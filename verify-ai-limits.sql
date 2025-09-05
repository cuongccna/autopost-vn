-- Test script to verify current AI limits in database
-- Run this in Supabase SQL Editor to check current values

SELECT 
    user_role,
    daily_limit,
    monthly_limit,
    updated_at
FROM public.autopostvn_ai_rate_limits 
ORDER BY user_role;

-- If values are not updated, run the update commands:
-- UPDATE public.autopostvn_ai_rate_limits 
-- SET daily_limit = 3, monthly_limit = 60 
-- WHERE user_role = 'free';

-- UPDATE public.autopostvn_ai_rate_limits 
-- SET daily_limit = 50, monthly_limit = 1000 
-- WHERE user_role = 'professional';
