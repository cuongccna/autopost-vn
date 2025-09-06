// Types for System Activity Logs
export interface SystemActivityLog {
  id: string;
  user_id: string;
  workspace_id?: string;
  
  // Action details
  action_type: string;
  action_category: 'auth' | 'post' | 'account' | 'workspace' | 'admin' | 'api';
  description: string;
  
  // Target resource
  target_resource_type?: string;
  target_resource_id?: string;
  previous_data?: Record<string, any>;
  new_data?: Record<string, any>;
  
  // Request context
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  session_id?: string;
  
  // Status and metadata
  status: 'success' | 'failed' | 'warning';
  error_message?: string;
  duration_ms?: number;
  additional_data?: Record<string, any>;
  
  created_at: string;
}

export interface CreateActivityLogRequest {
  action_type: string;
  action_category: 'auth' | 'post' | 'account' | 'workspace' | 'admin' | 'api';
  description: string;
  workspace_id?: string;
  target_resource_type?: string;
  target_resource_id?: string;
  previous_data?: Record<string, any>;
  new_data?: Record<string, any>;
  status?: 'success' | 'failed' | 'warning';
  error_message?: string;
  duration_ms?: number;
  additional_data?: Record<string, any>;
}

export interface ActivityLogFilters {
  action_category?: 'auth' | 'post' | 'account' | 'workspace' | 'admin' | 'api';
  action_type?: string;
  status?: 'success' | 'failed' | 'warning';
  target_resource_type?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityLogResponse {
  logs: SystemActivityLog[];
  total: number;
  has_more: boolean;
}

// Pre-defined action types for consistency
export const ACTION_TYPES = {
  // Authentication
  AUTH: {
    LOGIN: 'login',
    LOGOUT: 'logout',
    REGISTER: 'register',
    PASSWORD_RESET: 'password_reset',
    EMAIL_VERIFY: 'email_verify',
  },
  
  // Posts
  POST: {
    CREATE: 'create_post',
    UPDATE: 'update_post',
    DELETE: 'delete_post',
    SCHEDULE: 'schedule_post',
    PUBLISH: 'publish_post',
    CANCEL: 'cancel_post',
    DUPLICATE: 'duplicate_post',
  },
  
  // Social Accounts
  ACCOUNT: {
    CONNECT: 'connect_account',
    DISCONNECT: 'disconnect_account',
    REFRESH_TOKEN: 'refresh_token',
    SYNC: 'sync_account',
  },
  
  // Workspace
  WORKSPACE: {
    CREATE: 'create_workspace',
    UPDATE: 'update_workspace',
    DELETE: 'delete_workspace',
    INVITE_USER: 'invite_user',
    REMOVE_USER: 'remove_user',
  },
  
  // Admin
  ADMIN: {
    VIEW_LOGS: 'view_logs',
    EXPORT_DATA: 'export_data',
    MANAGE_USERS: 'manage_users',
    SYSTEM_CONFIG: 'system_config',
  },
  
  // API
  API: {
    CREATE_KEY: 'create_api_key',
    DELETE_KEY: 'delete_api_key',
    API_CALL: 'api_call',
    WEBHOOK_TRIGGER: 'webhook_trigger',
  },
} as const;

// Helper function to create standardized log descriptions
export function createLogDescription(actionType: string, details: Record<string, any> = {}): string {
  const descriptions: Record<string, (details: Record<string, any>) => string> = {
    // Auth
    [ACTION_TYPES.AUTH.LOGIN]: () => 'Đăng nhập vào hệ thống',
    [ACTION_TYPES.AUTH.LOGOUT]: () => 'Đăng xuất khỏi hệ thống',
    [ACTION_TYPES.AUTH.REGISTER]: () => 'Đăng ký tài khoản mới',
    [ACTION_TYPES.AUTH.PASSWORD_RESET]: () => 'Đặt lại mật khẩu',
    [ACTION_TYPES.AUTH.EMAIL_VERIFY]: () => 'Xác thực email',
    
    // Posts
    [ACTION_TYPES.POST.CREATE]: (d) => `Tạo bài đăng mới: ${d.title || 'Không có tiêu đề'}`,
    [ACTION_TYPES.POST.UPDATE]: (d) => `Cập nhật bài đăng: ${d.title || d.id}`,
    [ACTION_TYPES.POST.DELETE]: (d) => `Xóa bài đăng: ${d.title || d.id}`,
    [ACTION_TYPES.POST.SCHEDULE]: (d) => `Lên lịch đăng bài: ${d.title || d.id} lúc ${d.scheduled_at}`,
    [ACTION_TYPES.POST.PUBLISH]: (d) => `Đăng bài thành công: ${d.title || d.id}`,
    [ACTION_TYPES.POST.CANCEL]: (d) => `Hủy lịch đăng bài: ${d.title || d.id}`,
    [ACTION_TYPES.POST.DUPLICATE]: (d) => `Nhân đôi bài đăng: ${d.title || d.id}`,
    
    // Accounts
    [ACTION_TYPES.ACCOUNT.CONNECT]: (d) => `Kết nối tài khoản ${d.provider}: ${d.name}`,
    [ACTION_TYPES.ACCOUNT.DISCONNECT]: (d) => `Ngắt kết nối tài khoản ${d.provider}: ${d.name}`,
    [ACTION_TYPES.ACCOUNT.REFRESH_TOKEN]: (d) => `Làm mới token cho ${d.provider}: ${d.name}`,
    [ACTION_TYPES.ACCOUNT.SYNC]: (d) => `Đồng bộ dữ liệu tài khoản ${d.provider}: ${d.name}`,
    
    // Workspace
    [ACTION_TYPES.WORKSPACE.CREATE]: (d) => `Tạo workspace mới: ${d.name}`,
    [ACTION_TYPES.WORKSPACE.UPDATE]: (d) => `Cập nhật workspace: ${d.name}`,
    [ACTION_TYPES.WORKSPACE.DELETE]: (d) => `Xóa workspace: ${d.name}`,
    [ACTION_TYPES.WORKSPACE.INVITE_USER]: (d) => `Mời người dùng ${d.email} vào workspace`,
    [ACTION_TYPES.WORKSPACE.REMOVE_USER]: (d) => `Xóa người dùng ${d.email} khỏi workspace`,
    
    // Admin
    [ACTION_TYPES.ADMIN.VIEW_LOGS]: () => 'Xem nhật ký hệ thống',
    [ACTION_TYPES.ADMIN.EXPORT_DATA]: (d) => `Xuất dữ liệu: ${d.type}`,
    [ACTION_TYPES.ADMIN.MANAGE_USERS]: (d) => `Quản lý người dùng: ${d.action}`,
    [ACTION_TYPES.ADMIN.SYSTEM_CONFIG]: (d) => `Thay đổi cấu hình hệ thống: ${d.setting}`,
    
    // API
    [ACTION_TYPES.API.CREATE_KEY]: (d) => `Tạo API key mới: ${d.name}`,
    [ACTION_TYPES.API.DELETE_KEY]: (d) => `Xóa API key: ${d.name}`,
    [ACTION_TYPES.API.API_CALL]: (d) => `Gọi API: ${d.endpoint}`,
    [ACTION_TYPES.API.WEBHOOK_TRIGGER]: (d) => `Kích hoạt webhook: ${d.event}`,
  };
  
  const descriptionFn = descriptions[actionType];
  if (descriptionFn) {
    return descriptionFn(details);
  }
  
  return `Thực hiện hành động: ${actionType}`;
}
