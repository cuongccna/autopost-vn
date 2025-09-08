/**
 * Activity Logger Service for V3 Compose
 * Logs all user activities including post creation, updates, AI usage, etc.
 */

interface ActivityLogData {
  action_type: string;
  action_category: 'auth' | 'post' | 'account' | 'workspace' | 'admin' | 'api' | 'ai';
  description: string;
  workspace_id?: string;
  target_resource_type?: string;
  target_resource_id?: string;
  old_data?: any;
  new_data?: any;
  status?: 'success' | 'failed' | 'warning';
  duration_ms?: number;
  additional_data?: any;
  ip_address?: string;
  user_agent?: string;
}

class ActivityLogger {
  private static instance: ActivityLogger;
  private isLogging = false;

  static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger();
    }
    return ActivityLogger.instance;
  }

  async logActivity(data: ActivityLogData): Promise<boolean> {
    if (this.isLogging) return false; // Prevent recursive logging
    
    try {
      this.isLogging = true;

      const response = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          ip_address: data.ip_address || this.getClientIP(),
          user_agent: data.user_agent || navigator.userAgent,
        }),
      });

      if (!response.ok) {
        console.error('Failed to log activity:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Activity logging error:', error);
      return false;
    } finally {
      this.isLogging = false;
    }
  }

  private getClientIP(): string {
    // This will be populated by the API from request headers
    return '';
  }

  // Post-related activities
  async logPostCreated(postData: any, postId?: string): Promise<void> {
    await this.logActivity({
      action_type: 'post_created',
      action_category: 'post',
      description: `Tạo bài đăng mới: "${postData.title || 'Không có tiêu đề'}"`,
      target_resource_type: 'post',
      target_resource_id: postId,
      new_data: {
        title: postData.title,
        content: postData.content?.substring(0, 100) + '...',
        platforms: postData.channels,
        metadata: postData.metadata,
      },
      status: 'success',
      additional_data: {
        tab_type: postData.metadata?.type || 'social',
        platforms: postData.channels,
        has_media: (postData.mediaUrls?.length || 0) > 0,
        is_scheduled: !!postData.scheduleAt,
      }
    });
  }

  async logPostUpdated(oldData: any, newData: any, postId: string): Promise<void> {
    await this.logActivity({
      action_type: 'post_updated',
      action_category: 'post',
      description: `Cập nhật bài đăng: "${newData.title || 'Không có tiêu đề'}"`,
      target_resource_type: 'post',
      target_resource_id: postId,
      old_data: {
        title: oldData.title,
        content: oldData.content?.substring(0, 100) + '...',
      },
      new_data: {
        title: newData.title,
        content: newData.content?.substring(0, 100) + '...',
      },
      status: 'success',
      additional_data: {
        changes: this.detectChanges(oldData, newData),
      }
    });
  }

  async logPostScheduled(postData: any, scheduledTime: string, postId?: string): Promise<void> {
    await this.logActivity({
      action_type: 'post_scheduled',
      action_category: 'post',
      description: `Lên lịch đăng bài: "${postData.title || 'Không có tiêu đề'}" vào ${new Date(scheduledTime).toLocaleString('vi-VN')}`,
      target_resource_type: 'post',
      target_resource_id: postId,
      new_data: {
        title: postData.title,
        scheduled_time: scheduledTime,
        platforms: postData.channels,
      },
      status: 'success',
      additional_data: {
        scheduled_for: scheduledTime,
        platforms: postData.channels,
      }
    });
  }

  async logPostFailed(postData: any, error: string, postId?: string): Promise<void> {
    await this.logActivity({
      action_type: 'post_failed',
      action_category: 'post',
      description: `Lỗi tạo bài đăng: "${postData.title || 'Không có tiêu đề'}" - ${error}`,
      target_resource_type: 'post',
      target_resource_id: postId,
      new_data: {
        title: postData.title,
        error_message: error,
      },
      status: 'failed',
      additional_data: {
        error_type: this.categorizeError(error),
        platforms: postData.channels,
      }
    });
  }

  // AI-related activities
  async logAIUsage(action: string, platform: string, success: boolean, error?: string): Promise<void> {
    await this.logActivity({
      action_type: `ai_${action}`,
      action_category: 'ai',
      description: `Sử dụng AI ${this.getAIActionName(action)} cho ${platform} - ${success ? 'Thành công' : 'Thất bại'}`,
      target_resource_type: 'ai_generation',
      status: success ? 'success' : 'failed',
      additional_data: {
        ai_action: action,
        platform,
        error_message: error,
        model: 'gemini-1.5-flash-8b',
      }
    });
  }

  // Template usage
  async logTemplateUsed(template: any, tabType: 'social' | 'video'): Promise<void> {
    await this.logActivity({
      action_type: 'template_used',
      action_category: 'post',
      description: `Sử dụng template "${template.name}" cho ${tabType === 'video' ? 'video' : 'bài đăng'}`,
      target_resource_type: 'template',
      target_resource_id: template.id,
      status: 'success',
      additional_data: {
        template_type: tabType,
        template_name: template.name,
        template_ratio: template.ratio,
      }
    });
  }

  // Platform/ratio selection
  async logPlatformSelected(platform: string, ratio: string, tabType: 'social' | 'video'): Promise<void> {
    await this.logActivity({
      action_type: 'platform_selected',
      action_category: 'post',
      description: `Chọn nền tảng ${platform} với tỷ lệ ${ratio} cho ${tabType === 'video' ? 'video' : 'bài đăng'}`,
      status: 'success',
      additional_data: {
        platform,
        ratio,
        tab_type: tabType,
      }
    });
  }

  // Private helper methods
  private detectChanges(oldData: any, newData: any): string[] {
    const changes: string[] = [];
    
    if (oldData.title !== newData.title) changes.push('title');
    if (oldData.content !== newData.content) changes.push('content');
    if (JSON.stringify(oldData.channels) !== JSON.stringify(newData.channels)) changes.push('platforms');
    if (oldData.scheduleAt !== newData.scheduleAt) changes.push('schedule');
    if (JSON.stringify(oldData.mediaUrls) !== JSON.stringify(newData.mediaUrls)) changes.push('media');
    
    return changes;
  }

  private categorizeError(error: string): string {
    if (error.includes('network') || error.includes('fetch')) return 'network';
    if (error.includes('auth') || error.includes('unauthorized')) return 'authentication';
    if (error.includes('rate limit') || error.includes('quota')) return 'rate_limit';
    if (error.includes('validation') || error.includes('required')) return 'validation';
    return 'unknown';
  }

  private getAIActionName(action: string): string {
    const actions: { [key: string]: string } = {
      'caption': 'tạo nội dung',
      'hashtags': 'gợi ý hashtag',
      'script': 'tạo script video',
      'hook': 'gợi ý hook',
      'timeline': 'chia timeline',
    };
    return actions[action] || action;
  }
}

// Export singleton instance
export const activityLogger = ActivityLogger.getInstance();

// Export for testing
export { ActivityLogger };
