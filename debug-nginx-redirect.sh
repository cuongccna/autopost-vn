#!/bin/bash

echo "🔍 Checking NGINX Configuration Details"
echo "========================================"
echo ""

# Find the actual server block handling autopostvn.cloud
echo "📋 Full NGINX Configuration:"
echo ""
cat /etc/nginx/nginx.conf

echo ""
echo "========================================"
echo ""

# Check if there are include directives
echo "🔗 Checking for included configs:"
grep -r "include" /etc/nginx/nginx.conf

echo ""
echo "========================================"
echo ""

# List all conf.d files
echo "📁 Config files in conf.d:"
ls -la /etc/nginx/conf.d/ 2>/dev/null || echo "No conf.d directory"

echo ""
echo "========================================"
echo ""

# Show server blocks
echo "🌐 Server blocks found:"
grep -r "server_name" /etc/nginx/ 2>/dev/null

echo ""
echo "========================================"
echo ""

# Check current /uploads/ location
echo "📍 Current /uploads/ location (if exists):"
grep -A 10 "location /uploads" /etc/nginx/nginx.conf 2>/dev/null || echo "Not found in main config"

echo ""
echo "========================================"
echo ""

# Test actual URL
echo "🧪 Testing actual URL:"
curl -I https://autopostvn.cloud/uploads/test.txt 2>&1 | head -20

echo ""
echo "========================================"
echo ""

# Check if there's a redirect
echo "🔄 Checking for redirects:"
curl -v https://autopostvn.cloud/uploads/test.txt 2>&1 | grep -i "location:"
