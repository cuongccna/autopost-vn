#!/usr/bin/env pwsh

Write-Host "Checking AI-generated scheduled posts..." -ForegroundColor Cyan

ssh root@autopostvn.cloud @"
psql -U autopostvn_user -d autopostvn -c "SELECT title, providers, TO_CHAR(scheduled_at, 'YYYY-MM-DD HH24:MI') as scheduled_time FROM autopostvn_scheduled_posts WHERE metadata->>'ai_generated' = 'true' ORDER BY scheduled_at LIMIT 15;"
"@

Write-Host "Check complete!" -ForegroundColor Green
