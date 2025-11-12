# 🔄 Migration Guide: Supabase → PostgreSQL + S3

## Tổng quan

Hướng dẫn này sẽ giúp bạn chuyển đổi AutoPost VN từ Supabase sang PostgreSQL + S3 standalone.

## ✅ Đã hoàn thành

### 1. **Authentication APIs**
- ✅ `forgot-password` → PostgreSQL + Email Service
- ✅ `change-password` → PostgreSQL bcrypt
- ✅ `register` → Đã dùng PostgreSQL
- ✅ `reset-password` → PostgreSQL + JWT

### 2. **Media Storage**
- ✅ `media/upload` → S3 + PostgreSQL
- ✅ Thêm `autopostvn_media` table
- ✅ S3Service với upload/delete

### 3. **Upgrade/Payment APIs**
- ✅ `upgrade-request` → PostgreSQL + Email
- ✅ `activate-upgrade` → PostgreSQL + Email
- ✅ EmailService với SMTP

### 4. **Debug APIs**
- ✅ `debug/env` → PostgreSQL + S3 config
- ✅ `debug/user-role` → PostgreSQL queries
- ✅ `debug/session` → NextAuth (không đổi)

### 5. **Services**
- ✅ UserManagementService → PostgreSQL
- ✅ EmailService → Nodemailer SMTP
- ✅ S3Service → AWS SDK
- ✅ Removed Supabase dependencies

## 📋 Cấu hình mới

### Environment Variables

Thay thế các biến Supabase bằng:

```env
# Database (PostgreSQL)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=autopostvn
POSTGRES_USER=autopostvn_user
POSTGRES_PASSWORD=your_password_here

# Storage (AWS S3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET_NAME=your-bucket-name

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# Auth
NEXTAUTH_SECRET=your-nextauth-secret-here
JWT_SECRET=your-jwt-secret-here
```

### Database Schema

Chạy file `database/schema-postgres.sql` để tạo tables:

```bash
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DATABASE -f database/schema-postgres.sql
```

## 🔄 Migration Steps

### 1. Setup Infrastructure

```bash
# 1. Tạo PostgreSQL database
createdb autopostvn

# 2. Tạo AWS S3 bucket
# - Tạo bucket với public access
# - Cấu hình CORS cho web uploads

# 3. Setup SMTP email
# - Gmail: Tạo App Password
# - Hoặc dùng SendGrid/Mailgun
```

### 2. Update Code

```bash
# 1. Install new dependencies
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner nodemailer

# 2. Remove Supabase dependencies
npm uninstall @supabase/supabase-js @supabase/ssr

# 3. Update environment variables
cp .env.example.postgres .env.local
```

### 3. Migrate Data (nếu cần)

Nếu có dữ liệu cũ từ Supabase:

```sql
-- Export từ Supabase
-- Import vào PostgreSQL
-- Update token encryption keys
```

## 🧪 Testing

### Test Authentication
```bash
# Test register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'

# Test forgot password
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Test Media Upload
```bash
# Test S3 upload
curl -X POST http://localhost:3000/api/media/upload \
  -F "file=@test-image.jpg"
```

### Test Debug APIs
```bash
# Test env config
curl http://localhost:3000/api/debug/env

# Test user role
curl http://localhost:3000/api/debug/user-role
```

## 🚨 Breaking Changes

### API Changes
- `/api/ai/usage-stats` → `/api/limits?scope=ai`
- `/api/posts/usage-stats` → `/api/limits?scope=posts`
- Supabase storage → S3 URLs

### Schema Changes
- `autopostvn_user_profiles` → `autopostvn_users`
- Token encryption: Supabase Vault → AES-256
- Media storage: Supabase Storage → S3

### Authentication
- Supabase Auth → Custom PostgreSQL auth
- Password reset: Supabase → JWT + Email

## 📞 Support

Nếu gặp vấn đề trong quá trình migration:
1. Kiểm tra logs: `npm run dev`
2. Test từng API riêng lẻ
3. Verify environment variables
4. Check database connections

## ✅ Status: Migration Complete

AutoPost VN đã được chuyển đổi hoàn toàn từ Supabase sang PostgreSQL + S3 standalone! 🎉
