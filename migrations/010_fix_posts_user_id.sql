-- Fix autopostvn_posts.user_id type and recreate dependent view

-- 1. Drop the dependent view
DROP VIEW IF EXISTS public.autopostvn_user_posts;

-- 2. Change column type to VARCHAR
ALTER TABLE public.autopostvn_posts 
ALTER COLUMN user_id TYPE VARCHAR(255);

-- 3. Recreate the view
CREATE OR REPLACE VIEW public.autopostvn_user_posts AS
 SELECT p.id,
    p.workspace_id,
    p.user_id,
    p.title,
    p.content,
    p.media_urls,
    p.providers,
    p.status,
    p.scheduled_at,
    p.published_at,
    p.engagement_data,
    p.metadata,
    p.created_at,
    p.updated_at,
    p.account_id,
    usa.user_email,
    usa.provider,
    usa.account_name,
    uw.workspace_name
   FROM autopostvn_posts p
     JOIN autopostvn_user_social_accounts usa ON p.account_id = usa.id
     JOIN autopostvn_user_workspaces uw ON usa.workspace_id = uw.id;
