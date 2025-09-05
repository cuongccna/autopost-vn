import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Helper function to create mock session
const createMockSession = (user?: any, status: 'authenticated' | 'unauthenticated' | 'loading' = 'authenticated') => ({
  data: user ? {
    user,
    expires: '2024-12-31T23:59:59Z'
  } : null,
  status,
  update: jest.fn(),
});

describe('usePermissions Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return free role when no session', () => {
    mockUseSession.mockReturnValue(createMockSession(null, 'unauthenticated'));

    const { result } = renderHook(() => usePermissions());
    
    expect(result.current.userRole).toBe('free');
    expect(result.current.isLoading).toBe(false);
  });

  it('should return free role when session user has no role', () => {
    mockUseSession.mockReturnValue(createMockSession({ 
      name: 'Test User', 
      email: 'test@example.com' 
    }));

    const { result } = renderHook(() => usePermissions());
    
    expect(result.current.userRole).toBe('free');
    expect(result.current.isLoading).toBe(false);
  });

  it('should return correct role when user has role in session', () => {
    mockUseSession.mockReturnValue(createMockSession({ 
      name: 'Pro User', 
      email: 'pro@example.com', 
      role: 'professional' 
    }));

    const { result } = renderHook(() => usePermissions());
    
    expect(result.current.userRole).toBe('professional');
    expect(result.current.isLoading).toBe(false);
  });

  it('should return enterprise permissions', () => {
    mockUseSession.mockReturnValue(createMockSession({ 
      name: 'Enterprise User', 
      email: 'enterprise@example.com', 
      role: 'enterprise' 
    }));

    const { result } = renderHook(() => usePermissions());
    
    expect(result.current.userRole).toBe('enterprise');
    expect(result.current.hasFeature('scheduling', 'aiOptimized')).toBe(true);
    expect(result.current.hasFeature('analytics', 'advanced')).toBe(true);
  });

  it('should return loading state when session is loading', () => {
    mockUseSession.mockReturnValue(createMockSession(null, 'loading'));

    const { result } = renderHook(() => usePermissions());
    
    expect(result.current.isLoading).toBe(true);
  });

  describe('hasFeature method', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(createMockSession({ 
        name: 'Free User', 
        role: 'free' 
      }));
    });

    it('should check basic permissions correctly', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasFeature('scheduling', 'basic')).toBe(true);
      expect(result.current.hasFeature('analytics', 'basic')).toBe(true);
    });

    it('should check premium permissions correctly for free user', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasFeature('scheduling', 'aiOptimized')).toBe(false);
      expect(result.current.hasFeature('analytics', 'advanced')).toBe(false);
      expect(result.current.hasFeature('templates', 'customTemplates')).toBe(false);
    });

    it('should work without subFeature parameter', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasFeature('scheduling')).toBe(true);
      expect(result.current.hasFeature('analytics')).toBe(true);
    });
  });

  describe('getLimit method', () => {
    it('should return correct limits for free user', () => {
      mockUseSession.mockReturnValue(createMockSession({ 
        name: 'Free User', 
        role: 'free' 
      }));

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.getLimit('posts')).toBe(10);
      expect(result.current.getLimit('templates')).toBe(3);
      expect(result.current.getLimit('aiRequests')).toBe(2);
    });

    it('should return correct limits for professional user', () => {
      mockUseSession.mockReturnValue(createMockSession({ 
        name: 'Pro User', 
        role: 'professional' 
      }));

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.getLimit('posts')).toBe(100);
      expect(result.current.getLimit('templates')).toBe(50);
      expect(result.current.getLimit('aiRequests')).toBe(20);
    });

    it('should return unlimited (-1) for enterprise user', () => {
      mockUseSession.mockReturnValue(createMockSession({ 
        name: 'Enterprise User', 
        role: 'enterprise' 
      }));

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.getLimit('posts')).toBe(-1);
      expect(result.current.getLimit('templates')).toBe(-1);
      expect(result.current.getLimit('aiRequests')).toBe(-1);
    });
  });

  describe('getUpgradeMsg method', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(createMockSession({ 
        name: 'Free User', 
        role: 'free' 
      }));
    });

    it('should return appropriate upgrade messages', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.getUpgradeMsg('scheduling')).toContain('Professional');
      expect(result.current.getUpgradeMsg('analytics')).toContain('Professional');
      expect(result.current.getUpgradeMsg('templates')).toContain('Professional');
    });

    it('should return enterprise upgrade message for professional user', () => {
      mockUseSession.mockReturnValue(createMockSession({ 
        name: 'Pro User', 
        role: 'professional' 
      }));

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.getUpgradeMsg('analytics', 'enterprise')).toContain('Enterprise');
    });
  });

  describe('Role transitions', () => {
    it('should handle role changes in session', () => {
      // Start with free user
      mockUseSession.mockReturnValue(createMockSession({ 
        name: 'User', 
        role: 'free' 
      }));

      const { result, rerender } = renderHook(() => usePermissions());
      
      expect(result.current.userRole).toBe('free');
      expect(result.current.hasFeature('scheduling', 'aiOptimized')).toBe(false);

      // Upgrade to professional
      mockUseSession.mockReturnValue(createMockSession({ 
        name: 'User', 
        role: 'professional' 
      }));

      rerender();

      expect(result.current.userRole).toBe('professional');
      expect(result.current.hasFeature('scheduling', 'aiOptimized')).toBe(true);
    });

    it('should handle session logout', () => {
      // Start with authenticated professional user
      mockUseSession.mockReturnValue(createMockSession({ 
        name: 'Pro User', 
        role: 'professional' 
      }));

      const { result, rerender } = renderHook(() => usePermissions());
      
      expect(result.current.userRole).toBe('professional');

      // User logs out
      mockUseSession.mockReturnValue(createMockSession(null, 'unauthenticated'));

      rerender();

      expect(result.current.userRole).toBe('free');
      expect(result.current.hasFeature('scheduling', 'aiOptimized')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid role gracefully', () => {
      mockUseSession.mockReturnValue(createMockSession({ 
        name: 'User', 
        role: 'invalid-role' 
      }));

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.userRole).toBe('free');
    });

    it('should handle missing user properties', () => {
      mockUseSession.mockReturnValue(createMockSession({ 
        role: 'professional' 
      }));

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.userRole).toBe('professional');
    });

    it('should handle session with undefined user', () => {
      mockUseSession.mockReturnValue(createMockSession(undefined));

      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.userRole).toBe('free');
    });
  });
});
