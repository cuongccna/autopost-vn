# Migration Guide - Quick Start
# Cách chạy migration từ Supabase sang PostgreSQL Local

Write-Host "🚀 AutoPost VN - Database Migration to PostgreSQL Local" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# Step 1: Setup PostgreSQL
Write-Host "📦 Step 1: Setup PostgreSQL with Docker" -ForegroundColor Yellow
Write-Host "Run: .\scripts\setup-postgres.ps1`n" -ForegroundColor White

# Step 2: Run migrations
Write-Host "📦 Step 2: Run database migrations" -ForegroundColor Yellow
Write-Host "Run: .\scripts\run-migrations.ps1`n" -ForegroundColor White

# Step 3: Update environment
Write-Host "📦 Step 3: Update .env.local" -ForegroundColor Yellow
Write-Host "PostgreSQL config has been added to .env.local" -ForegroundColor Green
Write-Host "Make sure these values are correct:" -ForegroundColor White
Write-Host "  POSTGRES_HOST=localhost" -ForegroundColor Gray
Write-Host "  POSTGRES_PORT=5432" -ForegroundColor Gray
Write-Host "  POSTGRES_DATABASE=autopost_vn" -ForegroundColor Gray
Write-Host "  POSTGRES_USER=autopost_admin" -ForegroundColor Gray
Write-Host "  POSTGRES_PASSWORD=autopost_vn_secure_2025`n" -ForegroundColor Gray

# Step 4: Test migration
Write-Host "📦 Step 4: Test the migration" -ForegroundColor Yellow
Write-Host "Run: npm run dev" -ForegroundColor White
Write-Host "Check if app connects to PostgreSQL successfully`n" -ForegroundColor Green

# Architecture Overview
Write-Host "`n📊 Migration Architecture:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Old: Supabase Client → Supabase Cloud" -ForegroundColor Red
Write-Host "     └─ Storage: Supabase Storage" -ForegroundColor Red
Write-Host ""
Write-Host "New: PostgreSQL Client → PostgreSQL Local (Docker)" -ForegroundColor Green
Write-Host "     └─ Storage: Local Filesystem (./public/uploads)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

# Files Created/Modified
Write-Host "✅ Files Created:" -ForegroundColor Green
Write-Host "  - docker-compose.yml (PostgreSQL + pgAdmin)" -ForegroundColor White
Write-Host "  - src/lib/db/postgres.ts (PostgreSQL client)" -ForegroundColor White
Write-Host "  - src/lib/db/supabase-compat.ts (Compatibility layer)" -ForegroundColor White
Write-Host "  - src/lib/storage/local.ts (Local file storage)" -ForegroundColor White
Write-Host "  - scripts/setup-postgres.ps1" -ForegroundColor White
Write-Host "  - scripts/run-migrations.ps1" -ForegroundColor White
Write-Host "  - .env.local (updated with PostgreSQL config)`n" -ForegroundColor White

Write-Host "✅ Services Migrated:" -ForegroundColor Green
Write-Host "  - UserManagementService (uses db from supabase-compat)" -ForegroundColor White
Write-Host "  - Other services will use same pattern`n" -ForegroundColor White

# Next Steps
Write-Host "📌 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run .\scripts\setup-postgres.ps1 to start PostgreSQL" -ForegroundColor White
Write-Host "2. Run .\scripts\run-migrations.ps1 to setup schema" -ForegroundColor White
Write-Host "3. Run npm run dev to test the app" -ForegroundColor White
Write-Host "4. Access pgAdmin at http://localhost:5050 (admin@autopostvn.local / admin123)" -ForegroundColor White
Write-Host "5. Check database at localhost:5432 (autopost_admin / autopost_vn_secure_2025)`n" -ForegroundColor White

Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "- Use pgAdmin to browse database: http://localhost:5050" -ForegroundColor White
Write-Host "- Check Docker logs: docker-compose logs -f postgres" -ForegroundColor White
Write-Host "- Stop PostgreSQL: docker-compose down" -ForegroundColor White
Write-Host "- Backup database: docker exec autopost-vn-postgres pg_dump -U autopost_admin autopost_vn > backup.sql`n" -ForegroundColor White

Write-Host "✨ Migration setup completed! Ready to run." -ForegroundColor Green
