'use client';

import { useState, useEffect } from 'react';
import { Brain, Zap, TrendingUp } from 'lucide-react';

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

export default function AIUsageIndicator({ className = '', showDetails = false }: AIUsageIndicatorProps) {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/usage-stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage stats');
      }
      
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching AI usage stats:', err);
    } finally {
      setLoading(false);
    }
  };

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
    // Compact version for header/navbar
    return (
      <div className={`flex items-center gap-2 ${className}`} title={`AI: ${stats.dailyUsage}/${stats.dailyLimit === -1 ? '∞' : stats.dailyLimit} hôm nay`}>
        <Brain className={`w-4 h-4 ${getDailyStatusColor()}`} />
        <span className={`text-sm font-medium ${getDailyStatusColor()}`}>
          {stats.dailyUsage}/{stats.dailyLimit === -1 ? '∞' : stats.dailyLimit}
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
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">AI Usage</h3>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color} bg-gray-50`}>
          <span>{roleInfo.icon}</span>
          <span>{roleInfo.label}</span>
        </div>
      </div>

      {/* Daily Usage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Hôm nay</span>
          <span className={`font-medium ${getDailyStatusColor()}`}>
            {stats.dailyUsage}/{stats.dailyLimit === -1 ? '∞' : stats.dailyLimit}
          </span>
        </div>
        {stats.dailyLimit !== -1 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                dailyPercentage >= 100 ? 'bg-red-500' : 
                dailyPercentage >= 80 ? 'bg-orange-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(dailyPercentage, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Monthly Usage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Tháng này</span>
          <span className={`font-medium ${getMonthlyStatusColor()}`}>
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

      {/* Upgrade suggestion for free users */}
      {stats.userRole === 'free' && (dailyPercentage >= 80 || monthlyPercentage >= 80) && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Nâng cấp để có thêm AI</span>
          </div>
          <p className="text-xs text-blue-700 mb-2">
            Professional: <strong>20 lượt/ngày, 600 lượt/tháng</strong>
          </p>
          <button className="w-full bg-blue-600 text-white text-xs py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors">
            Nâng cấp ngay - 299k/tháng
          </button>
        </div>
      )}

      {/* Enterprise upgrade for professional */}
      {stats.userRole === 'professional' && (dailyPercentage >= 80 || monthlyPercentage >= 80) && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Nâng cấp Enterprise</span>
          </div>
          <p className="text-xs text-purple-700 mb-2">
            <strong>Không giới hạn</strong> AI requests
          </p>
          <button className="w-full bg-purple-600 text-white text-xs py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors">
            Nâng cấp ngay - 999k/tháng
          </button>
        </div>
      )}
    </div>
  );
}
