/**
 * Facebook Insights Service
 * 
 * Fetches post analytics from Facebook Graph API:
 * - Post engagement (likes, comments, shares)
 * - Reach and impressions
 * - Post performance over time
 * - Best posting time analysis
 * 
 * API Reference: https://developers.facebook.com/docs/graph-api/reference/v21.0/insights
 */

import { createClient } from '@supabase/supabase-js';
import logger from './logger';
import { withRateLimit } from './rateLimiter';
import { OAuthTokenManager } from '../services/TokenEncryptionService';

export interface PostInsights {
  postId: string;
  externalPostId: string;
  platform: string;
  accountName: string;
  publishedAt: Date;
  content: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    impressions: number;
    engagement: number;
    engagementRate: number;
  };
  rawData?: any;
}

export interface AnalyticsSummary {
  totalPosts: number;
  totalEngagement: number;
  totalReach: number;
  averageEngagementRate: number;
  topPost: PostInsights | null;
  recentPosts: PostInsights[];
  engagementTrend: {
    date: string;
    engagement: number;
  }[];
}

export interface BestPostingTime {
  dayOfWeek: string;
  hour: number;
  averageEngagement: number;
  postCount: number;
}

export class FacebookInsightsService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Fetch insights for a single Facebook post
   */
  async getPostInsights(
    postId: string,
    accessToken: string,
    userId: string
  ): Promise<PostInsights | null> {
    try {
      // Fetch post details and insights with rate limiting
      const postData = await withRateLimit('facebook', userId, async () => {
        const response = await fetch(
          `https://graph.facebook.com/v21.0/${postId}?fields=id,message,created_time,likes.summary(true),comments.summary(true),shares&access_token=${accessToken}`
        );

        if (!response.ok) {
          throw new Error(`Facebook API error: ${response.statusText}`);
        }

        return await response.json();
      });

      // Fetch insights (reach, impressions)
      let insightsData;
      try {
        insightsData = await withRateLimit('facebook', userId, async () => {
          const response = await fetch(
            `https://graph.facebook.com/v21.0/${postId}/insights?metric=post_impressions,post_reach,post_engaged_users&access_token=${accessToken}`
          );

          if (!response.ok) {
            // Insights may not be available for all posts
            logger.warn('Post insights not available', { postId });
            return null;
          }

          return await response.json();
        });
      } catch (error) {
        logger.warn('Failed to fetch post insights', { postId, error });
        insightsData = null;
      }

      // Parse metrics
      const likes = postData.likes?.summary?.total_count || 0;
      const comments = postData.comments?.summary?.total_count || 0;
      const shares = postData.shares?.count || 0;
      
      // Parse insights data
      let reach = 0;
      let impressions = 0;
      let engagedUsers = 0;

      if (insightsData?.data) {
        for (const insight of insightsData.data) {
          if (insight.name === 'post_reach') {
            reach = insight.values[0]?.value || 0;
          } else if (insight.name === 'post_impressions') {
            impressions = insight.values[0]?.value || 0;
          } else if (insight.name === 'post_engaged_users') {
            engagedUsers = insight.values[0]?.value || 0;
          }
        }
      }

      const engagement = likes + comments + shares;
      const engagementRate = reach > 0 ? (engagement / reach) * 100 : 0;

      // Get post info from database
      const { data: dbPost } = await this.supabase
        .from('autopostvn_scheduled_posts')
        .select('id, content, published_at, autopostvn_social_accounts(name)')
        .eq('external_post_id', postId)
        .single();

      const post = dbPost as any;

      return {
        postId: post?.id || '',
        externalPostId: postId,
        platform: 'facebook',
        accountName: post?.autopostvn_social_accounts?.name || 'Unknown',
        publishedAt: new Date(post?.published_at || postData.created_time),
        content: post?.content || postData.message || '',
        metrics: {
          likes,
          comments,
          shares,
          reach,
          impressions,
          engagement,
          engagementRate: Math.round(engagementRate * 100) / 100
        },
        rawData: { postData, insightsData }
      };
    } catch (error: any) {
      logger.error('Error fetching post insights', { 
        postId, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Fetch insights for multiple posts
   */
  async getPostsInsights(
    workspaceId: string,
    limit: number = 10
  ): Promise<PostInsights[]> {
    try {
      // First, get all social accounts for this workspace
      const { data: accounts, error: accountsError } = await this.supabase
        .from('autopostvn_social_accounts')
        .select('id, name, provider, token_encrypted')
        .eq('workspace_id', workspaceId)
        .in('provider', ['facebook', 'facebook_page']);

      if (accountsError) throw accountsError;
      if (!accounts || accounts.length === 0) {
        logger.warn('No Facebook accounts found for workspace', { workspaceId });
        return [];
      }

      const accountIds = (accounts as any[]).map((a: any) => a.id);

      // Get recent published posts
      const { data: schedules, error: schedulesError } = await this.supabase
        .from('autopostvn_post_schedules')
        .select('id, post_id, external_post_id, published_at, social_account_id')
        .in('social_account_id', accountIds)
        .eq('status', 'published')
        .not('external_post_id', 'is', null)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (schedulesError) throw schedulesError;
      if (!schedules || schedules.length === 0) {
        logger.info('No published posts found', { workspaceId });
        return [];
      }

      // Get post content
      const postIds = [...new Set((schedules as any[]).map((s: any) => s.post_id))];
      const { data: posts } = await this.supabase
        .from('autopostvn_posts')
        .select('id, content')
        .in('id', postIds);

      const postsMap = new Map((posts as any[] || []).map((p: any) => [p.id, p]));
      const accountsMap = new Map((accounts as any[]).map((a: any) => [a.id, a]));

      const insights: PostInsights[] = [];

      for (const schedule of (schedules as any[])) {
        const account = accountsMap.get(schedule.social_account_id);
        if (!account) continue;

        const post = postsMap.get(schedule.post_id);
        const content = post?.content || '';
        
        // Decrypt token using OAuthTokenManager
        const accessToken = OAuthTokenManager.decryptForUse(account.token_encrypted);

        // Fetch insights
        const postInsight = await this.getPostInsights(
          schedule.external_post_id,
          accessToken,
          workspaceId
        );

        if (postInsight) {
          insights.push(postInsight);
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return insights;
    } catch (error: any) {
      logger.error('Error fetching posts insights', { 
        workspaceId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Generate analytics summary
   */
  async getAnalyticsSummary(workspaceId: string): Promise<AnalyticsSummary> {
    const insights = await this.getPostsInsights(workspaceId, 30);

    if (insights.length === 0) {
      return {
        totalPosts: 0,
        totalEngagement: 0,
        totalReach: 0,
        averageEngagementRate: 0,
        topPost: null,
        recentPosts: [],
        engagementTrend: []
      };
    }

    const totalEngagement = insights.reduce((sum, p) => sum + p.metrics.engagement, 0);
    const totalReach = insights.reduce((sum, p) => sum + p.metrics.reach, 0);
    const avgEngagementRate = insights.reduce((sum, p) => sum + p.metrics.engagementRate, 0) / insights.length;

    // Find top post
    const topPost = insights.reduce((top, current) => 
      current.metrics.engagement > top.metrics.engagement ? current : top
    );

    // Engagement trend (group by date)
    const trendMap = new Map<string, number>();
    insights.forEach(post => {
      const date = post.publishedAt.toISOString().split('T')[0];
      trendMap.set(date, (trendMap.get(date) || 0) + post.metrics.engagement);
    });

    const engagementTrend = Array.from(trendMap.entries())
      .map(([date, engagement]) => ({ date, engagement }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days

    return {
      totalPosts: insights.length,
      totalEngagement,
      totalReach,
      averageEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      topPost,
      recentPosts: insights.slice(0, 5),
      engagementTrend
    };
  }

  /**
   * Analyze best posting times
   */
  async getBestPostingTimes(workspaceId: string): Promise<BestPostingTime[]> {
    const insights = await this.getPostsInsights(workspaceId, 50);

    if (insights.length === 0) {
      return [];
    }

    // Group by day of week and hour
    const timeMap = new Map<string, { engagement: number; count: number }>();

    insights.forEach(post => {
      const date = new Date(post.publishedAt);
      const dayOfWeek = date.toLocaleDateString('vi-VN', { weekday: 'long' });
      const hour = date.getHours();
      const key = `${dayOfWeek}-${hour}`;

      const current = timeMap.get(key) || { engagement: 0, count: 0 };
      timeMap.set(key, {
        engagement: current.engagement + post.metrics.engagement,
        count: current.count + 1
      });
    });

    // Calculate averages and sort
    const bestTimes: BestPostingTime[] = Array.from(timeMap.entries())
      .map(([key, data]) => {
        const [dayOfWeek, hourStr] = key.split('-');
        return {
          dayOfWeek,
          hour: parseInt(hourStr),
          averageEngagement: Math.round(data.engagement / data.count),
          postCount: data.count
        };
      })
      .filter(time => time.postCount >= 2) // At least 2 posts
      .sort((a, b) => b.averageEngagement - a.averageEngagement)
      .slice(0, 5); // Top 5 times

    return bestTimes;
  }
}

export default FacebookInsightsService;
