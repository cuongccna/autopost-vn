-- Migration: 008_add_system_activity_logs.sql
-- Thêm bảng nhật ký hệ thống theo user

-- Nhật ký hoạt động hệ thống - System Activity Logs
create table if not exists public.autopostvn_system_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.autopostvn_workspaces(id) on delete cascade,
  
  -- Thông tin hoạt động
  action_type text not null, -- 'login', 'logout', 'create_post', 'delete_post', 'connect_account', etc
  action_category text not null check (action_category in ('auth', 'post', 'account', 'workspace', 'admin', 'api')),
  description text not null, -- Mô tả chi tiết hoạt động bằng tiếng Việt
  
  -- Metadata
  target_resource_type text, -- 'post', 'social_account', 'workspace', etc
  target_resource_id uuid, -- ID của resource được tác động
  previous_data jsonb default '{}'::jsonb, -- Dữ liệu trước khi thay đổi (cho audit trail)
  new_data jsonb default '{}'::jsonb, -- Dữ liệu sau khi thay đổi
  
  -- Request context
  ip_address inet,
  user_agent text,
  request_id text, -- Request ID để trace
  session_id text, -- Session ID
  
  -- Status và metadata
  status text check (status in ('success', 'failed', 'warning')) default 'success',
  error_message text, -- Nếu action failed
  duration_ms int, -- Thời gian thực hiện (milliseconds)
  additional_data jsonb default '{}'::jsonb, -- Dữ liệu bổ sung
  
  created_at timestamptz default now()
);

-- Indexes cho performance
create index if not exists idx_autopostvn_activity_logs_user_id on public.autopostvn_system_activity_logs (user_id, created_at desc);
create index if not exists idx_autopostvn_activity_logs_workspace_id on public.autopostvn_system_activity_logs (workspace_id, created_at desc);
create index if not exists idx_autopostvn_activity_logs_action_category on public.autopostvn_system_activity_logs (action_category, created_at desc);
create index if not exists idx_autopostvn_activity_logs_action_type on public.autopostvn_system_activity_logs (action_type, created_at desc);
create index if not exists idx_autopostvn_activity_logs_target_resource on public.autopostvn_system_activity_logs (target_resource_type, target_resource_id);
create index if not exists idx_autopostvn_activity_logs_status on public.autopostvn_system_activity_logs (status, created_at desc);
create index if not exists idx_autopostvn_activity_logs_created_at on public.autopostvn_system_activity_logs (created_at desc);

-- Row Level Security
alter table public.autopostvn_system_activity_logs enable row level security;

-- Policy: Users can only see their own activity logs
create policy "Users can view their own activity logs" on public.autopostvn_system_activity_logs
  for select using (auth.uid() = user_id);

-- Policy: Service role can insert activity logs
create policy "Service role can insert activity logs" on public.autopostvn_system_activity_logs
  for insert with check (true);

-- Policy: Workspace members can view workspace activity logs (if they belong to workspace)
create policy "Workspace members can view workspace logs" on public.autopostvn_system_activity_logs
  for select using (
    workspace_id in (
      select w.id from public.autopostvn_workspaces w
      where exists (
        select 1 from public.autopostvn_user_profiles up
        where up.id = auth.uid()
      )
    )
  );

-- Comments
comment on table public.autopostvn_system_activity_logs is 'Nhật ký hoạt động hệ thống theo user';
comment on column public.autopostvn_system_activity_logs.action_type is 'Loại hành động cụ thể';
comment on column public.autopostvn_system_activity_logs.action_category is 'Nhóm hành động: auth, post, account, workspace, admin, api';
comment on column public.autopostvn_system_activity_logs.description is 'Mô tả chi tiết bằng tiếng Việt';
comment on column public.autopostvn_system_activity_logs.target_resource_type is 'Loại tài nguyên bị tác động';
comment on column public.autopostvn_system_activity_logs.target_resource_id is 'ID của tài nguyên bị tác động';
comment on column public.autopostvn_system_activity_logs.previous_data is 'Dữ liệu trước khi thay đổi (audit trail)';
comment on column public.autopostvn_system_activity_logs.new_data is 'Dữ liệu sau khi thay đổi';
comment on column public.autopostvn_system_activity_logs.status is 'Trạng thái thực hiện: success, failed, warning';
comment on column public.autopostvn_system_activity_logs.duration_ms is 'Thời gian thực hiện (ms)';
