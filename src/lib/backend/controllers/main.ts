// AutoPost VN - Backend Controller
// Main controller to orchestrate all backend services

import { DatabaseService } from '../services/database';
import { PostService } from '../services/post';
import { SocialAccountService } from '../services/socialAccount';
import { AnalyticsService } from '../services/analytics';
import { EncryptionService } from '@/lib/backend/utils/encryption';
import {
  DatabaseConfig,
  CreatePostRequest,
  UpdatePostRequest,
  ConnectSocialAccountRequest,
  ApiResponse
} from '../types';

export class BackendController {
  private db: DatabaseService;
  private encryption: EncryptionService;
  private postService: PostService;
  private socialAccountService: SocialAccountService;
  private analyticsService: AnalyticsService;

  constructor(config: {
    database: DatabaseConfig;
    encryptionKey: string;
  }) {
    // Initialize services
    this.db = new DatabaseService(config.database);
    this.encryption = new EncryptionService(config.encryptionKey);
    this.postService = new PostService(this.db, this.encryption);
    this.socialAccountService = new SocialAccountService(this.db, this.encryption);
    this.analyticsService = new AnalyticsService(this.db);
  }

  // ========================================
  // POST METHODS
  // ========================================

  async createPost(workspaceId: string, data: CreatePostRequest): Promise<ApiResponse> {
    try {
      const post = await this.postService.create(workspaceId, data);
      return {
        success: true,
        data: post,
        message: 'Post created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create post'
      };
    }
  }

  async updatePost(postId: string, data: UpdatePostRequest): Promise<ApiResponse> {
    try {
      const post = await this.postService.update(postId, data);
      return {
        success: true,
        data: post,
        message: 'Post updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update post'
      };
    }
  }

  async deletePost(postId: string): Promise<ApiResponse> {
    try {
      await this.postService.delete(postId);
      return {
        success: true,
        message: 'Post deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete post'
      };
    }
  }

  async getPosts(workspaceId: string, _filters?: any): Promise<ApiResponse> {
    try {
      const posts = await this.postService.getPostsWithSchedules(workspaceId);
      return {
        success: true,
        data: posts
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get posts'
      };
    }
  }

  async getPost(postId: string): Promise<ApiResponse> {
    try {
      const post = await this.postService.findById(postId);
      if (!post) {
        return {
          success: false,
          error: 'Post not found'
        };
      }
      return {
        success: true,
        data: post
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get post'
      };
    }
  }

  async reschedulePost(postId: string, newScheduledAt: string): Promise<ApiResponse> {
    try {
      const post = await this.postService.reschedulePost(postId, new Date(newScheduledAt));
      return {
        success: true,
        data: post,
        message: 'Post rescheduled successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reschedule post'
      };
    }
  }

  // ========================================
  // SOCIAL ACCOUNT METHODS
  // ========================================

  async connectSocialAccount(workspaceId: string, data: ConnectSocialAccountRequest): Promise<ApiResponse> {
    try {
      const account = await this.socialAccountService.connect(workspaceId, data);
      return {
        success: true,
        data: account,
        message: 'Social account connected successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect social account'
      };
    }
  }

  async disconnectSocialAccount(accountId: string): Promise<ApiResponse> {
    try {
      await this.socialAccountService.disconnect(accountId);
      return {
        success: true,
        message: 'Social account disconnected successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect social account'
      };
    }
  }

  async refreshSocialAccountToken(accountId: string): Promise<ApiResponse> {
    try {
      const account = await this.socialAccountService.refreshToken(accountId);
      return {
        success: true,
        data: account,
        message: 'Token refreshed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh token'
      };
    }
  }

  async getSocialAccounts(workspaceId: string): Promise<ApiResponse> {
    try {
      const accounts = await this.socialAccountService.findByWorkspace(workspaceId);
      return {
        success: true,
        data: accounts
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get social accounts'
      };
    }
  }

  async checkAccountHealth(accountId: string): Promise<ApiResponse> {
    try {
      const health = await this.socialAccountService.checkAccountHealth(accountId);
      return {
        success: true,
        data: health
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check account health'
      };
    }
  }

  // ========================================
  // ANALYTICS METHODS
  // ========================================

  async getPostAnalytics(workspaceId: string, filters?: any): Promise<ApiResponse> {
    try {
      const analytics = await this.analyticsService.getPostAnalytics(workspaceId, filters);
      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get post analytics'
      };
    }
  }

  async getAccountPerformance(workspaceId: string): Promise<ApiResponse> {
    try {
      const performance = await this.analyticsService.getAccountPerformance(workspaceId);
      return {
        success: true,
        data: performance
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account performance'
      };
    }
  }

  async getEngagementStats(workspaceId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<ApiResponse> {
    try {
      const stats = await this.analyticsService.getEngagementStats(workspaceId, timeframe);
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get engagement stats'
      };
    }
  }

  async getOptimalPostingTimes(workspaceId: string): Promise<ApiResponse> {
    try {
      const times = await this.analyticsService.getOptimalPostingTimes(workspaceId);
      return {
        success: true,
        data: times
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get optimal posting times'
      };
    }
  }

  async getErrorAnalysis(workspaceId: string): Promise<ApiResponse> {
    try {
      const analysis = await this.analyticsService.getErrorAnalysis(workspaceId);
      return {
        success: true,
        data: analysis
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get error analysis'
      };
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  async getDashboardData(workspaceId: string): Promise<ApiResponse> {
    try {
      // Get all dashboard data in parallel
      const [
        posts,
        accounts,
        postAnalytics,
        accountPerformance,
        engagementStats,
        errorAnalysis
      ] = await Promise.all([
        this.postService.getPostsWithSchedules(workspaceId),
        this.socialAccountService.findByWorkspace(workspaceId),
        this.analyticsService.getPostAnalytics(workspaceId),
        this.analyticsService.getAccountPerformance(workspaceId),
        this.analyticsService.getEngagementStats(workspaceId, 'week'),
        this.analyticsService.getErrorAnalysis(workspaceId)
      ]);

      const dashboardData = {
        posts,
        accounts,
        analytics: {
          posts: postAnalytics,
          accounts: accountPerformance,
          engagement: engagementStats,
          errors: errorAnalysis
        },
        summary: {
          total_posts: posts.length,
          total_accounts: accounts.length,
          connected_accounts: accounts.filter(acc => acc.status === 'connected').length,
          scheduled_posts: posts.filter(post => post.status === 'scheduled').length,
          published_posts: posts.filter(post => post.status === 'published').length,
          failed_posts: posts.filter(post => post.status === 'failed').length
        }
      };

      return {
        success: true,
        data: dashboardData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get dashboard data'
      };
    }
  }

  async getSystemHealth(): Promise<ApiResponse> {
    try {
      // Basic health checks
      const dbHealth = await this.checkDatabaseHealth();
      const serviceHealth = await this.checkServicesHealth();

      const health = {
        status: dbHealth && serviceHealth ? 'healthy' : 'unhealthy',
        database: dbHealth ? 'connected' : 'disconnected',
        services: serviceHealth ? 'operational' : 'error',
        timestamp: new Date().toISOString()
      };

      return {
        success: true,
        data: health
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      // Try to fetch a workspace to test database connection
      await this.db.getWorkspace('test');
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkServicesHealth(): Promise<boolean> {
    try {
      // Basic service initialization check
      return !!(this.postService && this.socialAccountService && this.analyticsService);
    } catch (error) {
      return false;
    }
  }
}
