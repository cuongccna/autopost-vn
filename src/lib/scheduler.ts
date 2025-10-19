import { sbServer } from '@/lib/supabase/server';
import { validatePostForPublishing, logValidationActivity, ValidationResult } from '@/lib/post-validation';
import { createPublisher, logPublishActivity, PublishResult, PublishData } from '@/lib/social-publishers';

interface ScheduleJob {
  id: string;
  post_id: string;
  social_account_id: string;
  scheduled_at: string;
  status: string;
  retry_count: number;
}

interface ProcessingResult {
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  details: Array<{
    scheduleId: string;
    postId: string;
    status: 'success' | 'failed' | 'skipped';
    message: string;
  }>;
}

/**
 * Main scheduler function - xử lý auto post
 */
export async function runScheduler(limit = 10): Promise<ProcessingResult> {
  console.log(`🔄 [SCHEDULER] Starting scheduler run with limit: ${limit}`);
  
  const sb = sbServer(true);
  // Allow 5 minutes leeway to absorb client timezone drift and near-future scheduling
  const nowLeeway = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const result: ProcessingResult = {
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    details: []
  };

  try {
    // Lấy các job cần xử lý (đã đến thời gian và status = 'pending')
    const { data: jobs, error: jobsError } = await sb
      .from('autopostvn_post_schedules')
      .select(`
        id,
        post_id,
        social_account_id,
        scheduled_at,
        status,
        retry_count
      `)
      .lte('scheduled_at', nowLeeway)
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    if (jobsError) {
      console.error('❌ [SCHEDULER] Error fetching jobs:', jobsError);
      throw jobsError;
    }

    if (!jobs || jobs.length === 0) {
      console.log('✅ [SCHEDULER] No pending jobs found');
      return result;
    }

    console.log(`📋 [SCHEDULER] Found ${jobs.length} pending jobs`);

    // Đánh dấu jobs đang được xử lý (idempotent protection: only if still pending)
    const jobIds = jobs.map(j => j.id);
    await sb
      .from('autopostvn_post_schedules')
      .update({ status: 'publishing', updated_at: new Date().toISOString() })
      .in('id', jobIds)
      .eq('status', 'pending');

    // Xử lý từng job
    for (const job of jobs) {
      result.processed++;
      console.log(`🔄 [SCHEDULER] Processing job ${job.id} for post ${job.post_id}`);

      try {
        // Bước 1: Validation bài đăng
        console.log(`🔍 [SCHEDULER] Validating post ${job.post_id}`);
        const validation = await validatePostForPublishing(job.post_id);
        
        // Log validation activity
        await logValidationActivity(job.post_id, validation.result);

        if (!validation.result.isValid) {
          const errorMessage = `Validation failed: ${validation.result.errors.join(', ')}`;
          console.log(`❌ [SCHEDULER] ${errorMessage}`);
          
          await updateJobStatus(job.id, 'failed', errorMessage);
          result.failed++;
          result.details.push({
            scheduleId: job.id,
            postId: job.post_id,
            status: 'failed',
            message: errorMessage
          });
          continue;
        }

        // In warnings nếu có
        if (validation.result.warnings.length > 0) {
          console.log(`⚠️ [SCHEDULER] Warnings: ${validation.result.warnings.join(', ')}`);
        }

        // Bước 2: Lấy thông tin social account
        const socialAccount = validation.data!.socialAccounts.find(
          acc => acc.id === job.social_account_id
        );

        if (!socialAccount) {
          const errorMessage = `Social account not found: ${job.social_account_id}`;
          console.log(`❌ [SCHEDULER] ${errorMessage}`);
          
          await updateJobStatus(job.id, 'failed', errorMessage);
          result.failed++;
          result.details.push({
            scheduleId: job.id,
            postId: job.post_id,
            status: 'failed',
            message: errorMessage
          });
          continue;
        }

        // Bước 3: Publishing
        console.log(`📤 [SCHEDULER] Publishing to ${socialAccount.provider}: ${socialAccount.name}`);
        
        const publishData: PublishData = {
          content: validation.data!.post.content,
          mediaUrls: validation.data!.post.media_urls || [],
          metadata: validation.data!.post.metadata || {}
        };

        const publisher = createPublisher(socialAccount);
        // Idempotency: skip if already published by concurrent worker
        const { data: freshJob } = await sb
          .from('autopostvn_post_schedules')
          .select('status')
          .eq('id', job.id)
          .single();
        if (freshJob?.status === 'published') {
          console.log(`⏩ [SCHEDULER] Job ${job.id} already published, skipping`);
          result.skipped++;
          result.details.push({
            scheduleId: job.id,
            postId: job.post_id,
            status: 'skipped',
            message: 'Already published by another worker'
          });
          continue;
        }

        const publishResult = await publisher.publish(publishData);

        // Log publish activity
        await logPublishActivity(
          job.post_id,
          job.id,
          socialAccount,
          publishResult,
          validation.data!.post.user_id
        );

        if (publishResult.success) {
          console.log(`✅ [SCHEDULER] Successfully published job ${job.id}`);
          
          await updateJobStatus(
            job.id, 
            'published', 
            'Published successfully', 
            publishResult.externalPostId
          );
          
          result.successful++;
          result.details.push({
            scheduleId: job.id,
            postId: job.post_id,
            status: 'success',
            message: `Published to ${socialAccount.provider}: ${socialAccount.name}`
          });

          // Kiểm tra xem tất cả schedules của post đã hoàn thành chưa
          await checkAndUpdatePostStatus(job.post_id);

        } else {
          console.log(`❌ [SCHEDULER] Failed to publish job ${job.id}: ${publishResult.error}`);
          
          // Kiểm tra có retry không
          const shouldRetry = job.retry_count < 3; // Max 3 retries
          if (shouldRetry) {
            const retryAt = new Date(Date.now() + (job.retry_count + 1) * 30 * 60 * 1000); // Retry sau 30 phút, 1 giờ, 1.5 giờ
            await sb
              .from('autopostvn_post_schedules')
              .update({
                status: 'pending',
                retry_count: job.retry_count + 1,
                scheduled_at: retryAt.toISOString(),
                error_message: publishResult.error
              })
              .eq('id', job.id);
              
            result.details.push({
              scheduleId: job.id,
              postId: job.post_id,
              status: 'skipped',
              message: `Failed, scheduled for retry ${job.retry_count + 1}/3 at ${retryAt.toISOString()}`
            });
            result.skipped++;
          } else {
            await updateJobStatus(job.id, 'failed', publishResult.error || 'Unknown error');
            result.failed++;
            result.details.push({
              scheduleId: job.id,
              postId: job.post_id,
              status: 'failed',
              message: `Max retries exceeded: ${publishResult.error}`
            });
          }
        }

      } catch (error: any) {
        console.error(`❌ [SCHEDULER] Error processing job ${job.id}:`, error);
        
        await updateJobStatus(job.id, 'failed', `System error: ${error.message}`);
        result.failed++;
        result.details.push({
          scheduleId: job.id,
          postId: job.post_id,
          status: 'failed',
          message: `System error: ${error.message}`
        });
      }
    }

    console.log(`🏁 [SCHEDULER] Completed processing. Results:`, {
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
      skipped: result.skipped
    });

    return result;

  } catch (error: any) {
    console.error('❌ [SCHEDULER] Fatal error:', error);
    throw error;
  }
}

