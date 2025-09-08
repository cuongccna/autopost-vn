import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

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

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function usePostRateLimit() {
  // Always call hooks first
  const [rateLimitData, setRateLimitData] = useState<RateLimitCheck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cache duration: 30 seconds
  const CACHE_DURATION = 30000;

  // 🚨 EMERGENCY FIX: Set mock data in development mode immediately
  useEffect(() => {
    console.log('🔧 usePostRateLimit - Development mode check:', process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 usePostRateLimit - Setting mock data');
      setRateLimitData({
        allowed: true,
        stats: {
          monthlyUsage: 0,
          monthlyLimit: 10,
          weeklyUsage: 0,
          dailyUsage: 0,
          userRole: 'professional',
          allowed: true
        },
        userRole: 'professional'
      });
    }
  }, []);

  const checkRateLimit = useCallback(async () => {
    // 🚨 EMERGENCY FIX: Return mock data in development
    if (process.env.NODE_ENV === 'development') {
      return {
        allowed: true,
        stats: {
          monthlyUsage: 0,
          monthlyLimit: 10,
          weeklyUsage: 0,
          dailyUsage: 0,
          userRole: 'professional',
          allowed: true
        },
        userRole: 'professional'
      };
    }

    // Check cache first
    const now = Date.now();
    if (now - lastFetchRef.current < CACHE_DURATION && rateLimitData && !isLoading) {
      return rateLimitData;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    lastFetchRef.current = now;
    
    try {
      const response = await fetch('/api/posts/check-rate-limit', {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error('Failed to check rate limit');
      }
      
      const data = await response.json();
      setRateLimitData(data);
      return data;
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't set error
        return null;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Rate limit check error:', err);
      return null;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [rateLimitData, isLoading]);

  // Debounced version to prevent rapid calls
  const debouncedCheckRateLimit = useMemo(
    () => debounce(checkRateLimit, 1000), // 1 second debounce
    [checkRateLimit]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper functions
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

  // 🚨 EMERGENCY FIX: Return mock data in development to prevent infinite loop
  if (process.env.NODE_ENV === 'development') {
    return {
      rateLimitData: {
        allowed: true,
        stats: {
          monthlyUsage: 0,
          monthlyLimit: 10,
          weeklyUsage: 0,
          dailyUsage: 0,
          userRole: 'professional',
          allowed: true
        },
        userRole: 'professional'
      },
      isLoading: false,
      error: null,
      checkRateLimit: checkRateLimit,
      checkRateLimitImmediate: checkRateLimit,
      getRateLimitMessage: getRateLimitMessage,
      canCreatePost: () => true,
      getBlockedReason: () => ''
    };
  }

  return {
    rateLimitData,
    isLoading,
    error,
    checkRateLimit: debouncedCheckRateLimit, // Use debounced version
    checkRateLimitImmediate: checkRateLimit, // Original for manual calls
    getRateLimitMessage,
    canCreatePost,
    getBlockedReason
  };
}
