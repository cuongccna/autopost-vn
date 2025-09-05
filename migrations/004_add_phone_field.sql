-- Add phone field to autopostvn_users table
-- Created: 2025-09-05

-- Add phone column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'autopostvn_users' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.autopostvn_users 
        ADD COLUMN phone VARCHAR(20);
    END IF;
END $$;

-- Add index for phone if needed
CREATE INDEX IF NOT EXISTS idx_autopostvn_users_phone ON public.autopostvn_users(phone);

-- Update the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for autopostvn_users updated_at
DROP TRIGGER IF EXISTS update_autopostvn_users_updated_at ON public.autopostvn_users;
CREATE TRIGGER update_autopostvn_users_updated_at
    BEFORE UPDATE ON public.autopostvn_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
