-- Add phone column to autopostvn_users table
-- Run this on Supabase SQL Editor

-- Add phone column if not exists
ALTER TABLE public.autopostvn_users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_autopostvn_users_phone 
ON public.autopostvn_users(phone);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'autopostvn_users' 
  AND column_name = 'phone';
