#!/bin/bash

# VPS Setup Script - Fix Instagram Upload Issue
# Run this on your VPS server

set -e  # Exit on error

echo "🚀 AutoPostVN - Instagram Upload Fix"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/autopost-vn"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available/autopostvn.cloud"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled/autopostvn.cloud"

echo "${YELLOW}Step 1: Checking current configuration...${NC}"
echo ""

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo "${RED}❌ App directory not found: $APP_DIR${NC}"
    exit 1
fi
echo "${GREEN}✅ App directory found${NC}"

# Check if uploads directory exists
if [ ! -d "$APP_DIR/public/uploads" ]; then
    echo "${YELLOW}⚠️  Creating uploads directory...${NC}"
    mkdir -p "$APP_DIR/public/uploads/images"
    mkdir -p "$APP_DIR/public/uploads/videos"
    chown -R www-data:www-data "$APP_DIR/public/uploads"
    chmod -R 755 "$APP_DIR/public/uploads"
    echo "${GREEN}✅ Uploads directory created${NC}"
else
    echo "${GREEN}✅ Uploads directory exists${NC}"
fi

echo ""
echo "${YELLOW}Step 2: Testing current upload URL accessibility...${NC}"
echo ""

# Create test file
echo "test" > "$APP_DIR/public/uploads/test.txt"
chmod 644 "$APP_DIR/public/uploads/test.txt"

# Test if accessible
if curl -s -o /dev/null -w "%{http_code}" "https://autopostvn.cloud/uploads/test.txt" | grep -q "200"; then
    echo "${GREEN}✅ Uploads are already accessible!${NC}"
    echo "No NGINX changes needed."
else
    echo "${RED}❌ Uploads are NOT accessible${NC}"
    echo "${YELLOW}Updating NGINX configuration...${NC}"
    echo ""
    
    # Backup current config
    if [ -f "$NGINX_SITES_AVAILABLE" ]; then
        cp "$NGINX_SITES_AVAILABLE" "$NGINX_SITES_AVAILABLE.backup.$(date +%Y%m%d_%H%M%S)"
        echo "${GREEN}✅ Backed up current NGINX config${NC}"
    fi
    
    # Check if /uploads/ location already exists
    if grep -q "location /uploads/" "$NGINX_SITES_AVAILABLE" 2>/dev/null; then
        echo "${YELLOW}⚠️  /uploads/ location already exists in config${NC}"
        echo "Please check the configuration manually."
    else
        echo "${YELLOW}Adding /uploads/ location to NGINX config...${NC}"
        
        # Add uploads location block before the main location /
        sed -i '/location \/ {/i \    # Serve uploaded media files directly\n    location /uploads/ {\n        alias /var/www/autopost-vn/public/uploads/;\n        expires 1y;\n        add_header Cache-Control "public, immutable";\n        add_header Access-Control-Allow-Origin "*";\n        try_files $uri =404;\n        autoindex off;\n    }\n' "$NGINX_SITES_AVAILABLE"
        
        echo "${GREEN}✅ Updated NGINX config${NC}"
    fi
    
    # Test NGINX config
    echo ""
    echo "${YELLOW}Testing NGINX configuration...${NC}"
    if nginx -t; then
        echo "${GREEN}✅ NGINX config is valid${NC}"
        
        # Reload NGINX
        echo ""
        echo "${YELLOW}Reloading NGINX...${NC}"
        systemctl reload nginx
        echo "${GREEN}✅ NGINX reloaded${NC}"
    else
        echo "${RED}❌ NGINX config has errors!${NC}"
        echo "Restoring backup..."
        if [ -f "$NGINX_SITES_AVAILABLE.backup.$(date +%Y%m%d_%H%M%S)" ]; then
            mv "$NGINX_SITES_AVAILABLE.backup.$(date +%Y%m%d_%H%M%S)" "$NGINX_SITES_AVAILABLE"
            systemctl reload nginx
        fi
        exit 1
    fi
fi

echo ""
echo "${YELLOW}Step 3: Final verification...${NC}"
echo ""

# Test again after changes
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://autopostvn.cloud/uploads/test.txt")

if [ "$HTTP_CODE" = "200" ]; then
    echo "${GREEN}✅ SUCCESS! Uploads are now publicly accessible${NC}"
    echo ""
    echo "Test URL: https://autopostvn.cloud/uploads/test.txt"
    echo "HTTP Status: $HTTP_CODE"
else
    echo "${RED}❌ Still not accessible (HTTP $HTTP_CODE)${NC}"
    echo ""
    echo "Please check:"
    echo "1. NGINX config: sudo nano $NGINX_SITES_AVAILABLE"
    echo "2. NGINX error log: sudo tail -f /var/log/nginx/error.log"
    echo "3. File permissions: ls -la $APP_DIR/public/uploads/"
fi

echo ""
echo "${YELLOW}Step 4: Checking PM2 app status...${NC}"
echo ""

if command -v pm2 &> /dev/null; then
    pm2 list
    echo ""
    echo "${YELLOW}To view app logs: pm2 logs autopost-vn${NC}"
else
    echo "${RED}❌ PM2 not found${NC}"
fi

echo ""
echo "${GREEN}========================================${NC}"
echo "${GREEN}Setup complete!${NC}"
echo "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Upload a test image through your app"
echo "2. Check the URL is publicly accessible"
echo "3. Try posting to Instagram again"
echo ""
echo "If issues persist, check:"
echo "- Firewall settings (allow port 80/443)"
echo "- SSL certificate validity"
echo "- App logs: pm2 logs autopost-vn"
