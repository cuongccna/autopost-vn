-- Check the provider constraint in autopostvn_social_accounts table
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname LIKE '%provider%'
AND conrelid = 'public.autopostvn_social_accounts'::regclass;

-- Also check what providers are currently allowed
SELECT DISTINCT provider 
FROM public.autopostvn_social_accounts;

