-- Check current database function definition
-- Run this in Supabase SQL Editor to see the current function

SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'check_ai_rate_limit';

-- Or check function source directly
\df+ check_ai_rate_limit
