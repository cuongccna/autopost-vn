'use client';

import { useState, useEffect } from 'react';
import { FileText, TrendingUp, Calendar, Clock, BarChart3, AlertCircle, PieChart } from 'lucide-react';

interface PostUsageStats {
  monthlyUsage: number;
  monthlyLimit: number;
  weeklyUsage: number;
  dailyUsage: number;
  userRole: string;
  allowed: boolean;
}

interface PostUsageBreakdown {
  byPlatform: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  timeline: Array<{ date: string; count: number }>;
}

export default function PostUsageDashboard() {
  const [stats, setStats] = useState<PostUsageStats | null>(null);
  const [breakdown, setBreakdown] = useState<PostUsageBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/posts/usage-stats?breakdown=true&days=30');
      
      if (!response.ok) {
        throw new Error('Failed to fetch post usage stats');
      }
      
      const data = await response.json();
      setStats(data.stats);
      setBreakdown(data.breakdown);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching post usage dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Đang tải thống kê bài đăng...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="font-medium text-red-800">Lỗi tải dữ liệu</span>
        </div>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  const monthlyPercentage = stats.monthlyLimit === -1 ? 0 : (stats.monthlyUsage / stats.monthlyLimit) * 100;
  
  const getRoleInfo = () => {
    switch (stats.userRole) {
      case 'free': return { 
        label: 'Miễn phí', 
        icon: '📝', 
        color: 'bg-gray-100 text-gray-800',
        nextTier: 'Professional',
        nextPrice: '299k/tháng'
      };
      case 'professional': return { 
        label: 'Professional', 
        icon: '⭐', 
        color: 'bg-blue-100 text-blue-800',
        nextTier: 'Enterprise',
        nextPrice: '999k/tháng'
      };
      case 'enterprise': return { 
        label: 'Enterprise', 
        icon: '💎', 
        color: 'bg-purple-100 text-purple-800',
        nextTier: null,
        nextPrice: null
      };
      default: return { 
        label: 'Unknown', 
        icon: '❓', 
        color: 'bg-gray-100 text-gray-800',
        nextTier: null,
        nextPrice: null
      };
    }
  };

  const roleInfo = getRoleInfo();

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return '📘';
      case 'instagram': return '📷';
      case 'tiktok': return '🎵';
      case 'zalo': return '💬';
      default: return '📱';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return '✅';
      case 'scheduled': return '⏰';
      case 'draft': return '📝';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Post Usage Dashboard</h2>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${roleInfo.color}`}>
          {roleInfo.icon} {roleInfo.label}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Usage */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-gray-900">Tháng này</h3>
            </div>
            <span className="text-2xl font-bold text-green-600">
              {stats.monthlyUsage}/{stats.monthlyLimit === -1 ? '∞' : stats.monthlyLimit}
            </span>
          </div>
          
          {stats.monthlyLimit !== -1 && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    monthlyPercentage >= 100 ? 'bg-red-500' : 
                    monthlyPercentage >= 80 ? 'bg-orange-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(monthlyPercentage, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {monthlyPercentage.toFixed(1)}% đã sử dụng
              </p>
            </>
          )}
        </div>

        {/* Weekly Usage */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">Tuần này</h3>
            </div>
            <span className="text-2xl font-bold text-blue-600">{stats.weeklyUsage}</span>
          </div>
          <p className="text-sm text-gray-600">Bài đăng trong tuần</p>
        </div>

        {/* Daily Usage */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <h3 className="font-medium text-gray-900">Hôm nay</h3>
            </div>
            <span className="text-2xl font-bold text-purple-600">{stats.dailyUsage}</span>
          </div>
          <p className="text-sm text-gray-600">Bài đăng hôm nay</p>
        </div>
      </div>

      {/* Breakdown Charts */}
      {breakdown && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Platform Breakdown */}
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">Phân bố theo Platform</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(breakdown.byPlatform).map(([platform, count]) => {
                const total = Object.values(breakdown.byPlatform).reduce((sum, val) => sum + val, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                
                return (
                  <div key={platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPlatformIcon(platform)}</span>
                      <span className="text-sm font-medium capitalize">{platform}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-gray-900">Trạng thái bài đăng</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(breakdown.byStatus).map(([status, count]) => {
                const total = Object.values(breakdown.byStatus).reduce((sum, val) => sum + val, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getStatusIcon(status)}</span>
                      <span className="text-sm font-medium capitalize">{status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Timeline Chart */}
      {breakdown && breakdown.timeline.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-medium text-gray-900 mb-4">Hoạt động 30 ngày gần nhất</h3>
          <div className="flex items-end gap-1 h-32 overflow-x-auto">
            {breakdown.timeline.map((day, index) => {
              const maxCount = Math.max(...breakdown.timeline.map(d => d.count));
              const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              
              return (
                <div key={day.date} className="flex flex-col items-center min-w-[20px]">
                  <div 
                    className="w-4 bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                    style={{ height: `${Math.max(4, height)}%` }}
                    title={`${day.date}: ${day.count} posts`}
                  />
                  <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Type Breakdown */}
      {breakdown && (
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-medium text-gray-900 mb-4">Loại bài đăng</h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(breakdown.byType).map(([type, count]) => (
              <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Card */}
      {roleInfo.nextTier && stats.userRole === 'free' && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">
              Nâng cấp lên {roleInfo.nextTier}
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-medium text-green-800 mb-2">Lợi ích khi nâng cấp:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• <strong>Không giới hạn</strong> số bài đăng/tháng</li>
                <li>• Đăng bài tự động theo lịch</li>
                <li>• AI không giới hạn cho nội dung</li>
                <li>• Hỗ trợ ưu tiên 24/7</li>
                <li>• Thống kê chi tiết và insights</li>
              </ul>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-900 mb-2">
                {roleInfo.nextPrice}
              </div>
              <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors">
                Nâng cấp ngay
              </button>
            </div>
          </div>
          
          <p className="text-xs text-green-600 text-center">
            💡 Hiện tại bạn chỉ có thể đăng {stats.monthlyLimit} bài/tháng. Nâng cấp để không bị giới hạn!
          </p>
        </div>
      )}
    </div>
  );
}
