'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Brain, Zap, TrendingUp, Calendar, BarChart3 } from 'lucide-react';

interface AIUsageStats {
  dailyUsage: number;
  dailyLimit: number;
  monthlyUsage: number;
  monthlyLimit: number;
  userRole: string;
  allowed: boolean;
}

interface AIUsageIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export interface AIUsageIndicatorRef {
  refresh: () => void;
}

const AIUsageIndicator = forwardRef<AIUsageIndicatorRef, AIUsageIndicatorProps>(function AIUsageIndicator({ className = '', showDetails = false }, ref) {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      setStats(null); // Clear previous stats to force re-render
      
      console.log('🔍 Fetching AI usage stats...');
      
      // Add cache-busting timestamp
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/limits?scope=ai&t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage stats');
      }
      
      const data = await response.json();
      console.log('📊 AI Usage Stats Response:', data);
      
      const statsData = (data.stats ?? data?.ai?.stats);
      if (statsData) {
        console.log('🔄 Setting new stats:', statsData);
        setStats(statsData);
        console.log('✅ Stats updated successfully');
      } else {
        throw new Error('No stats in response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('❌ Error fetching AI usage stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageStats();
  }, []);

  // Expose refresh method via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchUsageStats
  }));

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Brain className="w-4 h-4 animate-pulse text-gray-400" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Brain className="w-4 h-4 text-red-400" />
        <span className="text-sm text-red-500">Error loading AI stats</span>
      </div>
    );
  }

  const dailyPercentage = stats.dailyLimit === -1 ? 0 : (stats.dailyUsage / stats.dailyLimit) * 100;
  const monthlyPercentage = stats.monthlyLimit === -1 ? 0 : (stats.monthlyUsage / stats.monthlyLimit) * 100;
  
  const getDailyStatusColor = () => {
    if (stats.dailyLimit === -1) return 'text-purple-600'; // Unlimited
    if (dailyPercentage >= 100) return 'text-red-500';
    if (dailyPercentage >= 80) return 'text-orange-500';
    return 'text-green-500';
  };

  const getMonthlyStatusColor = () => {
    if (stats.monthlyLimit === -1) return 'text-purple-600'; // Unlimited
    if (monthlyPercentage >= 100) return 'text-red-500';
    if (monthlyPercentage >= 80) return 'text-orange-500';
    return 'text-green-500';
  };

  const getRoleDisplay = () => {
    switch (stats.userRole) {
      case 'free': return { label: 'Miễn phí', icon: '🆓', color: 'text-gray-600' };
      case 'professional': return { label: 'Professional', icon: '⭐', color: 'text-blue-600' };
      case 'enterprise': return { label: 'Enterprise', icon: '💎', color: 'text-purple-600' };
      default: return { label: 'Unknown', icon: '❓', color: 'text-gray-600' };
    }
  };

  const roleInfo = getRoleDisplay();

  if (!showDetails) {
    // Modern professional design for header/navbar
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-3 py-2 hover:shadow-sm transition-all duration-200">
          {/* AI Icon */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
          </div>
          
          {/* Usage Stats */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">
                {stats.dailyUsage}
              </span>
              <span className="text-xs text-gray-500">/</span>
              <span className="text-xs text-gray-600">
                {stats.dailyLimit === -1 ? '∞' : stats.dailyLimit}
              </span>
              <span className="text-xs text-gray-500">hôm nay</span>
            </div>
            
            {/* Progress bar */}
            {stats.dailyLimit !== -1 && (
              <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    dailyPercentage >= 100 ? 'bg-red-500' : 
                    dailyPercentage >= 80 ? 'bg-orange-500' : 
                    'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                  style={{ width: `${Math.min(dailyPercentage, 100)}%` }}
                />
              </div>
            )}
          </div>
          
          {/* Role Badge */}
          <div className="flex-shrink-0">
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
              stats.userRole === 'professional' 
                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                : stats.userRole === 'enterprise'
                ? 'bg-purple-100 text-purple-800 border-purple-200'
                : 'bg-gray-100 text-gray-800 border-gray-200'
            }`}>
              <span className="mr-1">{roleInfo.icon}</span>
              <span className="hidden sm:inline">{roleInfo.label}</span>
            </div>
          </div>
        </div>
        
        {/* Monthly usage tooltip */}
        <div className="absolute -bottom-1 right-2 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          {stats.monthlyUsage}/{stats.monthlyLimit === -1 ? '∞' : stats.monthlyLimit} tháng này
        </div>
      </div>
    );
  }

  // Enhanced detailed version for dashboard/settings
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Usage</h3>
            <p className="text-sm text-gray-500">Thống kê sử dụng AI</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border ${
          stats.userRole === 'professional' 
            ? 'bg-blue-50 text-blue-800 border-blue-200' 
            : stats.userRole === 'enterprise'
            ? 'bg-purple-50 text-purple-800 border-purple-200'
            : 'bg-gray-50 text-gray-800 border-gray-200'
        }`}>
          <span>{roleInfo.icon}</span>
          <span>{roleInfo.label}</span>
        </div>
      </div>

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Usage Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-blue-900">Hôm nay</span>
            </div>
            <span className={`text-lg font-bold ${getDailyStatusColor()}`}>
              {stats.dailyUsage}/{stats.dailyLimit === -1 ? '∞' : stats.dailyLimit}
            </span>
          </div>
          
          {stats.dailyLimit !== -1 && (
            <>
              <div className="w-full bg-blue-200 rounded-full h-2.5 mb-2">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    dailyPercentage >= 100 ? 'bg-red-500' : 
                    dailyPercentage >= 80 ? 'bg-orange-500' : 
                    'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                  style={{ width: `${Math.min(dailyPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 font-medium">
                {dailyPercentage.toFixed(1)}% đã sử dụng
              </p>
            </>
          )}
        </div>

        {/* Monthly Usage Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-green-900">Tháng này</span>
            </div>
            <span className={`text-lg font-bold ${getMonthlyStatusColor()}`}>
              {stats.monthlyUsage}/{stats.monthlyLimit === -1 ? '∞' : stats.monthlyLimit}
            </span>
          </div>
          
          {stats.monthlyLimit !== -1 && (
            <>
              <div className="w-full bg-green-200 rounded-full h-2.5 mb-2">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    monthlyPercentage >= 100 ? 'bg-red-500' : 
                    monthlyPercentage >= 80 ? 'bg-orange-500' : 
                    'bg-gradient-to-r from-green-500 to-emerald-500'
                  }`}
                  style={{ width: `${Math.min(monthlyPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-green-700 font-medium">
                {monthlyPercentage.toFixed(1)}% đã sử dụng
              </p>
            </>
          )}
        </div>
      </div>

      {/* Upgrade Suggestions */}
      {stats.userRole === 'free' && (dailyPercentage >= 80 || monthlyPercentage >= 80) && (
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">
                Nâng cấp lên Professional
              </h4>
              <p className="text-sm text-blue-700 mb-4">
                Bạn đang sử dụng gần hết quota AI. Nâng cấp để có nhiều tính năng hơn!
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">50</div>
                  <div className="text-xs text-blue-700">lượt/ngày</div>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">1000</div>
                  <div className="text-xs text-blue-700">lượt/tháng</div>
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg">
                Nâng cấp ngay - 299k/tháng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise upgrade for professional */}
      {stats.userRole === 'professional' && (dailyPercentage >= 80 || monthlyPercentage >= 80) && (
        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-purple-900 mb-2">
                Nâng cấp lên Enterprise
              </h4>
              <p className="text-sm text-purple-700 mb-4">
                Mở khóa sức mạnh AI không giới hạn cho doanh nghiệp của bạn
              </p>
              <div className="bg-white/60 rounded-lg p-4 text-center mb-4">
                <div className="text-2xl font-bold text-purple-600 mb-1">∞</div>
                <div className="text-sm text-purple-700 font-medium">Không giới hạn AI requests</div>
              </div>
              <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg">
                Nâng cấp ngay - 999k/tháng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default AIUsageIndicator;
