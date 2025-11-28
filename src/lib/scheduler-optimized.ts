import { sbServer } from '@/lib/supabase/server';
import { createPublisher, logPublishActivity, PublishResult, PublishData } from '@/lib/social-publishers';
import { WorkspaceSettingsService } from '@/lib/services/workspace-settings.service';
import logger from '@/lib/utils/logger';
import { PerformanceMonitor } from '@/lib/services/performance-monitor.service';
import { CacheService } from '@/lib/services/cache.service';

interface ScheduleJob {
  id: string;
  post_id: string;
  social_account_id: string;
  scheduled_at: string;
  status: string;
  retry_count: number;
}

interface JobData {
  id: string;
  post_id: string;
  social_account_id: string;
  scheduled_at: string;
  status: string;
  retry_count: number;
  posts: {
    id: string;
    title: string;
    content: string;
    media_urls: string[];
    media_type?: 'image' | 'video' | 'album' | 'none';
    providers: string[];
    workspace_id: string;
    user_id: string;
    status: string;
    metadata?: any;
  };
  social_accounts: {
    id: string;
    provider: string;
    provider_id: string;
    name: string;
    status: string;
    token_encrypted: string;
    expires_at: string | null;
    metadata?: any;
  };
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
  metrics?: {
    totalDuration: number;
    avgProcessingTime: number;
    databaseQueryTime: number;
    apiCallTime: number;
  };
}

/**
 * Optimized scheduler với parallel processing và advanced caching
 */
export async function runOptimizedScheduler(
  limit = 20,
  concurrency = 5
): Promise<ProcessingResult> {
  const startTime = Date.now();
  const monitor = PerformanceMonitor.start('scheduler-run');
  
  console.log(`🚀 [OPTIMIZED SCHEDULER] Starting with limit: ${limit}, concurrency: ${concurrency}`);
  
  const sb = sbServer(true);
  const nowLeeway = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const result: ProcessingResult = {
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    details: []
  };

  try {
    // ✅ OPTIMIZATION 1: Single query với JOINs thay vì N+1 queries
    const dbQueryStart = Date.now();
    const { data: jobsData, error: jobsError } = await sb
      .from('autopostvn_post_schedules')
      .select(`
        id,
        post_id,
        social_account_id,
        scheduled_at,
        status,
        retry_count,
        posts:autopostvn_posts!inner(
          id,
          title,
          content,
          media_urls,
          media_type,
          providers,
          workspace_id,
          user_id,
          status,
          metadata
        ),
        social_accounts:autopostvn_social_accounts!inner(
          id,
          provider,
          provider_id,
          name,
          status,
          token_encrypted,
          expires_at,
          metadata
        )
      `)
      .lte('scheduled_at', nowLeeway)
      .eq('status', 'pending')
      .eq('posts.status', 'scheduled')
      .eq('social_accounts.status', 'connected')
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    const dbQueryTime = Date.now() - dbQueryStart;
    monitor.recordMetric('database_query_time', dbQueryTime);

    if (jobsError) {
      console.error('❌ [OPTIMIZED SCHEDULER] Error fetching jobs:', jobsError);
      monitor.recordError(jobsError);
      throw jobsError;
    }

    if (!jobsData || jobsData.length === 0) {
      console.log('✅ [OPTIMIZED SCHEDULER] No pending jobs found');
      monitor.end();
      return result;
    }

    console.log(`📋 [OPTIMIZED SCHEDULER] Found ${jobsData.length} pending jobs`);

    // Mark jobs as processing (idempotent protection)
    const jobIds = jobsData.map(j => j.id);
    await sb
      .from('autopostvn_post_schedules')
      .update({ status: 'publishing', updated_at: new Date().toISOString() })
      .in('id', jobIds)
      .eq('status', 'pending');

    // ✅ OPTIMIZATION 2: Pre-load workspace settings với batch caching
    const workspaceIds = [...new Set(jobsData.map((j: any) => j.posts.workspace_id))];
    await CacheService.preloadWorkspaceSettings(workspaceIds);

    // ✅ OPTIMIZATION 3: Batch rate limit checking
    const rateLimitMap = await batchCheckRateLimits(workspaceIds);

    // ✅ OPTIMIZATION 4: Parallel processing với concurrency limit
    const apiCallStart = Date.now();
    
    // Transform jobsData để match JobData interface
    const transformedJobs: JobData[] = jobsData.map((job: any) => ({
      id: job.id,
      post_id: job.post_id,
      social_account_id: job.social_account_id,
      scheduled_at: job.scheduled_at,
      status: job.status,
      retry_count: job.retry_count,
      posts: Array.isArray(job.posts) ? job.posts[0] : job.posts,
      social_accounts: Array.isArray(job.social_accounts) ? job.social_accounts[0] : job.social_accounts
    }));
    
    const processedResults = await processBatchParallel(
      transformedJobs,
      concurrency,
      rateLimitMap
    );
    const apiCallTime = Date.now() - apiCallStart;
    monitor.recordMetric('api_call_time', apiCallTime);

    // Aggregate results
    for (const jobResult of processedResults) {
      result.processed++;
      result.details.push(jobResult.detail);
      
      switch (jobResult.detail.status) {
        case 'success':
          result.successful++;
          break;
        case 'failed':
          result.failed++;
          break;
        case 'skipped':
          result.skipped++;
          break;
      }
    }

    // Calculate metrics
    const totalDuration = Date.now() - startTime;
    const avgProcessingTime = result.processed > 0 ? totalDuration / result.processed : 0;
    
    result.metrics = {
      totalDuration,
      avgProcessingTime,
      databaseQueryTime: dbQueryTime,
      apiCallTime
    };

    monitor.recordMetric('total_duration', totalDuration);
    monitor.recordMetric('jobs_processed', result.processed);
    monitor.recordMetric('jobs_successful', result.successful);
    monitor.recordMetric('jobs_failed', result.failed);
    monitor.recordMetric('jobs_skipped', result.skipped);

    console.log(`🏁 [OPTIMIZED SCHEDULER] Completed in ${totalDuration}ms. Results:`, {
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
      skipped: result.skipped,
      avgProcessingTime: Math.round(avgProcessingTime),
      dbQueryTime,
      apiCallTime
    });

    monitor.end();
    return result;

  } catch (error: any) {
    console.error('❌ [OPTIMIZED SCHEDULER] Fatal error:', error);
    monitor.recordError(error);
    monitor.end();
    throw error;
  }
}

