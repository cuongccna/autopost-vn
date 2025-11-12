-- Add missing authentication columns to users table

ALTER TABLE autopostvn_users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster auth lookups
CREATE INDEX IF NOT EXISTS idx_autopostvn_users_email_verified 
ON autopostvn_users(email, email_verified);

-- Verify
\d autopostvn_users
