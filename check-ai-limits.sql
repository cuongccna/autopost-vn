-- Kiểm tra dữ liệu user hiện tại
SELECT id, email, user_role FROM autopostvn_users ORDER BY created_at DESC LIMIT 5;

-- Kiểm tra AI rate limits table (tên bảng đúng)
SELECT * FROM autopostvn_ai_rate_limits ORDER BY user_role;

-- Kiểm tra AI usage logs cho user gần đây nhất
SELECT 
  u.email,
  u.user_role,
  DATE(l.request_date) as date,
  COUNT(*) as usage_count
FROM autopostvn_users u
LEFT JOIN autopostvn_ai_usage l ON u.id = l.user_id
WHERE l.request_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY u.email, u.user_role, DATE(l.request_date)
ORDER BY u.email, date DESC;

-- Test function check_ai_rate_limit cho user professional
-- Thay USER_ID_HERE bằng ID thật của user professional
SELECT check_ai_rate_limit('55853823-2861-4d98-9105-4dab4b65b998', 'professional');
