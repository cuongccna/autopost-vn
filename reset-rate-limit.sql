-- Reset post usage tracking for development/testing
-- Run this to reset rate limits

-- First, let's see current usage
SELECT 
  user_id,
  monthly_posts,
  weekly_posts,
  daily_posts,
  user_role,
  monthly_limit,
  last_reset_at
FROM autopostvn_post_limits_tracking 
WHERE user_id = '019534da-5e93-7633-b0ec-a26b6d7c9a4f';

-- Reset usage counts
UPDATE autopostvn_post_limits_tracking 
SET 
  monthly_posts = 0,
  weekly_posts = 0,
  daily_posts = 0,
  last_reset_at = NOW()
WHERE user_id = '019534da-5e93-7633-b0ec-a26b6d7c9a4f';

-- Or increase limits temporarily for testing
UPDATE autopostvn_post_limits_tracking 
SET 
  monthly_limit = 100,
  user_role = 'premium'
WHERE user_id = '019534da-5e93-7633-b0ec-a26b6d7c9a4f';

-- Check updated values
SELECT 
  user_id,
  monthly_posts,
  weekly_posts,
  daily_posts,
  user_role,
  monthly_limit,
  last_reset_at
FROM autopostvn_post_limits_tracking 
WHERE user_id = '019534da-5e93-7633-b0ec-a26b6d7c9a4f';