/**
 * ✅ OPTIMIZATION: Batch check rate limits cho multiple workspaces
 */
async function batchCheckRateLimits(
  workspaceIds: string[]
): Promise<Map<string, { allowed: boolean; current: number; limit: number }>> {
  const sb = sbServer(true);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const resultMap = new Map();

  try {
    // Single query để lấy usage của tất cả workspaces
    const { data: publishedSchedules, error } = await sb
      .from('autopostvn_post_schedules')
      .select('id, posts!inner(workspace_id)')
      .in('posts.workspace_id', workspaceIds)
      .gte('published_at', oneHourAgo.toISOString())
      .eq('status', 'published');

    if (error) {
      console.error('Error checking batch rate limits:', error);
      // Fallback: allow all
      workspaceIds.forEach(id => {
        resultMap.set(id, { allowed: true, current: 0, limit: 10 });
      });
      return resultMap;
    }

    // Count usage per workspace
    const usageMap = new Map<string, number>();
    publishedSchedules?.forEach((schedule: any) => {
      const workspaceId = schedule.posts.workspace_id;
      usageMap.set(workspaceId, (usageMap.get(workspaceId) || 0) + 1);
    });

    // Check limits for each workspace (sử dụng cached settings)
    for (const workspaceId of workspaceIds) {
      const current = usageMap.get(workspaceId) || 0;
      const settings = await CacheService.getWorkspaceSettings(workspaceId);
      const limit = settings.scheduling.rateLimit;
      const allowed = current < limit;

      resultMap.set(workspaceId, { allowed, current, limit });
    }

    return resultMap;

  } catch (error) {
    console.error('Error in batch rate limit check:', error);
    // Fallback: allow all
    workspaceIds.forEach(id => {
      resultMap.set(id, { allowed: true, current: 0, limit: 10 });
    });
    return resultMap;
  }
}

/**
 * ✅ OPTIMIZATION: Process jobs in parallel với concurrency control
 */
