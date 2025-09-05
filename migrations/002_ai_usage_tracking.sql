-- AI Usage Tracking Migration
-- Created: 2025-09-05

-- Table để track AI usage của users
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL, -- 'caption', 'hashtags', 'script', 'optimal_times'
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tokens_used INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes để tối ưu query
CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, request_date);
CREATE INDEX idx_ai_usage_user_month ON ai_usage(user_id, DATE_TRUNC('month', request_date));
CREATE INDEX idx_ai_usage_type ON ai_usage(request_type);

-- Table để lưu rate limits theo role
CREATE TABLE ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_role VARCHAR(20) NOT NULL UNIQUE, -- 'free', 'professional', 'enterprise'
  daily_limit INTEGER NOT NULL,
  monthly_limit INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default rate limits
INSERT INTO ai_rate_limits (user_role, daily_limit, monthly_limit) VALUES
('free', 2, 60),
('professional', 20, 600),
('enterprise', -1, -1); -- -1 means unlimited

-- Function để kiểm tra và update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers cho updated_at
CREATE TRIGGER update_ai_usage_updated_at BEFORE UPDATE ON ai_usage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_rate_limits_updated_at BEFORE UPDATE ON ai_rate_limits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function để lấy usage count
CREATE OR REPLACE FUNCTION get_user_ai_usage(
    p_user_id UUID,
    p_period VARCHAR(10) -- 'daily' hoặc 'monthly'
)
RETURNS INTEGER AS $$
DECLARE
    usage_count INTEGER;
BEGIN
    IF p_period = 'daily' THEN
        SELECT COUNT(*) INTO usage_count
        FROM ai_usage
        WHERE user_id = p_user_id 
        AND request_date = CURRENT_DATE
        AND success = TRUE;
    ELSIF p_period = 'monthly' THEN
        SELECT COUNT(*) INTO usage_count
        FROM ai_usage
        WHERE user_id = p_user_id 
        AND DATE_TRUNC('month', request_date) = DATE_TRUNC('month', CURRENT_DATE)
        AND success = TRUE;
    ELSE
        usage_count := 0;
    END IF;
    
    RETURN COALESCE(usage_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function để check rate limit
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
    -- Get rate limits for user role
    SELECT rl.daily_limit, rl.monthly_limit 
    INTO daily_limit, monthly_limit
    FROM ai_rate_limits rl
    WHERE rl.user_role = p_user_role;
    
    -- If no limits found, default to free tier
    IF daily_limit IS NULL THEN
        SELECT rl.daily_limit, rl.monthly_limit 
        INTO daily_limit, monthly_limit
        FROM ai_rate_limits rl
        WHERE rl.user_role = 'free';
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
