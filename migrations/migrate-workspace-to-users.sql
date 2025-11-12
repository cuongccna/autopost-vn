-- Migration: Move user data from workspace settings to users table
-- This script extracts user info from workspace.settings and creates proper user records

-- Insert users from workspace settings
INSERT INTO autopostvn_users (id, email, full_name, password_hash, email_verified, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  settings->>'user_email' as email,
  settings->>'user_full_name' as full_name,
  settings->>'password_hash' as password_hash,
  COALESCE((settings->>'email_verified')::boolean, false) as email_verified,
  created_at,
  updated_at
FROM autopostvn_workspaces
WHERE settings->>'user_email' IS NOT NULL
  AND settings->>'password_hash' IS NOT NULL
  AND settings->>'user_email' NOT IN (SELECT email FROM autopostvn_users)
ON CONFLICT (email) DO NOTHING;

-- Update workspace slugs to use user-{user_id} format
UPDATE autopostvn_workspaces w
SET 
  slug = 'user-' || u.id,
  settings = jsonb_set(
    COALESCE(w.settings, '{}'::jsonb),
    '{user_id}',
    to_jsonb(u.id::text)
  ),
  updated_at = NOW()
FROM autopostvn_users u
WHERE w.settings->>'user_email' = u.email
  AND w.slug NOT LIKE 'user-%';

-- Verify migration
SELECT 
  'Users migrated:' as status,
  COUNT(*) as count
FROM autopostvn_users;

SELECT 
  'Workspaces updated:' as status,
  COUNT(*) as count
FROM autopostvn_workspaces
WHERE slug LIKE 'user-%';
