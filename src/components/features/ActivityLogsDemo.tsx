'use client';

import { useState } from 'react';
import { useLogActivity, useActivityLogs, useActivityStats } from '@/hooks/useActivityLogs';
import ActivityLogsView from './ActivityLogsView';
import { ACTION_TYPES } from '@/types/activity-logs';

export default function ActivityLogsDemo() {
  const [activeTab, setActiveTab] = useState<'demo' | 'logs' | 'stats'>('demo');
  const { logActivity, logAuth, logPost, logAccount, logging } = useLogActivity();
  const { logs, refresh } = useActivityLogs({ limit: 5 });
  const { stats } = useActivityStats(undefined, 7);

  const handleTestAction = async (actionType: string, category: any, description: string) => {
    await logActivity(actionType, category, {
      description,
      additional_data: {
        demo: true,
        timestamp: new Date().toISOString()
      }
    });
    
    // Refresh logs after creating
    setTimeout(() => refresh(), 1000);
  };

  const demoActions = [
    {
      name: 'Đăng nhập',
      action: () => logAuth('LOGIN', { description: 'Demo: Đăng nhập vào hệ thống' }),
      icon: '🔐',
      category: 'auth'
    },
    {
      name: 'Tạo bài đăng',
      action: () => logPost('CREATE', { 
        description: 'Demo: Tạo bài đăng khuyến mãi',
        target_resource_type: 'post',
        new_data: { title: 'Demo Post', content: 'This is a demo post' }
      }),
      icon: '📝',
      category: 'post'
    },
    {
      name: 'Kết nối Facebook',
      action: () => logAccount('CONNECT', { 
        description: 'Demo: Kết nối tài khoản Facebook',
        target_resource_type: 'social_account',
        new_data: { provider: 'facebook', name: 'Demo Page' }
      }),
      icon: '📘',
      category: 'account'
    },
    {
      name: 'Lỗi đăng bài',
      action: () => logPost('PUBLISH', { 
        description: 'Demo: Lỗi đăng bài lên Instagram',
        status: 'failed',
        error_message: 'Demo error: Invalid access token',
        target_resource_type: 'post'
      }),
      icon: '❌',
      category: 'post'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Activity Logs System Demo
        </h2>
        <p className="text-gray-600">
          Demo hệ thống nhật ký hoạt động - ghi lại và theo dõi tất cả hành động của người dùng
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'demo', name: 'Demo Actions', icon: '🎮' },
            { id: 'logs', name: 'Nhật ký', icon: '📋' },
            { id: 'stats', name: 'Thống kê', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'demo' && (
        <div className="space-y-6">
          {/* Demo Actions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Thử nghiệm các hành động
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  disabled={logging}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{action.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{action.name}</h4>
                      <p className="text-sm text-gray-500 capitalize">{action.category}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Logs Preview */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Nhật ký gần đây
            </h3>
            {logs.length > 0 ? (
              <div className="space-y-2">
                {logs.slice(0, 3).map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {log.description}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        log.status === 'success' ? 'bg-green-100 text-green-700' :
                        log.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {log.status}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {log.action_category}
                      </span>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setActiveTab('logs')}
                  className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Xem tất cả nhật ký →
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>Chưa có nhật ký nào. Hãy thử các hành động ở trên!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <ActivityLogsView showFilters={true} limit={50} />
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">
            Thống kê hoạt động 7 ngày qua
          </h3>
          
          {stats ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-3xl mr-3">📊</div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">Tổng hoạt động</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.total_actions}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-3xl mr-3">✅</div>
                    <div>
                      <p className="text-sm font-medium text-green-700">Tỷ lệ thành công</p>
                      <p className="text-2xl font-bold text-green-900">{stats.success_rate}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-3xl mr-3">📈</div>
                    <div>
                      <p className="text-sm font-medium text-purple-700">Ngày hoạt động</p>
                      <p className="text-2xl font-bold text-purple-900">{stats.by_day.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* By Category */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Theo danh mục</h4>
                <div className="space-y-3">
                  {Object.entries(stats.by_category).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(count / stats.total_actions) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Day */}
              {stats.by_day.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Hoạt động theo ngày</h4>
                  <div className="space-y-2">
                    {stats.by_day.map((day) => (
                      <div key={day.date} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {new Date(day.date).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="font-medium text-gray-900">{day.count} hoạt động</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>Đang tải thống kê...</p>
            </div>
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {logging && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Đang ghi nhật ký...</span>
          </div>
        </div>
      )}
    </div>
  );
}
