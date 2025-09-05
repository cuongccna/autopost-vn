-- Migration to update AI rate limits for free users
-- Free users should have 0 AI limits (no AI access)

UPDATE public.autopostvn_ai_rate_limits 
SET daily_limit = 0, monthly_limit = 0 
WHERE user_role = 'free';

-- Verify the update
SELECT user_role, daily_limit, monthly_limit 
FROM public.autopostvn_ai_rate_limits 
ORDER BY user_role;
