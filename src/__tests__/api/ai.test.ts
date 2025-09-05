import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { POST as captionAPI } from '@/app/api/ai/caption/route';
import { POST as hashtagsAPI } from '@/app/api/ai/hashtags/route';
import { POST as scriptAPI } from '@/app/api/ai/script/route';
import { POST as optimalTimesAPI } from '@/app/api/ai/optimal-times/route';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('@/lib/services/aiUsageService');
jest.mock('@/lib/services/gemini');

const mockGetServerSession = getServerSession as jest.Mock;
const mockCheckAIRateLimit = jest.fn() as jest.Mock;
const mockLogAIUsage = jest.fn() as jest.Mock;
const mockGenerateCaption = jest.fn() as jest.Mock;
const mockGenerateHashtags = jest.fn() as jest.Mock;
const mockGenerateVideoScript = jest.fn() as jest.Mock;
const mockGenerateOptimalTimes = jest.fn() as jest.Mock;

// Mock the AI usage service
jest.doMock('@/lib/services/aiUsageService', () => ({
  checkAIRateLimit: mockCheckAIRateLimit,
  logAIUsage: mockLogAIUsage,
}));

// Mock the Gemini service
jest.doMock('@/lib/services/gemini', () => ({
  generateCaption: mockGenerateCaption,
  generateHashtags: mockGenerateHashtags,
  generateVideoScript: mockGenerateVideoScript,
  generateOptimalTimes: mockGenerateOptimalTimes,
}));

