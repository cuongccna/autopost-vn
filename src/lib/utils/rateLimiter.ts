/**
 * Rate Limiter for Social Media APIs
 * 
 * Implements token bucket algorithm for rate limiting:
 * - Facebook Graph API: 200 calls per hour per user
 * - Instagram Graph API: 200 calls per hour per user
 * - Distributed rate limiting using Supabase
 */

interface RateLimitConfig {
  maxRequests: number;  // Maximum requests allowed
  windowMs: number;     // Time window in milliseconds
  keyPrefix: string;    // Prefix for storage key
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;  // Seconds to wait before retry
}

/**
 * Platform-specific rate limit configurations
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  facebook: {
    maxRequests: 200,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'ratelimit:facebook',
  },
  instagram: {
    maxRequests: 200,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'ratelimit:instagram',
  },
  // For development/testing with lower limits
  facebook_dev: {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'ratelimit:facebook:dev',
  },
};

/**
 * In-memory rate limiter (for single-instance deployments)
 * For production with multiple instances, use Redis or database-backed limiter
 */
class InMemoryRateLimiter {
  private store: Map<string, { count: number; resetAt: number }> = new Map();

  async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const record = this.store.get(key);

    // Clean up expired records
    if (record && now >= record.resetAt) {
      this.store.delete(key);
    }

    const currentRecord = this.store.get(key);

    if (!currentRecord) {
      // First request in this window
      this.store.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: new Date(now + config.windowMs),
      };
    }

    // Check if limit exceeded
    if (currentRecord.count >= config.maxRequests) {
      const retryAfter = Math.ceil((currentRecord.resetAt - now) / 1000);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(currentRecord.resetAt),
        retryAfter,
      };
    }

    // Increment count
    currentRecord.count++;
    this.store.set(key, currentRecord);

    return {
      allowed: true,
      remaining: config.maxRequests - currentRecord.count,
      resetAt: new Date(currentRecord.resetAt),
    };
  }

  /**
   * Reset rate limit for a specific key (useful for testing)
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all rate limits (useful for testing)
   */
  clearAll(): void {
    this.store.clear();
  }

  /**
   * Get current stats for a key
   */
  getStats(key: string): { count: number; resetAt: Date } | null {
    const record = this.store.get(key);
    if (!record) return null;

    return {
      count: record.count,
      resetAt: new Date(record.resetAt),
    };
  }
}

// Singleton instance
const rateLimiter = new InMemoryRateLimiter();

/**
 * Check rate limit for a platform and user
 */
export async function checkRateLimit(
  platform: 'facebook' | 'instagram',
  userId: string,
  isDev: boolean = process.env.NODE_ENV === 'development'
): Promise<RateLimitResult> {
  const configKey = isDev ? `${platform}_dev` : platform;
  const config = RATE_LIMITS[configKey];
  
  if (!config) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  const key = `${config.keyPrefix}:${userId}`;
  return rateLimiter.checkLimit(key, config);
}

/**
 * Wait with exponential backoff
 */
export async function exponentialBackoff(
  attempt: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 60000
): Promise<void> {
  const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
  const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
  
  await new Promise(resolve => setTimeout(resolve, delay + jitter));
}

/**
 * Retry wrapper with rate limit handling
 */
export async function withRateLimit<T>(
  platform: 'facebook' | 'instagram',
  userId: string,
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check rate limit
    const limitResult = await checkRateLimit(platform, userId);

    if (!limitResult.allowed) {
      if (attempt === maxRetries) {
        throw new Error(
          `Rate limit exceeded for ${platform}. Retry after ${limitResult.retryAfter || 'unknown'} seconds.`
        );
      }

      // Wait before retrying
      const retryAfter = limitResult.retryAfter;
      if (retryAfter && retryAfter > 0) {
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      } else {
        await exponentialBackoff(attempt);
      }
      continue;
    }

    // Execute function
    try {
      const result = await fn();
      return result;
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit error from API
      if (error.code === 4 || error.code === 17 || error.code === 32) {
        // Facebook rate limit error codes
        if (attempt < maxRetries) {
          await exponentialBackoff(attempt);
          continue;
        }
      }

      // If it's not a rate limit error, throw immediately
      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Reset rate limit for testing
 */
export function resetRateLimit(platform: 'facebook' | 'instagram', userId: string): void {
  const config = RATE_LIMITS[platform];
  const key = `${config.keyPrefix}:${userId}`;
  rateLimiter.reset(key);
}

/**
 * Get rate limit stats
 */
export function getRateLimitStats(
  platform: 'facebook' | 'instagram',
  userId: string
): { count: number; resetAt: Date } | null {
  const config = RATE_LIMITS[platform];
  const key = `${config.keyPrefix}:${userId}`;
  return rateLimiter.getStats(key);
}

export default rateLimiter;
