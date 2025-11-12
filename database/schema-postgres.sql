-- AutoPost VN - PostgreSQL Database Schema (Standalone)
-- Designed for Vietnamese social media automation platform
-- No Supabase dependencies

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ========================================
-- CORE TABLES
-- ========================================

-- Users - Thông tin người dùng (standalone, không phụ thuộc Supabase Auth)
create table if not exists autopostvn_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  email_verified boolean default false,
  email_verification_token text,
  email_verification_expires timestamptz,
  password_hash text not null,
  password_reset_token text,
  password_reset_expires timestamptz,
  full_name text not null,
  avatar_url text,
  phone text,
  user_role text check (user_role in ('free','professional','enterprise')) default 'free',
  subscription_status text check (subscription_status in ('active','inactive','cancelled','expired')) default 'inactive',
  subscription_expires_at timestamptz,
  last_login_at timestamptz,
  login_attempts int default 0,
  locked_until timestamptz,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Workspaces - Đại diện cho tổ chức/doanh nghiệp
create table if not exists autopostvn_workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references autopostvn_users(id) on delete cascade,
  name text not null,
  slug text unique,
  description text,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Social Accounts - Tài khoản mạng xã hội được kết nối
create table if not exists autopostvn_social_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references autopostvn_workspaces(id) on delete cascade,
  provider text not null check (provider in ('facebook','instagram','zalo')),
  provider_id text not null, -- ID từ platform (page_id, account_id, etc)
  name text not null,
  avatar_url text,
  username text,
  token_encrypted text not null, -- Encrypted access token
  refresh_token_encrypted text, -- Encrypted refresh token
  scopes text[] default '{}',
  expires_at timestamptz,
  status text check (status in ('connected','expired','error','disconnected')) default 'connected',
  last_sync_at timestamptz,
  metadata jsonb default '{}'::jsonb, -- Platform-specific data
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(workspace_id, provider, provider_id)
);

