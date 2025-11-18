#!/bin/bash

echo "🔍 Finding actual server config in sites-enabled"
echo "================================================"
echo ""

# List files in sites-enabled
echo "📁 Files in /etc/nginx/sites-enabled/:"
ls -la /etc/nginx/sites-enabled/

echo ""
echo "================================================"
echo ""

# Show content of all enabled sites
echo "📄 Content of enabled sites:"
for file in /etc/nginx/sites-enabled/*; do
    echo ""
    echo "File: $file"
    echo "----------------------------------------"
    cat "$file"
    echo ""
done

echo ""
echo "================================================"
echo ""

# Also check sites-available
echo "📁 Files in /etc/nginx/sites-available/:"
ls -la /etc/nginx/sites-available/

echo ""
echo "================================================"
echo ""

# Find server blocks with autopostvn
echo "🌐 Server blocks containing 'autopostvn' or '3000':"
grep -r "autopostvn\|localhost:3000\|server_name" /etc/nginx/sites-enabled/ 2>/dev/null
