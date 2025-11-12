'use client';

import { useState } from 'react';
import ActivityLogsView from './ActivityLogsView';
import { useActivityStats } from '@/hooks/useActivityLogs';

const statusNames = {
  success: 'Thành công',
  failed: 'Thất bại', 
  warning: 'Cảnh báo',
};

const categoryNames = {
  auth: 'Xác thực',
  post: 'Bài đăng',
  account: 'Tài khoản',
  workspace: 'Workspace',
  admin: 'Quản trị',
  api: 'API',
};

export default function Activities() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'errors' | 'success'>('recent');
  const { stats, loading: statsLoading } = useActivityStats(undefined, 7);

  const getFilterConfig = () => {
    switch (activeFilter) {
      case 'recent':
        return { limit: 20 };
      case 'errors':
        return { status: 'failed' as const, limit: 20 };
      case 'success':
        return { status: 'success' as const, limit: 20 };
      default:
        return { limit: 20 };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          🔍 Hoạt động
        </h1>
        <p className="text-gray-600 mt-1">
          Theo dõi tất cả hoạt động trong tài khoản của bạn
        </p>
      </div>

      {/* Quick Stats */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📊</div>
              <div>
                <p className="text-sm font-medium text-blue-700">Tổng hoạt động</p>
                <p className="text-xl font-bold text-blue-900">{stats.total_actions}</p>
                <p className="text-xs text-blue-600">7 ngày qua</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">✅</div>
              <div>
                <p className="text-sm font-medium text-green-700">Tỷ lệ thành công</p>
                <p className="text-xl font-bold text-green-900">{stats.success_rate}%</p>
                <p className="text-xs text-green-600">Hoạt động</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📈</div>
              <div>
                <p className="text-sm font-medium text-yellow-700">Ngày hoạt động</p>
                <p className="text-xl font-bold text-yellow-900">{stats.by_day.length}</p>
                <p className="text-xs text-yellow-600">Trong tuần</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🎯</div>
              <div>
                <p className="text-sm font-medium text-purple-700">Hoạt động chính</p>
                <p className="text-xl font-bold text-purple-900">
                  {Object.entries(stats.by_category).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                </p>
                <p className="text-xs text-purple-600 capitalize">
                  {Object.entries(stats.by_category).sort(([,a], [,b]) => b - a)[0] ? 
                    categoryNames[Object.entries(stats.by_category).sort(([,a], [,b]) => b - a)[0][0] as keyof typeof categoryNames] : 'Danh mục'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'recent', name: 'Gần đây', icon: '🕒', count: Math.min(20, stats?.total_actions || 0) },
            { id: 'all', name: 'Tất cả', icon: '📋', count: stats?.total_actions },
            { id: 'errors', name: 'Lỗi', icon: '❌', count: Math.round((stats?.total_actions || 0) * (1 - (stats?.success_rate || 0) / 100)) },
            { id: 'success', name: 'Thành công', icon: '✅', count: Math.round((stats?.total_actions || 0) * (stats?.success_rate || 0) / 100) }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                activeFilter === filter.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{filter.icon}</span>
              <span>{filter.name}</span>
              {filter.count && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === filter.id 
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border">
        <div className="p-6">
          <ActivityLogsView 
            showFilters={activeFilter === 'all'} 
            status={getFilterConfig().status}
            limit={getFilterConfig().limit}
          />
        </div>
      </div>

      {/* Category Breakdown */}
      {!statsLoading && stats && Object.keys(stats.by_category).length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            📊 Phân tích theo danh mục (7 ngày qua)
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.by_category)
              .sort(([,a], [,b]) => b - a)
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {categoryNames[category as keyof typeof categoryNames] || category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max((count / stats.total_actions) * 100, 5)}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {count}
                    </span>
                    <span className="text-xs text-gray-500 w-12 text-right">
                      {((count / stats.total_actions) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Activity Timeline (if we have daily data) */}
      {!statsLoading && stats && stats.by_day.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            📈 Hoạt động theo ngày
          </h3>
          <div className="space-y-2">
            {stats.by_day
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((day) => (
                <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('vi-VN', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit'
                    })}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{
                          width: `${Math.max((day.count / Math.max(...stats.by_day.map(d => d.count))) * 100, 10)}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {day.count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
