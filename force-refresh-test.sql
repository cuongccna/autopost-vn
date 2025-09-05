-- Force refresh test - run this in Supabase SQL Editor
-- to confirm the values are truly updated

-- 1. Check current table values with timestamp
SELECT 
    user_role,
    daily_limit,
    monthly_limit,
    updated_at,
    NOW() as current_time
FROM public.autopostvn_ai_rate_limits 
ORDER BY user_role;

-- 2. Test function with explicit user role
SELECT check_ai_rate_limit(
    '59dd7dcb-73b3-4b83-96a6-82811c1413fe'::UUID,
    'free'::VARCHAR
) as function_result;

-- 3. Force update again with current timestamp
UPDATE public.autopostvn_ai_rate_limits 
SET daily_limit = 3, monthly_limit = 60, updated_at = NOW()
WHERE user_role = 'free';

UPDATE public.autopostvn_ai_rate_limits 
SET daily_limit = 50, monthly_limit = 1000, updated_at = NOW()
WHERE user_role = 'professional';
