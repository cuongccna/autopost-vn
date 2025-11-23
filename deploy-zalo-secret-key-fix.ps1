#!/usr/bin/env pwsh

# Deploy Zalo secret_key fix to VPS
Write-Host "🚀 Deploying Zalo secret_key fix to VPS..." -ForegroundColor Cyan

# Step 1: Upload the fixed callback route
Write-Host "`n📤 Step 1/4: Uploading fixed Zalo callback route..." -ForegroundColor Yellow
scp src/app/api/oauth/zalo/callback/route.ts root@autopostvn.cloud:/var/www/autopost-vn/src/app/api/oauth/zalo/callback/route.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload file" -ForegroundColor Red
    exit 1
}
Write-Host "✅ File uploaded successfully" -ForegroundColor Green

# Step 2: Build on VPS
Write-Host "`n🔨 Step 2/4: Building on VPS..." -ForegroundColor Yellow
ssh root@autopostvn.cloud "cd /var/www/autopost-vn && npm run build"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed on VPS" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green

# Step 3: Restart PM2
Write-Host "`n♻️ Step 3/4: Restarting PM2 application..." -ForegroundColor Yellow
ssh root@autopostvn.cloud "pm2 restart autopost-vn --update-env"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ PM2 restart encountered issues" -ForegroundColor Yellow
}
Write-Host "✅ PM2 restarted" -ForegroundColor Green

# Step 4: Show logs
Write-Host "`n📋 Step 4/4: Monitoring logs for Zalo activity..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Gray
Write-Host ""
ssh root@autopostvn.cloud "pm2 logs autopost-vn --lines 30 | grep -i zalo"

Write-Host "`n✨ Deployment complete!" -ForegroundColor Green
Write-Host "🔗 Test Zalo OAuth at: https://autopostvn.cloud/settings" -ForegroundColor Cyan
