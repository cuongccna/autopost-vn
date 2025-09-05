-- Migration: Post limits tracking system
-- Description: Track user posts and implement role-based limits
-- Date: 2024-01-15

-- Create post_usage table to track user posts
CREATE TABLE IF NOT EXISTS post_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID, -- Reference to actual post if needed
    post_type VARCHAR(50) DEFAULT 'regular', -- regular, scheduled, draft
    platform VARCHAR(50) NOT NULL, -- facebook, instagram, tiktok, zalo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft' -- draft, scheduled, published, failed
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_post_usage_user_id ON post_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_post_usage_created_at ON post_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_post_usage_user_month ON post_usage(user_id, DATE_TRUNC('month', created_at));
CREATE INDEX IF NOT EXISTS idx_post_usage_status ON post_usage(status);

-- Create post_rate_limits table to define limits per role
CREATE TABLE IF NOT EXISTS post_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_role VARCHAR(50) NOT NULL UNIQUE, -- free, professional, enterprise
    monthly_limit INTEGER NOT NULL, -- -1 for unlimited
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default post rate limits
INSERT INTO post_rate_limits (user_role, monthly_limit) VALUES
('free', 10),
('professional', -1), -- unlimited
('enterprise', -1)    -- unlimited
ON CONFLICT (user_role) DO UPDATE SET
monthly_limit = EXCLUDED.monthly_limit,
updated_at = NOW();

-- Function to check post rate limits
CREATE OR REPLACE FUNCTION check_post_rate_limit(
    p_user_id UUID,
    p_user_role VARCHAR(50) DEFAULT 'free'
)
RETURNS JSON AS $$
DECLARE
    v_monthly_usage INTEGER;
    v_monthly_limit INTEGER;
    v_current_month DATE;
    v_result JSON;
BEGIN
    -- Get current month start
    v_current_month := DATE_TRUNC('month', NOW());
    
    -- Get monthly usage for current month
    SELECT COALESCE(COUNT(*), 0)
    INTO v_monthly_usage
    FROM post_usage
    WHERE user_id = p_user_id
    AND DATE_TRUNC('month', created_at) = v_current_month;
    
    -- Get monthly limit for user role
    SELECT monthly_limit
    INTO v_monthly_limit
    FROM post_rate_limits
    WHERE user_role = p_user_role;
    
    -- If no limit found, default to free tier
    IF v_monthly_limit IS NULL THEN
        v_monthly_limit := 10;
    END IF;
    
    -- Build result JSON
    v_result := json_build_object(
        'allowed', CASE 
            WHEN v_monthly_limit = -1 THEN true
            WHEN v_monthly_usage < v_monthly_limit THEN true
            ELSE false
        END,
        'monthly_usage', v_monthly_usage,
        'monthly_limit', v_monthly_limit,
        'user_role', p_user_role
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user post usage stats
CREATE OR REPLACE FUNCTION get_user_post_usage(
    p_user_id UUID,
    p_user_role VARCHAR(50) DEFAULT 'free'
)
RETURNS JSON AS $$
DECLARE
    v_monthly_usage INTEGER;
    v_monthly_limit INTEGER;
    v_current_month DATE;
    v_this_week INTEGER;
    v_today INTEGER;
    v_result JSON;
BEGIN
    -- Get current month start
    v_current_month := DATE_TRUNC('month', NOW());
    
    -- Get monthly usage
    SELECT COALESCE(COUNT(*), 0)
    INTO v_monthly_usage
    FROM post_usage
    WHERE user_id = p_user_id
    AND DATE_TRUNC('month', created_at) = v_current_month;
    
    -- Get this week usage
    SELECT COALESCE(COUNT(*), 0)
    INTO v_this_week
    FROM post_usage
    WHERE user_id = p_user_id
    AND DATE_TRUNC('week', created_at) = DATE_TRUNC('week', NOW());
    
    -- Get today usage
    SELECT COALESCE(COUNT(*), 0)
    INTO v_today
    FROM post_usage
    WHERE user_id = p_user_id
    AND DATE_TRUNC('day', created_at) = DATE_TRUNC('day', NOW());
    
    -- Get monthly limit
    SELECT monthly_limit
    INTO v_monthly_limit
    FROM post_rate_limits
    WHERE user_role = p_user_role;
    
    -- Default to free if not found
    IF v_monthly_limit IS NULL THEN
        v_monthly_limit := 10;
    END IF;
    
    -- Build result
    v_result := json_build_object(
        'monthly_usage', v_monthly_usage,
        'monthly_limit', v_monthly_limit,
        'weekly_usage', v_this_week,
        'daily_usage', v_today,
        'user_role', p_user_role,
        'allowed', CASE 
            WHEN v_monthly_limit = -1 THEN true
            WHEN v_monthly_usage < v_monthly_limit THEN true
            ELSE false
        END
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON post_usage TO authenticated;
GRANT SELECT ON post_rate_limits TO authenticated;
GRANT EXECUTE ON FUNCTION check_post_rate_limit(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_post_usage(UUID, VARCHAR) TO authenticated;

-- Add RLS policies for post_usage
ALTER TABLE post_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own post usage
CREATE POLICY post_usage_user_policy ON post_usage
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Users can insert their own post usage
CREATE POLICY post_usage_insert_policy ON post_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add RLS for post_rate_limits (read-only for all authenticated users)
ALTER TABLE post_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_rate_limits_read_policy ON post_rate_limits
    FOR SELECT USING (auth.role() = 'authenticated');

-- Comment on tables and functions
COMMENT ON TABLE post_usage IS 'Tracks user posts for rate limiting and analytics';
COMMENT ON TABLE post_rate_limits IS 'Defines post limits per user role (free, professional, enterprise)';
COMMENT ON FUNCTION check_post_rate_limit IS 'Checks if user can create a new post based on their role and current usage';
COMMENT ON FUNCTION get_user_post_usage IS 'Returns comprehensive post usage statistics for a user';
