import { createClient } from '@supabase/supabase-js';
import { 
  CreateActivityLogRequest, 
  SystemActivityLog, 
  ActivityLogFilters, 
  ActivityLogResponse,
  createLogDescription 
} from '@/types/activity-logs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class ActivityLogService {
  /**
   * Ghi nhật ký hoạt động của người dùng
   */
  static async log(
    userId: string, 
    logData: CreateActivityLogRequest,
    context?: {
      ipAddress?: string;
      userAgent?: string;
      requestId?: string;
      sessionId?: string;
    }
  ): Promise<SystemActivityLog | null> {
    try {
      const startTime = Date.now();
      
      // Tự động tạo description nếu không có
      const description = logData.description || createLogDescription(
        logData.action_type, 
        logData.additional_data || {}
      );
      
      const insertData = {
        user_id: userId,
        workspace_id: logData.workspace_id,
        action_type: logData.action_type,
        action_category: logData.action_category,
        description,
        target_resource_type: logData.target_resource_type,
        target_resource_id: logData.target_resource_id,
        previous_data: logData.previous_data || {},
        new_data: logData.new_data || {},
        ip_address: context?.ipAddress,
        user_agent: context?.userAgent,
        request_id: context?.requestId,
        session_id: context?.sessionId,
        status: logData.status || 'success',
        error_message: logData.error_message,
        duration_ms: logData.duration_ms || (Date.now() - startTime),
        additional_data: logData.additional_data || {},
      };
      
      const { data, error } = await supabase
        .from('autopostvn_system_activity_logs')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating activity log:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Activity log service error:', error);
      return null;
    }
  }
  
  /**
   * Lấy nhật ký hoạt động của người dùng
   */
  static async getUserLogs(
    userId: string, 
    filters: ActivityLogFilters = {}
  ): Promise<ActivityLogResponse> {
    try {
      let query = supabase
        .from('autopostvn_system_activity_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filters.action_category) {
        query = query.eq('action_category', filters.action_category);
      }
      
      if (filters.action_type) {
        query = query.eq('action_type', filters.action_type);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.target_resource_type) {
        query = query.eq('target_resource_type', filters.target_resource_type);
      }
      
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      
      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      
      query = query.range(offset, offset + limit - 1);
      
      const { data, error, count } = await query;
      
      if (error) {
        throw error;
      }
      
      return {
        logs: data || [],
        total: count || 0,
        has_more: (count || 0) > offset + limit,
      };
    } catch (error) {
      console.error('Error fetching user logs:', error);
      return { logs: [], total: 0, has_more: false };
    }
  }
  
  /**
   * Lấy nhật ký hoạt động của workspace
   */
  static async getWorkspaceLogs(
    workspaceId: string,
    filters: ActivityLogFilters = {}
  ): Promise<ActivityLogResponse> {
    try {
      let query = supabase
        .from('autopostvn_system_activity_logs')
        .select(`
          *,
          user:autopostvn_user_profiles!user_id(
            full_name,
            email,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      // Apply same filters as getUserLogs
      if (filters.action_category) {
        query = query.eq('action_category', filters.action_category);
      }
      
      if (filters.action_type) {
        query = query.eq('action_type', filters.action_type);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.target_resource_type) {
        query = query.eq('target_resource_type', filters.target_resource_type);
      }
      
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      
      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      
      query = query.range(offset, offset + limit - 1);
      
      const { data, error, count } = await query;
      
      if (error) {
        throw error;
      }
      
      return {
        logs: data || [],
        total: count || 0,
        has_more: (count || 0) > offset + limit,
      };
    } catch (error) {
      console.error('Error fetching workspace logs:', error);
      return { logs: [], total: 0, has_more: false };
    }
  }
  
  /**
   * Xóa nhật ký cũ (cleanup)
   */
  static async cleanupOldLogs(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const { data, error } = await supabase
        .from('autopostvn_system_activity_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');
      
      if (error) {
        throw error;
      }
      
      return data?.length || 0;
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      return 0;
    }
  }
  
  /**
   * Thống kê hoạt động
   */
  static async getActivityStats(
    userId: string,
    workspaceId?: string,
    days: number = 30
  ): Promise<{
    total_actions: number;
    success_rate: number;
    by_category: Record<string, number>;
    by_day: Array<{ date: string; count: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      let query = supabase
        .from('autopostvn_system_activity_logs')
        .select('action_category, status, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());
        
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        return {
          total_actions: 0,
          success_rate: 0,
          by_category: {},
          by_day: [],
        };
      }
      
      const totalActions = data.length;
      const successCount = data.filter((log: any) => log.status === 'success').length;
      const successRate = totalActions > 0 ? (successCount / totalActions) * 100 : 0;
      
      // Group by category
      const byCategory = data.reduce((acc: Record<string, number>, log: any) => {
        acc[log.action_category] = (acc[log.action_category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Group by day
      const byDay = data.reduce((acc: Array<{ date: string; count: number }>, log: any) => {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        const existing = acc.find((item: any) => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, [] as Array<{ date: string; count: number }>);
      
      return {
        total_actions: totalActions,
        success_rate: Number(successRate.toFixed(2)),
        by_category: byCategory,
        by_day: byDay.sort((a: any, b: any) => a.date.localeCompare(b.date)),
      };
    } catch (error) {
      console.error('Error getting activity stats:', error);
      return {
        total_actions: 0,
        success_rate: 0,
        by_category: {},
        by_day: [],
      };
    }
  }
}
