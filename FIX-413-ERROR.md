# HƯỚNG DẪN SỬA LỖI 413 REQUEST ENTITY TOO LARGE

## Vấn đề hiện tại
```
Failed to load resource: the server responded with a status of 413 (Request Entity Too Large)
Upload error: SyntaxError: Unexpected token '<', "<html>..."
```

**Nguyên nhân:** NGINX đang chặn request vì file video quá lớn (mặc định NGINX chỉ cho phép 1MB).

## GIẢI PHÁP NGAY LẬP TỨC

### Bước 1: SSH vào VPS
```bash
ssh root@autopostvn.cloud
```

### Bước 2: Edit NGINX Config
```bash
sudo nano /etc/nginx/sites-available/autopostvn.cloud
```

### Bước 3: Thêm cấu hình
Tìm dòng có `server {` và thêm các dòng sau **NGAY SAU** dòng `server_name`:

```nginx
server {
    listen 80;
    server_name autopostvn.cloud www.autopostvn.cloud;
    
    # ========== THÊM ĐOẠN NÀY ==========
    # Allow large file uploads for videos (100MB)
    client_max_body_size 100M;
    client_body_buffer_size 100M;
    client_body_timeout 300s;
    # ===================================
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # ========== THÊM ĐOẠN NÀY ==========
        # Increase proxy timeouts for large uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        proxy_request_buffering off;
        # ===================================
    }
    
    # SSL config nếu có...
}
```

**Lưu file:** Ctrl+X, Y, Enter

### Bước 4: Test NGINX Config
```bash
sudo nginx -t
```

Phải thấy: `syntax is ok` và `test is successful`

### Bước 5: Reload NGINX
```bash
sudo systemctl reload nginx
```

### Bước 6: Kiểm tra NGINX đã reload
```bash
sudo systemctl status nginx
```

### Bước 7: (Optional) Restart PM2
```bash
cd /var/www/autopost-vn
pm2 restart autopost-vn
```

## Kiểm tra sau khi sửa

### 1. Test với curl
```bash
# Từ local machine, test upload
curl -X POST https://autopostvn.cloud/api/media/upload \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -F "file=@./test-video.mp4" \
  -v
```

Không còn thấy **413** nữa là OK!

### 2. Test trên browser
1. Mở https://autopostvn.cloud/compose
2. Upload 1 video nhỏ (2-5MB)
3. Xem Network tab trong DevTools
4. Status phải là **200 OK**

## Config mẫu hoàn chỉnh

```nginx
server {
    listen 80;
    server_name autopostvn.cloud www.autopostvn.cloud;
    
    # Allow large file uploads
    client_max_body_size 100M;
    client_body_buffer_size 100M;
    client_body_timeout 300s;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for large uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        proxy_request_buffering off;
    }
}

# SSL version (port 443)
server {
    listen 443 ssl http2;
    server_name autopostvn.cloud www.autopostvn.cloud;
    
    # SSL certificates
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Allow large file uploads
    client_max_body_size 100M;
    client_body_buffer_size 100M;
    client_body_timeout 300s;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for large uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        proxy_request_buffering off;
    }
}
```

## Troubleshooting

### Nếu vẫn bị 413:
```bash
# Kiểm tra global NGINX config
sudo nano /etc/nginx/nginx.conf

# Thêm vào block http { ... }:
http {
    ...
    client_max_body_size 100M;
    ...
}

# Reload lại
sudo systemctl reload nginx
```

### Kiểm tra log NGINX:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Kiểm tra PM2 logs:
```bash
pm2 logs autopost-vn --lines 50
```

## Sau khi sửa xong

Video upload sẽ hoạt động bình thường với:
- ✅ Status 200 OK
- ✅ File được lưu vào `/var/www/autopost-vn/public/uploads/videos/`
- ✅ Logs hiển thị đầy đủ quá trình upload
- ✅ Database có record mới trong `autopostvn_media`

## Thời gian thực hiện: ~2 phút

1. SSH vào server (10s)
2. Edit NGINX config (30s)
3. Test & reload (20s)
4. Test upload (30s)
5. ✅ Done!
