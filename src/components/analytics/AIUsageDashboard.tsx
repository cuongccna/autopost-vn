'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Calendar, Clock, BarChart3, AlertCircle } from 'lucide-react';

interface AIUsageStats {
  dailyUsage: number;
  dailyLimit: number;
  monthlyUsage: number;
  monthlyLimit: number;
  userRole: string;
  allowed: boolean;
}

interface AIUsageHistory {
  date: string;
  usage: number;
  requests: {
    caption: number;
    hashtags: number;
    script: number;
    optimal_times: number;
  };
}

export default function AIUsageDashboard() {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [history, setHistory] = useState<AIUsageHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/usage-stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage stats');
      }
      
      const data = await response.json();
      setStats(data.stats);
      
      // Mock history data for demo (replace with real API)
      setHistory([
        { 
          date: '2024-01-15', 
          usage: 8, 
          requests: { caption: 3, hashtags: 2, script: 2, optimal_times: 1 } 
        },
        { 
          date: '2024-01-14', 
          usage: 5, 
          requests: { caption: 2, hashtags: 1, script: 1, optimal_times: 1 } 
        },
        { 
          date: '2024-01-13', 
          usage: 12, 
          requests: { caption: 4, hashtags: 3, script: 3, optimal_times: 2 } 
        },
      ]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching AI usage dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Đang tải thống kê AI...</span>
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

  const dailyPercentage = stats.dailyLimit === -1 ? 0 : (stats.dailyUsage / stats.dailyLimit) * 100;
  const monthlyPercentage = stats.monthlyLimit === -1 ? 0 : (stats.monthlyUsage / stats.monthlyLimit) * 100;
  
  const getRoleInfo = () => {
    switch (stats.userRole) {
      case 'free': return { 
        label: 'Miễn phí', 
        icon: '🆓', 
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">AI Usage Dashboard</h2>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${roleInfo.color}`}>
          {roleInfo.icon} {roleInfo.label}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Usage */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">Sử dụng hôm nay</h3>
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {stats.dailyUsage}/{stats.dailyLimit === -1 ? '∞' : stats.dailyLimit}
            </span>
          </div>
          
          {stats.dailyLimit !== -1 && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    dailyPercentage >= 100 ? 'bg-red-500' : 
                    dailyPercentage >= 80 ? 'bg-orange-500' : 
                    'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(dailyPercentage, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {dailyPercentage.toFixed(1)}% đã sử dụng
              </p>
            </>
          )}
        </div>

        {/* Monthly Usage */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-gray-900">Sử dụng tháng này</h3>
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
      </div>

      {/* Feature Usage Breakdown */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-medium text-gray-900 mb-4">Phân bố theo tính năng</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {history.reduce((sum, day) => sum + day.requests.caption, 0)}
            </div>
            <div className="text-sm text-blue-700">Caption AI</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {history.reduce((sum, day) => sum + day.requests.hashtags, 0)}
            </div>
            <div className="text-sm text-green-700">Hashtags AI</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {history.reduce((sum, day) => sum + day.requests.script, 0)}
            </div>
            <div className="text-sm text-purple-700">Script AI</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {history.reduce((sum, day) => sum + day.requests.optimal_times, 0)}
            </div>
            <div className="text-sm text-orange-700">Optimal Times</div>
          </div>
        </div>
      </div>

      {/* Usage History */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-medium text-gray-900 mb-4">Lịch sử sử dụng (7 ngày gần nhất)</h3>
        <div className="space-y-3">
          {history.map((day, index) => (
            <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {new Date(day.date).toLocaleDateString('vi-VN', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Caption: {day.requests.caption} | 
                  Hashtags: {day.requests.hashtags} | 
                  Script: {day.requests.script} | 
                  Times: {day.requests.optimal_times}
                </div>
                <div className="font-semibold text-blue-600">
                  {day.usage} lượt
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Card */}
      {roleInfo.nextTier && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">
              Nâng cấp lên {roleInfo.nextTier}
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Lợi ích khi nâng cấp:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {roleInfo.nextTier === 'Professional' ? (
                  <>
                    <li>• 20 lượt AI mỗi ngày (thay vì 2)</li>
                    <li>• 600 lượt AI mỗi tháng (thay vì 60)</li>
                    <li>• Ưu tiên xử lý AI</li>
                    <li>• Hỗ trợ 24/7</li>
                  </>
                ) : (
                  <>
                    <li>• Không giới hạn AI requests</li>
                    <li>• API Access cho doanh nghiệp</li>
                    <li>• Tích hợp tùy chỉnh</li>
                    <li>• Account Manager riêng</li>
                  </>
                )}
              </ul>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-900 mb-2">
                {roleInfo.nextPrice}
              </div>
              <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Nâng cấp ngay
              </button>
            </div>
          </div>
          
          <p className="text-xs text-blue-600 text-center">
            💡 Nâng cấp bất cứ lúc nào, thanh toán an toàn 100%
          </p>
        </div>
      )}
    </div>
  );
}
