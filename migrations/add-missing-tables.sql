-- Migration: Add missing tables from Supabase schema
-- Date: 2025-11-09

-- 1. Create autopostvn_users table
CREATE TABLE IF NOT EXISTS public.autopostvn_users (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text NULL,
  avatar_url text NULL,
  user_role character varying(20) NOT NULL DEFAULT 'free'::character varying,
  is_active boolean NULL DEFAULT true,
  subscription_expires_at timestamp with time zone NULL,
  metadata jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  phone character varying(20) NULL,
  CONSTRAINT autopostvn_users_pkey PRIMARY KEY (id),
  CONSTRAINT autopostvn_users_email_key UNIQUE (email),
  CONSTRAINT autopostvn_users_user_role_check CHECK (
    (user_role)::text = ANY (
      ARRAY[
        'free'::character varying,
        'professional'::character varying,
        'enterprise'::character varying
      ]::text[]
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_autopostvn_users_phone ON public.autopostvn_users USING btree (phone);
CREATE INDEX IF NOT EXISTS idx_autopostvn_users_user_role ON public.autopostvn_users USING btree (user_role);

-- Trigger for autopostvn_users
CREATE TRIGGER update_autopostvn_users_updated_at 
  BEFORE UPDATE ON autopostvn_users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 2. Create autopostvn_user_profiles table
CREATE TABLE IF NOT EXISTS public.autopostvn_user_profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  avatar_url text NULL,
  phone text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT autopostvn_user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT autopostvn_user_profiles_email_key UNIQUE (email)
);

-- 3. Create autopostvn_system_activity_logs table
CREATE TABLE IF NOT EXISTS public.autopostvn_system_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid NULL,
  action_type text NOT NULL,
  action_category text NOT NULL,
  description text NOT NULL,
  target_resource_type text NULL,
  target_resource_id uuid NULL,
  previous_data jsonb NULL DEFAULT '{}'::jsonb,
  new_data jsonb NULL DEFAULT '{}'::jsonb,
  ip_address inet NULL,
  user_agent text NULL,
  request_id text NULL,
  session_id text NULL,
  status text NULL DEFAULT 'success'::text,
  error_message text NULL,
  duration_ms integer NULL,
  additional_data jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT autopostvn_system_activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT autopostvn_system_activity_logs_workspace_id_fkey 
    FOREIGN KEY (workspace_id) REFERENCES autopostvn_workspaces(id) ON DELETE CASCADE,
  CONSTRAINT autopostvn_system_activity_logs_action_category_check CHECK (
    action_category = ANY (
      ARRAY['auth'::text, 'post'::text, 'account'::text, 'workspace'::text, 'admin'::text, 'api'::text]
    )
  ),
  CONSTRAINT autopostvn_system_activity_logs_status_check CHECK (
    status = ANY (ARRAY['success'::text, 'failed'::text, 'warning'::text])
  )
);

CREATE INDEX IF NOT EXISTS idx_autopostvn_activity_logs_user_id 
  ON public.autopostvn_system_activity_logs USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_autopostvn_activity_logs_workspace_id 
  ON public.autopostvn_system_activity_logs USING btree (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_autopostvn_activity_logs_action_category 
  ON public.autopostvn_system_activity_logs USING btree (action_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_autopostvn_activity_logs_action_type 
  ON public.autopostvn_system_activity_logs USING btree (action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_autopostvn_activity_logs_target_resource 
  ON public.autopostvn_system_activity_logs USING btree (target_resource_type, target_resource_id);
CREATE INDEX IF NOT EXISTS idx_autopostvn_activity_logs_status 
  ON public.autopostvn_system_activity_logs USING btree (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_autopostvn_activity_logs_created_at 
  ON public.autopostvn_system_activity_logs USING btree (created_at DESC);

-- 4. Create autopostvn_ai_usage table
CREATE TABLE IF NOT EXISTS public.autopostvn_ai_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  request_type character varying(50) NOT NULL,
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  request_timestamp timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  tokens_used integer NULL DEFAULT 0,
  success boolean NULL DEFAULT true,
  error_message text NULL,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT autopostvn_ai_usage_pkey PRIMARY KEY (id),
  CONSTRAINT autopostvn_ai_usage_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES autopostvn_users(id) ON DELETE CASCADE
);

CREATE TRIGGER update_autopostvn_ai_usage_updated_at 
  BEFORE UPDATE ON autopostvn_ai_usage 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Create autopostvn_post_usage table
CREATE TABLE IF NOT EXISTS public.autopostvn_post_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid NULL,
  post_type character varying(50) NULL DEFAULT 'regular'::character varying,
  platform character varying(50) NOT NULL,
  content_preview text NULL,
  media_count integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  scheduled_for timestamp with time zone NULL,
  published_at timestamp with time zone NULL,
  status character varying(50) NULL DEFAULT 'draft'::character varying,
  metadata jsonb NULL DEFAULT '{}'::jsonb,
  CONSTRAINT autopostvn_post_usage_pkey PRIMARY KEY (id),
  CONSTRAINT autopostvn_post_usage_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES autopostvn_users(id) ON DELETE CASCADE
);

-- 6. Update autopostvn_social_accounts to add missing providers
DO $$ 
BEGIN
  -- Drop existing constraint
  ALTER TABLE autopostvn_social_accounts 
    DROP CONSTRAINT IF EXISTS autopostvn_social_accounts_provider_check;
  
  -- Add new constraint with all providers
  ALTER TABLE autopostvn_social_accounts 
    ADD CONSTRAINT autopostvn_social_accounts_provider_check 
    CHECK (
      provider = ANY (
        ARRAY[
          'facebook'::text,
          'facebook_page'::text,
          'instagram'::text,
          'zalo'::text,
          'buffer'::text
        ]
      )
    );
END $$;

-- 7. Add missing column 'platform_name' to autopostvn_social_accounts if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'autopostvn_social_accounts' 
    AND column_name = 'platform_name'
  ) THEN
    ALTER TABLE autopostvn_social_accounts 
      ADD COLUMN platform_name text NULL;
  END IF;
END $$;

-- Insert default AI rate limits if not exists
INSERT INTO autopostvn_ai_rate_limits (user_role, daily_limit, monthly_limit)
VALUES 
  ('free', -1, -1),
  ('professional', 50, 1000),
  ('enterprise', -1, -1)
ON CONFLICT (user_role) DO NOTHING;

-- Insert default post rate limits if not exists
INSERT INTO autopostvn_post_rate_limits (user_role, monthly_limit, daily_limit)
VALUES 
  ('free', -1, -1),
  ('professional', 1000, 100),
  ('enterprise', -1, -1)
ON CONFLICT (user_role) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '   - Created autopostvn_users table';
  RAISE NOTICE '   - Created autopostvn_user_profiles table';
  RAISE NOTICE '   - Created autopostvn_system_activity_logs table';
  RAISE NOTICE '   - Created autopostvn_ai_usage table';
  RAISE NOTICE '   - Created autopostvn_post_usage table';
  RAISE NOTICE '   - Updated autopostvn_social_accounts providers';
  RAISE NOTICE '   - Added platform_name column';
  RAISE NOTICE '   - Inserted default rate limits';
END $$;
