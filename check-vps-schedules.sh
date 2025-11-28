#!/bin/bash
psql -d autopost_db -c "
SELECT 
  ps.id, 
  ps.status, 
  ps.scheduled_at AT TIME ZONE 'Asia/Ho_Chi_Minh' as vn_time, 
  LEFT(p.title, 40) as title, 
  sa.provider 
FROM autopostvn_post_schedules ps 
JOIN autopostvn_posts p ON p.id = ps.post_id 
JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id 
WHERE DATE(ps.scheduled_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = '2025-11-28' 
ORDER BY ps.scheduled_at;
"

echo ""
echo "=== Current time ==="
psql -d autopost_db -c "SELECT NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' as vn_now;"

echo ""
echo "=== Overdue pending schedules ==="
psql -d autopost_db -c "SELECT COUNT(*) FROM autopostvn_post_schedules WHERE status = 'pending' AND scheduled_at <= NOW();"

echo ""
echo "=== Recent schedules (all dates) ==="
psql -d autopost_db -c "
SELECT 
  ps.status,
  ps.scheduled_at AT TIME ZONE 'Asia/Ho_Chi_Minh' as vn_time, 
  LEFT(p.title, 35) as title, 
  sa.provider
FROM autopostvn_post_schedules ps 
JOIN autopostvn_posts p ON p.id = ps.post_id 
JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id 
ORDER BY ps.scheduled_at DESC 
LIMIT 20;
"
