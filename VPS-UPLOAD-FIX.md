# 🚀 VPS Deployment Guide - File Upload Fix

## Vấn đề

Lỗi **"Unexpected token '<'"** khi upload file trên VPS do:
1. Thư mục `public/uploads` chưa tồn tại
2. Không có quyền write
3. Next.js bodyParser chưa được cấu hình đúng

## Giải pháp

### Bước 1: SSH vào VPS

```bash
ssh user@your-vps-ip
cd /path/to/autopost-vn
```

### Bước 2: Setup thư mục uploads

```bash
# Chạy script setup
chmod +x scripts/setup-uploads.sh
./scripts/setup-uploads.sh
```

Hoặc thủ công:

```bash
mkdir -p public/uploads/images
mkdir -p public/uploads/videos
mkdir -p public/uploads/documents
chmod -R 755 public/uploads
```

### Bước 3: Kiểm tra quyền

```bash
ls -la public/
# Phải thấy drwxr-xr-x cho thư mục uploads
```

### Bước 4: Deploy code mới

```bash
# Pull code mới (đã fix trong commit này)
git pull origin main

# Rebuild
npm run build

# Restart PM2
pm2 restart all
```

### Bước 5: Kiểm tra logs

```bash
# Xem logs real-time
pm2 logs --lines 100

# Hoặc
tail -f ~/.pm2/logs/autopost-vn-out.log
```

### Bước 6: Test upload

1. Vào `https://autopostvn.cloud/app`
2. Tạo bài mới
3. Upload ảnh/video
4. Kiểm tra logs sẽ thấy:
   ```
   📤 Media upload request received
   👤 User ID: xxx
   📁 File received: { name: 'test.jpg', type: 'image/jpeg', size: 123456 }
   ✅ Upload successful
   ```

## Troubleshooting

### Lỗi "Permission denied"

```bash
# Cấp quyền write cho process
sudo chown -R $USER:$USER public/uploads
chmod -R 755 public/uploads
```

### Lỗi "Directory not found"

```bash
# Tạo lại thư mục
mkdir -p public/uploads/{images,videos,documents}
```

### Lỗi "File too large"

- Images: Max 10MB
- Videos: Max 100MB

Nếu cần tăng limit, sửa trong `src/app/api/media/upload/route.ts`

### Kiểm tra file đã upload

```bash
ls -lh public/uploads/images/
ls -lh public/uploads/videos/
```

### Xóa file test

```bash
# Xóa toàn bộ file upload (cẩn thận!)
rm -rf public/uploads/images/*
rm -rf public/uploads/videos/*
```

## Cấu trúc thư mục sau khi setup

```
public/
└── uploads/
    ├── images/
    │   └── <user-id>/
    │       └── <timestamp>-<uuid>.jpg
    ├── videos/
    │   └── <user-id>/
    │       └── <timestamp>-<uuid>.mp4
    └── documents/
```

## URL truy cập file

Format: `https://autopostvn.cloud/uploads/<type>/<user-id>/<filename>`

Ví dụ:
- Image: `https://autopostvn.cloud/uploads/images/user123/1234567890-abc123.jpg`
- Video: `https://autopostvn.cloud/uploads/videos/user123/1234567890-def456.mp4`

## Monitoring

### Check disk space

```bash
df -h
# Đảm bảo có đủ dung lượng cho uploads
```

### Check upload size

```bash
du -sh public/uploads
```

### Set up cleanup cron (optional)

```bash
# Xóa file cũ hơn 30 ngày
0 2 * * * find /path/to/autopost-vn/public/uploads -type f -mtime +30 -delete
```

---

**✅ Sau khi làm xong các bước trên, upload file sẽ hoạt động bình thường!**
