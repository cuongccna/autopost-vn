'use client';

import { useState, useMemo } from 'react';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { SystemActivityLog } from '@/types/activity-logs';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const statusIcons = {
  success: '✅',
  failed: '❌',
  warning: '⚠️',
};

const categoryIcons = {
  auth: '🔐',
  post: '📝',
  account: '👤',
  workspace: '🏢',
  admin: '⚙️',
  api: '🔗',
};

const statusColors = {
  success: 'text-green-600 bg-green-50',
  failed: 'text-red-600 bg-red-50',
  warning: 'text-yellow-600 bg-yellow-50',
};

const categoryColors = {
  auth: 'text-purple-600 bg-purple-50',
  post: 'text-blue-600 bg-blue-50',
  account: 'text-gray-600 bg-gray-50',
  workspace: 'text-indigo-600 bg-indigo-50',
  admin: 'text-orange-600 bg-orange-50',
  api: 'text-teal-600 bg-teal-50',
};

interface FullActivityLogsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FullActivityLogs({ isOpen, onClose }: FullActivityLogsProps) {
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
  });
  
  const { logs, loading, error, total, loadMore, hasMore, refresh } = useActivityLogs({
    limit: 20,
    status: filters.status ? filters.status as 'success' | 'failed' | 'warning' : undefined,
    action_category: filters.category ? filters.category as 'auth' | 'post' | 'account' | 'workspace' | 'admin' | 'api' : undefined,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter logs by search term
  const filteredLogs = useMemo(() => {
    if (!filters.search) return logs;
    
    const searchTerm = filters.search.toLowerCase();
    return logs.filter(log => 
      log.description.toLowerCase().includes(searchTerm) ||
      log.action_type.toLowerCase().includes(searchTerm)
    );
  }, [logs, filters.search]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Nhật ký hệ thống</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Làm mới"
            >
              <svg 
                className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Tìm theo mô tả, loại hành động..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="success">Thành công</option>
                <option value="failed">Thất bại</option>
                <option value="warning">Cảnh báo</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả danh mục</option>
                <option value="auth">Xác thực</option>
                <option value="post">Bài viết</option>
                <option value="account">Tài khoản</option>
                <option value="workspace">Không gian làm việc</option>
                <option value="admin">Quản trị</option>
                <option value="api">API</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading && filteredLogs.length === 0 ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-3xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không thể tải nhật ký</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-3xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có hoạt động nào</h3>
              <p className="text-gray-500">
                {filters.search || filters.status || filters.category 
                  ? 'Không tìm thấy hoạt động nào khớp với bộ lọc'
                  : 'Chưa có hoạt động nào được ghi nhận'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div key={log.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {categoryIcons[log.action_category as keyof typeof categoryIcons] || '📋'}
                      </span>
                      <span className="text-lg">
                        {statusIcons[log.status as keyof typeof statusIcons]}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          categoryColors[log.action_category as keyof typeof categoryColors] || 'text-gray-600 bg-gray-50'
                        }`}>
                          {log.action_category}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[log.status as keyof typeof statusColors] || 'text-gray-600 bg-gray-50'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      
                      <p className="text-gray-900 mb-2">{log.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{getRelativeTime(log.created_at)}</span>
                        {log.duration_ms && (
                          <span>• {log.duration_ms}ms</span>
                        )}
                        <span>• {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
                      </div>
                      
                      {log.error_message && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <strong>Lỗi:</strong> {log.error_message}
                        </div>
                      )}
                      
                      {log.additional_data && Object.keys(log.additional_data).length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                          <strong>Chi tiết:</strong>
                          <pre className="mt-1 text-xs overflow-x-auto">
                            {JSON.stringify(log.additional_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Đang tải...' : 'Tải thêm'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Hiển thị {filteredLogs.length} / {total} hoạt động
            </span>
            <span>
              Cập nhật lần cuối: {logs.length > 0 ? getRelativeTime(logs[0].created_at) : 'Chưa có dữ liệu'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
