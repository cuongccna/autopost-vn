#!/bin/bash

echo "🔍 Checking NGINX configuration for static uploads..."
echo ""

# Check if NGINX config exists
if [ -f /etc/nginx/sites-available/autopostvn.cloud ]; then
    echo "✅ Found NGINX config: /etc/nginx/sites-available/autopostvn.cloud"
    echo ""
    echo "Current configuration:"
    cat /etc/nginx/sites-available/autopostvn.cloud
else
    echo "❌ NGINX config not found at /etc/nginx/sites-available/autopostvn.cloud"
    echo ""
    echo "Checking default config..."
    if [ -f /etc/nginx/sites-available/default ]; then
        cat /etc/nginx/sites-available/default
    fi
fi

echo ""
echo "================================"
echo ""

# Check if uploads directory exists
if [ -d /var/www/autopost-vn/public/uploads ]; then
    echo "✅ Uploads directory exists"
    echo ""
    echo "Files in uploads:"
    ls -lah /var/www/autopost-vn/public/uploads/
    echo ""
    echo "Recent images:"
    find /var/www/autopost-vn/public/uploads/images -type f -mtime -1 2>/dev/null | head -5
else
    echo "❌ Uploads directory not found at /var/www/autopost-vn/public/uploads"
fi

echo ""
echo "================================"
echo ""

# Test if a sample upload URL is accessible
echo "Testing upload URL accessibility..."
SAMPLE_URL="https://autopostvn.cloud/uploads/test.txt"
echo "test" > /var/www/autopost-vn/public/uploads/test.txt 2>/dev/null

if curl -I "$SAMPLE_URL" 2>/dev/null | grep -q "200 OK"; then
    echo "✅ Uploads are publicly accessible"
else
    echo "❌ Uploads are NOT publicly accessible"
    echo "Testing with curl:"
    curl -I "$SAMPLE_URL"
fi
