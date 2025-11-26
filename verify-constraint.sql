SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'autopostvn_post_schedules_status_check';
