import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  SystemActivityLog, 
  ActivityLogFilters, 
  ActivityLogResponse,
  CreateActivityLogRequest,
  ACTION_TYPES 
} from '@/types/activity-logs';

// Hook để quản lý activity logs
export function useActivityLogs(filters: ActivityLogFilters = {}) {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<SystemActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchLogs = async (newFilters: ActivityLogFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams = new URLSearchParams();
      
      Object.entries({ ...filters, ...newFilters }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      const response = await fetch(`/api/activity-logs?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      
      const data: ActivityLogResponse = await response.json();
      
      if (newFilters.offset && newFilters.offset > 0) {
        // Append to existing logs for pagination
        setLogs(prev => [...prev, ...data.logs]);
      } else {
        // Replace logs for new search
        setLogs(data.logs);
      }
      
      setTotal(data.total);
      setHasMore(data.has_more);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchLogs({ ...filters, offset: logs.length });
    }
  };

  const refresh = () => {
    fetchLogs();
  };

  useEffect(() => {
    // Chỉ fetch khi đã authenticated
    if (status === 'authenticated') {
      fetchLogs();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError(null);
      setLogs([]);
      setTotal(0);
      setHasMore(false);
    }
  }, [status]);

  return {
    logs,
    loading,
    error,
    hasMore,
    total,
    fetchLogs,
    loadMore,
    refresh,
  };
}

// Hook để ghi activity log
export function useLogActivity() {
  const [logging, setLogging] = useState(false);

  const logActivity = async (
    actionType: string,
    actionCategory: 'auth' | 'post' | 'account' | 'workspace' | 'admin' | 'api',
    options: Partial<CreateActivityLogRequest> = {}
  ) => {
    try {
      setLogging(true);
      
      const logData: CreateActivityLogRequest = {
        action_type: actionType,
        action_category: actionCategory,
        description: options.description || '',
        ...options,
      };
      
      const response = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to log activity');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to log activity:', error);
      return null;
    } finally {
      setLogging(false);
    }
  };

  // Convenience methods for common actions
  const logAuth = (action: keyof typeof ACTION_TYPES.AUTH, options?: Partial<CreateActivityLogRequest>) => {
    return logActivity(ACTION_TYPES.AUTH[action], 'auth', options);
  };

  const logPost = (action: keyof typeof ACTION_TYPES.POST, options?: Partial<CreateActivityLogRequest>) => {
    return logActivity(ACTION_TYPES.POST[action], 'post', options);
  };

  const logAccount = (action: keyof typeof ACTION_TYPES.ACCOUNT, options?: Partial<CreateActivityLogRequest>) => {
    return logActivity(ACTION_TYPES.ACCOUNT[action], 'account', options);
  };

  const logWorkspace = (action: keyof typeof ACTION_TYPES.WORKSPACE, options?: Partial<CreateActivityLogRequest>) => {
    return logActivity(ACTION_TYPES.WORKSPACE[action], 'workspace', options);
  };

  const logAdmin = (action: keyof typeof ACTION_TYPES.ADMIN, options?: Partial<CreateActivityLogRequest>) => {
    return logActivity(ACTION_TYPES.ADMIN[action], 'admin', options);
  };

  const logApi = (action: keyof typeof ACTION_TYPES.API, options?: Partial<CreateActivityLogRequest>) => {
    return logActivity(ACTION_TYPES.API[action], 'api', options);
  };

  return {
    logActivity,
    logAuth,
    logPost,
    logAccount,
    logWorkspace,
    logAdmin,
    logApi,
    logging,
  };
}

// Hook để lấy thống kê hoạt động
export function useActivityStats(workspaceId?: string, days: number = 30) {
  const [stats, setStats] = useState<{
    total_actions: number;
    success_rate: number;
    by_category: Record<string, number>;
    by_day: Array<{ date: string; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams = new URLSearchParams();
      if (workspaceId) searchParams.append('workspace_id', workspaceId);
      searchParams.append('days', String(days));
      
      const response = await fetch(`/api/activity-logs/stats?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [workspaceId, days]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}
