-- AutoPost VN - Supabase Database Schema
-- Designed for Vietnamese social media automation platform
-- All tables created in public schema for REST API compatibility

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ========================================
-- CORE TABLES (in public schema)
-- ========================================

-- User Profiles - Thông tin người dùng
create table if not exists public.autopostvn_user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  avatar_url text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Workspaces - Đại diện cho tổ chức/doanh nghiệp
create table if not exists public.autopostvn_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Social Accounts - Tài khoản mạng xã hội được kết nối
create table if not exists public.autopostvn_social_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.autopostvn_workspaces(id) on delete cascade,
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
create table if not exists public.autopostvn_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.autopostvn_workspaces(id) on delete cascade,
  user_id uuid not null, -- User who created the post
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
create table if not exists public.autopostvn_post_schedules (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.autopostvn_posts(id) on delete cascade,
  social_account_id uuid references public.autopostvn_social_accounts(id) on delete cascade,
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
create table if not exists public.autopostvn_post_analytics (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.autopostvn_posts(id) on delete cascade,
  provider text not null,
  metrics jsonb not null, -- Views, likes, comments, shares, etc
  collected_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Analytics Events - Sự kiện phân tích chi tiết
create table if not exists public.autopostvn_analytics_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.autopostvn_workspaces(id) on delete cascade,
  post_id uuid references public.autopostvn_posts(id) on delete cascade,
  social_account_id uuid references public.autopostvn_social_accounts(id) on delete cascade,
  event_type text not null, -- 'post_published', 'post_failed', 'engagement_update', etc
  event_data jsonb not null,
  user_agent text,
  ip_address inet,
  created_at timestamptz default now()
);

-- Error Logs - Nhật ký lỗi hệ thống
create table if not exists public.autopostvn_error_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.autopostvn_workspaces(id) on delete set null,
  error_type text not null,
  error_message text not null,
  error_stack text,
  context jsonb default '{}'::jsonb,
  post_schedule_id uuid references public.autopostvn_post_schedules(id) on delete set null,
  social_account_id uuid references public.autopostvn_social_accounts(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- Account Performance - Hiệu suất tài khoản theo thời gian
create table if not exists public.autopostvn_account_performance (
  id uuid primary key default gen_random_uuid(),
  social_account_id uuid references public.autopostvn_social_accounts(id) on delete cascade,
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

-- ========================================
-- SYSTEM TABLES
-- ========================================

-- API Keys - Khóa API cho tích hợp bên ngoài  
create table if not exists public.autopostvn_api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.autopostvn_workspaces(id) on delete cascade,
  name text not null,
  key_hash text unique not null, -- Hashed API key
  permissions text[] default '{}', -- ['read:posts', 'write:posts', etc]
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Webhooks - Webhook endpoints cho tự động hóa
create table if not exists public.autopostvn_webhooks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.autopostvn_workspaces(id) on delete cascade,
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
create index if not exists idx_autopostvn_posts_workspace_status on public.autopostvn_posts (workspace_id, status);
create index if not exists idx_autopostvn_posts_scheduled_at on public.autopostvn_posts (scheduled_at) where status = 'scheduled';
create index if not exists idx_autopostvn_post_schedules_pending on public.autopostvn_post_schedules (scheduled_at) where status = 'pending';
create index if not exists idx_autopostvn_post_schedules_account on public.autopostvn_post_schedules (social_account_id, status);
create index if not exists idx_autopostvn_social_accounts_workspace on public.autopostvn_social_accounts (workspace_id, status);
create index if not exists idx_autopostvn_analytics_events_workspace_type on public.autopostvn_analytics_events (workspace_id, event_type);
create index if not exists idx_autopostvn_analytics_events_created_at on public.autopostvn_analytics_events (created_at);
create index if not exists idx_autopostvn_error_logs_workspace_unresolved on public.autopostvn_error_logs (workspace_id) where resolved_at is null;

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
alter table public.autopostvn_workspaces enable row level security;
alter table public.autopostvn_social_accounts enable row level security;
alter table public.autopostvn_posts enable row level security;
alter table public.autopostvn_post_schedules enable row level security;
alter table public.autopostvn_analytics_events enable row level security;
alter table public.autopostvn_error_logs enable row level security;
alter table public.autopostvn_api_keys enable row level security;
alter table public.autopostvn_webhooks enable row level security;
alter table public.autopostvn_post_analytics enable row level security;
alter table public.autopostvn_account_performance enable row level security;

-- Policies for development (allow all - replace with proper auth in production)
create policy "dev_all_workspaces" on public.autopostvn_workspaces for all using (true) with check (true);
create policy "dev_all_social_accounts" on public.autopostvn_social_accounts for all using (true) with check (true);
create policy "dev_all_posts" on public.autopostvn_posts for all using (true) with check (true);
create policy "dev_all_post_schedules" on public.autopostvn_post_schedules for all using (true) with check (true);
create policy "dev_all_analytics_events" on public.autopostvn_analytics_events for all using (true) with check (true);
create policy "dev_all_error_logs" on public.autopostvn_error_logs for all using (true) with check (true);
create policy "dev_all_api_keys" on public.autopostvn_api_keys for all using (true) with check (true);
create policy "dev_all_webhooks" on public.autopostvn_webhooks for all using (true) with check (true);
create policy "dev_all_post_analytics" on public.autopostvn_post_analytics for all using (true) with check (true);
create policy "dev_all_account_performance" on public.autopostvn_account_performance for all using (true) with check (true);

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
$$ language plpgsql;

-- Triggers to auto-update updated_at
create trigger update_autopostvn_workspaces_updated_at before update on public.autopostvn_workspaces
    for each row execute function update_updated_at_column();

create trigger update_autopostvn_social_accounts_updated_at before update on public.autopostvn_social_accounts
    for each row execute function update_updated_at_column();

create trigger update_autopostvn_posts_updated_at before update on public.autopostvn_posts
    for each row execute function update_updated_at_column();

create trigger update_autopostvn_post_schedules_updated_at before update on public.autopostvn_post_schedules
    for each row execute function update_updated_at_column();

-- Function to create analytics event
create or replace function create_analytics_event(
  p_workspace_id uuid,
  p_event_type text,
  p_event_data jsonb,
  p_post_id uuid default null,
  p_social_account_id uuid default null
)
returns uuid as $$
declare
  event_id uuid;
begin
  insert into public.autopostvn_analytics_events (workspace_id, event_type, event_data, post_id, social_account_id)
  values (p_workspace_id, p_event_type, p_event_data, p_post_id, p_social_account_id)
  returning id into event_id;
  
  return event_id;
end;
$$ language plpgsql;

-- ========================================
-- SAMPLE DATA FOR DEVELOPMENT
-- ========================================

-- Insert sample workspace
insert into public.autopostvn_workspaces (id, name, slug, description) 
values (
  '123e4567-e89b-12d3-a456-426614174000',
  'AutoPost VN Demo',
  'autopost-vn-demo',
  'Demo workspace for AutoPost VN application'
) on conflict do nothing;

-- Insert sample social accounts  
insert into public.autopostvn_social_accounts (workspace_id, provider, provider_id, name, username, token_encrypted, status)
values 
  ('123e4567-e89b-12d3-a456-426614174000', 'facebook', 'fb_page_123', 'Fanpage Cửa Hàng A', 'cuahang_a', 'encrypted_token_fb', 'connected'),
  ('123e4567-e89b-12d3-a456-426614174000', 'instagram', 'ig_account_456', 'Instagram Shop B', 'shop_b_official', 'encrypted_token_ig', 'connected'),
  ('123e4567-e89b-12d3-a456-426614174000', 'zalo', 'zalo_oa_789', 'Zalo OA Dịch Vụ C', 'dichvu_c_oa', 'encrypted_token_zalo', 'connected')
on conflict do nothing;

