-- Fix the database function to ensure it reads from rate limits table correctly
-- This addresses the issue where function returns old hardcoded values

DROP FUNCTION IF EXISTS check_ai_rate_limit(UUID, VARCHAR);

CREATE OR REPLACE FUNCTION check_ai_rate_limit(
    p_user_id UUID,
    p_user_role VARCHAR(20)
)
RETURNS JSON AS $$
DECLARE
    daily_usage INTEGER;
    monthly_usage INTEGER;
    daily_limit INTEGER;
    monthly_limit INTEGER;
    result JSON;
BEGIN
    -- Get rate limits for user role with explicit debugging
    SELECT rl.daily_limit, rl.monthly_limit 
    INTO daily_limit, monthly_limit
    FROM public.autopostvn_ai_rate_limits rl
    WHERE rl.user_role = p_user_role;
    
    -- If no limits found for specific role, default to free tier
    IF daily_limit IS NULL THEN
        SELECT rl.daily_limit, rl.monthly_limit 
        INTO daily_limit, monthly_limit
        FROM public.autopostvn_ai_rate_limits rl
        WHERE rl.user_role = 'free';
    END IF;
    
    -- If still no limits found, set explicit defaults (should not happen)
    IF daily_limit IS NULL THEN
        daily_limit := 0;
        monthly_limit := 0;
    END IF;
    
    -- Get current usage
    daily_usage := get_user_ai_usage(p_user_id, 'daily');
    monthly_usage := get_user_ai_usage(p_user_id, 'monthly');
    
    -- Check limits (-1 means unlimited)
    result := json_build_object(
        'allowed', CASE 
            WHEN daily_limit = -1 AND monthly_limit = -1 THEN TRUE
            WHEN daily_limit = -1 THEN monthly_usage < monthly_limit
            WHEN monthly_limit = -1 THEN daily_usage < daily_limit
            ELSE daily_usage < daily_limit AND monthly_usage < monthly_limit
        END,
        'daily_usage', daily_usage,
        'daily_limit', daily_limit,
        'monthly_usage', monthly_usage,
        'monthly_limit', monthly_limit,
        'user_role', p_user_role
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