describe('AI API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful rate limit check
    mockCheckAIRateLimit.mockResolvedValue({
      allowed: true,
      stats: {
        dailyUsage: 1,
        dailyLimit: 2,
        monthlyUsage: 10,
        monthlyLimit: 60,
        userRole: 'free',
        allowed: true
      }
    });

    // Default successful AI responses
    mockGenerateCaption.mockResolvedValue('Generated caption content');
    mockGenerateHashtags.mockResolvedValue(['#test', '#ai', '#social']);
    mockGenerateVideoScript.mockResolvedValue('Generated video script');
    mockGenerateOptimalTimes.mockResolvedValue([
      { time: '19:30', score: 85, platform: 'facebook' }
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Caption API', () => {
    const createCaptionRequest = (body: any) => ({
      json: () => Promise.resolve(body),
    } as NextRequest);

    it('should generate caption for authenticated free user within limits', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1' }
      });

      const request = createCaptionRequest({
        platform: 'facebook',
        title: 'Test post',
        content: 'Test content',
        tone: 'exciting'
      });

      const response = await captionAPI(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.caption).toBe('Generated caption content');
      expect(mockCheckAIRateLimit).toHaveBeenCalledWith('user-1', 'caption');
      expect(mockLogAIUsage).toHaveBeenCalledWith('user-1', 'caption', true, 0);
    });

    it('should reject unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createCaptionRequest({
        platform: 'facebook',
        title: 'Test post'
      });

      const response = await captionAPI(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should block requests when rate limit exceeded', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1' }
      });

      mockCheckAIRateLimit.mockResolvedValue({
        allowed: false,
        message: 'Rate limit exceeded',
        stats: {
          dailyUsage: 2,
          dailyLimit: 2,
          monthlyUsage: 15,
          monthlyLimit: 60,
          userRole: 'free',
          allowed: false
        }
      });

      const request = createCaptionRequest({
        platform: 'facebook',
        title: 'Test post'
      });

      const response = await captionAPI(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
      expect(data.message).toBe('Rate limit exceeded');
    });

    it('should validate required fields', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1' }
      });

      const request = createCaptionRequest({
        // Missing platform and title
        content: 'Test content'
      });

      const response = await captionAPI(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Platform and title are required');
    });

    it('should validate platform values', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1' }
      });

      const request = createCaptionRequest({
        platform: 'invalid-platform',
        title: 'Test post'
      });

      const response = await captionAPI(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid platform');
    });

    it('should handle AI generation errors and log failed usage', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1' }
      });

      mockGenerateCaption.mockRejectedValue(new Error('AI service unavailable'));

      const request = createCaptionRequest({
        platform: 'facebook',
        title: 'Test post'
      });

      const response = await captionAPI(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('AI service unavailable');
      expect(mockLogAIUsage).toHaveBeenCalledWith('user-1', 'caption', false, 0, 'AI service unavailable');
    });
  });

  describe('Hashtags API', () => {
    const createHashtagsRequest = (body: any) => ({
      json: () => Promise.resolve(body),
    } as NextRequest);

    it('should generate hashtags for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1' }
      });

      const request = createHashtagsRequest({
        platform: 'instagram',
        title: 'Fashion post',
        content: 'Beautiful dress',
        count: 5
      });

      const response = await hashtagsAPI(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hashtags).toEqual(['#test', '#ai', '#social']);
      expect(mockCheckAIRateLimit).toHaveBeenCalledWith('user-1', 'hashtags');
    });

    it('should validate count parameter', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1' }
      });

      const request = createHashtagsRequest({
        platform: 'instagram',
        title: 'Test post',
        count: 50 // Too high
      });

      const response = await hashtagsAPI(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Count must be between 1 and 30');
    });
  });

  describe('Script API', () => {
    const createScriptRequest = (body: any) => ({
      json: () => Promise.resolve(body),
    } as NextRequest);

    it('should generate video script for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1' }
      });

      const request = createScriptRequest({
        platform: 'tiktok',
        duration: 30,
        title: 'Recipe video',
        content: 'Cooking tutorial',
        style: 'entertainment'
      });

      const response = await scriptAPI(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.script).toBe('Generated video script');
      expect(mockCheckAIRateLimit).toHaveBeenCalledWith('user-1', 'script');
    });

    it('should validate duration parameter', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1' }
      });

      const request = createScriptRequest({
        platform: 'tiktok',
        duration: 400, // Too long
        title: 'Test video'
      });

      const response = await scriptAPI(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Duration must be between 5 and 300 seconds');
    });

    it('should validate style parameter', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1' }
      });

      const request = createScriptRequest({
        platform: 'tiktok',
        duration: 30,
        title: 'Test video',
        style: 'invalid-style'
      });

      const response = await scriptAPI(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid style');
    });
  });

  describe('Optimal Times API', () => {
    const createOptimalTimesRequest = (body: any) => ({
      json: () => Promise.resolve(body),
    } as NextRequest);

    it('should generate optimal times for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1' }
      });

      const request = createOptimalTimesRequest({
        platforms: ['facebook', 'instagram'],
        contentType: 'promotional',
        targetAudience: 'general',
        timezone: 'Asia/Ho_Chi_Minh'
      });

      const response = await optimalTimesAPI(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions).toEqual([
        { time: '19:30', score: 85, platform: 'facebook' }
      ]);
      expect(mockCheckAIRateLimit).toHaveBeenCalledWith('user-1', 'optimal_times');
    });

    it('should validate platforms parameter', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1' }
      });

      const request = createOptimalTimesRequest({
        platforms: [], // Empty platforms
        contentType: 'promotional'
      });

      const response = await optimalTimesAPI(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('At least one platform is required');
    });
  });

  describe('Role-based Access Control', () => {
    it('should allow professional user with higher limits', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-pro' }
      });

      mockCheckAIRateLimit.mockResolvedValue({
        allowed: true,
        stats: {
          dailyUsage: 15,
          dailyLimit: 20,
          monthlyUsage: 400,
          monthlyLimit: 600,
          userRole: 'professional',
          allowed: true
        }
      });

      const request = {
        json: () => Promise.resolve({
          platform: 'facebook',
          title: 'Professional post'
        }),
      } as NextRequest;

      const response = await captionAPI(request);
      expect(response.status).toBe(200);
    });

    it('should allow enterprise user with unlimited access', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-enterprise' }
      });

      mockCheckAIRateLimit.mockResolvedValue({
        allowed: true,
        stats: {
          dailyUsage: 100,
          dailyLimit: -1,
          monthlyUsage: 2000,
          monthlyLimit: -1,
          userRole: 'enterprise',
          allowed: true
        }
      });

      const request = {
        json: () => Promise.resolve({
          platform: 'facebook',
          title: 'Enterprise post'
        }),
      } as NextRequest;

      const response = await captionAPI(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing Gemini API key', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1' }
      });

      // Temporarily remove API key
      const originalApiKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const request = {
        json: () => Promise.resolve({
          platform: 'facebook',
          title: 'Test post'
        }),
      } as NextRequest;

      const response = await captionAPI(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Gemini API key not configured');

      // Restore API key
      process.env.GEMINI_API_KEY = originalApiKey;
    });

    it('should handle rate limit service errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1' }
      });

      mockCheckAIRateLimit.mockRejectedValue(new Error('Rate limit service down'));

      const request = {
        json: () => Promise.resolve({
          platform: 'facebook',
          title: 'Test post'
        }),
      } as NextRequest;

      const response = await captionAPI(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Rate limit service down');
    });
  });
});
