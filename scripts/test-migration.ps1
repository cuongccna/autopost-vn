# Test Migration Setup
# Verify PostgreSQL connection and basic operations

Write-Host "🧪 Testing PostgreSQL Migration..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

$failed = $false

# Test 1: Docker Running
Write-Host "1️⃣  Checking Docker..." -ForegroundColor Yellow
$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Docker is not running!" -ForegroundColor Red
    $failed = $true
} else {
    Write-Host "   ✅ Docker is running" -ForegroundColor Green
}

# Test 2: PostgreSQL Container
Write-Host "`n2️⃣  Checking PostgreSQL container..." -ForegroundColor Yellow
$pgContainer = docker ps --filter "name=autopost-vn-postgres" --format "{{.Names}}"
if ($pgContainer -eq "autopost-vn-postgres") {
    Write-Host "   ✅ PostgreSQL container is running" -ForegroundColor Green
    
    # Check health
    $health = docker inspect --format='{{.State.Health.Status}}' autopost-vn-postgres 2>$null
    if ($health -eq "healthy") {
        Write-Host "   ✅ PostgreSQL is healthy" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  PostgreSQL health: $health" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ PostgreSQL container not running!" -ForegroundColor Red
    Write-Host "   Run: .\scripts\setup-postgres.ps1" -ForegroundColor Cyan
    $failed = $true
}

# Test 3: Database Connection
Write-Host "`n3️⃣  Testing database connection..." -ForegroundColor Yellow
$testQuery = "SELECT version();"
$result = $testQuery | docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn -t 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Database connection successful" -ForegroundColor Green
    Write-Host "   PostgreSQL: $($result.Trim())" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Cannot connect to database!" -ForegroundColor Red
    $failed = $true
}

# Test 4: Check Tables
Write-Host "`n4️⃣  Checking database tables..." -ForegroundColor Yellow
$tableQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'autopostvn_%';"
$tableCount = $tableQuery | docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn -t 2>&1

if ($LASTEXITCODE -eq 0) {
    $count = $tableCount.Trim()
    if ([int]$count -gt 0) {
        Write-Host "   ✅ Found $count AutoPostVN tables" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  No AutoPostVN tables found" -ForegroundColor Yellow
        Write-Host "   Run: .\scripts\run-migrations.ps1" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ❌ Cannot query tables!" -ForegroundColor Red
    $failed = $true
}

# Test 5: Test Query
Write-Host "`n5️⃣  Testing sample query..." -ForegroundColor Yellow
$sampleQuery = "SELECT COUNT(*) FROM autopostvn_workspaces;"
$workspaceCount = $sampleQuery | docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn -t 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Query successful - Workspaces: $($workspaceCount.Trim())" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Table might not exist yet" -ForegroundColor Yellow
}

# Test 6: pgAdmin
Write-Host "`n6️⃣  Checking pgAdmin..." -ForegroundColor Yellow
$pgAdminContainer = docker ps --filter "name=autopost-vn-pgadmin" --format "{{.Names}}"
if ($pgAdminContainer -eq "autopost-vn-pgadmin") {
    Write-Host "   ✅ pgAdmin is running" -ForegroundColor Green
    Write-Host "   URL: http://localhost:5050" -ForegroundColor Cyan
} else {
    Write-Host "   ⚠️  pgAdmin not running" -ForegroundColor Yellow
}

# Test 7: Environment Variables
Write-Host "`n7️⃣  Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "POSTGRES_HOST") {
        Write-Host "   ✅ .env.local has PostgreSQL config" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  .env.local missing PostgreSQL config" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ .env.local not found!" -ForegroundColor Red
    $failed = $true
}

# Test 8: Node Dependencies
Write-Host "`n8️⃣  Checking Node.js dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules/pg") {
    Write-Host "   ✅ pg package installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  pg package not installed" -ForegroundColor Yellow
    Write-Host "   Run: npm install" -ForegroundColor Cyan
}

# Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
if ($failed) {
    Write-Host "❌ Some tests failed! Please fix issues above." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ All tests passed! Migration setup is ready." -ForegroundColor Green
    Write-Host "`nYou can now:" -ForegroundColor Cyan
    Write-Host "  - Access pgAdmin: http://localhost:5050" -ForegroundColor White
    Write-Host "  - Start app: npm run dev" -ForegroundColor White
    Write-Host "  - View docs: MIGRATION-SUMMARY.md" -ForegroundColor White
}
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
