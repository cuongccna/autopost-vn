import { query } from '@/lib/db/postgres';
import { validatePostForPublishing, logValidationActivity, ValidationResult } from '@/lib/post-validation';
import { createPublisher, logPublishActivity, PublishResult, PublishData } from '@/lib/social-publishers';
import { WorkspaceSettingsService } from '@/lib/services/workspace-settings.service';
import { NotificationService } from '@/lib/services/notification.service';
import logger from '@/lib/utils/logger';

interface ScheduleJob {
  id: string;
  post_id: string;
  social_account_id: string;
  scheduled_at: string;
  status: string;
  retry_count: number;
  user_id: string;
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
    const jobsResult = await query<ScheduleJob>(`
      SELECT 
        ps.id, 
        ps.post_id, 
        ps.social_account_id, 
        ps.scheduled_at, 
        ps.status, 
        ps.retry_count,
        p.user_id
      FROM autopostvn_post_schedules ps
      JOIN autopostvn_posts p ON p.id = ps.post_id
      WHERE ps.scheduled_at <= $1
        AND ps.status = 'pending'
      ORDER BY ps.scheduled_at ASC
      LIMIT $2
    `, [nowLeeway, limit]);

    const jobs = jobsResult.rows;

    if (!jobs || jobs.length === 0) {
      console.log('✅ [SCHEDULER] No pending jobs found');
      return result;
    }

    console.log(`📋 [SCHEDULER] Found ${jobs.length} pending jobs`);

    // Đánh dấu jobs đang được xử lý (idempotent protection: only if still pending)
    for (const job of jobs) {
      await query(`
        UPDATE autopostvn_post_schedules
        SET status = 'publishing', updated_at = NOW()
        WHERE id = $1 AND status = 'pending'
      `, [job.id]);
    }

    // Xử lý từng job
    for (const job of jobs) {
      result.processed++;
      console.log(`🔄 [SCHEDULER] Processing job ${job.id} for post ${job.post_id}`);

      try {
        // Bước 1: Validation bài đăng
        console.log(`🔍 [SCHEDULER] Validating post ${job.post_id}`);
        const validation = await validatePostForPublishing(job.post_id);
        
        // Log validation activity with user_id from job
        await logValidationActivity(job.post_id, validation.result, job.user_id);

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

        // Bước 2.5: Check workspace settings
        const workspaceId = validation.data!.post.workspace_id;
        const settings = await WorkspaceSettingsService.getSettings(workspaceId);
        
        // Check rate limit
        const rateLimit = await WorkspaceSettingsService.checkRateLimit(workspaceId, settings);
        if (!rateLimit.allowed) {
          const errorMessage = `Rate limit exceeded: ${rateLimit.current}/${rateLimit.limit} posts/hour`;
          console.log(`⏸️ [SCHEDULER] ${errorMessage}`);
          
          // Reset status to pending for later retry
          await query(`
            UPDATE autopostvn_post_schedules
            SET status = 'pending', updated_at = NOW()
            WHERE id = $1
          `, [job.id]);
          
          result.skipped++;
          result.details.push({
            scheduleId: job.id,
            postId: job.post_id,
            status: 'skipped',
            message: errorMessage
          });
          continue;
        }

        // Bước 3: Publishing
        console.log(`📤 [SCHEDULER] Publishing to ${socialAccount.provider}: ${socialAccount.name}`);
        
        // Auto-detect media type from URLs if not set in database
        let mediaType = validation.data!.post.media_type || 'none';
        console.log(`🔍 [MEDIA TYPE DEBUG] Original mediaType from DB: "${mediaType}", media_urls:`, validation.data!.post.media_urls);
        
        if ((mediaType === 'none' || !mediaType) && validation.data!.post.media_urls && validation.data!.post.media_urls.length > 0) {
          const firstUrl = validation.data!.post.media_urls[0];
          const urlPath = firstUrl.split('?')[0].split('#')[0].toLowerCase();
          console.log(`🔍 [MEDIA TYPE DEBUG] Analyzing URL path: "${urlPath}"`);
          
          if (urlPath.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv)$/)) {
            mediaType = 'video';
            console.log(`🎥 [MEDIA TYPE] Auto-detected VIDEO from URL: ${firstUrl}`);
          } else if (urlPath.match(/\.(jpg|jpeg|png|gif|webp|heif|tiff)$/)) {
            mediaType = 'image';
            console.log(`📷 [MEDIA TYPE] Auto-detected IMAGE from URL: ${firstUrl}`);
          } else if (validation.data!.post.media_urls.length > 1) {
            mediaType = 'album';
            console.log(`📁 [MEDIA TYPE] Auto-detected ALBUM (${validation.data!.post.media_urls.length} files)`);
          } else {
            console.log(`⚠️ [MEDIA TYPE] Could not detect type from URL: ${firstUrl}`);
          }
        } else {
          console.log(`ℹ️ [MEDIA TYPE] Using existing mediaType: "${mediaType}"`);
        }
        
