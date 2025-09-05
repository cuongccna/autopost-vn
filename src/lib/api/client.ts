// AutoPost VN - Frontend API Client
// Client để kết nối frontend với backend API

import { ApiResponse } from '@/lib/backend/types';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  [key: string]: any;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/v1';
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // ========================================
  // POST METHODS
  // ========================================

  async getPosts(workspaceId: string) {
    return this.request(`/posts?workspaceId=${workspaceId}`);
  }

  async getPost(id: string, workspaceId: string) {
    return this.request(`/posts/${id}?workspaceId=${workspaceId}`);
  }

  async createPost(workspaceId: string, data: any) {
    return this.request(`/posts?workspaceId=${workspaceId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePost(id: string, data: any, workspaceId: string) {
    return this.request(`/posts/${id}?workspaceId=${workspaceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePost(id: string, workspaceId: string) {
    return this.request(`/posts/${id}?workspaceId=${workspaceId}`, {
      method: 'DELETE',
    });
  }

  async reschedulePost(id: string, scheduledAt: string, workspaceId: string) {
    return this.request(`/posts/reschedule/${id}?workspaceId=${workspaceId}`, {
      method: 'POST',
      body: JSON.stringify({ scheduledAt }),
    });
  }

  // ========================================
  // SOCIAL ACCOUNT METHODS
  // ========================================

  async getSocialAccounts(workspaceId: string) {
    return this.request(`/accounts?workspaceId=${workspaceId}`);
  }

  async connectSocialAccount(workspaceId: string, data: any) {
    return this.request(`/accounts?workspaceId=${workspaceId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async disconnectSocialAccount(id: string, workspaceId: string) {
    return this.request(`/accounts/${id}?workspaceId=${workspaceId}`, {
      method: 'DELETE',
    });
  }

  async refreshAccountToken(id: string, workspaceId: string) {
    return this.request(`/accounts/refresh/${id}?workspaceId=${workspaceId}`, {
      method: 'POST',
    });
  }

  async checkAccountHealth(id: string, workspaceId: string) {
    return this.request(`/accounts/health/${id}?workspaceId=${workspaceId}`);
  }

  // ========================================
  // ANALYTICS METHODS
  // ========================================

  async getPostAnalytics(workspaceId: string, filters?: any) {
    const params = new URLSearchParams({ workspaceId });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    return this.request(`/analytics/posts?${params.toString()}`);
  }

  async getAccountPerformance(workspaceId: string) {
    return this.request(`/analytics/accounts?workspaceId=${workspaceId}`);
  }

  async getEngagementStats(workspaceId: string, timeframe: 'day' | 'week' | 'month' = 'week') {
    return this.request(`/analytics/engagement?workspaceId=${workspaceId}&timeframe=${timeframe}`);
  }

  async getOptimalPostingTimes(workspaceId: string) {
    return this.request(`/analytics/optimal-times?workspaceId=${workspaceId}`);
  }

  async getErrorAnalysis(workspaceId: string) {
    return this.request(`/analytics/errors?workspaceId=${workspaceId}`);
  }

  // ========================================
  // DASHBOARD METHODS
  // ========================================

  async getDashboardData(workspaceId: string) {
    return this.request(`/dashboard?workspaceId=${workspaceId}`);
  }

  async getSystemHealth() {
    return this.request('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// React hooks for API calls
import { useState, useEffect, useCallback } from 'react';

export function useApiCall<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const executeCall = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      
      if (response.success) {
        setData(response.data as T);
      } else {
        setError(response.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    executeCall();
  }, [executeCall]);

  return { data, loading, error, refetch: executeCall };
}

// Specific hooks for common operations
export function usePosts(workspaceId: string) {
  return useApiCall(
    () => apiClient.getPosts(workspaceId),
    [workspaceId]
  );
}

export function useSocialAccounts(workspaceId: string) {
  return useApiCall(
    () => apiClient.getSocialAccounts(workspaceId),
    [workspaceId]
  );
}

export function useDashboardData(workspaceId: string) {
  return useApiCall(
    () => apiClient.getDashboardData(workspaceId),
    [workspaceId]
  );
}

export function usePostAnalytics(workspaceId: string, filters?: any) {
  return useApiCall(
    () => apiClient.getPostAnalytics(workspaceId, filters),
    [workspaceId, JSON.stringify(filters)]
  );
}

export function useEngagementStats(workspaceId: string, timeframe: 'day' | 'week' | 'month' = 'week') {
  return useApiCall(
    () => apiClient.getEngagementStats(workspaceId, timeframe),
    [workspaceId, timeframe]
  );
}

// Mutation hooks for write operations
export function useMutation<T, P>(
  mutationFn: (_params: P) => Promise<ApiResponse<T>>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (params: P) => {
    try {
      setLoading(true);
      setError(null);
      const response = await mutationFn(params);
      
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Unknown error occurred');
        throw new Error(response.error || 'Unknown error occurred');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Request failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutationFn]);

  return { mutate, loading, error };
}

// Specific mutation hooks
export function useCreatePost(workspaceId: string) {
  return useMutation((data: any) => apiClient.createPost(workspaceId, data));
}

export function useUpdatePost() {
  return useMutation(({ id, data, workspaceId }: { id: string; data: any; workspaceId: string }) => 
    apiClient.updatePost(id, data, workspaceId)
  );
}

export function useDeletePost() {
  return useMutation(({ id, workspaceId }: { id: string; workspaceId: string }) => 
    apiClient.deletePost(id, workspaceId)
  );
}

export function useReschedulePost() {
  return useMutation(({ id, scheduledAt, workspaceId }: { id: string; scheduledAt: string; workspaceId: string }) => 
    apiClient.reschedulePost(id, scheduledAt, workspaceId)
  );
}

export function useConnectSocialAccount(workspaceId: string) {
  return useMutation((data: any) => apiClient.connectSocialAccount(workspaceId, data));
}

export function useDisconnectSocialAccount() {
  return useMutation(({ id, workspaceId }: { id: string; workspaceId: string }) => 
    apiClient.disconnectSocialAccount(id, workspaceId)
  );
}