async function processBatchParallel(
  jobs: JobData[],
  concurrency: number,
  rateLimitMap: Map<string, { allowed: boolean; current: number; limit: number }>
): Promise<Array<{
  detail: {
    scheduleId: string;
    postId: string;
    status: 'success' | 'failed' | 'skipped';
    message: string;
  }
}>> {
  const results: Array<{
    detail: {
      scheduleId: string;
      postId: string;
      status: 'success' | 'failed' | 'skipped';
      message: string;
    }
  }> = [];

  // Process in batches with concurrency limit
  for (let i = 0; i < jobs.length; i += concurrency) {
    const batch = jobs.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(job => processJob(job, rateLimitMap))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error('Job processing error:', result.reason);
        // Add failed result
        results.push({
          detail: {
            scheduleId: 'unknown',
            postId: 'unknown',
            status: 'failed',
            message: `Processing error: ${result.reason?.message || 'Unknown'}`
          }
        });
      }
    }

    // Small delay between batches to prevent overwhelming the system
    if (i + concurrency < jobs.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Process single job với validation và publishing
 */
async function processJob(
  jobData: JobData,
  rateLimitMap: Map<string, { allowed: boolean; current: number; limit: number }>
): Promise<{
  detail: {
    scheduleId: string;
    postId: string;
    status: 'success' | 'failed' | 'skipped';
    message: string;
  }
}> {
  const sb = sbServer(true);
  const { id: jobId, post_id: postId, posts: post, social_accounts: socialAccount } = jobData;

  try {
    console.log(`🔄 [OPTIMIZED SCHEDULER] Processing job ${jobId} for post ${postId}`);

    // Validation: Check post content
    if (!post.content?.trim()) {
      await updateJobStatus(jobId, 'failed', 'Post has no content');
      return {
        detail: {
          scheduleId: jobId,
          postId,
          status: 'failed',
          message: 'Post has no content'
        }
      };
    }

    // Check workspace settings (cached)
    const settings = await CacheService.getWorkspaceSettings(post.workspace_id);

    // Rate limit check (batch checked)
    const rateLimit = rateLimitMap.get(post.workspace_id);
    if (rateLimit && !rateLimit.allowed) {
      const errorMessage = `Rate limit exceeded: ${rateLimit.current}/${rateLimit.limit} posts/hour`;
      console.log(`⏸️ [OPTIMIZED SCHEDULER] ${errorMessage}`);
      
      // Reset to pending for retry
      await sb
        .from('autopostvn_post_schedules')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', jobId);
      
      return {
        detail: {
          scheduleId: jobId,
          postId,
          status: 'skipped',
          message: errorMessage
        }
      };
    }

    // Check token expiry
    if (socialAccount.expires_at) {
      const expiresAt = new Date(socialAccount.expires_at);
      if (expiresAt <= new Date()) {
        const errorMessage = `Token expired for ${socialAccount.provider}: ${socialAccount.name}`;
        await updateJobStatus(jobId, 'failed', errorMessage);
        return {
          detail: {
            scheduleId: jobId,
            postId,
            status: 'failed',
            message: errorMessage
          }
        };
      }
    }

    // Idempotency check
    const { data: freshJob } = await sb
      .from('autopostvn_post_schedules')
      .select('status')
      .eq('id', jobId)
      .single();

    if (freshJob?.status === 'published') {
      console.log(`⏩ [OPTIMIZED SCHEDULER] Job ${jobId} already published, skipping`);
      return {
        detail: {
          scheduleId: jobId,
          postId,
          status: 'skipped',
          message: 'Already published by another worker'
        }
      };
    }

    // Publishing
    console.log(`📤 [OPTIMIZED SCHEDULER] Publishing to ${socialAccount.provider}: ${socialAccount.name}`);
    
    // Detect media type from URLs if not set in database
    let mediaType = post.media_type || 'none';
    console.log(`🔍 [MEDIA TYPE DEBUG] Original mediaType from DB: "${mediaType}", media_urls:`, post.media_urls);
    
    if ((mediaType === 'none' || !mediaType) && post.media_urls && post.media_urls.length > 0) {
      // Auto-detect from first media URL - extract filename from URL path (ignore query params)
      const firstUrl = post.media_urls[0];
      const urlPath = firstUrl.split('?')[0].split('#')[0].toLowerCase(); // Remove query params and hash
      console.log(`🔍 [MEDIA TYPE DEBUG] Analyzing URL path: "${urlPath}"`);
      
      if (urlPath.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv)$/)) {
        mediaType = 'video';
        console.log(`🎥 [MEDIA TYPE] Auto-detected VIDEO from URL: ${firstUrl}`);
      } else if (urlPath.match(/\.(jpg|jpeg|png|gif|webp|heif|tiff)$/)) {
        mediaType = 'image';
        console.log(`📷 [MEDIA TYPE] Auto-detected IMAGE from URL: ${firstUrl}`);
      } else if (post.media_urls.length > 1) {
        mediaType = 'album';
        console.log(`📁 [MEDIA TYPE] Auto-detected ALBUM (${post.media_urls.length} files)`);
      } else {
        console.log(`⚠️ [MEDIA TYPE] Could not detect type from URL: ${firstUrl}`);
      }
    } else {
      console.log(`ℹ️ [MEDIA TYPE] Using existing mediaType: "${mediaType}"`);
    }
    
    const publishData: PublishData = {
      content: post.content,
      mediaUrls: post.media_urls || [],
      mediaType: mediaType as 'image' | 'video' | 'album' | 'none',
      metadata: post.metadata || {}
    };

    const publisher = createPublisher(socialAccount);
    const publishResult = await publisher.publish(publishData);

    // Log activity
    await logPublishActivity(postId, jobId, socialAccount, publishResult, post.user_id);

    if (publishResult.success) {
      console.log(`✅ [OPTIMIZED SCHEDULER] Successfully published job ${jobId}`);
      
      await updateJobStatus(jobId, 'published', 'Published successfully', publishResult.externalPostId);
      
      // Check and update post status
      await checkAndUpdatePostStatus(postId);

      return {
        detail: {
          scheduleId: jobId,
          postId,
          status: 'success',
          message: `Published to ${socialAccount.provider}: ${socialAccount.name}`
        }
      };
    } else {
      console.log(`❌ [OPTIMIZED SCHEDULER] Failed to publish job ${jobId}: ${publishResult.error}`);
      
      // Retry logic
      const shouldRetry = jobData.retry_count < 3;
      if (shouldRetry) {
        const retryAt = new Date(Date.now() + (jobData.retry_count + 1) * 30 * 60 * 1000);
        await sb
          .from('autopostvn_post_schedules')
          .update({
            status: 'pending',
            retry_count: jobData.retry_count + 1,
            scheduled_at: retryAt.toISOString(),
            error_message: publishResult.error
          })
          .eq('id', jobId);
        
        return {
          detail: {
            scheduleId: jobId,
            postId,
            status: 'skipped',
            message: `Failed, scheduled for retry ${jobData.retry_count + 1}/3`
          }
        };
      } else {
        await updateJobStatus(jobId, 'failed', publishResult.error || 'Unknown error');
        return {
          detail: {
            scheduleId: jobId,
            postId,
            status: 'failed',
            message: `Max retries exceeded: ${publishResult.error}`
          }
        };
      }
    }

  } catch (error: any) {
    console.error(`❌ [OPTIMIZED SCHEDULER] Error processing job ${jobId}:`, error);
    await updateJobStatus(jobId, 'failed', `System error: ${error.message}`);
    
    return {
      detail: {
        scheduleId: jobId,
        postId,
        status: 'failed',
        message: `System error: ${error.message}`
      }
    };
  }
}

/**
 * Update job status
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
 * Check and update post status when all schedules complete
 */
async function checkAndUpdatePostStatus(postId: string) {
  const sb = sbServer(true);

  try {
    const { data: schedules, error } = await sb
      .from('autopostvn_post_schedules')
      .select('status')
      .eq('post_id', postId);

    if (error || !schedules || schedules.length === 0) {
      return;
    }

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

      console.log(`📊 [OPTIMIZED SCHEDULER] Updated post ${postId} status to: ${newStatus}`);
    }
  } catch (error) {
    console.error(`Error updating post status for ${postId}:`, error);
  }
}

/**
 * Cleanup old cache entries (run periodically)
 */
export async function cleanupSchedulerCache() {
  try {
    CacheService.cleanup();
    console.log('✅ Cache cleanup completed');
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}
