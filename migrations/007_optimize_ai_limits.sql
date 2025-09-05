-- Update AI rate limits with optimized values
-- Free: 3/day (enough for 1 complete post + experimentation)
-- Professional: 50/day, 1000/month (great value for 299k VND)

UPDATE public.autopostvn_ai_rate_limits 
SET daily_limit = 3, monthly_limit = 60 
WHERE user_role = 'free';

UPDATE public.autopostvn_ai_rate_limits 
SET daily_limit = 50, monthly_limit = 1000 
WHERE user_role = 'professional';

-- Verify the updates
SELECT user_role, daily_limit, monthly_limit 
FROM public.autopostvn_ai_rate_limits 
ORDER BY user_role;
