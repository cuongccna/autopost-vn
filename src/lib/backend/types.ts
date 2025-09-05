// AutoPost VN - Backend Types
// Định nghĩa các interface và types cho backend

export interface Workspace {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  workspace_id: string;
  provider: 'facebook' | 'instagram' | 'zalo';
  provider_id: string;
  name: string;
  avatar_url?: string;
  username?: string;
  token_encrypted: string;
  refresh_token_encrypted?: string;
  scopes: string[];
  expires_at?: string;
  status: 'connected' | 'expired' | 'error' | 'disconnected';
  last_sync_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  media_urls: string[];
  media_metadata: Record<string, any>;
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled';
  scheduled_at?: string;
  published_at?: string;
  created_by?: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PostSchedule {
  id: string;
  post_id: string;
  social_account_id: string;
  scheduled_at: string;
  status: 'pending' | 'processing' | 'published' | 'failed' | 'cancelled';
  attempts: number;
  max_attempts: number;
  last_error?: string;
  error_code?: string;
  external_post_id?: string;
  external_url?: string;
  engagement_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  workspace_id: string;
  event_type: string;
  event_data: Record<string, any>;
  post_id?: string;
  social_account_id?: string;
  created_at: string;
}

export interface ErrorLog {
  id: string;
  workspace_id: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  context: Record<string, any>;
  post_schedule_id?: string;
  social_account_id?: string;
  resolved_at?: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request Types
export interface CreatePostRequest {
  title: string;
  content: string;
  media_urls?: string[];
  scheduled_at?: string;
  social_account_ids: string[];
  tags?: string[];
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  media_urls?: string[];
  scheduled_at?: string;
  status?: Post['status'];
  tags?: string[];
}

export interface ConnectSocialAccountRequest {
  provider: SocialAccount['provider'];
  access_token: string;
  provider_data: Record<string, any>;
}

// Analytics Types
export interface PostAnalytics {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  status: Post['status'];
  scheduled_at?: string;
  published_at?: string;
  created_at: string;
  schedule_details: {
    provider: string;
    account_name: string;
    status: string;
    external_post_id?: string;
    engagement_data: Record<string, any>;
  }[];
  total_schedules: number;
  published_count: number;
  failed_count: number;
}

export interface AccountPerformance {
  id: string;
  workspace_id: string;
  provider: string;
  name: string;
  status: string;
  total_posts: number;
  published_posts: number;
  failed_posts: number;
  success_rate: number;
}

// Error Types
export interface AppError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, any>;
}

// Service Types
export interface PostService {
  create(_workspaceId: string, _data: CreatePostRequest): Promise<Post>;
  update(_id: string, _data: UpdatePostRequest): Promise<Post>;
  delete(_id: string): Promise<void>;
  findById(_id: string): Promise<Post | null>;
  findByWorkspace(_workspaceId: string, _filters?: any): Promise<Post[]>;
  schedule(_postId: string, _socialAccountIds: string[], _scheduledAt: Date): Promise<PostSchedule[]>;
}

export interface SocialAccountService {
  connect(_workspaceId: string, _data: ConnectSocialAccountRequest): Promise<SocialAccount>;
  disconnect(_id: string): Promise<void>;
  refreshToken(_id: string): Promise<SocialAccount>;
  findByWorkspace(_workspaceId: string): Promise<SocialAccount[]>;
  findById(_id: string): Promise<SocialAccount | null>;
}

export interface AnalyticsService {
  getPostAnalytics(_workspaceId: string, _filters?: any): Promise<PostAnalytics[]>;
  getAccountPerformance(_workspaceId: string): Promise<AccountPerformance[]>;
  createEvent(_event: Omit<AnalyticsEvent, 'id' | 'created_at'>): Promise<AnalyticsEvent>;
  getEvents(_workspaceId: string, _filters?: any): Promise<AnalyticsEvent[]>;
}

// Platform Specific Types
export interface FacebookPostData {
  message: string;
  link?: string;
  published?: boolean;
  scheduled_publish_time?: number;
}

export interface InstagramPostData {
  image_url?: string;
  caption?: string;
  user_tags?: any[];
}

export interface ZaloPostData {
  message: string;
  attachment?: {
    type: string;
    payload: any;
  };
}

// Job Queue Types
export interface ScheduledJob {
  id: string;
  type: 'publish_post' | 'refresh_token' | 'sync_engagement';
  data: Record<string, any>;
  scheduled_at: Date;
  attempts: number;
  max_attempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Database Types
export interface DatabaseConfig {
  url: string;
  key: string;
  schema?: string;
}

// Configuration Types
export interface AppConfig {
  database: DatabaseConfig;
  facebook: {
    app_id: string;
    app_secret: string;
    webhook_verify_token: string;
  };
  instagram: {
    client_id: string;
    client_secret: string;
  };
  zalo: {
    app_id: string;
    app_secret: string;
  };
  encryption: {
    key: string;
    algorithm: string;
  };
  jwt: {
    secret: string;
    expires_in: string;
  };
}
