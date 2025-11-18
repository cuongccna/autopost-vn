#!/bin/bash

# Deploy Facebook Video Fix to VPS
# This script uploads the fixed scheduler-optimized.ts to VPS and rebuilds

echo "🚀 Deploying Facebook video fix to VPS..."

VPS_HOST="autopostvn.cloud"
VPS_USER="root"
VPS_DIR="/var/www/autopost-vn"

# Upload the fixed file
echo "📤 Uploading scheduler-optimized.ts..."
scp src/lib/scheduler-optimized.ts ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/src/lib/

echo "🔨 Building on VPS..."
ssh ${VPS_USER}@${VPS_HOST} << 'EOF'
cd /var/www/autopost-vn

# Build
npm run build

# Restart PM2
pm2 restart autopost-vn

# Show logs
echo "📊 PM2 Status:"
pm2 status autopost-vn

echo "📝 Last 20 log lines:"
pm2 logs autopost-vn --lines 20 --nostream
EOF

echo "✅ Deployment complete!"
echo ""
echo "🧪 To test Facebook video posting:"
echo "1. Login to https://autopostvn.cloud"
echo "2. Schedule a video post to Facebook"
echo "3. Check logs: ssh root@autopostvn.cloud 'pm2 logs autopost-vn'"
echo "4. Look for: '🎥 Auto-detected media type: video'"
echo "5. Verify video uploads to /videos endpoint (not /photos)"
