#!/bin/bash
# Script để fix lỗi video upload 413 Request Entity Too Large

echo "🔧 Fixing NGINX configuration for video uploads..."
echo ""

# Backup NGINX config trước
echo "📦 Backing up current NGINX config..."
sudo cp /etc/nginx/sites-available/autopostvn.cloud /etc/nginx/sites-available/autopostvn.cloud.backup.$(date +%Y%m%d_%H%M%S)

# Kiểm tra xem đã có client_max_body_size chưa
if grep -q "client_max_body_size" /etc/nginx/sites-available/autopostvn.cloud; then
    echo "⚠️  client_max_body_size đã tồn tại, cần cập nhật thủ công"
    echo "Current config:"
    grep -A2 -B2 "client_max_body_size" /etc/nginx/sites-available/autopostvn.cloud
else
    echo "➕ Adding client_max_body_size to NGINX config..."
    
    # Tạo file config mới
    cat > /tmp/nginx_upload_fix.conf << 'EOF'
# Add these lines inside the server block (after server_name)

    # Allow large file uploads for videos (100MB)
    client_max_body_size 100M;
    client_body_buffer_size 100M;
    client_body_timeout 300s;
    
    # Increase proxy timeouts for large uploads
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
EOF
    
    echo "📝 Config to add:"
    cat /tmp/nginx_upload_fix.conf
fi

echo ""
echo "📋 Manual steps needed:"
echo "1. Edit NGINX config:"
echo "   sudo nano /etc/nginx/sites-available/autopostvn.cloud"
echo ""
echo "2. Add these lines inside the 'server' block (after server_name line):"
echo ""
cat << 'EOF'
    # Allow large file uploads for videos (100MB)
    client_max_body_size 100M;
    client_body_buffer_size 100M;
    client_body_timeout 300s;
EOF
echo ""
echo "3. Also add these to the 'location /' block:"
echo ""
cat << 'EOF'
    # Increase proxy timeouts for large uploads
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
EOF
echo ""
echo "4. Test NGINX config:"
echo "   sudo nginx -t"
echo ""
echo "5. Reload NGINX:"
echo "   sudo systemctl reload nginx"
echo ""
echo "6. Restart PM2 app:"
echo "   cd /var/www/autopost-vn && pm2 restart autopost-vn"
echo ""
echo "✅ After completing these steps, try uploading video again"
