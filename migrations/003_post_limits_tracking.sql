-- Migration: Post limits tracking system
-- Description: Track user posts and implement role-based limits
-- Date: 2024-01-15
-- Updated: 2025-09-05 - Added autopostvn_ prefix and improved schema

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create post_usage table to track user posts
CREATE TABLE IF NOT EXISTS public.autopostvn_post_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.autopostvn_users(id) ON DELETE CASCADE,
    post_id UUID, -- Reference to actual post if needed
    post_type VARCHAR(50) DEFAULT 'regular', -- regular, scheduled, draft
    platform VARCHAR(50) NOT NULL, -- facebook, instagram, tiktok, zalo
    content_preview TEXT, -- Brief preview of post content
    media_count INTEGER DEFAULT 0, -- Number of media files attached
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, published, failed
    metadata JSONB DEFAULT '{}'::jsonb -- Additional platform-specific data
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_autopostvn_post_usage_user_id ON public.autopostvn_post_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_autopostvn_post_usage_created_at ON public.autopostvn_post_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_autopostvn_post_usage_user_month ON public.autopostvn_post_usage(user_id, DATE_TRUNC('month', created_at));
CREATE INDEX IF NOT EXISTS idx_autopostvn_post_usage_status ON public.autopostvn_post_usage(status);
CREATE INDEX IF NOT EXISTS idx_autopostvn_post_usage_platform ON public.autopostvn_post_usage(platform);
CREATE INDEX IF NOT EXISTS idx_autopostvn_post_usage_scheduled ON public.autopostvn_post_usage(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Create post_rate_limits table to define limits per role
CREATE TABLE IF NOT EXISTS public.autopostvn_post_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_role VARCHAR(50) NOT NULL UNIQUE, -- free, professional, enterprise
    monthly_limit INTEGER NOT NULL, -- -1 for unlimited
    daily_limit INTEGER DEFAULT -1, -- -1 for unlimited
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default post rate limits
INSERT INTO public.autopostvn_post_rate_limits (user_role, monthly_limit, daily_limit) VALUES
('free', 10, 1),
('professional', 100, 10),
('enterprise', -1, -1)    -- unlimited
ON CONFLICT (user_role) DO UPDATE SET
monthly_limit = EXCLUDED.monthly_limit,
daily_limit = EXCLUDED.daily_limit,
updated_at = NOW();

-- Function để update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger cho updated_at trên post_rate_limits
DROP TRIGGER IF EXISTS update_autopostvn_post_rate_limits_updated_at ON public.autopostvn_post_rate_limits;
CREATE TRIGGER update_autopostvn_post_rate_limits_updated_at 
    BEFORE UPDATE ON public.autopostvn_post_rate_limits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check post rate limits (enhanced with daily limits)
CREATE OR REPLACE FUNCTION check_post_rate_limit(
    p_user_id UUID,
    p_user_role VARCHAR(50) DEFAULT 'free'
)
RETURNS JSON AS $$
DECLARE
    v_monthly_usage INTEGER;
    v_daily_usage INTEGER;
    v_monthly_limit INTEGER;
    v_daily_limit INTEGER;
    v_current_month DATE;
    v_current_date DATE;
    v_result JSON;
BEGIN
    -- Get current month and date
    v_current_month := DATE_TRUNC('month', NOW());
    v_current_date := DATE_TRUNC('day', NOW());
    
    -- Get monthly usage for current month
    SELECT COALESCE(COUNT(*), 0)
    INTO v_monthly_usage
    FROM public.autopostvn_post_usage
    WHERE user_id = p_user_id
    AND DATE_TRUNC('month', created_at) = v_current_month
    AND status IN ('published', 'scheduled');
    
    -- Get daily usage for today
    SELECT COALESCE(COUNT(*), 0)
    INTO v_daily_usage
    FROM public.autopostvn_post_usage
    WHERE user_id = p_user_id
    AND DATE_TRUNC('day', created_at) = v_current_date
    AND status IN ('published', 'scheduled');
    
    -- Get limits for user role
    SELECT monthly_limit, daily_limit
    INTO v_monthly_limit, v_daily_limit
    FROM public.autopostvn_post_rate_limits
    WHERE user_role = p_user_role;
    
    -- If no limit found, default to free tier
    IF v_monthly_limit IS NULL THEN
        SELECT monthly_limit, daily_limit
        INTO v_monthly_limit, v_daily_limit
        FROM public.autopostvn_post_rate_limits
        WHERE user_role = 'free';
    END IF;
    
    -- Build result JSON
    v_result := json_build_object(
        'allowed', CASE 
            WHEN v_monthly_limit = -1 AND v_daily_limit = -1 THEN true
            WHEN v_monthly_limit = -1 THEN v_daily_usage < v_daily_limit
            WHEN v_daily_limit = -1 THEN v_monthly_usage < v_monthly_limit
            ELSE v_monthly_usage < v_monthly_limit AND v_daily_usage < v_daily_limit
        END,
        'monthly_usage', v_monthly_usage,
        'monthly_limit', v_monthly_limit,
        'daily_usage', v_daily_usage,
        'daily_limit', v_daily_limit,
        'user_role', p_user_role
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user post usage stats (enhanced)
CREATE OR REPLACE FUNCTION get_user_post_usage(
    p_user_id UUID,
    p_user_role VARCHAR(50) DEFAULT 'free'
)
RETURNS JSON AS $$
DECLARE
    v_monthly_usage INTEGER;
    v_monthly_limit INTEGER;
    v_daily_limit INTEGER;
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
    FROM public.autopostvn_post_usage
    WHERE user_id = p_user_id
    AND DATE_TRUNC('month', created_at) = v_current_month
    AND status IN ('published', 'scheduled');
    
    -- Get this week usage
    SELECT COALESCE(COUNT(*), 0)
    INTO v_this_week
    FROM public.autopostvn_post_usage
    WHERE user_id = p_user_id
    AND DATE_TRUNC('week', created_at) = DATE_TRUNC('week', NOW())
    AND status IN ('published', 'scheduled');
    
    -- Get today usage
    SELECT COALESCE(COUNT(*), 0)
    INTO v_today
    FROM public.autopostvn_post_usage
    WHERE user_id = p_user_id
    AND DATE_TRUNC('day', created_at) = DATE_TRUNC('day', NOW())
    AND status IN ('published', 'scheduled');
    
    -- Get limits
    SELECT monthly_limit, daily_limit
    INTO v_monthly_limit, v_daily_limit
    FROM public.autopostvn_post_rate_limits
    WHERE user_role = p_user_role;
    
    -- Default to free if not found
    IF v_monthly_limit IS NULL THEN
        SELECT monthly_limit, daily_limit
        INTO v_monthly_limit, v_daily_limit
        FROM public.autopostvn_post_rate_limits
        WHERE user_role = 'free';
    END IF;
    
    -- Build result
    v_result := json_build_object(
        'monthly_usage', v_monthly_usage,
        'monthly_limit', v_monthly_limit,
        'daily_usage', v_today,
        'daily_limit', v_daily_limit,
        'weekly_usage', v_this_week,
        'user_role', p_user_role,
        'allowed', CASE 
            WHEN v_monthly_limit = -1 AND v_daily_limit = -1 THEN true
            WHEN v_monthly_limit = -1 THEN v_today < v_daily_limit
            WHEN v_daily_limit = -1 THEN v_monthly_usage < v_monthly_limit
            ELSE v_monthly_usage < v_monthly_limit AND v_today < v_daily_limit
        END
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log post creation
CREATE OR REPLACE FUNCTION log_post_creation(
    p_user_id UUID,
    p_post_id UUID,
    p_platform VARCHAR(50),
    p_post_type VARCHAR(50) DEFAULT 'regular',
    p_content_preview TEXT DEFAULT NULL,
    p_media_count INTEGER DEFAULT 0,
    p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_usage_id UUID;
BEGIN
    INSERT INTO public.autopostvn_post_usage (
        user_id,
        post_id,
        platform,
        post_type,
        content_preview,
        media_count,
        scheduled_for,
        status
    ) VALUES (
        p_user_id,
        p_post_id,
        p_platform,
        p_post_type,
        p_content_preview,
        p_media_count,
        p_scheduled_for,
        CASE WHEN p_scheduled_for IS NOT NULL THEN 'scheduled' ELSE 'published' END
    ) RETURNING id INTO v_usage_id;
    
    RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.autopostvn_post_usage TO authenticated;
GRANT SELECT ON public.autopostvn_post_rate_limits TO authenticated;
GRANT EXECUTE ON FUNCTION check_post_rate_limit(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_post_usage(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION log_post_creation(UUID, UUID, VARCHAR, VARCHAR, TEXT, INTEGER, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Add RLS policies for post_usage
ALTER TABLE public.autopostvn_post_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own post usage
CREATE POLICY autopostvn_post_usage_user_policy ON public.autopostvn_post_usage
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Users can insert their own post usage
CREATE POLICY autopostvn_post_usage_insert_policy ON public.autopostvn_post_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add RLS for post_rate_limits (read-only for all authenticated users)
ALTER TABLE public.autopostvn_post_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY autopostvn_post_rate_limits_read_policy ON public.autopostvn_post_rate_limits
    FOR SELECT TO authenticated USING (true);

-- Comment on tables and functions
COMMENT ON TABLE public.autopostvn_post_usage IS 'Tracks user posts for rate limiting and analytics with autopostvn prefix';
COMMENT ON TABLE public.autopostvn_post_rate_limits IS 'Defines post limits per user role (free, professional, enterprise) with autopostvn prefix';
COMMENT ON FUNCTION check_post_rate_limit IS 'Checks if user can create a new post based on their role and current usage (includes daily limits)';
COMMENT ON FUNCTION get_user_post_usage IS 'Returns comprehensive post usage statistics for a user';
COMMENT ON FUNCTION log_post_creation IS 'Logs a new post creation for usage tracking';