/**
 * Cập nhật trạng thái job
 */
async function updateJobStatus(
  jobId: string, 
  status: string, 
  errorMessage?: string, 
  externalPostId?: string
) {
  const sb = sbServer(true);
  
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'published') {
    updateData.published_at = new Date().toISOString();
    if (externalPostId) {
      updateData.external_post_id = externalPostId;
    }
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error } = await sb
    .from('autopostvn_post_schedules')
    .update(updateData)
    .eq('id', jobId);

  if (error) {
    console.error(`Failed to update job status for ${jobId}:`, error);
  }
}

/**
 * Kiểm tra và cập nhật trạng thái post khi tất cả schedules hoàn thành
 */
async function checkAndUpdatePostStatus(postId: string) {
  const sb = sbServer(true);

  try {
    // Lấy tất cả schedules của post
    const { data: schedules, error } = await sb
      .from('autopostvn_post_schedules')
      .select('status')
      .eq('post_id', postId);

    if (error) {
      console.error(`Error checking post schedules for ${postId}:`, error);
      return;
    }

    if (!schedules || schedules.length === 0) {
      return;
    }

    // Kiểm tra trạng thái
    const allCompleted = schedules.every(s => ['published', 'failed'].includes(s.status));
    const hasSuccessful = schedules.some(s => s.status === 'published');
    
    if (allCompleted) {
      const newStatus = hasSuccessful ? 'published' : 'failed';
      
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'published') {
        updateData.published_at = new Date().toISOString();
      }

      await sb
        .from('autopostvn_posts')
        .update(updateData)
        .eq('id', postId);

      console.log(`📊 [SCHEDULER] Updated post ${postId} status to: ${newStatus}`);
    }

  } catch (error) {
    console.error(`Error updating post status for ${postId}:`, error);
  }
}