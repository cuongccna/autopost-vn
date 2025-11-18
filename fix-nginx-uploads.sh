#!/bin/bash

echo "🔧 Adding /uploads/ location to NGINX config"
echo "============================================="
echo ""

CONFIG_FILE="/etc/nginx/sites-available/autopost"

# Backup original config
cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backed up config to ${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Create new config with /uploads/ location
cat > "$CONFIG_FILE" << 'EOF'
server {
    server_name autopostvn.cloud www.autopostvn.cloud;

    # Serve uploaded media files directly (for Instagram API)
    location /uploads/ {
        alias /var/www/autopost-vn/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
        try_files $uri =404;
        autoindex off;
        access_log /var/log/nginx/uploads_access.log;
    }

    # Proxy all other requests to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long requests
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Large file uploads
        client_max_body_size 100M;
        client_body_buffer_size 100M;
        client_body_timeout 300s;
        proxy_request_buffering off;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/autopostvn.cloud/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/autopostvn.cloud/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.autopostvn.cloud) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = autopostvn.cloud) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name autopostvn.cloud www.autopostvn.cloud;
    return 404; # managed by Certbot
}
EOF

echo "✅ Updated NGINX config"
echo ""

# Test config
echo "🧪 Testing NGINX configuration..."
if nginx -t; then
    echo "✅ Config is valid!"
    echo ""
    echo "🔄 Reloading NGINX..."
    systemctl reload nginx
    echo "✅ NGINX reloaded!"
    echo ""
    
    # Wait a moment
    sleep 2
    
    # Test URL
    echo "🧪 Testing upload URL..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://autopostvn.cloud/uploads/test.txt")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ SUCCESS! Uploads are now accessible (HTTP $HTTP_CODE)"
        echo ""
        echo "Test: curl -I https://autopostvn.cloud/uploads/test.txt"
    else
        echo "⚠️  HTTP Status: $HTTP_CODE"
        echo ""
        echo "If still not working, check:"
        echo "1. File permissions: sudo ls -la /var/www/autopost-vn/public/uploads/"
        echo "2. NGINX error log: sudo tail -f /var/log/nginx/error.log"
    fi
else
    echo "❌ Config has errors!"
    echo ""
    echo "Restoring backup..."
    mv "${CONFIG_FILE}.backup."* "$CONFIG_FILE"
    systemctl reload nginx
fi

echo ""
echo "Done! You can now try uploading and posting to Instagram."
EOF

chmod +x fix-nginx-uploads.sh
echo "✅ Created script: fix-nginx-uploads.sh"
echo ""
echo "Run with: sudo ./fix-nginx-uploads.sh"
