-- Migration: Add user_id to autopostvn_workspaces
-- Purpose: Unify workspace architecture - remove dependency on autopostvn_user_workspaces
-- Created: 2025-11-09

-- Step 1: Add user_id column if not exists
ALTER TABLE autopostvn_workspaces 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES autopostvn_users(id) ON DELETE CASCADE;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id 
ON autopostvn_workspaces(user_id);

-- Step 3: Update existing workspaces based on slug pattern
-- Workspaces with slug 'user-{first8chars}' should link to that user
UPDATE autopostvn_workspaces w
SET user_id = (
  SELECT u.id 
  FROM autopostvn_users u 
  WHERE w.slug = 'user-' || SUBSTRING(u.id::TEXT, 1, 8)
  LIMIT 1
)
WHERE user_id IS NULL AND slug LIKE 'user-%';

-- Step 4: Update workspaces based on posts ownership
-- If a workspace has posts from a specific user, assign that user as owner
UPDATE autopostvn_workspaces w
SET user_id = (
  SELECT p.user_id 
  FROM autopostvn_posts p 
  WHERE p.workspace_id = w.id 
  GROUP BY p.user_id 
  ORDER BY COUNT(*) DESC 
  LIMIT 1
)
WHERE user_id IS NULL
  AND EXISTS (SELECT 1 FROM autopostvn_posts WHERE workspace_id = w.id);

-- Step 5: Log workspaces without user_id (need manual assignment)
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM autopostvn_workspaces
  WHERE user_id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE NOTICE 'Warning: % workspaces have no user_id. These are either demo/system workspaces or need manual assignment.', orphan_count;
  ELSE
    RAISE NOTICE 'Success: All workspaces have user_id assigned.';
  END IF;
END $$;

-- Step 6: Add comment
COMMENT ON COLUMN autopostvn_workspaces.user_id IS 'Owner of this workspace. NULL for system/demo workspaces only.';

-- Step 7: Mark old table as deprecated
COMMENT ON TABLE autopostvn_user_workspaces IS 'DEPRECATED: Use autopostvn_workspaces.user_id instead. This table will be removed in future migration.';
