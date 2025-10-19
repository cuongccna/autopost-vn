'use client';

import { useState, useEffect } from 'react';
import { Brain, Zap } from 'lucide-react';

interface AIUsageStats {
  dailyUsage: number;
  dailyLimit: number;
  monthlyUsage: number;
  monthlyLimit: number;
  userRole: string;
  allowed: boolean;
}

export default function AIStatusCompact() {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/limits?scope=ai&t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        const statsData = (data.stats ?? data?.ai?.stats) as AIUsageStats;
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching AI stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
        <Brain className="w-4 h-4 text-gray-400 animate-pulse" />
        <span className="text-sm text-gray-500">...</span>
      </div>
    );
  }

  const dailyPercentage = stats.dailyLimit === -1 ? 0 : (stats.dailyUsage / stats.dailyLimit) * 100;
  const monthlyPercentage = stats.monthlyLimit === -1 ? 0 : (stats.monthlyUsage / stats.monthlyLimit) * 100;

  const getStatusColor = () => {
    if (stats.dailyLimit === -1 && stats.monthlyLimit === -1) return 'text-purple-600';
    const maxPercentage = Math.max(dailyPercentage, monthlyPercentage);
    if (maxPercentage >= 90) return 'text-red-500';
    if (maxPercentage >= 70) return 'text-orange-500';
    return 'text-green-500';
  };

  const getBgColor = () => {
    if (stats.dailyLimit === -1 && stats.monthlyLimit === -1) return 'bg-purple-50 border-purple-200';
    const maxPercentage = Math.max(dailyPercentage, monthlyPercentage);
    if (maxPercentage >= 90) return 'bg-red-50 border-red-200';
    if (maxPercentage >= 70) return 'bg-orange-50 border-orange-200';
    return 'bg-green-50 border-green-200';
  };

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${getBgColor()} hover:shadow-sm transition-all duration-200`}>
      {/* AI Icon */}
      <div className="flex-shrink-0">
        <Brain className={`w-4 h-4 ${getStatusColor()}`} />
      </div>
      
      {/* Stats */}
      <div className="flex items-center gap-3 text-sm">
        {/* Daily Usage */}
        <div className="flex items-center gap-1">
          <span className={`font-medium ${getStatusColor()}`}>
            {stats.dailyUsage}
          </span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">
            {stats.dailyLimit === -1 ? '∞' : stats.dailyLimit}
          </span>
          <span className="text-xs text-gray-500">hôm nay</span>
        </div>

        {/* Separator */}
        <div className="w-px h-4 bg-gray-300"></div>

        {/* Monthly Usage */}
        <div className="flex items-center gap-1">
          <span className={`font-medium ${getStatusColor()}`}>
            {stats.monthlyUsage}
          </span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">
            {stats.monthlyLimit === -1 ? '∞' : stats.monthlyLimit}
          </span>
          <span className="text-xs text-gray-500">tháng</span>
        </div>
      </div>

      {/* Status Indicator */}
      {stats.userRole === 'enterprise' ? (
        <Zap className="w-3 h-3 text-purple-500" />
      ) : (
        <div className={`w-2 h-2 rounded-full ${
          stats.dailyLimit === -1 && stats.monthlyLimit === -1 ? 'bg-purple-500' :
          Math.max(dailyPercentage, monthlyPercentage) >= 90 ? 'bg-red-500' :
          Math.max(dailyPercentage, monthlyPercentage) >= 70 ? 'bg-orange-500' :
          'bg-green-500'
        }`} />
      )}
    </div>
  );
}
