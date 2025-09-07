import { sbServer } from '@/lib/supabase/server';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PostValidationData {
  post: {
    id: string;
    title: string;
    content: string;
    media_urls: string[];
    providers: string[];
    workspace_id: string;
    user_id: string;
    metadata?: any;
  };
  schedules: Array<{
    id: string;
    social_account_id: string;
    scheduled_at: string;
    status: string;
  }>;
  socialAccounts: Array<{
    id: string;
    provider: string;
    provider_id: string;
    name: string;
    status: string;
    token_encrypted: string;
    expires_at: string | null;
    metadata?: any;
  }>;
}

/**
 * Kiểm tra tính hợp lệ của bài đăng trước khi publish
 */
export async function validatePostForPublishing(postId: string): Promise<{
  result: ValidationResult;
  data?: PostValidationData;
}> {
  const sb = sbServer(true);
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Lấy thông tin bài đăng
    const { data: post, error: postError } = await sb
      .from('autopostvn_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      errors.push(`Không tìm thấy bài đăng: ${postError?.message || 'Post not found'}`);
      return {
        result: { isValid: false, errors, warnings }
      };
    }

    // Kiểm tra trạng thái bài đăng
    if (post.status !== 'scheduled') {
      errors.push(`Bài đăng không ở trạng thái scheduled: ${post.status}`);
    }

    // Kiểm tra nội dung bài đăng
    if (!post.content?.trim()) {
      errors.push('Bài đăng không có nội dung');
    }

    if (!post.providers?.length) {
      errors.push('Bài đăng không có nền tảng nào được chọn');
    }

    // Lấy lịch đăng bài - Chấp nhận cả pending và publishing status
    const { data: schedules, error: schedulesError } = await sb
      .from('autopostvn_post_schedules')
      .select('*')
      .eq('post_id', postId)
      .in('status', ['pending', 'publishing']);

    if (schedulesError) {
      errors.push(`Lỗi khi lấy lịch đăng bài: ${schedulesError.message}`);
      return {
        result: { isValid: false, errors, warnings }
      };
    }

    if (!schedules?.length) {
      errors.push('Không có lịch đăng bài nào trong trạng thái pending hoặc publishing');
    }

    // Lấy thông tin tài khoản mạng xã hội
    const accountIds = schedules?.map(s => s.social_account_id) || [];
    const { data: socialAccounts, error: accountsError } = await sb
      .from('autopostvn_social_accounts')
      .select('id, provider, provider_id, name, status, token_encrypted, expires_at, metadata')
      .in('id', accountIds);

    if (accountsError) {
      errors.push(`Lỗi khi lấy thông tin tài khoản: ${accountsError.message}`);
      return {
        result: { isValid: false, errors, warnings }
      };
    }

    // Kiểm tra từng tài khoản
    for (const account of socialAccounts || []) {
      // Kiểm tra trạng thái kết nối
      if (account.status !== 'connected') {
        errors.push(`Tài khoản ${account.name} (${account.provider}) không ở trạng thái connected: ${account.status}`);
      }

      // Kiểm tra token hết hạn
      if (account.expires_at) {
        const expiresAt = new Date(account.expires_at);
        const now = new Date();
        const timeToExpiry = expiresAt.getTime() - now.getTime();
        const hoursToExpiry = timeToExpiry / (1000 * 60 * 60);

        if (timeToExpiry <= 0) {
          errors.push(`Token của tài khoản ${account.name} (${account.provider}) đã hết hạn`);
        } else if (hoursToExpiry <= 24) {
          warnings.push(`Token của tài khoản ${account.name} (${account.provider}) sẽ hết hạn trong ${Math.round(hoursToExpiry)} giờ`);
        }
      }

      // Kiểm tra token tồn tại
      if (!account.token_encrypted) {
        errors.push(`Tài khoản ${account.name} (${account.provider}) không có token`);
      }

      // Kiểm tra provider có trong danh sách được chọn không
      if (!post.providers.includes(account.provider)) {
        warnings.push(`Tài khoản ${account.name} (${account.provider}) không nằm trong danh sách provider được chọn`);
      }
    }

    // Kiểm tra xem các provider trong schedules có tài khoản tương ứng không
    // Chỉ kiểm tra providers thực sự có schedule được tạo
    const scheduledProviders = new Set(socialAccounts?.map(acc => acc.provider) || []);
    for (const provider of scheduledProviders) {
      const hasAccount = socialAccounts?.some(acc => acc.provider === provider && acc.status === 'connected');
      if (!hasAccount) {
        errors.push(`Không có tài khoản ${provider} nào đã kết nối`);
      }
    }

    const validationData: PostValidationData = {
      post,
      schedules: schedules || [],
      socialAccounts: socialAccounts || []
    };

    return {
      result: {
        isValid: errors.length === 0,
        errors,
        warnings
      },
      data: validationData
    };

  } catch (error: any) {
    errors.push(`Lỗi hệ thống khi kiểm tra: ${error.message}`);
    return {
      result: { isValid: false, errors, warnings }
    };
  }
}

/**
 * Log hoạt động validation
 */
export async function logValidationActivity(
  postId: string,
  result: ValidationResult,
  userId?: string
) {
  const sb = sbServer(true);
  
  const status = result.isValid ? 'success' : 'failed';
  const description = result.isValid 
    ? 'Kiểm tra bài đăng thành công, sẵn sàng để publish'
    : `Kiểm tra bài đăng thất bại: ${result.errors.join(', ')}`;

  try {
    await sb.from('autopostvn_system_activity_logs').insert({
      user_id: userId,
      action_type: 'post_validation',
      action_category: 'post',
      description,
      status,
      target_resource_type: 'post',
      target_resource_id: postId,
      additional_data: {
        errors: result.errors,
        warnings: result.warnings,
        validation_timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to log validation activity:', error);
  }
}
