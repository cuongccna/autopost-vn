-- Fix user_id type from UUID to VARCHAR in all related tables
-- This is necessary because NextAuth uses CUIDs (strings) which are not valid UUIDs

-- 1. Drop foreign key constraints
ALTER TABLE public.autopostvn_ai_usage 
DROP CONSTRAINT IF EXISTS autopostvn_ai_usage_user_id_fkey;

ALTER TABLE public.autopostvn_post_usage 
DROP CONSTRAINT IF EXISTS autopostvn_post_usage_user_id_fkey;

ALTER TABLE public.autopostvn_workspaces 
DROP CONSTRAINT IF EXISTS autopostvn_workspaces_user_id_fkey;

-- 2. Change column types to VARCHAR
-- autopostvn_users (Primary Key)
ALTER TABLE public.autopostvn_users 
ALTER COLUMN id TYPE VARCHAR(255);

-- autopostvn_ai_usage
ALTER TABLE public.autopostvn_ai_usage 
ALTER COLUMN user_id TYPE VARCHAR(255);

-- autopostvn_post_usage
ALTER TABLE public.autopostvn_post_usage 
ALTER COLUMN user_id TYPE VARCHAR(255);

-- autopostvn_workspaces
ALTER TABLE public.autopostvn_workspaces 
ALTER COLUMN user_id TYPE VARCHAR(255);

-- autopostvn_posts (No FK but has user_id column)
ALTER TABLE public.autopostvn_posts 
ALTER COLUMN user_id TYPE VARCHAR(255);

-- 3. Re-add foreign key constraints
ALTER TABLE public.autopostvn_ai_usage 
ADD CONSTRAINT autopostvn_ai_usage_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.autopostvn_users(id) ON DELETE CASCADE;

ALTER TABLE public.autopostvn_post_usage 
ADD CONSTRAINT autopostvn_post_usage_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.autopostvn_users(id) ON DELETE CASCADE;

ALTER TABLE public.autopostvn_workspaces 
ADD CONSTRAINT autopostvn_workspaces_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.autopostvn_users(id) ON DELETE CASCADE;
