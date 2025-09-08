'use client';

import { useState, useEffect } from 'react';

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ActivityLogsProps {
  className?: string;
}

export default function ActivityLogs({ className = '' }: ActivityLogsProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');

  const activityTypes = [
    { value: 'all', label: 'Tất cả' },
    { value: 'post_created', label: 'Tạo bài viết' },
    { value: 'post_scheduled', label: 'Lập lịch' },
    { value: 'ai_usage', label: 'Sử dụng AI' },
    { value: 'template_used', label: 'Dùng template' },
    { value: 'platform_selected', label: 'Chọn platform' }
  ];

  const fetchActivities = async (page = 1, type = selectedType) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        type
      });

      const response = await fetch(`/api/dashboard/activities?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handlePageChange = (newPage: number) => {
    fetchActivities(newPage, selectedType);
  };

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    fetchActivities(1, newType); // Reset to page 1 when changing filter
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post_created':
        return '📝';
      case 'post_scheduled':
        return '⏰';
      case 'ai_usage':
        return '🤖';
      case 'template_used':
        return '📋';
      case 'platform_selected':
        return '🔗';
      default:
        return '📌';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'post_created':
        return 'bg-green-100 text-green-600';
      case 'post_scheduled':
        return 'bg-blue-100 text-blue-600';
      case 'ai_usage':
        return 'bg-purple-100 text-purple-600';
      case 'template_used':
        return 'bg-yellow-100 text-yellow-600';
      case 'platform_selected':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header with Filter */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nhật ký hoạt động</h2>
            <p className="text-sm text-gray-500">
              Theo dõi tất cả hoạt động trong hệ thống ({pagination.total} hoạt động)
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {activityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => fetchActivities(pagination.page, selectedType)}
              disabled={loading}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="p-6">
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium">{activity.description}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {activity.metadata && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {activity.metadata.platform || activity.metadata.action_type || 'Chi tiết'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">Chưa có hoạt động nào</p>
            <p className="text-sm mt-1">
              {selectedType === 'all' ? 
                'Bắt đầu bằng cách tạo bài viết đầu tiên' : 
                `Không có hoạt động nào thuộc loại "${activityTypes.find(t => t.value === selectedType)?.label}"`
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong {pagination.total} kết quả
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage || loading}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Trước
              </button>
              
              <div className="flex items-center space-x-1">
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i;
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`px-3 py-2 text-sm font-medium rounded-lg disabled:opacity-50 ${
                        pageNum === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage || loading}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
