// AutoPost VN - Analytics Service
import { DatabaseService } from './database';
import {
  AnalyticsEvent,
  PostAnalytics,
  AccountPerformance,
  AnalyticsService as IAnalyticsService
} from '../types';

export class AnalyticsService implements IAnalyticsService {
  // eslint-disable-next-line no-unused-vars
  constructor(private db: DatabaseService) {}

  async getPostAnalytics(workspaceId: string, filters?: {
    from_date?: string;
    to_date?: string;
    status?: string;
    provider?: string;
  }): Promise<PostAnalytics[]> {
    try {
      // Get post analytics from database view
      const analytics = await this.db.getPostAnalytics(workspaceId);
      
      // Apply filters if provided
      let filteredAnalytics = analytics;
      
      if (filters?.from_date) {
        filteredAnalytics = filteredAnalytics.filter(
          item => new Date(item.created_at) >= new Date(filters.from_date!)
        );
      }
      
      if (filters?.to_date) {
        filteredAnalytics = filteredAnalytics.filter(
          item => new Date(item.created_at) <= new Date(filters.to_date!)
        );
      }
      
      if (filters?.status) {
        filteredAnalytics = filteredAnalytics.filter(
          item => item.status === filters.status
        );
      }
      
      if (filters?.provider) {
        filteredAnalytics = filteredAnalytics.filter(
          item => item.schedule_details.some((detail: any) => detail.provider === filters.provider)
        );
      }

      return filteredAnalytics;
    } catch (error) {
      console.error('Error getting post analytics:', error);
      return [];
    }
  }

  async getAccountPerformance(workspaceId: string): Promise<AccountPerformance[]> {
    try {
      return await this.db.getAccountPerformance(workspaceId);
    } catch (error) {
      console.error('Error getting account performance:', error);
      return [];
    }
  }

  async createEvent(event: Omit<AnalyticsEvent, 'id' | 'created_at'>): Promise<AnalyticsEvent> {
    return await this.db.createAnalyticsEvent(event);
  }

  async getEvents(workspaceId: string, filters?: {
    event_type?: string;
    from_date?: string;
    to_date?: string;
    limit?: number;
  }): Promise<AnalyticsEvent[]> {
    return await this.db.getAnalyticsEvents(workspaceId, filters);
  }

  // Specialized analytics methods
  async getEngagementStats(workspaceId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    total_posts: number;
    total_engagement: number;
    avg_engagement_per_post: number;
    engagement_by_platform: Record<string, number>;
    engagement_trend: Array<{ date: string; engagement: number }>;
  }> {
    try {
      const posts = await this.getPostAnalytics(workspaceId);
      
      // Calculate timeframe start date
      const now = new Date();
      const startDate = new Date();
      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Filter posts by timeframe
      const filteredPosts = posts.filter(post => 
        post.published_at && new Date(post.published_at) >= startDate
      );

      // Calculate total engagement
      let totalEngagement = 0;
      const engagementByPlatform: Record<string, number> = {};
      
      filteredPosts.forEach(post => {
        post.schedule_details.forEach(schedule => {
          if (schedule.status === 'published' && schedule.engagement_data) {
            const engagement = this.calculatePostEngagement(schedule.engagement_data);
            totalEngagement += engagement;
            
            if (!engagementByPlatform[schedule.provider]) {
              engagementByPlatform[schedule.provider] = 0;
            }
            engagementByPlatform[schedule.provider] += engagement;
          }
        });
      });

      // Generate engagement trend (daily data points)
      const engagementTrend = this.generateEngagementTrend(filteredPosts, timeframe);

      return {
        total_posts: filteredPosts.length,
        total_engagement: totalEngagement,
        avg_engagement_per_post: filteredPosts.length > 0 ? totalEngagement / filteredPosts.length : 0,
        engagement_by_platform: engagementByPlatform,
        engagement_trend: engagementTrend
      };
    } catch (error) {
      console.error('Error getting engagement stats:', error);
      return {
        total_posts: 0,
        total_engagement: 0,
        avg_engagement_per_post: 0,
        engagement_by_platform: {},
        engagement_trend: []
      };
    }
  }

