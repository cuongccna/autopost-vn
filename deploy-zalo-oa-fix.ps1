$VPS_IP = "72.61.114.103"
$VPS_USER = "root"
$VPS_DIR = "/var/www/autopost-vn"

Write-Host "🚀 Deploying Zalo OA Fix to VPS ($VPS_IP)..." -ForegroundColor Cyan

# Upload files
Write-Host "📤 Uploading src/app/api/oauth/zalo/callback/route.ts..."
scp "src/app/api/oauth/zalo/callback/route.ts" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/src/app/api/oauth/zalo/callback/route.ts"

Write-Host "📤 Uploading src/lib/social-publishers.ts..."
scp "src/lib/social-publishers.ts" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/src/lib/social-publishers.ts"

# Restart service
Write-Host "🔄 Restarting service on VPS..."
ssh "${VPS_USER}@${VPS_IP}" "cd ${VPS_DIR} && pm2 restart autopostvn"

Write-Host "✅ Deployment complete!" -ForegroundColor Green
