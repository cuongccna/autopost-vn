# Setup PostgreSQL Local with Docker
# Run this script to start PostgreSQL and pgAdmin

Write-Host "Setting up PostgreSQL..." -ForegroundColor Cyan

# Check if Docker is running
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "Docker not found! Please install Docker Desktop" -ForegroundColor Red
    exit 1
}

# Check if Docker is running
$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker is not running! Please start Docker Desktop" -ForegroundColor Red
    exit 1
}

Write-Host "Docker is running" -ForegroundColor Green

# Stop existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Start PostgreSQL and pgAdmin
Write-Host "Starting PostgreSQL and pgAdmin..." -ForegroundColor Cyan
docker-compose up -d

# Wait for PostgreSQL to be ready
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if PostgreSQL is healthy
$pgHealth = docker inspect --format='{{.State.Health.Status}}' autopost-vn-postgres 2>$null
if ($pgHealth -eq "healthy") {
    Write-Host "PostgreSQL is healthy!" -ForegroundColor Green
} else {
    Write-Host "PostgreSQL may not be ready yet, check logs:" -ForegroundColor Yellow
    Write-Host "   docker-compose logs postgres" -ForegroundColor Cyan
}

# Show connection info
Write-Host ""
Write-Host "Connection Information:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Gray
Write-Host "PostgreSQL:" -ForegroundColor Green
Write-Host "  Host:     localhost" -ForegroundColor White
Write-Host "  Port:     5432" -ForegroundColor White
Write-Host "  Database: autopost_vn" -ForegroundColor White
Write-Host "  User:     autopost_admin" -ForegroundColor White
Write-Host "  Password: autopost_vn_secure_2025" -ForegroundColor White
Write-Host ""
Write-Host "pgAdmin:" -ForegroundColor Green
Write-Host "  URL:      http://localhost:5050" -ForegroundColor White
Write-Host "  Email:    admin@autopostvn.local" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Gray

Write-Host ""
Write-Host "Setup completed!" -ForegroundColor Green
Write-Host "Run migrations with: .\scripts\run-migrations.ps1" -ForegroundColor Cyan
