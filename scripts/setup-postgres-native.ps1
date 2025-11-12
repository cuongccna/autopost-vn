# Setup PostgreSQL Native on Windows
# Alternative to Docker setup

Write-Host "PostgreSQL Native Setup Guide" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Gray

Write-Host ""
Write-Host "Step 1: Download PostgreSQL" -ForegroundColor Yellow
Write-Host "Visit: https://www.postgresql.org/download/windows/" -ForegroundColor White
Write-Host "Download PostgreSQL 15 installer" -ForegroundColor White

Write-Host ""
Write-Host "Step 2: Install PostgreSQL" -ForegroundColor Yellow
Write-Host "During installation:" -ForegroundColor White
Write-Host "  - Port: 5432" -ForegroundColor Gray
Write-Host "  - Password: autopost_vn_secure_2025" -ForegroundColor Gray
Write-Host "  - Locale: Default" -ForegroundColor Gray

Write-Host ""
Write-Host "Step 3: Create Database" -ForegroundColor Yellow
Write-Host "Run these commands in PowerShell:" -ForegroundColor White
Write-Host ""
Write-Host '  # Add psql to PATH (adjust path if needed)' -ForegroundColor Gray
Write-Host '  $env:Path += ";C:\Program Files\PostgreSQL\15\bin"' -ForegroundColor Cyan
Write-Host ""
Write-Host "  # Connect to PostgreSQL" -ForegroundColor Gray
Write-Host "  psql -U postgres" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # In psql, run these SQL commands:" -ForegroundColor Gray
Write-Host "  CREATE DATABASE autopost_vn WITH ENCODING 'UTF8';" -ForegroundColor Cyan
Write-Host "  CREATE USER autopost_admin WITH PASSWORD 'autopost_vn_secure_2025';" -ForegroundColor Cyan
Write-Host "  GRANT ALL PRIVILEGES ON DATABASE autopost_vn TO autopost_admin;" -ForegroundColor Cyan
Write-Host "  \q" -ForegroundColor Cyan

Write-Host ""
Write-Host "Step 4: Import Schema" -ForegroundColor Yellow
Write-Host "  psql -U autopost_admin -d autopost_vn -f supabase\schema.sql" -ForegroundColor Cyan

Write-Host ""
Write-Host "Step 5: Run Migrations" -ForegroundColor Yellow
Write-Host "  .\scripts\run-migrations-native.ps1" -ForegroundColor Cyan

Write-Host ""
Write-Host "Step 6: Update .env.local" -ForegroundColor Yellow
Write-Host "Make sure these are set:" -ForegroundColor White
Write-Host "  POSTGRES_HOST=localhost" -ForegroundColor Gray
Write-Host "  POSTGRES_PORT=5432" -ForegroundColor Gray
Write-Host "  POSTGRES_DATABASE=autopost_vn" -ForegroundColor Gray
Write-Host "  POSTGRES_USER=autopost_admin" -ForegroundColor Gray
Write-Host "  POSTGRES_PASSWORD=autopost_vn_secure_2025" -ForegroundColor Gray

Write-Host ""
Write-Host "=====================================" -ForegroundColor Gray
Write-Host "For Docker setup (easier), install Docker Desktop first" -ForegroundColor Yellow
Write-Host "Then run: .\scripts\setup-postgres.ps1" -ForegroundColor Cyan
