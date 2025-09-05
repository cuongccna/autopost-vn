'use client';

import { useState, useEffect } from 'react';
import { FileText, TrendingUp, Calendar, BarChart3 } from 'lucide-react';

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

interface PostUsageIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export default function PostUsageIndicator({ className = '', showDetails = false }: PostUsageIndicatorProps) {
  const [stats, setStats] = useState<PostUsageStats | null>(null);
  const [breakdown, setBreakdown] = useState<PostUsageBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/usage-stats?breakdown=${showDetails}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch post usage stats');
      }
      
      const data = await response.json();
      setStats(data.stats);
      if (data.breakdown) {
        setBreakdown(data.breakdown);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching post usage stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <FileText className="w-4 h-4 animate-pulse text-gray-400" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <FileText className="w-4 h-4 text-red-400" />
        <span className="text-sm text-red-500">Error loading post stats</span>
      </div>
    );
  }

  const monthlyPercentage = stats.monthlyLimit === -1 ? 0 : (stats.monthlyUsage / stats.monthlyLimit) * 100;
  
  const getStatusColor = () => {
    if (stats.monthlyLimit === -1) return 'text-purple-600'; // Unlimited
    if (monthlyPercentage >= 100) return 'text-red-500';
    if (monthlyPercentage >= 80) return 'text-orange-500';
    return 'text-green-500';
  };

  const getRoleDisplay = () => {
    switch (stats.userRole) {
      case 'free': return { label: 'Miễn phí', icon: '📝', color: 'text-gray-600' };
      case 'professional': return { label: 'Professional', icon: '⭐', color: 'text-blue-600' };
      case 'enterprise': return { label: 'Enterprise', icon: '💎', color: 'text-purple-600' };
      default: return { label: 'Unknown', icon: '❓', color: 'text-gray-600' };
    }
  };

  const roleInfo = getRoleDisplay();

  if (!showDetails) {
    // Compact version for header/navbar
    return (
      <div className={`flex items-center gap-2 ${className}`} title={`Posts: ${stats.monthlyUsage}/${stats.monthlyLimit === -1 ? '∞' : stats.monthlyLimit} tháng này`}>
        <FileText className={`w-4 h-4 ${getStatusColor()}`} />
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {stats.monthlyUsage}/{stats.monthlyLimit === -1 ? '∞' : stats.monthlyLimit}
        </span>
        <span className={`text-xs ${roleInfo.color}`}>
          {roleInfo.icon}
        </span>
      </div>
    );
  }

  // Detailed version for dashboard/settings
  return (
    <div className={`bg-white rounded-xl border p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          <h3 className="font-medium text-gray-900">Post Usage</h3>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color} bg-gray-50`}>
          <span>{roleInfo.icon}</span>
          <span>{roleInfo.label}</span>
        </div>
      </div>

      {/* Monthly Usage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Tháng này</span>
          <span className={`font-medium ${getStatusColor()}`}>
            {stats.monthlyUsage}/{stats.monthlyLimit === -1 ? '∞' : stats.monthlyLimit}
          </span>
        </div>
        {stats.monthlyLimit !== -1 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                monthlyPercentage >= 100 ? 'bg-red-500' : 
                monthlyPercentage >= 80 ? 'bg-orange-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(monthlyPercentage, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Weekly and Daily Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-600">{stats.weeklyUsage}</div>
          <div className="text-xs text-blue-700">Tuần này</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-600">{stats.dailyUsage}</div>
          <div className="text-xs text-green-700">Hôm nay</div>
        </div>
      </div>

      {/* Platform Breakdown */}
      {breakdown && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Phân bố theo platform</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(breakdown.byPlatform).map(([platform, count]) => (
              <div key={platform} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs capitalize">{platform}</span>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Breakdown */}
      {breakdown && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Trạng thái bài đăng</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(breakdown.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs capitalize">{status}</span>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade suggestion for free users */}
      {stats.userRole === 'free' && monthlyPercentage >= 80 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Nâng cấp để đăng không giới hạn</span>
          </div>
          <p className="text-xs text-blue-700 mb-2">
            Professional: <strong>Không giới hạn bài đăng/tháng</strong>
          </p>
          <button className="w-full bg-blue-600 text-white text-xs py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors">
            Nâng cấp ngay - 299k/tháng
          </button>
        </div>
      )}

      {/* Timeline chart would go here */}
      {breakdown && breakdown.timeline.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Hoạt động 7 ngày gần nhất</h4>
          <div className="flex items-end gap-1 h-16">
            {breakdown.timeline.slice(-7).map((day, index) => (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ 
                    height: `${Math.max(4, (day.count / Math.max(...breakdown.timeline.map(d => d.count))) * 48)}px` 
                  }}
                  title={`${day.date}: ${day.count} posts`}
                />
                <span className="text-xs text-gray-500 mt-1">
                  {new Date(day.date).getDate()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
