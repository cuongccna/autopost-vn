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

import { query } from '@/lib/db/postgres';
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
  constructor() {
    // No Supabase client needed - using PostgreSQL directly
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

      // Get post info from database using PostgreSQL
      const dbPostResult = await query(
        `SELECT ps.id, ps.published_at, p.content, sa.name as account_name
         FROM autopostvn_post_schedules ps
         INNER JOIN autopostvn_posts p ON p.id = ps.post_id
         INNER JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
         WHERE ps.external_post_id = $1
         LIMIT 1`,
        [postId]
      );

      const dbPost = dbPostResult.rows[0];

      return {
        postId: dbPost?.id || '',
        externalPostId: postId,
        platform: 'facebook',
        accountName: dbPost?.account_name || 'Unknown',
        publishedAt: new Date(dbPost?.published_at || postData.created_time),
        content: dbPost?.content || postData.message || '',
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
      // First, get all social accounts for this workspace using PostgreSQL
      const accountsResult = await query(
        `SELECT id, name, provider, token_encrypted
         FROM autopostvn_social_accounts
         WHERE workspace_id = $1
         AND provider IN ('facebook', 'facebook_page')`,
        [workspaceId]
      );

      const accounts = accountsResult.rows;

      if (accounts.length === 0) {
        logger.warn('No Facebook accounts found for workspace', { workspaceId });
        return [];
      }

      const accountIds = accounts.map((a: any) => a.id);

      // Get recent published posts using PostgreSQL
      const schedulesResult = await query(
        `SELECT id, post_id, external_post_id, published_at, social_account_id
         FROM autopostvn_post_schedules
         WHERE social_account_id = ANY($1)
         AND status = 'published'
         AND external_post_id IS NOT NULL
         ORDER BY published_at DESC
         LIMIT $2`,
        [accountIds, limit]
      );

      const schedules = schedulesResult.rows;

      if (schedules.length === 0) {
        logger.info('No published posts found', { workspaceId });
        return [];
      }

      // Get post content
      const postIds = [...new Set(schedules.map((s: any) => s.post_id))];
      const postsResult = await query(
        `SELECT id, content FROM autopostvn_posts WHERE id = ANY($1)`,
        [postIds]
      );

      const posts = postsResult.rows;
      const postsMap = new Map(posts.map((p: any) => [p.id, p]));
      const accountsMap = new Map(accounts.map((a: any) => [a.id, a]));

      const insights: PostInsights[] = [];

      for (const schedule of schedules) {
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