-- Posts - Bài đăng và kế hoạch đăng bài
create table if not exists autopostvn_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references autopostvn_workspaces(id) on delete cascade,
  user_id uuid references autopostvn_users(id) on delete cascade,
  title text not null,
  content text not null,
  media_urls text[] default '{}', -- Array of image/video URLs
  providers text[] default '{}', -- Target platforms ['facebook', 'instagram', 'zalo']
  status text check (status in ('draft','scheduled','publishing','published','failed','archived')) default 'draft',
  scheduled_at timestamptz, -- When to publish
  published_at timestamptz, -- When actually published
  engagement_data jsonb default '{}'::jsonb, -- Likes, comments, shares data
  metadata jsonb default '{}'::jsonb, -- Additional post data
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Post Schedules - Lịch đăng bài chi tiết cho từng platform
create table if not exists autopostvn_post_schedules (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references autopostvn_posts(id) on delete cascade,
  social_account_id uuid references autopostvn_social_accounts(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text check (status in ('pending','publishing','published','failed','cancelled')) default 'pending',
  external_post_id text, -- ID from social platform after publishing
  error_message text, -- Error details if failed
  retry_count int default 0,
  engagement_data jsonb default '{}'::jsonb, -- Platform-specific engagement data
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========================================
-- ANALYTICS & MONITORING
-- ========================================

-- Post Analytics - Phân tích hiệu suất bài đăng
create table if not exists autopostvn_post_analytics (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references autopostvn_posts(id) on delete cascade,
  provider text not null,
  metrics jsonb not null, -- Views, likes, comments, shares, etc
  collected_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Analytics Events - Sự kiện phân tích chi tiết
create table if not exists autopostvn_analytics_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references autopostvn_workspaces(id) on delete cascade,
  post_id uuid references autopostvn_posts(id) on delete cascade,
  social_account_id uuid references autopostvn_social_accounts(id) on delete cascade,
  event_type text not null, -- 'post_published', 'post_failed', 'engagement_update', etc
  event_data jsonb not null,
  user_agent text,
  ip_address inet,
  created_at timestamptz default now()
);

-- Error Logs - Nhật ký lỗi hệ thống
create table if not exists autopostvn_error_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references autopostvn_workspaces(id) on delete set null,
  error_type text not null,
  error_message text not null,
  error_stack text,
  context jsonb default '{}'::jsonb,
  post_schedule_id uuid references autopostvn_post_schedules(id) on delete set null,
  social_account_id uuid references autopostvn_social_accounts(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- Account Performance - Hiệu suất tài khoản theo thời gian
create table if not exists autopostvn_account_performance (
  id uuid primary key default gen_random_uuid(),
  social_account_id uuid references autopostvn_social_accounts(id) on delete cascade,
  date date not null,
  followers_count int default 0,
  posts_count int default 0,
  engagement_rate decimal(5,2) default 0.00,
  reach int default 0,
  impressions int default 0,
  metrics jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique(social_account_id, date)
);

-- Media files - Quản lý file media được upload
create table if not exists autopostvn_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references autopostvn_users(id) on delete cascade,
  workspace_id uuid references autopostvn_workspaces(id) on delete set null,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size bigint not null,
  media_type text check (media_type in ('image','video','document')) default 'image',
  bucket text,
  public_url text not null,
  s3_key text,
  status text check (status in ('uploading','uploaded','failed','deleted')) default 'uploaded',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========================================
-- SYSTEM TABLES
-- ========================================

-- API Keys - Khóa API cho tích hợp bên ngoài
create table if not exists autopostvn_api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references autopostvn_workspaces(id) on delete cascade,
  name text not null,
  key_hash text unique not null, -- Hashed API key
  permissions text[] default '{}', -- ['read:posts', 'write:posts', etc]
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Webhooks - Webhook endpoints cho tự động hóa
create table if not exists autopostvn_webhooks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references autopostvn_workspaces(id) on delete cascade,
  url text not null,
  events text[] not null, -- ['post.published', 'post.failed', etc]
  secret text not null,
  is_active boolean default true,
  last_triggered_at timestamptz,
  created_at timestamptz default now()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Critical indexes for performance
create index if not exists idx_autopostvn_users_email on autopostvn_users (email);
create index if not exists idx_autopostvn_users_reset_token on autopostvn_users (password_reset_token) where password_reset_token is not null;
create index if not exists idx_autopostvn_posts_workspace_status on autopostvn_posts (workspace_id, status);
create index if not exists idx_autopostvn_posts_scheduled_at on autopostvn_posts (scheduled_at) where status = 'scheduled';
create index if not exists idx_autopostvn_post_schedules_pending on autopostvn_post_schedules (scheduled_at) where status = 'pending';
create index if not exists idx_autopostvn_post_schedules_account on autopostvn_post_schedules (social_account_id, status);
create index if not exists idx_autopostvn_social_accounts_workspace on autopostvn_social_accounts (workspace_id, status);
create index if not exists idx_autopostvn_analytics_events_workspace_type on autopostvn_analytics_events (workspace_id, event_type);
create index if not exists idx_autopostvn_analytics_events_created_at on autopostostvn_analytics_events (created_at);
create index if not exists idx_autopostvn_error_logs_workspace_unresolved on autopostvn_error_logs (workspace_id) where resolved_at is null;

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- Triggers for updated_at
create trigger update_autopostvn_users_updated_at before update on autopostvn_users for each row execute procedure update_updated_at_column();
create trigger update_autopostvn_workspaces_updated_at before update on autopostvn_workspaces for each row execute procedure update_updated_at_column();
create trigger update_autopostvn_social_accounts_updated_at before update on autopostvn_social_accounts for each row execute procedure update_updated_at_column();
create trigger update_autopostvn_posts_updated_at before update on autopostvn_posts for each row execute procedure update_updated_at_column();
create trigger update_autopostvn_post_schedules_updated_at before update on autopostvn_post_schedules for each row execute procedure update_updated_at_column();
