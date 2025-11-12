# Run all migrations in order
Write-Host "🔄 Running migrations..." -ForegroundColor Cyan

$migrations = @(
    "migrations/001_user_management.sql",
    "migrations/002_ai_usage_tracking.sql",
    "migrations/003_post_limits_tracking.sql",
    "migrations/004_add_phone_field.sql",
    "migrations/005_update_ai_limits.sql",
    "migrations/006_fix_ai_rate_limit_function.sql",
    "migrations/007_optimize_ai_limits.sql",
    "migrations/008_add_system_activity_logs.sql",
    "migrations/009_add_workspace_settings.sql",
    "migrations/create-media-table.sql",
    "migrations/add-media-lifecycle.sql",
    "migrations/add-media-columns.sql",
    "migrations/add-user-role-column.sql"
)

$failed = @()

foreach ($migration in $migrations) {
    if (Test-Path $migration) {
        Write-Host "▶ Running: $migration" -ForegroundColor Yellow
        
        $result = Get-Content $migration | docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Success" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Failed" -ForegroundColor Red
            $failed += $migration
        }
    } else {
        Write-Host "  ⚠️  File not found: $migration" -ForegroundColor Yellow
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
if ($failed.Count -eq 0) {
    Write-Host "✅ All migrations completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed migrations:" -ForegroundColor Red
    foreach ($f in $failed) {
        Write-Host "  - $f" -ForegroundColor Red
    }
}
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
