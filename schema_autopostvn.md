create table public.autopostvn_account_performance (
  id uuid not null default gen_random_uuid (),
  social_account_id uuid null,
  date date not null,
  followers_count integer null default 0,
  posts_count integer null default 0,
  engagement_rate numeric(5, 2) null default 0.00,
  reach integer null default 0,
  impressions integer null default 0,
  metrics jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  constraint autopostvn_account_performance_pkey primary key (id),
  constraint autopostvn_account_performance_social_account_id_date_key unique (social_account_id, date),
  constraint autopostvn_account_performance_social_account_id_fkey foreign KEY (social_account_id) references autopostvn_social_accounts (id) on delete CASCADE
) TABLESPACE pg_default;

--------------------------------

create table public.autopostvn_ai_rate_limits (
  id uuid not null default gen_random_uuid (),
  user_role character varying(20) not null,
  daily_limit integer not null,
  monthly_limit integer not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint autopostvn_ai_rate_limits_pkey primary key (id),
  constraint autopostvn_ai_rate_limits_user_role_key unique (user_role)
) TABLESPACE pg_default;

create trigger update_autopostvn_ai_rate_limits_updated_at BEFORE
update on autopostvn_ai_rate_limits for EACH row
execute FUNCTION update_updated_at_column ();

INSERT INTO "public"."autopostvn_ai_rate_limits" ("id", "user_role", "daily_limit", "monthly_limit", "created_at", "updated_at") VALUES ('70e52261-8d2d-4c45-83be-35c9d95cbe01', 'professional', '50', '1000', '2025-09-05 12:28:58.073303+00', '2025-09-05 15:05:41.981464+00'), ('91dfc22b-fe43-4273-89cb-ce16ed5ef58c', 'enterprise', '-1', '-1', '2025-09-05 12:28:58.073303+00', '2025-09-05 12:28:58.073303+00'), ('9609e8c6-e6cc-4be4-aeab-758b6819a6d8', 'free', '-1', '-1', '2025-09-05 12:28:58.073303+00', '2025-10-07 16:45:16.389275+00');

----------------------------------------

