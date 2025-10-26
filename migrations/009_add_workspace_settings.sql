-- Migration: Add workspace settings support
-- Description: Update existing workspaces with default settings and add helper functions

-- Update existing workspaces with default settings if they don't have any
UPDATE autopostvn_workspaces
SET settings = jsonb_build_object(
  'notifications', jsonb_build_object(
    'onSuccess', true,
    'onFailure', true,
    'onTokenExpiry', true
  ),
  'scheduling', jsonb_build_object(
    'timezone', 'Asia/Ho_Chi_Minh',
    'goldenHours', jsonb_build_array('09:00', '12:30', '20:00'),
    'rateLimit', 10
  ),
  'advanced', jsonb_build_object(
    'autoDeleteOldPosts', false,
    'autoDeleteDays', 30,
    'testMode', false
  )
)
WHERE settings = '{}'::jsonb OR settings IS NULL;

-- Create function to get workspace settings with defaults
CREATE OR REPLACE FUNCTION get_workspace_settings(workspace_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT settings INTO result
  FROM autopostvn_workspaces
  WHERE id = workspace_uuid;
  
  -- Return settings or default if empty
  IF result IS NULL OR result = '{}'::jsonb THEN
    result := jsonb_build_object(
      'notifications', jsonb_build_object(
        'onSuccess', true,
        'onFailure', true,
        'onTokenExpiry', true
      ),
      'scheduling', jsonb_build_object(
        'timezone', 'Asia/Ho_Chi_Minh',
        'goldenHours', jsonb_build_array('09:00', '12:30', '20:00'),
        'rateLimit', 10
      ),
      'advanced', jsonb_build_object(
        'autoDeleteOldPosts', false,
        'autoDeleteDays', 30,
        'testMode', false
      )
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Create function to update workspace settings
CREATE OR REPLACE FUNCTION update_workspace_settings(
  workspace_uuid uuid,
  new_settings jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
BEGIN
  UPDATE autopostvn_workspaces
  SET 
    settings = new_settings,
    updated_at = now()
  WHERE id = workspace_uuid
  RETURNING settings INTO result;
  
  RETURN result;
END;
$$;

-- Add comment for documentation
COMMENT ON COLUMN autopostvn_workspaces.settings IS 'Workspace settings including notifications, scheduling preferences, and advanced options';
COMMENT ON FUNCTION get_workspace_settings IS 'Get workspace settings with default fallback';
COMMENT ON FUNCTION update_workspace_settings IS 'Update workspace settings and return the new value';
