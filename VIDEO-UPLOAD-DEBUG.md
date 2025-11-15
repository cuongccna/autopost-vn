# Video Upload Debug Guide

## Vấn đề
Video upload thành công ở local nhưng không hoạt động trên production (pm2). Logs không hiển thị bất kỳ request nào đến `/api/media/upload`.

## Nguyên nhân có thể

### 1. NGINX Body Size Limit
NGINX mặc định giới hạn request body là 1MB, cần tăng lên cho video upload.

**Kiểm tra:**
```bash
# SSH vào server
ssh root@autopostvn.cloud

# Kiểm tra NGINX config
cat /etc/nginx/sites-available/autopostvn.cloud
```

**Sửa lỗi:**
Thêm vào NGINX config trong block `server`:
```nginx
server {
    listen 80;
    server_name autopostvn.cloud www.autopostvn.cloud;
    
    # Tăng giới hạn body size cho video uploads (100MB)
    client_max_body_size 100M;
    client_body_timeout 300s;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Tăng timeout cho upload
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

Sau đó restart NGINX:
```bash
sudo nginx -t  # Test config
sudo systemctl reload nginx
```

### 2. File Permissions
Thư mục uploads trên server cần có quyền ghi.

**Kiểm tra:**
```bash
# Kiểm tra quyền của thư mục uploads
ls -la /var/www/autopost-vn/public/uploads/

# Kiểm tra owner
ls -la /var/www/autopost-vn/public/uploads/videos/
```

**Sửa lỗi:**
```bash
# Tạo thư mục nếu chưa có
mkdir -p /var/www/autopost-vn/public/uploads/videos
mkdir -p /var/www/autopost-vn/public/uploads/images

# Set quyền cho pm2 user (thường là user deploy)
sudo chown -R $USER:$USER /var/www/autopost-vn/public/uploads
sudo chmod -R 755 /var/www/autopost-vn/public/uploads
```

### 3. PM2 Logs
Kiểm tra xem có error nào không:

**Kiểm tra:**
```bash
# Xem full logs
pm2 logs autopost-vn --lines 100

# Xem error logs
pm2 logs autopost-vn --err --lines 50

# Restart để apply changes
pm2 restart autopost-vn
pm2 logs autopost-vn --lines 0  # Follow new logs
```

### 4. Environment Variables
Đảm bảo `.env.production` có đúng config:

**Kiểm tra:**
```bash
cat /var/www/autopost-vn/.env.production | grep UPLOAD
```

Cần có:
```bash
UPLOAD_DIR=./public/uploads
MAX_IMAGE_SIZE=10485760
MAX_VIDEO_SIZE=104857600
NEXT_PUBLIC_APP_URL=https://autopostvn.cloud
```

### 5. Database Connection
Kiểm tra xem database có sẵn sàng nhận media records:

**Kiểm tra:**
```bash
# Connect to PostgreSQL
psql -U autopost_admin -d autopost_vn

# Check media table
\d autopostvn_media;

# Test insert
SELECT * FROM autopostvn_media ORDER BY created_at DESC LIMIT 5;
```

## Test Video Upload

### Test từ client
1. Mở browser DevTools (F12)
2. Go to Network tab
3. Try upload video
4. Check request:
   - Status code (nên là 200)
   - Response time
   - Request payload size
   - Response body

### Test direct với curl
```bash
# Lấy session token từ browser cookies
# Thay YOUR_SESSION_TOKEN bằng giá trị thực

curl -X POST https://autopostvn.cloud/api/media/upload \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -F "file=@/path/to/test-video.mp4" \
  -v
```

## Checklist Debug

- [ ] NGINX `client_max_body_size` >= 100M
- [ ] NGINX timeout settings tăng lên 300s
- [ ] Thư mục `/var/www/autopost-vn/public/uploads/videos` tồn tại
- [ ] Thư mục uploads có quyền write (755 hoặc 775)
- [ ] PM2 đang chạy với user có quyền ghi vào uploads
- [ ] Environment variables đúng trong production
- [ ] Next.js config có `serverActions.bodySizeLimit: '100mb'`
- [ ] Middleware log hiển thị request đến `/api/media/upload`
- [ ] Database table `autopostvn_media` sẵn sàng

## Kết quả mong đợi

Khi upload video thành công, logs sẽ hiển thị:
```
🛡️ MIDDLEWARE: Allowing API route
📤 [MEDIA UPLOAD] Request received
👤 [MEDIA UPLOAD] User ID: xxx
📁 [MEDIA UPLOAD] File received: { name: 'video.mp4', type: 'video/mp4', size: xxx }
🔍 [MEDIA UPLOAD] File type validation: { isVideo: true }
📏 [MEDIA UPLOAD] Size check: { sizeOK: true }
📤 [LOCAL STORAGE] Upload started
📁 [LOCAL STORAGE] Determined subdirectory: videos
💾 [LOCAL STORAGE] Writing file to disk
✅ [LOCAL STORAGE] File written successfully
💾 [MEDIA UPLOAD] Saving to database
✅ [MEDIA UPLOAD] Database record created
🎉 [MEDIA UPLOAD] Upload completed successfully
```

## Next Steps

1. **Apply NGINX changes first** - Đây là nguyên nhân phổ biến nhất
2. **Check permissions** - Đảm bảo có quyền ghi
3. **Restart services** - `pm2 restart autopost-vn`
4. **Test upload** - Thử upload video nhỏ (< 5MB) trước
5. **Monitor logs** - `pm2 logs autopost-vn --lines 0`

## Quick Fix Script

Tạo file `fix-video-upload.sh` trên server:

```bash
#!/bin/bash
echo "🔧 Fixing video upload issues..."

# 1. Create directories
echo "📁 Creating upload directories..."
mkdir -p /var/www/autopost-vn/public/uploads/videos
mkdir -p /var/www/autopost-vn/public/uploads/images

# 2. Fix permissions
echo "🔐 Fixing permissions..."
chown -R $USER:$USER /var/www/autopost-vn/public/uploads
chmod -R 755 /var/www/autopost-vn/public/uploads

# 3. Check NGINX config
echo "🌐 Checking NGINX config..."
if ! grep -q "client_max_body_size 100M" /etc/nginx/sites-available/autopostvn.cloud; then
    echo "⚠️  NGINX config needs manual update!"
    echo "Add: client_max_body_size 100M;"
fi

# 4. Restart services
echo "🔄 Restarting services..."
pm2 restart autopost-vn

echo "✅ Done! Check logs with: pm2 logs autopost-vn --lines 0"
```

Chạy:
```bash
chmod +x fix-video-upload.sh
./fix-video-upload.sh
```
