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

interface AIStatusBadgeProps {
  className?: string;
}

export default function AIStatusBadge({ className = '' }: AIStatusBadgeProps) {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/ai/usage-stats?t=${timestamp}`, {
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
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching AI usage stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageStats();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 ${className}`}>
        <Brain className="w-4 h-4 animate-pulse text-gray-400" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const dailyPercentage = stats.dailyLimit === -1 ? 0 : (stats.dailyUsage / stats.dailyLimit) * 100;
  const monthlyPercentage = stats.monthlyLimit === -1 ? 0 : (stats.monthlyUsage / stats.monthlyLimit) * 100;
  
  const getStatusColor = () => {
    if (stats.dailyLimit === -1) return 'emerald'; // Unlimited
    if (dailyPercentage >= 90) return 'red';
    if (dailyPercentage >= 70) return 'orange';
    return 'blue';
  };

  const getStatusIcon = () => {
    if (stats.userRole === 'enterprise') return Zap;
    if (stats.userRole === 'professional') return TrendingUp;
    return Brain;
  };

  const color = getStatusColor();
  const StatusIcon = getStatusIcon();

  return (
    <div className={`group relative ${className}`}>
      {/* Main Badge */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer ${
        color === 'blue' ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' :
        color === 'orange' ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' :
        color === 'red' ? 'bg-red-50 border-red-200 hover:bg-red-100' :
        'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
      }`}>
        {/* AI Icon */}
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
          color === 'blue' ? 'bg-blue-500' :
          color === 'orange' ? 'bg-orange-500' :
          color === 'red' ? 'bg-red-500' :
          'bg-emerald-500'
        }`}>
          <StatusIcon className="w-3.5 h-3.5 text-white" />
        </div>

        {/* Usage Stats */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className={`text-sm font-semibold ${
              color === 'blue' ? 'text-blue-900' :
              color === 'orange' ? 'text-orange-900' :
              color === 'red' ? 'text-red-900' :
              'text-emerald-900'
            }`}>
              {stats.dailyUsage}
            </span>
            <span className={`text-xs ${
              color === 'blue' ? 'text-blue-600' :
              color === 'orange' ? 'text-orange-600' :
              color === 'red' ? 'text-red-600' :
              'text-emerald-600'
            }`}>
              /{stats.dailyLimit === -1 ? '∞' : stats.dailyLimit}
            </span>
          </div>
          <span className={`text-xs ${
            color === 'blue' ? 'text-blue-700' :
            color === 'orange' ? 'text-orange-700' :
            color === 'red' ? 'text-red-700' :
            'text-emerald-700'
          }`}>
            AI hôm nay
          </span>
        </div>

        {/* Progress Indicator */}
        {stats.dailyLimit !== -1 && (
          <div className="w-1 h-8 rounded-full bg-gray-200 overflow-hidden">
            <div 
              className={`w-full transition-all duration-500 ${
                color === 'blue' ? 'bg-blue-500' :
                color === 'orange' ? 'bg-orange-500' :
                color === 'red' ? 'bg-red-500' :
                'bg-emerald-500'
              }`}
              style={{ height: `${Math.min(dailyPercentage, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Hover Tooltip */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
        <div className="space-y-1">
          <div>Hôm nay: {stats.dailyUsage}/{stats.dailyLimit === -1 ? '∞' : stats.dailyLimit}</div>
          <div>Tháng này: {stats.monthlyUsage}/{stats.monthlyLimit === -1 ? '∞' : stats.monthlyLimit}</div>
          <div className="text-gray-300">
            {stats.userRole === 'professional' ? '⭐ Professional' : 
             stats.userRole === 'enterprise' ? '💎 Enterprise' : 
             '🆓 Miễn phí'}
          </div>
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}
