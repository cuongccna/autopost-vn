#!/bin/bash

# Script to find and display NGINX configuration

echo "🔍 Finding NGINX Configuration Files..."
echo "========================================"
echo ""

# Method 1: Check common locations
echo "📁 Checking common config locations:"
echo ""

if [ -f "/etc/nginx/sites-available/autopostvn.cloud" ]; then
    echo "✅ Found: /etc/nginx/sites-available/autopostvn.cloud"
    CONFIG_FILE="/etc/nginx/sites-available/autopostvn.cloud"
elif [ -f "/etc/nginx/sites-available/default" ]; then
    echo "✅ Found: /etc/nginx/sites-available/default"
    CONFIG_FILE="/etc/nginx/sites-available/default"
elif [ -f "/etc/nginx/conf.d/autopostvn.cloud.conf" ]; then
    echo "✅ Found: /etc/nginx/conf.d/autopostvn.cloud.conf"
    CONFIG_FILE="/etc/nginx/conf.d/autopostvn.cloud.conf"
elif [ -f "/etc/nginx/conf.d/default.conf" ]; then
    echo "✅ Found: /etc/nginx/conf.d/default.conf"
    CONFIG_FILE="/etc/nginx/conf.d/default.conf"
else
    echo "⚠️  No specific config found, checking main config"
    CONFIG_FILE="/etc/nginx/nginx.conf"
fi

echo ""
echo "========================================"
echo ""

# Method 2: Find all NGINX config files
echo "📋 All NGINX config files:"
find /etc/nginx -name "*.conf" -o -name "default" 2>/dev/null

echo ""
echo "========================================"
echo ""

# Method 3: Check what configs are actually being used
echo "🔗 Active NGINX configurations:"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "No sites-enabled directory"

echo ""
echo "========================================"
echo ""

# Display current config
if [ -f "$CONFIG_FILE" ]; then
    echo "📄 Current config file: $CONFIG_FILE"
    echo ""
    echo "Content:"
    echo "--------"
    cat "$CONFIG_FILE"
else
    echo "❌ No config file found!"
fi

echo ""
echo "========================================"
echo ""

# Check if /uploads/ location exists
echo "🔍 Checking for /uploads/ location in configs:"
if grep -r "location /uploads" /etc/nginx/ 2>/dev/null; then
    echo ""
    echo "✅ /uploads/ location found!"
else
    echo "❌ /uploads/ location NOT found in any config"
fi

echo ""
echo "========================================"
echo ""

# Test NGINX syntax
echo "🧪 Testing NGINX configuration:"
nginx -t

echo ""
echo "========================================"
echo ""

echo "Next steps:"
echo "1. If you see your config above, note the file path"
echo "2. Add the /uploads/ location block to that file"
echo "3. Run: sudo nginx -t"
echo "4. Run: sudo systemctl reload nginx"
