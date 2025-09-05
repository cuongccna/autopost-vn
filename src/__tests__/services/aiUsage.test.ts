import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { checkAIRateLimit, logAIUsage, getAIUsageStats } from '@/lib/services/aiUsageService';
import { sbServer } from '@/lib/supabase/server';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  sbServer: jest.fn(),
}));

const mockSupabase = {
  rpc: jest.fn() as jest.Mock,
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn() as jest.Mock,
};

describe('AI Usage Service', () => {
  beforeEach(() => {
    (sbServer as jest.Mock).mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkAIRateLimit', () => {
    it('should allow free user within daily limit', async () => {
      // Mock database response for free user with 1 usage today
      mockSupabase.rpc.mockResolvedValue({
        data: {
          allowed: true,
          daily_usage: 1,
          daily_limit: 2,
          monthly_usage: 10,
          monthly_limit: 60,
          user_role: 'free'
        },
        error: null
      });

      const result = await checkAIRateLimit('user-1', 'caption');

      expect(result.allowed).toBe(true);
      expect(result.stats.dailyUsage).toBe(1);
      expect(result.stats.dailyLimit).toBe(2);
      expect(result.stats.userRole).toBe('free');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('check_ai_rate_limit', {
        p_user_id: 'user-1',
        p_request_type: 'caption'
      });
    });

    it('should block free user exceeding daily limit', async () => {
      // Mock database response for free user exceeding daily limit
      mockSupabase.rpc.mockResolvedValue({
        data: {
          allowed: false,
          daily_usage: 2,
          daily_limit: 2,
          monthly_usage: 15,
          monthly_limit: 60,
          user_role: 'free'
        },
        error: null
      });

      const result = await checkAIRateLimit('user-1', 'caption');

      expect(result.allowed).toBe(false);
      expect(result.stats.dailyUsage).toBe(2);
      expect(result.stats.dailyLimit).toBe(2);
      expect(result.message).toContain('Bạn đã sử dụng hết 2 lượt AI miễn phí trong ngày');
      expect(result.message).toContain('Nâng cấp lên gói Professional');
    });

    it('should block free user exceeding monthly limit', async () => {
      // Mock database response for free user exceeding monthly limit
      mockSupabase.rpc.mockResolvedValue({
        data: {
          allowed: false,
          daily_usage: 1,
          daily_limit: 2,
          monthly_usage: 60,
          monthly_limit: 60,
          user_role: 'free'
        },
        error: null
      });

      const result = await checkAIRateLimit('user-1', 'caption');

      expect(result.allowed).toBe(false);
      expect(result.stats.monthlyUsage).toBe(60);
      expect(result.stats.monthlyLimit).toBe(60);
      expect(result.message).toContain('Bạn đã sử dụng hết 60 lượt AI miễn phí trong tháng');
    });

    it('should allow professional user within limits', async () => {
      // Mock database response for professional user
      mockSupabase.rpc.mockResolvedValue({
        data: {
          allowed: true,
          daily_usage: 10,
          daily_limit: 20,
          monthly_usage: 200,
          monthly_limit: 600,
          user_role: 'professional'
        },
        error: null
      });

      const result = await checkAIRateLimit('user-pro', 'caption');

      expect(result.allowed).toBe(true);
      expect(result.stats.dailyUsage).toBe(10);
      expect(result.stats.dailyLimit).toBe(20);
      expect(result.stats.userRole).toBe('professional');
    });

    it('should block professional user exceeding daily limit', async () => {
      // Mock database response for professional user exceeding daily limit
      mockSupabase.rpc.mockResolvedValue({
        data: {
          allowed: false,
          daily_usage: 20,
          daily_limit: 20,
          monthly_usage: 300,
          monthly_limit: 600,
          user_role: 'professional'
        },
        error: null
      });

      const result = await checkAIRateLimit('user-pro', 'caption');

      expect(result.allowed).toBe(false);
      expect(result.message).toContain('Bạn đã sử dụng hết 20 lượt AI Professional trong ngày');
      expect(result.message).toContain('Nâng cấp lên gói Enterprise');
    });

    it('should allow enterprise user (unlimited)', async () => {
      // Mock database response for enterprise user
      mockSupabase.rpc.mockResolvedValue({
        data: {
          allowed: true,
          daily_usage: 100,
          daily_limit: -1,
          monthly_usage: 1000,
          monthly_limit: -1,
          user_role: 'enterprise'
        },
        error: null
      });

      const result = await checkAIRateLimit('user-enterprise', 'caption');

      expect(result.allowed).toBe(true);
      expect(result.stats.dailyLimit).toBe(-1);
      expect(result.stats.monthlyLimit).toBe(-1);
      expect(result.stats.userRole).toBe('enterprise');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const result = await checkAIRateLimit('user-1', 'caption');

      // Should allow request in case of error (graceful degradation)
      expect(result.allowed).toBe(true);
      expect(result.stats.userRole).toBe('free');
    });
  });

  describe('logAIUsage', () => {
    it('should log successful AI usage', async () => {
      mockSupabase.insert.mockResolvedValue({
        error: null
      });

      await logAIUsage('user-1', 'caption', true, 150);

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_usage');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        request_type: 'caption',
        success: true,
        tokens_used: 150,
        error_message: null,
        created_at: expect.any(String)
      });
    });

    it('should log failed AI usage with error message', async () => {
      mockSupabase.insert.mockResolvedValue({
        error: null
      });

      await logAIUsage('user-1', 'hashtags', false, 0, 'API rate limit exceeded');

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        request_type: 'hashtags',
        success: false,
        tokens_used: 0,
        error_message: 'API rate limit exceeded',
        created_at: expect.any(String)
      });
    });

    it('should handle logging errors gracefully', async () => {
      mockSupabase.insert.mockResolvedValue({
        error: { message: 'Insert failed' }
      });

      // Should not throw error
      await expect(logAIUsage('user-1', 'caption', true, 100)).resolves.not.toThrow();
    });
  });

  describe('getAIUsageStats', () => {
    it('should return usage statistics for user', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          daily_usage: 5,
          daily_limit: 20,
          monthly_usage: 150,
          monthly_limit: 600,
          user_role: 'professional'
        },
        error: null
      });

      const stats = await getAIUsageStats('user-pro');

      expect(stats).toEqual({
        dailyUsage: 5,
        dailyLimit: 20,
        monthlyUsage: 150,
        monthlyLimit: 600,
        userRole: 'professional',
        allowed: true
      });
    });

    it('should handle missing user gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      });

      const stats = await getAIUsageStats('nonexistent-user');

      expect(stats).toEqual({
        dailyUsage: 0,
        dailyLimit: 2,
        monthlyUsage: 0,
        monthlyLimit: 60,
        userRole: 'free',
        allowed: true
      });
    });
  });

  describe('Different AI request types', () => {
    it('should handle caption requests', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { allowed: true, daily_usage: 1, daily_limit: 2, monthly_usage: 10, monthly_limit: 60, user_role: 'free' },
        error: null
      });

      const result = await checkAIRateLimit('user-1', 'caption');
      expect(result.allowed).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('check_ai_rate_limit', {
        p_user_id: 'user-1',
        p_request_type: 'caption'
      });
    });

    it('should handle hashtags requests', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { allowed: true, daily_usage: 1, daily_limit: 2, monthly_usage: 10, monthly_limit: 60, user_role: 'free' },
        error: null
      });

      const result = await checkAIRateLimit('user-1', 'hashtags');
      expect(result.allowed).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('check_ai_rate_limit', {
        p_user_id: 'user-1',
        p_request_type: 'hashtags'
      });
    });

    it('should handle script requests', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { allowed: true, daily_usage: 1, daily_limit: 2, monthly_usage: 10, monthly_limit: 60, user_role: 'free' },
        error: null
      });

      const result = await checkAIRateLimit('user-1', 'script');
      expect(result.allowed).toBe(true);
    });

    it('should handle optimal_times requests', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { allowed: true, daily_usage: 1, daily_limit: 2, monthly_usage: 10, monthly_limit: 60, user_role: 'free' },
        error: null
      });

      const result = await checkAIRateLimit('user-1', 'optimal_times');
      expect(result.allowed).toBe(true);
    });
  });
});
