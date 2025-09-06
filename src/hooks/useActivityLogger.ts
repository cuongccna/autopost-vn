import { useLogActivity } from './useActivityLogs';

// Hook tiện ích để log các activities phổ biến
export function useActivityLogger() {
  const { logActivity } = useLogActivity();

  const logPostAction = async (action: string, postData: any, status: 'success' | 'failed' = 'success', error?: string) => {
    await logActivity(action, 'post', {
      target_resource_type: 'post',
      target_resource_id: postData.id || 'new-post',
      description: getPostActionDescription(action, postData),
      status,
      error_message: error,
      additional_data: {
        title: postData.title,
        providers: postData.providers || postData.channels,
        scheduled_time: postData.datetime,
        content_length: postData.content?.length || 0
      }
    });
  };

  const logAccountAction = async (action: string, accountData: any, status: 'success' | 'failed' = 'success', error?: string) => {
    await logActivity(action, 'account', {
      target_resource_type: 'social_account',
      target_resource_id: accountData.id || accountData.provider,
      description: getAccountActionDescription(action, accountData),
      status,
      error_message: error,
      additional_data: {
        provider: accountData.provider,
        account_name: accountData.name || accountData.username,
        account_id: accountData.providerId
      }
    });
  };

  const logWorkspaceAction = async (action: string, data: any, status: 'success' | 'failed' = 'success', error?: string) => {
    await logActivity(action, 'workspace', {
      target_resource_type: 'workspace',
      target_resource_id: 'main-workspace',
      description: getWorkspaceActionDescription(action, data),
      status,
      error_message: error,
      additional_data: data
    });
  };

  const logAuthAction = async (action: string, data: any = {}, status: 'success' | 'failed' = 'success', error?: string) => {
    await logActivity(action, 'auth', {
      target_resource_type: 'user',
      target_resource_id: 'current-user',
      description: getAuthActionDescription(action, data),
      status,
      error_message: error,
      additional_data: data
    });
  };

  return {
    logPostAction,
    logAccountAction,
    logWorkspaceAction,
    logAuthAction
  };
}

function getPostActionDescription(action: string, postData: any): string {
  const title = postData.title || 'Bài đăng';
  const providers = postData.providers || postData.channels || [];
  const providerText = providers.length > 0 ? ` (${providers.join(', ')})` : '';

  switch (action) {
    case 'post_created':
      return `Tạo bài đăng mới: "${title}"${providerText}`;
    case 'post_updated':
      return `Cập nhật bài đăng: "${title}"${providerText}`;
    case 'post_deleted':
      return `Xóa bài đăng: "${title}"${providerText}`;
    case 'post_scheduled':
      return `Lên lịch bài đăng: "${title}"${providerText}`;
    case 'post_published':
      return `Đăng bài thành công: "${title}"${providerText}`;
    case 'post_failed':
      return `Lỗi đăng bài: "${title}"${providerText}`;
    default:
      return `${action}: "${title}"${providerText}`;
  }
}

function getAccountActionDescription(action: string, accountData: any): string {
  const provider = accountData.provider || 'Mạng xã hội';
  const name = accountData.name || accountData.username || 'Tài khoản';

  switch (action) {
    case 'account_connected':
      return `Kết nối tài khoản ${provider}: ${name}`;
    case 'account_disconnected':
      return `Ngắt kết nối tài khoản ${provider}: ${name}`;
    case 'account_updated':
      return `Cập nhật tài khoản ${provider}: ${name}`;
    case 'account_refresh_token':
      return `Làm mới token ${provider}: ${name}`;
    default:
      return `${action}: ${provider} - ${name}`;
  }
}

function getWorkspaceActionDescription(action: string, data: any): string {
  switch (action) {
    case 'settings_updated':
      const changes = Object.keys(data.changes || {});
      return `Cập nhật cài đặt: ${changes.join(', ')}`;
    case 'workspace_created':
      return 'Tạo workspace mới';
    case 'workspace_updated':
      return 'Cập nhật thông tin workspace';
    default:
      return `${action}: workspace`;
  }
}

function getAuthActionDescription(action: string, data: any): string {
  switch (action) {
    case 'user_login':
      return 'Đăng nhập hệ thống';
    case 'user_logout':
      return 'Đăng xuất hệ thống';
    case 'user_register':
      return 'Đăng ký tài khoản mới';
    case 'password_changed':
      return 'Đổi mật khẩu';
    default:
      return `${action}: user`;
  }
}
