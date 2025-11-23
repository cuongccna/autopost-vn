# Deploy Zalo OAuth Fix to VPS
Write-Host "🚀 Deploying Zalo OAuth fix to VPS..." -ForegroundColor Cyan

$VPS_HOST = "autopostvn.cloud"
$VPS_USER = "root"
$VPS_DIR = "/var/www/autopost-vn"

# Upload fixed file
Write-Host "📤 Uploading OAuth provider route..." -ForegroundColor Yellow
scp "src/app/api/oauth/[provider]/route.ts" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/src/app/api/oauth/[provider]/"

# SSH and rebuild
Write-Host "🔨 Building on VPS..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_HOST}" @"
cd ${VPS_DIR}

echo '📦 Building...'
npm run build

echo '🔄 Restarting PM2...'
pm2 restart autopost-vn --update-env

echo '✅ Done! Checking status...'
pm2 status autopost-vn

echo ''
echo '📝 Recent logs:'
pm2 logs autopost-vn --lines 30 --nostream
"@

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`n🧪 Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://autopostvn.cloud/settings"
Write-Host "2. Click 'Connect Zalo' or add account button"
Write-Host "3. Should work now with correct environment variables"
Write-Host "`n📊 Monitor logs: ssh root@autopostvn.cloud 'pm2 logs autopost-vn'"
