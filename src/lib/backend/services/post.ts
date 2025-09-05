// AutoPost VN - Post Service
/* eslint-disable no-unused-vars */
import { DatabaseService } from './database';
import { EncryptionService } from '@/lib/backend/utils/encryption';
import {
  Post,
  PostSchedule,
  CreatePostRequest,
  UpdatePostRequest,
  PostService as IPostService,
} from '../types';

export class PostService implements IPostService {
  // eslint-disable-next-line no-unused-vars
  constructor(
    private db: DatabaseService,
    private encryption: EncryptionService
  ) {}

  async create(workspaceId: string, data: CreatePostRequest): Promise<Post> {
    try {
      // Create the main post
      const post = await this.db.createPost({
        workspace_id: workspaceId,
        title: data.title,
        content: data.content,
        media_urls: data.media_urls || [],
        media_metadata: {},
        status: data.scheduled_at ? 'scheduled' : 'draft',
        scheduled_at: data.scheduled_at,
        tags: data.tags || [],
        metadata: {},
        created_by: 'system' // TODO: Get from auth context
      });

      // Create schedules for each social account if scheduled
      if (data.scheduled_at && data.social_account_ids.length > 0) {
        await this.scheduleToAccounts(post.id, data.social_account_ids, new Date(data.scheduled_at));
      }

      // Log analytics event
      await this.db.createAnalyticsEvent({
        workspace_id: workspaceId,
        event_type: 'post_created',
        event_data: {
          post_id: post.id,
          status: post.status,
          social_accounts_count: data.social_account_ids.length
        },
        post_id: post.id
      });

      return post;
    } catch (error) {
      // Log error
      await this.db.createErrorLog({
        workspace_id: workspaceId,
        error_type: 'post_creation_failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_stack: error instanceof Error ? error.stack : undefined,
        context: { data }
      });

      throw error;
    }
  }

