-- Add user_role column to autopostvn_users if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'autopostvn_users' 
        AND column_name = 'user_role'
    ) THEN
        ALTER TABLE public.autopostvn_users 
        ADD COLUMN user_role VARCHAR(20) DEFAULT 'free' NOT NULL;
        
        -- Add check constraint
        ALTER TABLE public.autopostvn_users
        ADD CONSTRAINT check_user_role 
        CHECK (user_role IN ('free', 'professional', 'enterprise'));
        
        RAISE NOTICE 'Added user_role column to autopostvn_users';
    ELSE
        RAISE NOTICE 'user_role column already exists in autopostvn_users';
    END IF;
END $$;

-- Create index on user_role for faster queries
CREATE INDEX IF NOT EXISTS idx_autopostvn_users_user_role 
ON public.autopostvn_users(user_role);

-- Update existing users to 'free' if NULL (shouldn't happen with default, but just in case)
UPDATE public.autopostvn_users 
SET user_role = 'free' 
WHERE user_role IS NULL;
