import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface AIRateLimitStats {
  dailyUsage: number;
  dailyLimit: number;
  monthlyUsage: number;
  monthlyLimit: number;
  userRole: string;
  allowed: boolean;
}

interface AIRateLimitResult {
  allowed: boolean;
  stats: AIRateLimitStats;
  message?: string;
}

interface UseAIRateLimitReturn {
  rateLimitData: AIRateLimitResult | null;
  isLoading: boolean;
  error: string | null;
  checkAIRateLimit: () => Promise<void>;
  canUseAI: () => boolean;
  getAILimitMessage: () => string;
  getUserRole: () => string;
}

export function useAIRateLimit(): UseAIRateLimitReturn {
  const { data: session } = useSession();
  const [rateLimitData, setRateLimitData] = useState<AIRateLimitResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user role from session
  const getUserRole = useCallback((): string => {
    return (session?.user as any)?.user_role || 'free';
  }, [session]);

  // Check AI rate limit
  const checkAIRateLimit = useCallback(async () => {
    if (!session?.user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/limits?scope=ai', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Normalize to AIRateLimitResult shape if needed
      const normalized = {
        allowed: data.allowed ?? data?.ai?.allowed ?? false,
        stats: (data.stats ?? data?.ai?.stats) as AIRateLimitStats,
        message: data.message ?? data?.ai?.message
      } as AIRateLimitResult;
      setRateLimitData(normalized);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('AI rate limit check error:', err);
      
      // Fallback data in case of error
      setRateLimitData({
        allowed: getUserRole() !== 'free', // Free users get no AI access on error
        stats: {
          dailyUsage: 0,
          dailyLimit: getUserRole() === 'free' ? 0 : 20,
          monthlyUsage: 0,
          monthlyLimit: getUserRole() === 'free' ? 0 : 600,
          userRole: getUserRole(),
          allowed: getUserRole() !== 'free'
        },
        message: 'Unable to check AI limits, please try again'
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, getUserRole]);

  // Check if user can use AI
  const canUseAI = useCallback((): boolean => {
    if (!rateLimitData) return false;
    return rateLimitData.allowed;
  }, [rateLimitData]);

  // Get AI limit message
  const getAILimitMessage = useCallback((): string => {
    if (!rateLimitData) return '';

    const { stats } = rateLimitData;
    const { userRole, dailyUsage, dailyLimit, monthlyUsage, monthlyLimit } = stats;

    if (userRole === 'enterprise') {
      return 'Không giới hạn AI (Enterprise)';
    }

    if (userRole === 'free') {
      return 'Nâng cấp để sử dụng AI';
    }

    if (dailyLimit === -1 && monthlyLimit === -1) {
      return 'Không giới hạn AI';
    }

    if (dailyLimit === -1) {
      return `Tháng này: ${monthlyUsage}/${monthlyLimit} lượt AI`;
    }

    if (monthlyLimit === -1) {
      return `Hôm nay: ${dailyUsage}/${dailyLimit} lượt AI`;
    }

    return `Hôm nay: ${dailyUsage}/${dailyLimit} • Tháng: ${monthlyUsage}/${monthlyLimit} lượt AI`;
  }, [rateLimitData]);

  // Auto-check on mount and when session changes
  useEffect(() => {
    if (session?.user) {
      checkAIRateLimit();
    }
  }, [session, checkAIRateLimit]);

  return {
    rateLimitData,
    isLoading,
    error,
    checkAIRateLimit,
    canUseAI,
    getAILimitMessage,
    getUserRole
  };
}
