import { checkAIRateLimit, type RateLimitResult as AIRateLimitResult } from './aiUsageService';
import { checkPostRateLimit, type PostRateLimitResult } from './postUsageService';

export interface UnifiedLimitsResult {
  ai: AIRateLimitResult;
  posts: PostRateLimitResult;
}

export async function getUnifiedLimits(
  userId: string,
  userRole: string = 'free'
): Promise<UnifiedLimitsResult> {
  const [ai, posts] = await Promise.all([
    checkAIRateLimit(userId, userRole),
    checkPostRateLimit(userId, userRole)
  ]);
  return { ai, posts };
}

export async function getScopedLimit(
  userId: string,
  userRole: string = 'free',
  scope: 'ai' | 'posts'
): Promise<AIRateLimitResult | PostRateLimitResult> {
  if (scope === 'ai') return checkAIRateLimit(userId, userRole);
  return checkPostRateLimit(userId, userRole);
}

