'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { useActivityLogsRefresh } from '@/contexts/ActivityLogsContext';
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

interface ActivityLogsWidgetProps {
  onViewAll?: () => void;
}

export default function ActivityLogsWidget({ onViewAll }: ActivityLogsWidgetProps) {
  const { data: session, status } = useSession();
  const { logs, loading, error, total, refresh } = useActivityLogs({ 
    limit: 5,
    // Chỉ lấy hoạt động quan trọng
  });
  const { setRefreshFunction } = useActivityLogsRefresh();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Register refresh function với context
  useEffect(() => {
    setRefreshFunction(() => {
      setIsRefreshing(true);
      refresh();
      setTimeout(() => setIsRefreshing(false), 500); // Hiệu ứng loading ngắn
    });
  }, [refresh, setRefreshFunction]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Không hiển thị widget khi chưa đăng nhập
  if (status === 'loading') {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Nhật ký hệ thống</h3>
          <div className="animate-pulse w-16 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1 h-3 bg-gray-200 rounded"></div>
                <div className="w-12 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Nhật ký hệ thống</h3>
          <span className="text-xs text-gray-500">Cần đăng nhập</span>
        </div>
        <div className="text-center py-6">
          <div className="text-gray-400 text-2xl mb-2">🔒</div>
          <p className="text-sm text-gray-500">Đăng nhập để xem nhật ký</p>
        </div>
      </div>
    );
  }

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Nhật ký hệ thống</h3>
          <div className="animate-pulse w-16 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1 h-3 bg-gray-200 rounded"></div>
                <div className="w-12 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Nhật ký hệ thống</h3>
          <span className="text-xs text-red-500">Lỗi tải</span>
        </div>
        <div className="text-center py-4">
          <div className="text-red-400 text-lg mb-1">⚠️</div>
          <p className="text-sm text-gray-500">Không thể tải nhật ký</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Nhật ký hệ thống</h3>
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={handleManualRefresh}
            disabled={loading || isRefreshing}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Làm mới"
          >
            <svg 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
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
          
          {total > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {total} hoạt động
            </span>
          )}
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Xem tất cả →
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-gray-400 text-2xl mb-2">📋</div>
            <p className="text-sm text-gray-500">Chưa có hoạt động nào</p>
          </div>
        ) : (
          logs.slice(0, 4).map((log) => (
            <div key={log.id} className="group hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-sm">
                    {categoryIcons[log.action_category as keyof typeof categoryIcons] || '📋'}
                  </span>
                  <span className="text-sm">
                    {statusIcons[log.status as keyof typeof statusIcons]}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {log.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {getRelativeTime(log.created_at)}
                    </span>
                    {log.duration_ms && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {log.duration_ms}ms
                      </span>
                    )}
                    {log.error_message && (
                      <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                        Có lỗi
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {logs.length > 4 && (
          <div className="text-center pt-2 border-t border-gray-100">
            <button
              onClick={onViewAll}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              +{logs.length - 4} hoạt động khác
            </button>
          </div>
        )}
      </div>

      {/* Quick stats at bottom */}
      {logs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {logs.filter(log => log.status === 'success').length}/{logs.length} thành công
            </span>
            <span>
              {logs.filter(log => log.status === 'failed').length > 0 && 
                `${logs.filter(log => log.status === 'failed').length} lỗi`
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