create table public.autopostvn_ai_usage (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  request_type character varying(50) not null,
  request_date date not null default CURRENT_DATE,
  request_timestamp timestamp with time zone null default CURRENT_TIMESTAMP,
  tokens_used integer null default 0,
  success boolean null default true,
  error_message text null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint autopostvn_ai_usage_pkey primary key (id),
  constraint autopostvn_ai_usage_user_id_fkey foreign KEY (user_id) references autopostvn_users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_autopostvn_ai_usage_updated_at BEFORE
update on autopostvn_ai_usage for EACH row
execute FUNCTION update_updated_at_column ();

INSERT INTO "public"."autopostvn_ai_usage" ("id", "user_id", "request_type", "request_date", "request_timestamp", "tokens_used", "success", "error_message", "created_at", "updated_at") VALUES ('07b6405d-52f9-4d59-8481-a344c51d1c95', '00095768-35ed-4fe7-8b68-58440f01843c', 'caption', '2025-10-25', '2025-10-25 16:41:25.822092+00', '0', 'false', 'Không thể tạo caption. Vui lòng thử lại.', '2025-10-25 16:41:25.822092+00', '2025-10-25 16:41:25.822092+00'), ('0ef7ad71-a6ef-494f-b9b9-0b67b2a9e67e', '00095768-35ed-4fe7-8b68-58440f01843c', 'caption', '2025-11-01', '2025-11-01 08:29:15.10084+00', '0', 'true', null, '2025-11-01 08:29:15.10084+00', '2025-11-01 08:29:15.10084+00'), ('120f3660-d241-40c8-a485-6de112b9c171', '00095768-35ed-4fe7-8b68-58440f01843c', 'caption', '2025-10-25', '2025-10-25 16:46:56.7176+00', '0', 'false', 'Không thể tạo caption. Vui lòng thử lại.', '2025-10-25 16:46:56.7176+00', '2025-10-25 16:46:56.7176+00'), ('165cadc9-055d-4e61-be00-f0620c718090', '00095768-35ed-4fe7-8b68-58440f01843c', 'caption', '2025-10-25', '2025-10-25 16:47:48.143458+00', '0', 'false', 'Không thể tạo caption. Vui lòng thử lại.', '2025-10-25 16:47:48.143458+00', '2025-10-25 16:47:48.143458+00'), ('1dffce38-4684-48c7-9fdc-988de3119248', '00095768-35ed-4fe7-8b68-58440f01843c', 'caption', '2025-10-25', '2025-10-25 16:48:44.136521+00', '0', 'false', 'Không thể tạo caption. Vui lòng thử lại.', '2025-10-25 16:48:44.136521+00', '2025-10-25 16:48:44.136521+00'), ('5f3a4092-d21b-4fe5-b2e6-4ea11b10d366', '00095768-35ed-4fe7-8b68-58440f01843c', 'caption', '2025-10-25', '2025-10-25 17:08:06.529545+00', '0', 'true', null, '2025-10-25 17:08:06.529545+00', '2025-10-25 17:08:06.529545+00'), ('631cbaab-61e6-436f-84bb-2cb01c933ea5', '00095768-35ed-4fe7-8b68-58440f01843c', 'caption', '2025-10-26', '2025-10-26 10:26:04.817966+00', '0', 'true', null, '2025-10-26 10:26:04.817966+00', '2025-10-26 10:26:04.817966+00'), ('6b1179c7-7581-4b42-8496-823706ddea8f', '00095768-35ed-4fe7-8b68-58440f01843c', 'caption', '2025-10-27', '2025-10-27 17:02:38.58529+00', '0', 'true', null, '2025-10-27 17:02:38.58529+00', '2025-10-27 17:02:38.58529+00'), ('7d4ab197-2312-48b8-941a-307fd7330c36', '59dd7dcb-73b3-4b83-96a6-82811c1413fe', 'optimal_times', '2025-09-05', '2025-09-05 16:27:43.232042+00', '0', 'true', null, '2025-09-05 16:27:43.232042+00', '2025-09-05 16:27:43.232042+00'), ('908de92a-fb16-4b7c-b111-a5c5c34c096a', '00095768-35ed-4fe7-8b68-58440f01843c', 'hashtags', '2025-10-25', '2025-10-25 17:08:15.197293+00', '0', 'true', null, '2025-10-25 17:08:15.197293+00', '2025-10-25 17:08:15.197293+00'), ('98d47a02-db47-45e4-bd3d-214ecabee38e', '00095768-35ed-4fe7-8b68-58440f01843c', 'caption', '2025-10-25', '2025-10-25 16:38:32.444624+00', '0', 'false', 'Không thể tạo caption. Vui lòng thử lại.', '2025-10-25 16:38:32.444624+00', '2025-10-25 16:38:32.444624+00'), ('aa5b2529-dd7f-44d8-ae04-37466999237b', '00095768-35ed-4fe7-8b68-58440f01843c', 'caption', '2025-10-25', '2025-10-25 16:55:55.667034+00', '0', 'false', 'Không thể tạo caption. Vui lòng thử lại.', '2025-10-25 16:55:55.667034+00', '2025-10-25 16:55:55.667034+00'), ('b3cd177e-1266-4aab-8bc7-de9398652f3d', '00095768-35ed-4fe7-8b68-58440f01843c', 'caption', '2025-10-29', '2025-10-29 16:35:00.588663+00', '0', 'true', null, '2025-10-29 16:35:00.588663+00', '2025-10-29 16:35:00.588663+00'), ('cb48c05b-3d39-44ec-a246-752c1d49ec3e', '59dd7dcb-73b3-4b83-96a6-82811c1413fe', 'hashtags', '2025-09-05', '2025-09-05 16:27:33.437073+00', '0', 'true', null, '2025-09-05 16:27:33.437073+00', '2025-09-05 16:27:33.437073+00'), ('dcbb8114-4332-49dd-95da-e3aedb072d2c', '00095768-35ed-4fe7-8b68-58440f01843c', 'caption', '2025-11-07', '2025-11-07 16:20:35.460572+00', '0', 'true', null, '2025-11-07 16:20:35.460572+00', '2025-11-07 16:20:35.460572+00'), ('e0211c1d-00c7-4db3-ac91-dd7fcd7b907e', '00095768-35ed-4fe7-8b68-58440f01843c', 'caption', '2025-10-25', '2025-10-25 16:45:25.175971+00', '0', 'false', 'Không thể tạo caption. Vui lòng thử lại.', '2025-10-25 16:45:25.175971+00', '2025-10-25 16:45:25.175971+00'), ('e9960311-6d81-4a7d-95bf-a810e2b7a2d6', '00095768-35ed-4fe7-8b68-58440f01843c', 'caption', '2025-10-22', '2025-10-22 03:28:30.445223+00', '0', 'false', 'Không thể tạo caption. Vui lòng thử lại.', '2025-10-22 03:28:30.445223+00', '2025-10-22 03:28:30.445223+00');





----------------------------------



create table public.autopostvn_analytics_events (
  id uuid not null default gen_random_uuid (),
  workspace_id uuid null,
  post_id uuid null,
  social_account_id uuid null,
  event_type text not null,
  event_data jsonb not null,
  user_agent text null,
  ip_address inet null,
  created_at timestamp with time zone null default now(),
  constraint autopostvn_analytics_events_pkey primary key (id),
  constraint autopostvn_analytics_events_post_id_fkey foreign KEY (post_id) references autopostvn_posts (id) on delete CASCADE,
  constraint autopostvn_analytics_events_social_account_id_fkey foreign KEY (social_account_id) references autopostvn_social_accounts (id) on delete CASCADE,
  constraint autopostvn_analytics_events_workspace_id_fkey foreign KEY (workspace_id) references autopostvn_workspaces (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_analytics_events_workspace_type on public.autopostvn_analytics_events using btree (workspace_id, event_type) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_analytics_events_created_at on public.autopostvn_analytics_events using btree (created_at) TABLESPACE pg_default;


----------------------------------------


create table public.autopostvn_api_keys (
  id uuid not null default gen_random_uuid (),
  workspace_id uuid null,
  name text not null,
  key_hash text not null,
  permissions text[] null default '{}'::text[],
  last_used_at timestamp with time zone null,
  expires_at timestamp with time zone null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint autopostvn_api_keys_pkey primary key (id),
  constraint autopostvn_api_keys_key_hash_key unique (key_hash),
  constraint autopostvn_api_keys_workspace_id_fkey foreign KEY (workspace_id) references autopostvn_workspaces (id) on delete CASCADE
) TABLESPACE pg_default;


--------------------------------------


create table public.autopostvn_error_logs (
  id uuid not null default gen_random_uuid (),
  workspace_id uuid null,
  error_type text not null,
  error_message text not null,
  error_stack text null,
  context jsonb null default '{}'::jsonb,
  post_schedule_id uuid null,
  social_account_id uuid null,
  resolved_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint autopostvn_error_logs_pkey primary key (id),
  constraint autopostvn_error_logs_post_schedule_id_fkey foreign KEY (post_schedule_id) references autopostvn_post_schedules (id) on delete set null,
  constraint autopostvn_error_logs_social_account_id_fkey foreign KEY (social_account_id) references autopostvn_social_accounts (id) on delete set null,
  constraint autopostvn_error_logs_workspace_id_fkey foreign KEY (workspace_id) references autopostvn_workspaces (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_error_logs_workspace_unresolved on public.autopostvn_error_logs using btree (workspace_id) TABLESPACE pg_default
where
  (resolved_at is null);

---------------------------------

create table public.autopostvn_media (
  id uuid not null default gen_random_uuid (),
  user_id text not null,
  workspace_id uuid null,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size bigint not null,
  media_type character varying(20) null default 'image'::character varying,
  bucket text null default 'media'::text,
  public_url text not null,
  status character varying(20) null default 'uploaded'::character varying,
  published_at timestamp without time zone null,
  archived_at timestamp without time zone null,
  deleted_at timestamp without time zone null,
  engagement_score integer null default 0,
  platform_urls jsonb null default '{}'::jsonb,
  metadata jsonb null default '{}'::jsonb,
  tags text[] null default '{}'::text[],
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint autopostvn_media_pkey primary key (id),
  constraint autopostvn_media_media_type_check check (
    (
      (media_type)::text = any (
        (
          array[
            'image'::character varying,
            'video'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint autopostvn_media_status_check check (
    (
      (status)::text = any (
        (
          array[
            'uploaded'::character varying,
            'processing'::character varying,
            'published'::character varying,
            'archived'::character varying,
            'deleted'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_media_user_status on public.autopostvn_media using btree (user_id, status, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_media_lifecycle on public.autopostvn_media using btree (status, published_at, archived_at) TABLESPACE pg_default;

create index IF not exists idx_media_type_status on public.autopostvn_media using btree (media_type, status) TABLESPACE pg_default;

create index IF not exists idx_media_workspace on public.autopostvn_media using btree (workspace_id, status, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_media_tags on public.autopostvn_media using gin (tags) TABLESPACE pg_default;

create trigger update_autopostvn_media_updated_at BEFORE
update on autopostvn_media for EACH row
execute FUNCTION update_updated_at_column ();

---------------------------------------


create table public.autopostvn_oauth_sessions (
  id uuid not null default gen_random_uuid (),
  user_email character varying(255) not null,
  provider character varying(50) not null,
  state_token character varying(255) not null,
  redirect_uri text null,
  created_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null default (now() + '00:30:00'::interval),
  constraint autopostvn_oauth_sessions_pkey primary key (id),
  constraint autopostvn_oauth_sessions_state_token_key unique (state_token)
) TABLESPACE pg_default;

create index IF not exists idx_oauth_sessions_state on public.autopostvn_oauth_sessions using btree (state_token) TABLESPACE pg_default;

create index IF not exists idx_oauth_sessions_expires on public.autopostvn_oauth_sessions using btree (expires_at) TABLESPACE pg_default;


---------------------------------------


create table public.autopostvn_post_analytics (
  id uuid not null default gen_random_uuid (),
  post_id uuid null,
  provider text not null,
  metrics jsonb not null,
  collected_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  constraint autopostvn_post_analytics_pkey primary key (id),
  constraint autopostvn_post_analytics_post_id_fkey foreign KEY (post_id) references autopostvn_posts (id) on delete CASCADE
) TABLESPACE pg_default;

----------------------------------------


create table public.autopostvn_post_rate_limits (
  id uuid not null default gen_random_uuid (),
  user_role character varying(50) not null,
  monthly_limit integer not null,
  daily_limit integer null default '-1'::integer,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint autopostvn_post_rate_limits_pkey primary key (id),
  constraint autopostvn_post_rate_limits_user_role_key unique (user_role)
) TABLESPACE pg_default;

create trigger update_autopostvn_post_rate_limits_updated_at BEFORE
update on autopostvn_post_rate_limits for EACH row
execute FUNCTION update_updated_at_column ();


INSERT INTO "public"."autopostvn_post_rate_limits" ("id", "user_role", "monthly_limit", "daily_limit", "created_at", "updated_at") VALUES ('4ef0ee4d-226b-42bb-aa52-01f0868fa960', 'enterprise', '-1', '-1', '2025-09-05 12:32:42.393278+00', '2025-09-05 12:32:42.393278+00'), ('c58312e0-2990-400c-ba59-6ec480cd5547', 'professional', '1000', '100', '2025-09-05 12:32:42.393278+00', '2025-09-07 16:31:04.22946+00'), ('f9d13cfd-fdef-409d-8cc7-ee9de82a348d', 'free', '-1', '-1', '2025-09-05 12:32:42.393278+00', '2025-10-07 16:46:41.729974+00');


-----------------------------------


create table public.autopostvn_post_schedules (
  id uuid not null default gen_random_uuid (),
  post_id uuid null,
  social_account_id uuid null,
  scheduled_at timestamp with time zone not null,
  status text null default 'pending'::text,
  external_post_id text null,
  error_message text null,
  retry_count integer null default 0,
  engagement_data jsonb null default '{}'::jsonb,
  published_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint autopostvn_post_schedules_pkey primary key (id),
  constraint autopostvn_post_schedules_post_id_fkey foreign KEY (post_id) references autopostvn_posts (id) on delete CASCADE,
  constraint autopostvn_post_schedules_social_account_id_fkey foreign KEY (social_account_id) references autopostvn_social_accounts (id) on delete CASCADE,
  constraint autopostvn_post_schedules_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'publishing'::text,
          'published'::text,
          'failed'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_post_schedules_pending on public.autopostvn_post_schedules using btree (scheduled_at) TABLESPACE pg_default
where
  (status = 'pending'::text);

create index IF not exists idx_autopostvn_post_schedules_account on public.autopostvn_post_schedules using btree (social_account_id, status) TABLESPACE pg_default;

create trigger update_autopostvn_post_schedules_updated_at BEFORE
update on autopostvn_post_schedules for EACH row
execute FUNCTION update_updated_at_column ();


------------------------------------


create table public.autopostvn_post_usage (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  post_id uuid null,
  post_type character varying(50) null default 'regular'::character varying,
  platform character varying(50) not null,
  content_preview text null,
  media_count integer null default 0,
  created_at timestamp with time zone null default now(),
  scheduled_for timestamp with time zone null,
  published_at timestamp with time zone null,
  status character varying(50) null default 'draft'::character varying,
  metadata jsonb null default '{}'::jsonb,
  constraint autopostvn_post_usage_pkey primary key (id),
  constraint autopostvn_post_usage_user_id_fkey foreign KEY (user_id) references autopostvn_users (id) on delete CASCADE
) TABLESPACE pg_default;



-------------------------------------


create table public.autopostvn_posts (
  id uuid not null default gen_random_uuid (),
  workspace_id uuid null,
  user_id uuid not null,
  title text not null,
  content text not null,
  media_urls text[] null default '{}'::text[],
  providers text[] null default '{}'::text[],
  status text null default 'draft'::text,
  scheduled_at timestamp with time zone null,
  published_at timestamp with time zone null,
  engagement_data jsonb null default '{}'::jsonb,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  account_id uuid null,
  media_type character varying(20) null default 'none'::character varying,
  constraint autopostvn_posts_pkey primary key (id),
  constraint autopostvn_posts_account_id_fkey foreign KEY (account_id) references autopostvn_user_social_accounts (id) on delete CASCADE,
  constraint autopostvn_posts_workspace_id_fkey foreign KEY (workspace_id) references autopostvn_workspaces (id) on delete CASCADE,
  constraint autopostvn_posts_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'scheduled'::text,
          'publishing'::text,
          'published'::text,
          'failed'::text,
          'archived'::text
        ]
      )
    )
  ),
  constraint media_type_check check (
    (
      (media_type)::text = any (
        (
          array[
            'image'::character varying,
            'video'::character varying,
            'album'::character varying,
            'none'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_posts_workspace_status on public.autopostvn_posts using btree (workspace_id, status) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_posts_scheduled_at on public.autopostvn_posts using btree (scheduled_at) TABLESPACE pg_default
where
  (status = 'scheduled'::text);

create index IF not exists idx_posts_account_id on public.autopostvn_posts using btree (account_id) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_posts_media_type on public.autopostvn_posts using btree (media_type) TABLESPACE pg_default;

create trigger update_autopostvn_posts_updated_at BEFORE
update on autopostvn_posts for EACH row
execute FUNCTION update_updated_at_column ();

--------------------------------------------


create table public.autopostvn_social_accounts (
  id uuid not null default gen_random_uuid (),
  workspace_id uuid null,
  provider text not null,
  provider_id text not null,
  name text not null,
  avatar_url text null,
  username text null,
  token_encrypted text not null,
  refresh_token_encrypted text null,
  scopes text[] null default '{}'::text[],
  expires_at timestamp with time zone null,
  status text null default 'connected'::text,
  last_sync_at timestamp with time zone null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint autopostvn_social_accounts_pkey primary key (id),
  constraint autopostvn_social_accounts_workspace_id_provider_provider_i_key unique (workspace_id, provider, provider_id),
  constraint autopostvn_social_accounts_workspace_id_fkey foreign KEY (workspace_id) references autopostvn_workspaces (id) on delete CASCADE,
  constraint autopostvn_social_accounts_provider_check check (
    (
      provider = any (
        array[
          'facebook'::text,
          'facebook_page'::text,
          'instagram'::text,
          'zalo'::text,
          'buffer'::text
        ]
      )
    )
  ),
  constraint autopostvn_social_accounts_status_check check (
    (
      status = any (
        array[
          'connected'::text,
          'expired'::text,
          'error'::text,
          'disconnected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_social_accounts_workspace on public.autopostvn_social_accounts using btree (workspace_id, status) TABLESPACE pg_default;

create trigger update_autopostvn_social_accounts_updated_at BEFORE
update on autopostvn_social_accounts for EACH row
execute FUNCTION update_updated_at_column ();


create table public.autopostvn_system_activity_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  workspace_id uuid null,
  action_type text not null,
  action_category text not null,
  description text not null,
  target_resource_type text null,
  target_resource_id uuid null,
  previous_data jsonb null default '{}'::jsonb,
  new_data jsonb null default '{}'::jsonb,
  ip_address inet null,
  user_agent text null,
  request_id text null,
  session_id text null,
  status text null default 'success'::text,
  error_message text null,
  duration_ms integer null,
  additional_data jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  constraint autopostvn_system_activity_logs_pkey primary key (id),
  constraint autopostvn_system_activity_logs_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint autopostvn_system_activity_logs_workspace_id_fkey foreign KEY (workspace_id) references autopostvn_workspaces (id) on delete CASCADE,
  constraint autopostvn_system_activity_logs_action_category_check check (
    (
      action_category = any (
        array[
          'auth'::text,
          'post'::text,
          'account'::text,
          'workspace'::text,
          'admin'::text,
          'api'::text
        ]
      )
    )
  ),
  constraint autopostvn_system_activity_logs_status_check check (
    (
      status = any (
        array['success'::text, 'failed'::text, 'warning'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_activity_logs_user_id on public.autopostvn_system_activity_logs using btree (user_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_activity_logs_workspace_id on public.autopostvn_system_activity_logs using btree (workspace_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_activity_logs_action_category on public.autopostvn_system_activity_logs using btree (action_category, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_activity_logs_action_type on public.autopostvn_system_activity_logs using btree (action_type, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_activity_logs_target_resource on public.autopostvn_system_activity_logs using btree (target_resource_type, target_resource_id) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_activity_logs_status on public.autopostvn_system_activity_logs using btree (status, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_activity_logs_created_at on public.autopostvn_system_activity_logs using btree (created_at desc) TABLESPACE pg_default;

--------------------------------------------

create table public.autopostvn_user_profiles (
  id uuid not null,
  email text not null,
  full_name text not null,
  avatar_url text null,
  phone text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint autopostvn_user_profiles_pkey primary key (id),
  constraint autopostvn_user_profiles_email_key unique (email),
  constraint autopostvn_user_profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;


--------------------------------------------

create table public.autopostvn_user_social_accounts (
  id uuid not null default gen_random_uuid (),
  user_email character varying(255) not null,
  workspace_id uuid not null,
  provider character varying(50) not null,
  account_name character varying(255) not null,
  provider_account_id character varying(255) not null,
  access_token text not null,
  refresh_token text null,
  token_expires_at timestamp with time zone null,
  account_data jsonb not null default '{}'::jsonb,
  status character varying(50) null default 'connected'::character varying,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint autopostvn_user_social_accounts_pkey primary key (id),
  constraint autopostvn_user_social_accoun_user_email_provider_provider__key unique (user_email, provider, provider_account_id),
  constraint autopostvn_user_social_accounts_provider_check check (
    (
      (provider)::text = any (
        (
          array[
            'facebook'::character varying,
            'instagram'::character varying,
            'zalo'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint autopostvn_user_social_accounts_status_check check (
    (
      (status)::text = any (
        (
          array[
            'connected'::character varying,
            'expired'::character varying,
            'error'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_user_social_accounts_email on public.autopostvn_user_social_accounts using btree (user_email) TABLESPACE pg_default;

create index IF not exists idx_user_social_accounts_workspace on public.autopostvn_user_social_accounts using btree (workspace_id) TABLESPACE pg_default;

create index IF not exists idx_user_social_accounts_provider on public.autopostvn_user_social_accounts using btree (provider) TABLESPACE pg_default;

create index IF not exists idx_user_social_accounts_status on public.autopostvn_user_social_accounts using btree (status) TABLESPACE pg_default;

create trigger update_user_social_accounts_updated_at BEFORE
update on autopostvn_user_social_accounts for EACH row
execute FUNCTION update_updated_at_column ();

------------------------------------------

create table public.autopostvn_users (
  id uuid not null,
  email text not null,
  full_name text null,
  avatar_url text null,
  user_role character varying(20) not null default 'free'::character varying,
  is_active boolean null default true,
  subscription_expires_at timestamp with time zone null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  phone character varying(20) null,
  constraint autopostvn_users_pkey primary key (id),
  constraint autopostvn_users_email_key unique (email),
  constraint autopostvn_users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint autopostvn_users_user_role_check check (
    (
      (user_role)::text = any (
        (
          array[
            'free'::character varying,
            'professional'::character varying,
            'enterprise'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_users_phone on public.autopostvn_users using btree (phone) TABLESPACE pg_default;

create index IF not exists idx_autopostvn_users_user_role on public.autopostvn_users using btree (user_role) TABLESPACE pg_default;

create trigger update_autopostvn_users_updated_at BEFORE
update on autopostvn_users for EACH row
execute FUNCTION update_updated_at_column ();

-----------------------------------------

create table public.autopostvn_webhooks (
  id uuid not null default gen_random_uuid (),
  workspace_id uuid null,
  url text not null,
  events text[] not null,
  secret text not null,
  is_active boolean null default true,
  last_triggered_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint autopostvn_webhooks_pkey primary key (id),
  constraint autopostvn_webhooks_workspace_id_fkey foreign KEY (workspace_id) references autopostvn_workspaces (id) on delete CASCADE
) TABLESPACE pg_default;


------------------------------------------

create table public.autopostvn_workspaces (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text null,
  description text null,
  settings jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint autopostvn_workspaces_pkey primary key (id),
  constraint autopostvn_workspaces_slug_key unique (slug)
) TABLESPACE pg_default;

create trigger update_autopostvn_workspaces_updated_at BEFORE
update on autopostvn_workspaces for EACH row
execute FUNCTION update_updated_at_column ();

