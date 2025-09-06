import { useState, useEffect } from 'react'

interface PostLimitStats {
  monthlyUsage: number;
  monthlyLimit: number;
  weeklyUsage: number;
  dailyUsage: number;
  userRole: string;
  allowed: boolean;
}

interface RateLimitCheck {
  allowed: boolean;
  stats: PostLimitStats;
  message?: string;
  userRole: string;
}

export function usePostRateLimit() {
  const [rateLimitData, setRateLimitData] = useState<RateLimitCheck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkRateLimit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/posts/check-rate-limit');
      
      if (!response.ok) {
        throw new Error('Failed to check rate limit');
      }
      
      const data = await response.json();
      setRateLimitData(data);
      return data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Rate limit check error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getRateLimitMessage = (data: RateLimitCheck): string => {
    if (!data.stats) return '';
    
    const { monthlyUsage, monthlyLimit, dailyUsage, userRole } = data.stats;
    
    // Get daily limit from role
    const dailyLimits: Record<string, number> = {
      free: 1,
      professional: 10,
      enterprise: -1 // unlimited
    };
    
    const dailyLimit = dailyLimits[userRole] || 1;
    
    if (userRole === 'enterprise') {
      return `Không giới hạn bài đăng (Enterprise)`;
    }
    
    if (monthlyLimit === -1) {
      return `Hôm nay: ${dailyUsage}/${dailyLimit === -1 ? '∞' : dailyLimit} bài`;
    }
    
    return `Tháng này: ${monthlyUsage}/${monthlyLimit} • Hôm nay: ${dailyUsage}/${dailyLimit === -1 ? '∞' : dailyLimit} bài`;
  };

  const canCreatePost = (): boolean => {
    return rateLimitData?.allowed ?? false;
  };

  const getBlockedReason = (): string => {
    if (!rateLimitData || rateLimitData.allowed) return '';
    
    const { stats } = rateLimitData;
    const { userRole } = stats;
    
    // Get daily limit from role
    const dailyLimits: Record<string, number> = {
      free: 1,
      professional: 10,
      enterprise: -1
    };
    
    const dailyLimit = dailyLimits[userRole] || 1;
    
    if (stats.dailyUsage >= dailyLimit && dailyLimit !== -1) {
      return `Bạn đã vượt quá giới hạn ${dailyLimit} bài đăng mỗi ngày cho tài khoản ${userRole}.`;
    }
    
    if (stats.monthlyUsage >= stats.monthlyLimit && stats.monthlyLimit !== -1) {
      return `Bạn đã vượt quá giới hạn ${stats.monthlyLimit} bài đăng mỗi tháng cho tài khoản ${userRole}.`;
    }
    
    return 'Bạn đã vượt quá giới hạn đăng bài.';
  };

  return {
    rateLimitData,
    isLoading,
    error,
    checkRateLimit,
    getRateLimitMessage,
    canCreatePost,
    getBlockedReason
  };
}
