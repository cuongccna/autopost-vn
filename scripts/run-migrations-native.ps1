# Run migrations for PostgreSQL Native installation
Write-Host "Running migrations on native PostgreSQL..." -ForegroundColor Cyan

# Check if psql is available
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
    Write-Host "psql not found! Add PostgreSQL to PATH:" -ForegroundColor Red
    Write-Host '  $env:Path += ";C:\Program Files\PostgreSQL\15\bin"' -ForegroundColor Yellow
    exit 1
}

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
        Write-Host "Running: $migration" -ForegroundColor Yellow
        
        psql -U autopost_admin -d autopost_vn -f $migration 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Success" -ForegroundColor Green
        } else {
            Write-Host "  Failed" -ForegroundColor Red
            $failed += $migration
        }
    } else {
        Write-Host "  File not found: $migration" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Gray
if ($failed.Count -eq 0) {
    Write-Host "All migrations completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed migrations:" -ForegroundColor Red
    foreach ($f in $failed) {
        Write-Host "  - $f" -ForegroundColor Red
    }
}
Write-Host "=====================================" -ForegroundColor Gray
