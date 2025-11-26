-- Add 'scheduled' and 'processing' to the allowed statuses
ALTER TABLE autopostvn_post_schedules DROP CONSTRAINT autopostvn_post_schedules_status_check;

ALTER TABLE autopostvn_post_schedules ADD CONSTRAINT autopostvn_post_schedules_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'scheduled'::text, 'processing'::text, 'publishing'::text, 'published'::text, 'failed'::text, 'cancelled'::text]));
