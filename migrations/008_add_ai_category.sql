-- Add 'ai' to action_category check constraint
-- This fixes: new row violates check constraint "autopostvn_system_activity_logs_action_category_check"

ALTER TABLE public.autopostvn_system_activity_logs 
DROP CONSTRAINT IF EXISTS autopostvn_system_activity_logs_action_category_check;

ALTER TABLE public.autopostvn_system_activity_logs 
ADD CONSTRAINT autopostvn_system_activity_logs_action_category_check 
CHECK (action_category = ANY (ARRAY['auth'::text, 'post'::text, 'account'::text, 'workspace'::text, 'admin'::text, 'api'::text, 'ai'::text]));
