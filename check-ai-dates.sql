SELECT 
    u.email,
    LEFT(p.title, 25) as title,
    DATE(p.scheduled_at AT TIME ZONE 'Asia/Ho_Chi_Minh') as local_date,
    (p.scheduled_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::time as local_time,
    p.metadata->>'ai_generated' as ai
FROM autopostvn_posts p
JOIN autopostvn_users u ON p.user_id = u.id
WHERE p.scheduled_at IS NOT NULL
ORDER BY p.scheduled_at DESC
LIMIT 20;
