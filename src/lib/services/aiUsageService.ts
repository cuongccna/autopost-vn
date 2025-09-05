import { sbServer } from '@/lib/supabase/server';

export interface AIUsageStats {
  dailyUsage: number;
  dailyLimit: number;
  monthlyUsage: number;
  monthlyLimit: number;
  userRole: string;
  allowed: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  stats: AIUsageStats;
  message?: string;
}

export type AIRequestType = 'caption' | 'hashtags' | 'script' | 'optimal_times';

/**
 * Check if user can make AI request based on their role and current usage
 */
export async function checkAIRateLimit(
  userId: string, 
  userRole: string = 'free'
): Promise<RateLimitResult> {
  try {
    const supabase = sbServer(true); // Use service role for admin operations
    
    // Call the database function to check rate limits
    const { data, error } = await supabase
      .rpc('check_ai_rate_limit', {
        p_user_id: userId,
        p_user_role: userRole
      });

    if (error) {
      console.error('Error checking AI rate limit:', error);
      throw error;
    }

    const stats: AIUsageStats = {
      dailyUsage: data.daily_usage,
      dailyLimit: data.daily_limit,
      monthlyUsage: data.monthly_usage,
      monthlyLimit: data.monthly_limit,
      userRole: data.user_role,
      allowed: data.allowed
    };

    let message = '';
    if (!data.allowed) {
      if (userRole === 'free') {
        if (stats.dailyUsage >= stats.dailyLimit) {
          message = `Bạn đã sử dụng hết ${stats.dailyLimit} lượt AI miễn phí trong ngày. Nâng cấp lên gói Professional để có ${20} lượt/ngày và nhiều tính năng khác!`;
        } else if (stats.monthlyUsage >= stats.monthlyLimit) {
          message = `Bạn đã sử dụng hết ${stats.monthlyLimit} lượt AI miễn phí trong tháng. Nâng cấp lên gói Professional để có ${600} lượt/tháng!`;
        }
      } else if (userRole === 'professional') {
        if (stats.dailyUsage >= stats.dailyLimit) {
          message = `Bạn đã sử dụng hết ${stats.dailyLimit} lượt AI Professional trong ngày. Nâng cấp lên gói Enterprise để không giới hạn!`;
        } else if (stats.monthlyUsage >= stats.monthlyLimit) {
          message = `Bạn đã sử dụng hết ${stats.monthlyLimit} lượt AI Professional trong tháng. Nâng cấp lên gói Enterprise để không giới hạn!`;
        }
      }
    }

    return {
      allowed: data.allowed,
      stats,
      message
    };

  } catch (error) {
    console.error('Error in checkAIRateLimit:', error);
    
    // In case of error, allow request but log it
    return {
      allowed: true,
      stats: {
        dailyUsage: 0,
        dailyLimit: 2,
        monthlyUsage: 0,
        monthlyLimit: 60,
        userRole: 'free',
        allowed: true
      },
      message: 'Không thể kiểm tra giới hạn AI, vui lòng thử lại sau'
    };
  }
}

/**
 * Log AI usage to database
 */
export async function logAIUsage(
  userId: string,
  requestType: AIRequestType,
  success: boolean = true,
  tokensUsed: number = 0,
  errorMessage?: string
): Promise<void> {
  try {
    const supabase = sbServer(true); // Use service role for admin operations
    
    const { error } = await supabase
      .from('ai_usage')
      .insert({
        user_id: userId,
        request_type: requestType,
        tokens_used: tokensUsed,
        success,
        error_message: errorMessage
      });

    if (error) {
      console.error('Error logging AI usage:', error);
    }

  } catch (error) {
    console.error('Error in logAIUsage:', error);
    // Don't throw error as this is just logging
  }
}

/**
 * Get AI usage statistics for a user
 */
export async function getAIUsageStats(userId: string): Promise<AIUsageStats | null> {
  try {
    const supabase = sbServer(true); // Use service role for admin operations
    
    // Get user role first (you might want to adjust this based on your user table structure)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error getting user data:', userError);
      return null;
    }

    const userRole = userData.subscription_tier || 'free';
    
    const result = await checkAIRateLimit(userId, userRole);
    return result.stats;

  } catch (error) {
    console.error('Error getting AI usage stats:', error);
    return null;
  }
}

/**
 * Get upgrade message based on current plan
 */
export function getUpgradeMessage(userRole: string): string {
  switch (userRole) {
    case 'free':
      return `
🚀 **Nâng cấp lên Professional** để được:
• **20 lượt AI/ngày** (thay vì 2 lượt)
• **600 lượt AI/tháng** (thay vì 60 lượt)
• Lên lịch không giới hạn bài đăng
• Phân tích chi tiết engagement
• Hỗ trợ ưu tiên 24/7
• **Chỉ 299.000đ/tháng**

[Nâng cấp ngay →](/pricing)
      `;
    case 'professional':
      return `
🌟 **Nâng cấp lên Enterprise** để được:
• **Không giới hạn** AI requests
• **Không giới hạn** bài đăng
• Quản lý nhiều tài khoản
• API tích hợp
• Báo cáo chi tiết
• Hỗ trợ dedicated
• **Chỉ 999.000đ/tháng**

[Nâng cấp ngay →](/pricing)
      `;
    default:
      return 'Liên hệ chúng tôi để biết thêm chi tiết về các gói nâng cấp.';
  }
}
