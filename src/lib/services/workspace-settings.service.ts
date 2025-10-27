import { sbServer } from '@/lib/supabase/server';
import logger from '@/lib/utils/logger';

export interface WorkspaceSettings {
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    onTokenExpiry: boolean;
  };
  scheduling: {
    timezone: string;
    goldenHours: string[];
    rateLimit: number;
  };
  advanced: {
    autoDeleteOldPosts: boolean;
    autoDeleteDays: number;
    testMode: boolean;
  };
}

const DEFAULT_SETTINGS: WorkspaceSettings = {
  notifications: {
    onSuccess: true,
    onFailure: true,
    onTokenExpiry: true,
  },
  scheduling: {
    timezone: 'Asia/Ho_Chi_Minh',
    goldenHours: ['09:00', '12:30', '20:00'],
    rateLimit: 10,
  },
  advanced: {
    autoDeleteOldPosts: false,
    autoDeleteDays: 30,
    testMode: false,
  },
};

export class WorkspaceSettingsService {
  /**
   * Get workspace settings from database
   */
  static async getSettings(workspaceId: string): Promise<WorkspaceSettings> {
    try {
      const supabase = sbServer();
      
      const { data: workspace, error } = await supabase
        .from('autopostvn_workspaces')
        .select('settings')
        .eq('id', workspaceId)
        .single();
      
      if (error) {
        logger.error('Failed to fetch workspace settings', { error, workspaceId });
        return DEFAULT_SETTINGS;
      }
      
      if (!workspace || !workspace.settings) {
        return DEFAULT_SETTINGS;
      }
      
      // Merge with defaults to ensure all fields exist
      return {
        notifications: {
          ...DEFAULT_SETTINGS.notifications,
          ...(workspace.settings.notifications || {}),
        },
        scheduling: {
          ...DEFAULT_SETTINGS.scheduling,
          ...(workspace.settings.scheduling || {}),
        },
        advanced: {
          ...DEFAULT_SETTINGS.advanced,
          ...(workspace.settings.advanced || {}),
        },
      };
    } catch (error) {
      logger.error('Error getting workspace settings', { error, workspaceId });
      return DEFAULT_SETTINGS;
    }
  }
  
  /**
   * Check if current time is within golden hours
   */
  static isGoldenHour(settings: WorkspaceSettings, datetime?: Date): boolean {
    const now = datetime || new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: settings.scheduling.timezone,
    });
    
    // Check if current time matches any golden hour (within 30 min window)
    return settings.scheduling.goldenHours.some(goldenHour => {
      const [hour, minute] = goldenHour.split(':').map(Number);
      const [nowHour, nowMinute] = timeStr.split(':').map(Number);
      
      const goldenMinutes = hour * 60 + minute;
      const nowMinutes = nowHour * 60 + nowMinute;
      
      // Within 30 minutes before or after
      return Math.abs(nowMinutes - goldenMinutes) <= 30;
    });
  }
  
  /**
   * Get suggested posting time based on golden hours
   */
  static getNextGoldenHour(settings: WorkspaceSettings, fromDate?: Date): Date {
    const now = fromDate || new Date();
    const timezone = settings.scheduling.timezone;
    
    // Convert current time to workspace timezone
    const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const nowMinutes = nowInTz.getHours() * 60 + nowInTz.getMinutes();
    
    // Find next golden hour
    for (const goldenHour of settings.scheduling.goldenHours) {
      const [hour, minute] = goldenHour.split(':').map(Number);
      const goldenMinutes = hour * 60 + minute;
      
      if (goldenMinutes > nowMinutes) {
        const next = new Date(nowInTz);
        next.setHours(hour, minute, 0, 0);
        return next;
      }
    }
    
    // If no golden hour today, return first golden hour tomorrow
    const tomorrow = new Date(nowInTz);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [hour, minute] = settings.scheduling.goldenHours[0].split(':').map(Number);
    tomorrow.setHours(hour, minute, 0, 0);
    
    return tomorrow;
  }
  
  /**
   * Check if rate limit would be exceeded
   */
  static async checkRateLimit(
    workspaceId: string,
    settings: WorkspaceSettings
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    try {
      const supabase = sbServer();
      
      // Count posts scheduled in the last hour
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      // Join with posts table to filter by workspace_id
      const { count, error } = await supabase
        .from('autopostvn_post_schedules')
        .select('id, post:autopostvn_posts!inner(workspace_id)', { count: 'exact', head: true })
        .eq('post.workspace_id', workspaceId)
        .gte('created_at', oneHourAgo.toISOString())
        .eq('status', 'published');
      
      if (error) {
        logger.error('Failed to check rate limit', { 
          error: error.message, 
          workspaceId 
        });
        return { allowed: true, current: 0, limit: settings.scheduling.rateLimit };
      }
      
      const current = count || 0;
      const allowed = current < settings.scheduling.rateLimit;
      
      return {
        allowed,
        current,
        limit: settings.scheduling.rateLimit,
      };
    } catch (error) {
      logger.error('Error checking rate limit', { error, workspaceId });
      return { allowed: true, current: 0, limit: settings.scheduling.rateLimit };
    }
  }
  
  /**
   * Should send notification based on settings
   */
  static shouldNotify(
    settings: WorkspaceSettings,
    type: 'success' | 'failure' | 'tokenExpiry'
  ): boolean {
    switch (type) {
      case 'success':
        return settings.notifications.onSuccess;
      case 'failure':
        return settings.notifications.onFailure;
      case 'tokenExpiry':
        return settings.notifications.onTokenExpiry;
      default:
        return false;
    }
  }
  
  /**
   * Is test mode enabled
   */
  static isTestMode(settings: WorkspaceSettings): boolean {
    return settings.advanced.testMode;
  }
}
