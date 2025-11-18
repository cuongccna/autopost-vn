# Instagram Upload Error: Invalid Parameter (Subcode 1366046)

## 🔴 Vấn đề

Instagram báo lỗi: **"Không thể đọc file"** với error subcode **1366046**

```
error_user_msg: 'Không thể tải ảnh lên. Ảnh phải có kích thước nhỏ hơn 10 MB...'
```

## 🔍 Nguyên nhân

Instagram **KHÔNG THỂ TRUY CẬP** được URL ảnh/video vì:

1. URL đang dùng `localhost:3000` (local development)
2. URL đang dùng IP nội bộ VPS (127.0.0.1, 10.x.x.x, 192.168.x.x)
3. URL không có HTTPS hoặc firewall chặn

## ✅ Giải pháp

### **Option 1: Sử dụng Public Domain (Khuyên dùng)**

#### Trên VPS, cập nhật `.env.production`:

```bash
# Thay localhost bằng domain công khai
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Hoặc nếu dùng IP public
NEXT_PUBLIC_APP_URL=http://YOUR_VPS_PUBLIC_IP:3000
```

#### Cấu hình NGINX để serve static files:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Serve Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Serve uploaded media files directly
    location /uploads/ {
        alias /path/to/autopost-vn/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Restart services:

```bash
# Restart NGINX
sudo systemctl restart nginx

# Rebuild và restart app
cd /path/to/autopost-vn
npm run build
pm2 restart autopost-vn
```

---

### **Option 2: Upload lên CDN (Production-ready)**

#### 1. Cài đặt Cloudinary SDK:

```bash
npm install cloudinary
```

#### 2. Tạo `src/lib/services/cloudinaryService.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  async uploadFile(buffer: Buffer, fileName: string, contentType: string) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'autopost-vn',
          resource_type: contentType.startsWith('video/') ? 'video' : 'image',
          public_id: fileName.split('.')[0],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve({
            url: result.secure_url,
            path: result.public_id,
            size: result.bytes,
            contentType: result.format,
          });
        }
      );
      uploadStream.end(buffer);
    });
  }
}

export const cloudinaryService = new CloudinaryService();
```

#### 3. Thêm vào `.env`:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### 4. Update `src/app/api/media/upload/route.ts`:

```typescript
import { cloudinaryService } from '@/lib/services/cloudinaryService';

// Thay thế localStorageService.uploadFile
uploadResult = await cloudinaryService.uploadFile(
  buffer,
  file.name,
  file.type
);
```

---

### **Option 3: AWS S3 (Scalable)**

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadToS3(buffer: Buffer, key: string) {
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ACL: 'public-read',
  }));
  
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
```

---

## 🧪 Test URL Accessibility

Chạy script này để test xem Instagram có truy cập được URL không:

```bash
# Test từ bên ngoài
curl -I https://yourdomain.com/uploads/images/test.jpg

# Hoặc
wget --spider https://yourdomain.com/uploads/images/test.jpg
```

Nếu thành công, bạn sẽ thấy `200 OK`.

---

## 📋 Checklist

- [ ] Cập nhật `NEXT_PUBLIC_APP_URL` với public domain/IP
- [ ] Cấu hình NGINX để serve `/uploads/` static files
- [ ] Test URL từ external network (dùng curl/wget)
- [ ] Rebuild và restart app (`npm run build && pm2 restart`)
- [ ] Thử đăng bài Instagram lại

---

## 🎯 Tóm tắt

Instagram cần:
1. ✅ **Public URL** (không phải localhost/private IP)
2. ✅ **HTTP/HTTPS accessible** (không bị firewall chặn)
3. ✅ **File tồn tại** và có thể download
4. ✅ **Đúng format** (JPG, PNG, GIF, MP4, etc.)

**Khuyến nghị**: Dùng **Cloudinary** hoặc **AWS S3** cho production để tránh vấn đề về storage và bandwidth.
