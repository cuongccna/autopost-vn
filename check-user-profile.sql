-- Check user profile columns and data
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'autopostvn_users'
ORDER BY 
  ordinal_position;

-- Check user data
SELECT 
  id,
  email,
  full_name,
  phone,
  avatar_url,
  role,
  created_at,
  updated_at
FROM 
  autopostvn_users
ORDER BY 
  created_at DESC
LIMIT 5;
