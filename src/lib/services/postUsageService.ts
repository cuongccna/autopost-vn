import { db } from '@/lib/db/supabase-compat';

export interface PostUsageStats {
  monthlyUsage: number;
  monthlyLimit: number;
  weeklyUsage: number;
  dailyUsage: number;
  userRole: string;
  allowed: boolean;
}

export interface PostRateLimitResult {
  allowed: boolean;
  stats: PostUsageStats;
  message?: string;
}

export type PostType = 'regular' | 'scheduled' | 'draft';
export type PostPlatform = 'facebook' | 'instagram' | 'tiktok' | 'zalo';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

/**
 * Check if user can create a new post based on their role and current usage
 */
export async function checkPostRateLimit(
  userId: string, 
  userRole: string = 'free'
): Promise<PostRateLimitResult> {
  try {
    // Call the database function to check rate limits using PostgreSQL
    const { data, error } = await db.rpc('check_post_rate_limit', {
      p_user_id: userId,
      p_user_role: userRole
    });

    if (error) {
      console.error('Error checking post rate limit:', error);
      throw error;
    }

    const stats: PostUsageStats = {
      monthlyUsage: data.monthly_usage || 0,
      monthlyLimit: data.monthly_limit || 10,
      weeklyUsage: 0, // Will be populated by separate call if needed
      dailyUsage: 0,  // Will be populated by separate call if needed
      userRole: data.user_role || 'free',
      allowed: data.allowed || false
    };

    let message = '';
    if (!data.allowed) {
      if (userRole === 'free') {
        const remaining = Math.max(0, stats.monthlyLimit - stats.monthlyUsage);
        if (remaining === 0) {
          message = `Bạn đã sử dụng hết ${stats.monthlyLimit} bài đăng miễn phí trong tháng này. Nâng cấp lên gói Professional để đăng không giới hạn!`;
        } else {
          message = `Bạn còn ${remaining} bài đăng trong tháng này. Nâng cấp lên Professional để không giới hạn!`;
        }
      }
    }

    return {
      allowed: data.allowed,
      stats,
      message
    };

  } catch (error) {
    console.error('Error in checkPostRateLimit:', error);
    
    // In case of error, allow request but log it
    return {
      allowed: true,
      stats: {
        monthlyUsage: 0,
        monthlyLimit: 10,
        weeklyUsage: 0,
        dailyUsage: 0,
        userRole: 'free',
        allowed: true
      },
      message: 'Unable to check post limits, proceeding...'
    };
  }
}

/**
 * Log a new post creation/usage
 */
export async function logPostUsage(
  userId: string,
  postType: PostType = 'regular',
  platform: PostPlatform,
  postId?: string,
  scheduledFor?: Date,
  status: PostStatus = 'draft'
): Promise<void> {
  try {
    const { error } = await db
      .from('autopostvn_post_usage')
      .insert({
        user_id: userId,
        post_id: postId,
        post_type: postType,
        platform: platform,
        scheduled_for: scheduledFor?.toISOString(),
        status: status
      });

    if (error) {
      console.error('Error logging post usage:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error in logPostUsage:', error);
    // Don't throw error to avoid breaking the main flow
  }
}

/**
 * Update post status (when published, failed, etc.)
 */
export async function updatePostStatus(
  userId: string,
  postId: string,
  status: PostStatus,
  publishedAt?: Date
): Promise<void> {
  try {
    const updateData: any = { status };
    if (publishedAt && status === 'published') {
      updateData.published_at = publishedAt.toISOString();
    }
    
    // Use raw query for updates with multiple conditions
    const { error } = await db.query(
      'UPDATE autopostvn_post_usage SET status = $1' + 
      (publishedAt && status === 'published' ? ', published_at = $2 WHERE user_id = $3 AND post_id = $4' : ' WHERE user_id = $2 AND post_id = $3'),
      publishedAt && status === 'published' 
        ? [status, publishedAt.toISOString(), userId, postId]
        : [status, userId, postId]
    );

    if (error) {
      console.error('Error updating post status:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error in updatePostStatus:', error);
  }
}

/**
 * Get comprehensive post usage statistics for a user
 */
export async function getPostUsageStats(
  userId: string,
  userRole: string = 'free'
): Promise<PostUsageStats> {
  try {
    // Call the database function to get usage stats using PostgreSQL
    const { data, error } = await db.rpc('get_user_post_usage', {
      p_user_id: userId,
      p_user_role: userRole
    });

    if (error) {
      console.error('Error getting post usage stats:', error);
      throw error;
    }

    return {
      monthlyUsage: data.monthly_usage || 0,
      monthlyLimit: data.monthly_limit || 10,
      weeklyUsage: data.weekly_usage || 0,
      dailyUsage: data.daily_usage || 0,
      userRole: data.user_role || 'free',
      allowed: data.allowed || false
    };

  } catch (error) {
    console.error('Error in getPostUsageStats:', error);
    
    // Return default stats in case of error
    return {
      monthlyUsage: 0,
      monthlyLimit: 10,
      weeklyUsage: 0,
      dailyUsage: 0,
      userRole: 'free',
      allowed: true
    };
  }
}

/**
 * Get post usage breakdown by platform and type
 */
export async function getPostUsageBreakdown(
  userId: string,
  days: number = 30
): Promise<{
  byPlatform: Record<PostPlatform, number>;
  byType: Record<PostType, number>;
  byStatus: Record<PostStatus, number>;
  timeline: Array<{ date: string; count: number }>;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await db
      .from('autopostvn_post_usage')
      .select('platform, post_type, status, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .execute();

    if (error) {
      console.error('Error getting post usage breakdown:', error);
      throw error;
    }

    // Initialize counters
    const byPlatform: Record<PostPlatform, number> = {
      facebook: 0,
      instagram: 0,
      tiktok: 0,
      zalo: 0
    };
    
    const byType: Record<PostType, number> = {
      regular: 0,
      scheduled: 0,
      draft: 0
    };
    
    const byStatus: Record<PostStatus, number> = {
      draft: 0,
      scheduled: 0,
      published: 0,
      failed: 0
    };

    // Count by categories
    data?.forEach((post: any) => {
      if (post.platform in byPlatform) {
        byPlatform[post.platform as PostPlatform]++;
      }
      if (post.post_type in byType) {
        byType[post.post_type as PostType]++;
      }
      if (post.status in byStatus) {
        byStatus[post.status as PostStatus]++;
      }
    });

    // Create timeline (group by day)
    const timelineMap = new Map<string, number>();
    data?.forEach((post: any) => {
      const date = new Date(post.created_at).toISOString().split('T')[0];
      timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
    });
    
    const timeline = Array.from(timelineMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      byPlatform,
      byType,
      byStatus,
      timeline
    };

  } catch (error) {
    console.error('Error in getPostUsageBreakdown:', error);
    
    return {
      byPlatform: { facebook: 0, instagram: 0, tiktok: 0, zalo: 0 },
      byType: { regular: 0, scheduled: 0, draft: 0 },
      byStatus: { draft: 0, scheduled: 0, published: 0, failed: 0 },
      timeline: []
    };
  }
}