  async getOptimalPostingTimes(workspaceId: string): Promise<{
    best_hours: number[];
    best_days: string[];
    hourly_performance: Array<{ hour: number; avg_engagement: number; post_count: number }>;
    daily_performance: Array<{ day: string; avg_engagement: number; post_count: number }>;
  }> {
    try {
      const posts = await this.getPostAnalytics(workspaceId);
      
      // Filter published posts with engagement data
      const publishedPosts = posts.filter(post => 
        post.status === 'published' && post.published_at
      );

      // Analyze by hour
      const hourlyData: Record<number, { total_engagement: number; count: number }> = {};
      const dailyData: Record<string, { total_engagement: number; count: number }> = {};

      publishedPosts.forEach(post => {
        if (!post.published_at) return;
        
        const publishedDate = new Date(post.published_at);
        const hour = publishedDate.getHours();
        const day = publishedDate.toLocaleDateString('en-US', { weekday: 'long' });

        // Calculate post engagement
        let postEngagement = 0;
        post.schedule_details.forEach(schedule => {
          if (schedule.engagement_data) {
            postEngagement += this.calculatePostEngagement(schedule.engagement_data);
          }
        });

        // Update hourly data
        if (!hourlyData[hour]) {
          hourlyData[hour] = { total_engagement: 0, count: 0 };
        }
        hourlyData[hour].total_engagement += postEngagement;
        hourlyData[hour].count += 1;

        // Update daily data
        if (!dailyData[day]) {
          dailyData[day] = { total_engagement: 0, count: 0 };
        }
        dailyData[day].total_engagement += postEngagement;
        dailyData[day].count += 1;
      });

      // Calculate averages and find best times
      const hourlyPerformance = Object.entries(hourlyData).map(([hour, data]) => ({
        hour: parseInt(hour),
        avg_engagement: data.count > 0 ? data.total_engagement / data.count : 0,
        post_count: data.count
      })).sort((a, b) => b.avg_engagement - a.avg_engagement);

      const dailyPerformance = Object.entries(dailyData).map(([day, data]) => ({
        day,
        avg_engagement: data.count > 0 ? data.total_engagement / data.count : 0,
        post_count: data.count
      })).sort((a, b) => b.avg_engagement - a.avg_engagement);

      // Get top 3 hours and days
      const bestHours = hourlyPerformance.slice(0, 3).map(item => item.hour);
      const bestDays = dailyPerformance.slice(0, 3).map(item => item.day);

      return {
        best_hours: bestHours,
        best_days: bestDays,
        hourly_performance: hourlyPerformance,
        daily_performance: dailyPerformance
      };
    } catch (error) {
      console.error('Error getting optimal posting times:', error);
      return {
        best_hours: [],
        best_days: [],
        hourly_performance: [],
        daily_performance: []
      };
    }
  }

  async getErrorAnalysis(workspaceId: string): Promise<{
    total_errors: number;
    error_rate: number;
    errors_by_type: Record<string, number>;
    errors_by_platform: Record<string, number>;
    recent_errors: Array<{
      error_type: string;
      error_message: string;
      platform?: string;
      occurred_at: string;
    }>;
  }> {
    try {
      // Get error logs
      const errorLogs = await this.db.getErrorLogs(workspaceId, { resolved: false });
      
      // Get all posts to calculate error rate
      const posts = await this.getPostAnalytics(workspaceId);
      const totalPosts = posts.length;
      const failedPosts = posts.filter(post => post.failed_count > 0).length;
      
      // Analyze errors by type
      const errorsByType: Record<string, number> = {};
      const errorsByPlatform: Record<string, number> = {};
      
      errorLogs.forEach(error => {
        // Count by error type
        if (!errorsByType[error.error_type]) {
          errorsByType[error.error_type] = 0;
        }
        errorsByType[error.error_type] += 1;

        // Count by platform (extract from context if available)
        const platform = error.context?.provider || 'unknown';
        if (!errorsByPlatform[platform]) {
          errorsByPlatform[platform] = 0;
        }
        errorsByPlatform[platform] += 1;
      });

      // Get recent errors (last 10)
      const recentErrors = errorLogs
        .slice(0, 10)
        .map(error => ({
          error_type: error.error_type,
          error_message: error.error_message,
          platform: error.context?.provider,
          occurred_at: error.created_at
        }));

      return {
        total_errors: errorLogs.length,
        error_rate: totalPosts > 0 ? (failedPosts / totalPosts) * 100 : 0,
        errors_by_type: errorsByType,
        errors_by_platform: errorsByPlatform,
        recent_errors: recentErrors
      };
    } catch (error) {
      console.error('Error getting error analysis:', error);
      return {
        total_errors: 0,
        error_rate: 0,
        errors_by_type: {},
        errors_by_platform: {},
        recent_errors: []
      };
    }
  }

  private calculatePostEngagement(engagementData: any): number {
    if (!engagementData) return 0;
    
    const likes = engagementData.likes || 0;
    const comments = engagementData.comments || 0;
    const shares = engagementData.shares || 0;
    const reactions = engagementData.reactions || 0;
    
    // Weight different engagement types
    return likes + (comments * 2) + (shares * 3) + reactions;
  }

  private generateEngagementTrend(posts: PostAnalytics[], timeframe: string): Array<{ date: string; engagement: number }> {
    const trend: Array<{ date: string; engagement: number }> = [];
    const now = new Date();
    
    let days = 7; // default for week
    if (timeframe === 'day') days = 1;
    if (timeframe === 'month') days = 30;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Calculate engagement for this day
      let dayEngagement = 0;
      posts.forEach(post => {
        if (post.published_at && post.published_at.startsWith(dateStr)) {
          post.schedule_details.forEach(schedule => {
            if (schedule.engagement_data) {
              dayEngagement += this.calculatePostEngagement(schedule.engagement_data);
            }
          });
        }
      });
      
      trend.push({ date: dateStr, engagement: dayEngagement });
    }
    
    return trend;
  }
}