        const publishData: PublishData = {
          content: validation.data!.post.content,
          mediaUrls: validation.data!.post.media_urls || [],
          mediaType: mediaType as 'image' | 'video' | 'album' | 'none',
          metadata: validation.data!.post.metadata || {}
        };

        const publisher = createPublisher(socialAccount);
        // Idempotency: skip if already published by concurrent worker
        const freshJobResult = await query<{status: string}>(`
          SELECT status FROM autopostvn_post_schedules WHERE id = $1
        `, [job.id]);
        
        const freshJob = freshJobResult.rows[0];
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

          // Gửi email thông báo thành công (async, không block)
          NotificationService.notifyPublishSuccess({
            postId: job.post_id,
            postTitle: validation.data!.post.title || '',
            postContent: validation.data!.post.content || '',
            provider: socialAccount.provider,
            accountName: socialAccount.name,
            userId: job.user_id,
            workspaceId: validation.data!.post.workspace_id
          }).catch(err => console.error('📧 Notification error:', err));

        } else {
          console.log(`❌ [SCHEDULER] Failed to publish job ${job.id}: ${publishResult.error}`);
          
          // Kiểm tra có retry không
          const shouldRetry = job.retry_count < 3; // Max 3 retries
          if (shouldRetry) {
            const retryAt = new Date(Date.now() + (job.retry_count + 1) * 30 * 60 * 1000); // Retry sau 30 phút, 1 giờ, 1.5 giờ
            await query(`
              UPDATE autopostvn_post_schedules
              SET status = 'pending',
                  retry_count = $1,
                  scheduled_at = $2,
                  error_message = $3,
                  updated_at = NOW()
              WHERE id = $4
            `, [job.retry_count + 1, retryAt.toISOString(), publishResult.error, job.id]);
              
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

            // Gửi email thông báo thất bại (sau khi hết retry)
            NotificationService.notifyPublishFailure({
              postId: job.post_id,
              postTitle: validation.data!.post.title || '',
              postContent: validation.data!.post.content || '',
              provider: socialAccount.provider,
              accountName: socialAccount.name,
              userId: job.user_id,
              workspaceId: validation.data!.post.workspace_id,
              error: publishResult.error || 'Unknown error'
            }).catch(err => console.error('📧 Notification error:', err));
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
  const updates: string[] = ['status = $1', 'updated_at = NOW()'];
  const params: any[] = [status];
  let paramIndex = 2;

  if (status === 'published') {
    updates.push('published_at = NOW()');
    if (externalPostId) {
      updates.push(`external_post_id = $${paramIndex}`);
      params.push(externalPostId);
      paramIndex++;
    }
  }

  if (errorMessage) {
    updates.push(`error_message = $${paramIndex}`);
    params.push(errorMessage);
    paramIndex++;
  }

  params.push(jobId);

  try {
    await query(`
      UPDATE autopostvn_post_schedules
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, params);
  } catch (error: any) {
    console.error(`Failed to update job status for ${jobId}:`, error);
  }
}

/**
 * Kiểm tra và cập nhật trạng thái post khi tất cả schedules hoàn thành
 */
async function checkAndUpdatePostStatus(postId: string) {
  try {
    // Lấy tất cả schedules của post
    const schedulesResult = await query<{status: string}>(`
      SELECT status FROM autopostvn_post_schedules WHERE post_id = $1
    `, [postId]);
    
    const schedules = schedulesResult.rows;

    if (!schedules || schedules.length === 0) {
      return;
    }

    // Kiểm tra trạng thái
    const allCompleted = schedules.every((s: {status: string}) => ['published', 'failed'].includes(s.status));
    const hasSuccessful = schedules.some((s: {status: string}) => s.status === 'published');
    
    if (allCompleted) {
      const newStatus = hasSuccessful ? 'published' : 'failed';
      
      if (newStatus === 'published') {
        await query(`
          UPDATE autopostvn_posts
          SET status = $1, published_at = NOW(), updated_at = NOW()
          WHERE id = $2
        `, [newStatus, postId]);
      } else {
        await query(`
          UPDATE autopostvn_posts
          SET status = $1, updated_at = NOW()
          WHERE id = $2
        `, [newStatus, postId]);
      }

      console.log(`📊 [SCHEDULER] Updated post ${postId} status to: ${newStatus}`);
    }

  } catch (error) {
    console.error(`Error updating post status for ${postId}:`, error);
  }
}