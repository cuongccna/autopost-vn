import { query, insert } from '@/lib/db/postgres';
import { 
  CreateActivityLogRequest, 
  SystemActivityLog, 
  ActivityLogFilters, 
  ActivityLogResponse,
  createLogDescription 
} from '@/types/activity-logs';

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
      
      // Validate UUID format for workspace_id and target_resource_id
      const isValidUUID = (str: string | undefined) => {
        if (!str) return false;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };
      
      const insertData = {
        user_id: userId,
        workspace_id: isValidUUID(logData.workspace_id) ? logData.workspace_id : null,
        action_type: logData.action_type,
        action_category: logData.action_category,
        description,
        target_resource_type: logData.target_resource_type,
        target_resource_id: isValidUUID(logData.target_resource_id) ? logData.target_resource_id : null,
        previous_data: JSON.stringify(logData.previous_data || {}),
        new_data: JSON.stringify(logData.new_data || {}),
        ip_address: context?.ipAddress,
        user_agent: context?.userAgent,
        request_id: context?.requestId,
        session_id: context?.sessionId,
        status: logData.status || 'success',
        error_message: logData.error_message,
        duration_ms: logData.duration_ms || (Date.now() - startTime),
        additional_data: JSON.stringify(logData.additional_data || {}),
      };
      
      const result = await insert('autopostvn_system_activity_logs', insertData);
      
      if (!result || result.length === 0) {
        console.error('Error creating activity log: No data returned');
        return null;
      }
      
      return result[0] as SystemActivityLog;
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
      // Build WHERE clause
      let whereClause = 'user_id = $1';
      const params: any[] = [userId];
      let paramCount = 1;
      
      if (filters.action_category) {
        paramCount++;
        whereClause += ` AND action_category = $${paramCount}`;
        params.push(filters.action_category);
      }
      
      if (filters.action_type) {
        paramCount++;
        whereClause += ` AND action_type = $${paramCount}`;
        params.push(filters.action_type);
      }
      
      if (filters.status) {
        paramCount++;
        whereClause += ` AND status = $${paramCount}`;
        params.push(filters.status);
      }
      
      if (filters.target_resource_type) {
        paramCount++;
        whereClause += ` AND target_resource_type = $${paramCount}`;
        params.push(filters.target_resource_type);
      }
      
      if (filters.date_from) {
        paramCount++;
        whereClause += ` AND created_at >= $${paramCount}`;
        params.push(filters.date_from);
      }
      
      if (filters.date_to) {
        paramCount++;
        whereClause += ` AND created_at <= $${paramCount}`;
        params.push(filters.date_to);
      }
      
      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM autopostvn_system_activity_logs WHERE ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0]?.total || '0');
      
      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      
      // Get data
      const dataResult = await query(
        `SELECT * FROM autopostvn_system_activity_logs 
         WHERE ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        [...params, limit, offset]
      );
      
      return {
        logs: dataResult.rows || [],
        total,
        has_more: total > offset + limit,
      };
    } catch (error) {
      console.error('Error fetching user logs:', error);
      return { logs: [], total: 0, has_more: false };
    }
  }  /**
   * Lấy nhật ký hoạt động của workspace
   */
  static async getWorkspaceLogs(
    workspaceId: string,
    filters: ActivityLogFilters = {}
  ): Promise<ActivityLogResponse> {
    try {
      // Build WHERE conditions
      let whereConditions = ['workspace_id = $1'];
      let paramValues: any[] = [workspaceId];
      let paramIndex = 2;

      if (filters.action_category) {
        whereConditions.push(`action_category = $${paramIndex}`);
        paramValues.push(filters.action_category);
        paramIndex++;
      }

      if (filters.action_type) {
        whereConditions.push(`action_type = $${paramIndex}`);
        paramValues.push(filters.action_type);
        paramIndex++;
      }

      if (filters.status) {
        whereConditions.push(`status = $${paramIndex}`);
        paramValues.push(filters.status);
        paramIndex++;
      }

      if (filters.target_resource_type) {
        whereConditions.push(`target_resource_type = $${paramIndex}`);
        paramValues.push(filters.target_resource_type);
        paramIndex++;
      }

      if (filters.date_from) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        paramValues.push(filters.date_from);
        paramIndex++;
      }

      if (filters.date_to) {
        whereConditions.push(`created_at <= $${paramIndex}`);
        paramValues.push(filters.date_to);
        paramIndex++;
      }

      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      // First, get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM autopostvn_system_activity_logs
        WHERE ${whereConditions.join(' AND ')}
      `;

      const countResult = await query(countQuery, paramValues);
      const total = parseInt(countResult.rows[0].total);

      // Then get paginated data with user info
      const dataQuery = `
        SELECT
          l.*,
          u.full_name,
          u.email,
          u.avatar_url
        FROM autopostvn_system_activity_logs l
        LEFT JOIN autopostvn_users u ON l.user_id = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY l.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      paramValues.push(limit, offset);
      const dataResult = await query(dataQuery, paramValues);

      // Transform data to match expected format
      const logs = dataResult.rows.map(row => ({
        ...row,
        user: row.full_name || row.email ? {
          full_name: row.full_name,
          email: row.email,
          avatar_url: row.avatar_url
        } : null
      }));

      return {
        logs,
        total,
        has_more: total > offset + limit,
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

      const result = await query(
        'DELETE FROM autopostvn_system_activity_logs WHERE created_at < $1',
        [cutoffDate.toISOString()]
      );

      return result.rowCount || 0;
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

      // Build base query
      let whereConditions = ['user_id = $1', 'created_at >= $2'];
      let paramValues: any[] = [userId, startDate.toISOString()];

      if (workspaceId) {
        whereConditions.push('workspace_id = $3');
        paramValues.push(workspaceId);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total actions and success count in one query
      const statsQuery = `
        SELECT
          COUNT(*) as total_actions,
          COUNT(*) FILTER (WHERE status = 'success') as success_count
        FROM autopostvn_system_activity_logs
        WHERE ${whereClause}
      `;

      const statsResult = await query(statsQuery, paramValues);
      const totalActions = parseInt(statsResult.rows[0].total_actions);
      const successCount = parseInt(statsResult.rows[0].success_count);
      const successRate = totalActions > 0 ? (successCount / totalActions) * 100 : 0;

      // Get category breakdown
      const categoryQuery = `
        SELECT action_category, COUNT(*) as count
        FROM autopostvn_system_activity_logs
        WHERE ${whereClause}
        GROUP BY action_category
      `;

      const categoryResult = await query(categoryQuery, paramValues);
      const byCategory = categoryResult.rows.reduce((acc: Record<string, number>, row: any) => {
        acc[row.action_category] = parseInt(row.count);
        return acc;
      }, {});

      // Get daily breakdown
      const dailyQuery = `
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM autopostvn_system_activity_logs
        WHERE ${whereClause}
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
      `;

      const dailyResult = await query(dailyQuery, paramValues);
      const byDay = dailyResult.rows.map((row: any) => ({
        date: row.date.toISOString().split('T')[0],
        count: parseInt(row.count)
      }));

      return {
        total_actions: totalActions,
        success_rate: Number(successRate.toFixed(2)),
        by_category: byCategory,
        by_day: byDay,
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
