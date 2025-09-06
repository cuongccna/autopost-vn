'use client';

import { useState } from 'react';
import { SystemActivityLog, ActivityLogFilters } from '@/types/activity-logs';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ActivityLogsViewProps {
  workspaceId?: string;
  showFilters?: boolean;
  limit?: number;
}

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

const categoryNames = {
  auth: 'Xác thực',
  post: 'Bài đăng',
  account: 'Tài khoản',
  workspace: 'Workspace',
  admin: 'Quản trị',
  api: 'API',
};

const statusNames = {
  success: 'Thành công',
  failed: 'Thất bại',
  warning: 'Cảnh báo',
};

export default function ActivityLogsView({ 
  workspaceId, 
  showFilters = true, 
  limit = 50 
}: ActivityLogsViewProps) {
  const [filters, setFilters] = useState<ActivityLogFilters>({ limit });
  const { logs, loading, error, hasMore, total, fetchLogs, loadMore } = useActivityLogs(filters);

  const handleFilterChange = (newFilters: Partial<ActivityLogFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, offset: 0 };
    setFilters(updatedFilters);
    fetchLogs(updatedFilters);
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: vi });
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

  if (loading && logs.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-500 text-lg mr-2">❌</span>
          <div>
            <h3 className="text-red-800 font-medium">Lỗi tải nhật ký</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Nhật ký hoạt động
          </h2>
          <p className="text-gray-600 text-sm">
            Theo dõi tất cả hoạt động trong hệ thống
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Tổng: {total} hoạt động
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục
              </label>
              <select
                value={filters.action_category || ''}
                onChange={(e) => handleFilterChange({ 
                  action_category: e.target.value as any || undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Tất cả</option>
                {Object.entries(categoryNames).map(([key, name]) => (
                  <option key={key} value={key}>
                    {categoryIcons[key as keyof typeof categoryIcons]} {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange({ 
                  status: e.target.value as any || undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Tất cả</option>
                {Object.entries(statusNames).map(([key, name]) => (
                  <option key={key} value={key}>
                    {statusIcons[key as keyof typeof statusIcons]} {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange({ date_from: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange({ date_to: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">📋</div>
            <p className="text-gray-500">Chưa có hoạt động nào</p>
          </div>
        ) : (
          logs.map((log) => (
            <ActivityLogItem key={log.id} log={log} />
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang tải...' : 'Tải thêm'}
          </button>
        </div>
      )}
    </div>
  );
}

function ActivityLogItem({ log }: { log: SystemActivityLog }) {
  const [expanded, setExpanded] = useState(false);

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: vi });
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

  const statusColor = {
    success: 'text-green-600 bg-green-50 border-green-200',
    failed: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  };

  return (
    <div className={`border rounded-lg p-4 ${statusColor[log.status]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">
              {categoryIcons[log.action_category as keyof typeof categoryIcons]}
            </span>
            <span className="text-lg">
              {statusIcons[log.status as keyof typeof statusIcons]}
            </span>
            <span className="font-medium text-gray-900">
              {log.description}
            </span>
            {log.duration_ms && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {log.duration_ms}ms
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{getRelativeTime(log.created_at)}</span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
              {categoryNames[log.action_category as keyof typeof categoryNames]}
            </span>
            {log.target_resource_type && (
              <span className="text-xs">
                Target: {log.target_resource_type}
              </span>
            )}
          </div>

          {log.error_message && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border-l-4 border-red-200">
              <strong>Lỗi:</strong> {log.error_message}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {formatDateTime(log.created_at)}
          </span>
          {(log.additional_data && Object.keys(log.additional_data).length > 0) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {expanded ? 'Thu gọn' : 'Chi tiết'}
            </button>
          )}
        </div>
      </div>

      {expanded && log.additional_data && Object.keys(log.additional_data).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Dữ liệu bổ sung:</h4>
          <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
            {JSON.stringify(log.additional_data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