  async update(id: string, data: UpdatePostRequest): Promise<Post> {
    try {
      const existingPost = await this.db.getPost(id);
      if (!existingPost) {
        throw new Error('Post not found');
      }

      // Update the post
      const updatedPost = await this.db.updatePost(id, {
        ...data,
        updated_at: new Date().toISOString()
      });

      // If scheduled_at changed, update all pending schedules
      if (data.scheduled_at && data.scheduled_at !== existingPost.scheduled_at) {
        await this.updateScheduleTiming(id, new Date(data.scheduled_at));
      }

      // Log analytics event
      await this.db.createAnalyticsEvent({
        workspace_id: existingPost.workspace_id,
        event_type: 'post_updated',
        event_data: {
          post_id: id,
          changes: data
        },
        post_id: id
      });

      return updatedPost;
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const post = await this.db.getPost(id);
      if (!post) {
        throw new Error('Post not found');
      }

      // Delete the post (cascades to schedules)
      await this.db.deletePost(id);

      // Log analytics event
      await this.db.createAnalyticsEvent({
        workspace_id: post.workspace_id,
        event_type: 'post_deleted',
        event_data: {
          post_id: id,
          title: post.title
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async findById(id: string): Promise<Post | null> {
    return await this.db.getPost(id);
  }

  async findByWorkspace(workspaceId: string, filters?: any): Promise<Post[]> {
    return await this.db.getPosts(workspaceId, filters);
  }

  async schedule(postId: string, socialAccountIds: string[], scheduledAt: Date): Promise<PostSchedule[]> {
    try {
      const post = await this.db.getPost(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      // Update post status and scheduled time
      await this.db.updatePost(postId, {
        status: 'scheduled',
        scheduled_at: scheduledAt.toISOString()
      });

      // Create schedules for each account
      const schedules = await this.scheduleToAccounts(postId, socialAccountIds, scheduledAt);

      // Log analytics event
      await this.db.createAnalyticsEvent({
        workspace_id: post.workspace_id,
        event_type: 'post_scheduled',
        event_data: {
          post_id: postId,
          scheduled_at: scheduledAt.toISOString(),
          social_accounts_count: socialAccountIds.length
        },
        post_id: postId
      });

      return schedules;
    } catch (error) {
      throw error;
    }
  }

  private async scheduleToAccounts(postId: string, socialAccountIds: string[], scheduledAt: Date): Promise<PostSchedule[]> {
    const schedules: PostSchedule[] = [];

    for (const accountId of socialAccountIds) {
      const schedule = await this.db.createPostSchedule({
        post_id: postId,
        social_account_id: accountId,
        scheduled_at: scheduledAt.toISOString(),
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        engagement_data: {}
      });

      schedules.push(schedule);
    }

    return schedules;
  }

  private async updateScheduleTiming(postId: string, newScheduledAt: Date): Promise<void> {
    const schedules = await this.db.getPostSchedules(postId);
    
    for (const schedule of schedules) {
      if (schedule.status === 'pending') {
        await this.db.updatePostSchedule(schedule.id, {
          scheduled_at: newScheduledAt.toISOString()
        });
      }
    }
  }

  // Utility methods for frontend
  async getPostsWithSchedules(workspaceId: string): Promise<any[]> {
    const posts = await this.db.getPosts(workspaceId);
    const postsWithSchedules = [];

    for (const post of posts) {
      const schedules = await this.db.getPostSchedules(post.id);
      postsWithSchedules.push({
        ...post,
        schedules: schedules.map(schedule => ({
          id: schedule.id,
          social_account_id: schedule.social_account_id,
          scheduled_at: schedule.scheduled_at,
          status: schedule.status,
          external_post_id: schedule.external_post_id,
          external_url: schedule.external_url,
          engagement_data: schedule.engagement_data
        }))
      });
    }

    return postsWithSchedules;
  }

  async reschedulePost(postId: string, newScheduledAt: Date): Promise<Post> {
    const post = await this.db.getPost(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Update post scheduled time
    const updatedPost = await this.db.updatePost(postId, {
      scheduled_at: newScheduledAt.toISOString(),
      status: 'scheduled'
    });

    // Update all pending schedules
    await this.updateScheduleTiming(postId, newScheduledAt);

    // Log analytics event
    await this.db.createAnalyticsEvent({
      workspace_id: post.workspace_id,
      event_type: 'post_rescheduled',
      event_data: {
        post_id: postId,
        old_scheduled_at: post.scheduled_at,
        new_scheduled_at: newScheduledAt.toISOString()
      },
      post_id: postId
    });

    return updatedPost;
  }

  async cancelScheduledPost(postId: string): Promise<Post> {
    const post = await this.db.getPost(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Update post status
    const updatedPost = await this.db.updatePost(postId, {
      status: 'cancelled'
    });

    // Cancel all pending schedules
    const schedules = await this.db.getPostSchedules(postId);
    for (const schedule of schedules) {
      if (schedule.status === 'pending') {
        await this.db.updatePostSchedule(schedule.id, {
          status: 'cancelled'
        });
      }
    }

    // Log analytics event
    await this.db.createAnalyticsEvent({
      workspace_id: post.workspace_id,
      event_type: 'post_cancelled',
      event_data: {
        post_id: postId,
        title: post.title
      },
      post_id: postId
    });

    return updatedPost;
  }

  async duplicatePost(postId: string): Promise<Post> {
    const originalPost = await this.db.getPost(postId);
    if (!originalPost) {
      throw new Error('Post not found');
    }

    // Create duplicate with modified title
    const duplicateData: CreatePostRequest = {
      title: `${originalPost.title} (Copy)`,
      content: originalPost.content,
      media_urls: originalPost.media_urls,
      tags: originalPost.tags,
      social_account_ids: [] // Don't automatically schedule
    };

    return await this.create(originalPost.workspace_id, duplicateData);
  }
}
