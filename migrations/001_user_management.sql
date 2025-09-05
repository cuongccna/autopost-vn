-- Migration: User Management & Multi-tenancy Support
-- Created: 2025-01-XX
-- Purpose: Add user workspaces and social accounts management

-- 1. User Workspaces Table
CREATE TABLE IF NOT EXISTS autopostvn_user_workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    workspace_name VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster user lookup
CREATE INDEX IF NOT EXISTS idx_user_workspaces_email ON autopostvn_user_workspaces(user_email);

-- 2. User Social Accounts Table
CREATE TABLE IF NOT EXISTS autopostvn_user_social_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    workspace_id UUID NOT NULL REFERENCES autopostvn_user_workspaces(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('facebook', 'instagram', 'zalo')),
    account_name VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    account_data JSONB DEFAULT '{}' NOT NULL,
    status VARCHAR(50) DEFAULT 'connected' CHECK (status IN ('connected', 'expired', 'error')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one account per provider per user
    UNIQUE(user_email, provider, provider_account_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_email ON autopostvn_user_social_accounts(user_email);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_workspace ON autopostvn_user_social_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_provider ON autopostvn_user_social_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_status ON autopostvn_user_social_accounts(status);

-- 3. Update Posts Table to link with user accounts
-- Add account_id column to existing posts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'autopostvn_posts' 
        AND column_name = 'account_id'
    ) THEN
        ALTER TABLE autopostvn_posts 
        ADD COLUMN account_id UUID REFERENCES autopostvn_user_social_accounts(id) ON DELETE CASCADE;
        
        -- Create index for account_id
        CREATE INDEX idx_posts_account_id ON autopostvn_posts(account_id);
    END IF;
END $$;

-- 4. User Posts View (for easy querying)
CREATE OR REPLACE VIEW autopostvn_user_posts AS
SELECT 
    p.*,
    usa.user_email,
    usa.provider,
    usa.account_name,
    uw.workspace_name
FROM autopostvn_posts p
JOIN autopostvn_user_social_accounts usa ON p.account_id = usa.id
JOIN autopostvn_user_workspaces uw ON usa.workspace_id = uw.id;

-- 5. OAuth Sessions Table (for handling OAuth flow state)
CREATE TABLE IF NOT EXISTS autopostvn_oauth_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    state_token VARCHAR(255) NOT NULL UNIQUE,
    redirect_uri TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes') NOT NULL
);

-- Index for OAuth session lookup
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_state ON autopostvn_oauth_sessions(state_token);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_expires ON autopostvn_oauth_sessions(expires_at);

-- 6. Auto-cleanup expired OAuth sessions
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM autopostvn_oauth_sessions 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 7. Update trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_user_workspaces_updated_at
    BEFORE UPDATE ON autopostvn_user_workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_social_accounts_updated_at
    BEFORE UPDATE ON autopostvn_user_social_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Row Level Security (RLS) Policies
ALTER TABLE autopostvn_user_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopostvn_user_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopostvn_oauth_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own workspace
CREATE POLICY user_workspace_policy ON autopostvn_user_workspaces
    FOR ALL USING (user_email = current_setting('app.current_user_email', true));

-- Policy: Users can only access their own social accounts
CREATE POLICY user_social_accounts_policy ON autopostvn_user_social_accounts
    FOR ALL USING (user_email = current_setting('app.current_user_email', true));

-- Policy: Users can only access their own OAuth sessions
CREATE POLICY user_oauth_sessions_policy ON autopostvn_oauth_sessions
    FOR ALL USING (user_email = current_setting('app.current_user_email', true));

-- 9. Example data migration (optional - for testing)
-- This would migrate existing accounts to the new structure
/*
INSERT INTO autopostvn_user_workspaces (user_email, workspace_name, settings)
SELECT DISTINCT 
    'demo@example.com',
    'Demo Workspace',
    '{"default_timezone": "Asia/Ho_Chi_Minh", "auto_post": true}'
WHERE NOT EXISTS (
    SELECT 1 FROM autopostvn_user_workspaces WHERE user_email = 'demo@example.com'
);
*/

-- 10. Grant permissions for application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON autopostvn_user_workspaces TO anon, authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON autopostvn_user_social_accounts TO anon, authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON autopostvn_oauth_sessions TO anon, authenticated;

COMMENT ON TABLE autopostvn_user_workspaces IS 'User workspaces for multi-tenant support';
COMMENT ON TABLE autopostvn_user_social_accounts IS 'OAuth-connected social media accounts per user';
COMMENT ON TABLE autopostvn_oauth_sessions IS 'Temporary sessions for OAuth flow state management';
COMMENT ON VIEW autopostvn_user_posts IS 'User posts with account information for easy querying';
