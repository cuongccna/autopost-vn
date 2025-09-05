# Environment Variables Setup Guide

## Tại sao file .env.local bị mất?

File `.env.local` có thể bị mất do các lý do sau:
1. **File bị xóa nhầm** khi cleanup project
2. **Chưa được tạo** từ ban đầu
3. **Bị ignore** bởi git và không được sync
4. **File backup không tồn tại**

## Cách khôi phục và setup

### 1. File .env.local đã được tạo sẵn
File `.env.local` mới đã được tạo với template đầy đủ các biến cần thiết.

### 2. Các biến môi trường quan trọng cần điền:

#### 🔐 **NextAuth (Bắt buộc)**
```bash
NEXTAUTH_SECRET=your-super-secret-nextauth-key-here
NEXTAUTH_URL=http://localhost:3000
```

#### 🗄️ **Supabase (Bắt buộc)**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
```

#### 🤖 **Gemini AI (Cho AI features)**
```bash
GEMINI_API_KEY=your-gemini-api-key-here
```

#### 📱 **Social Media APIs (Cho posting)**
```bash
# Facebook
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Instagram (same as Facebook)
INSTAGRAM_APP_ID=your-facebook-app-id
INSTAGRAM_APP_SECRET=your-facebook-app-secret

# Zalo
ZALO_APP_ID=your-zalo-app-id
ZALO_APP_SECRET=your-zalo-app-secret
```

### 3. Cách lấy các API keys:

#### Supabase
1. Truy cập: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào Settings > API
4. Copy URL và anon key

#### Gemini AI
1. Truy cập: https://ai.google.dev/
2. Đăng nhập và tạo API key
3. Copy API key

#### Facebook/Instagram
1. Truy cập: https://developers.facebook.com/
2. Tạo app mới hoặc sử dụng app có sẵn
3. Lấy App ID và App Secret

#### Zalo
1. Truy cập: https://developers.zalo.me/
2. Tạo app mới
3. Lấy App ID và Secret Key

### 4. Tạo NEXTAUTH_SECRET

Chạy lệnh này để tạo secret key an toàn:
```bash
# PowerShell
[System.Web.Security.Membership]::GeneratePassword(32, 4)

# Hoặc online
# Truy cập: https://generate-secret.vercel.app/32
```

### 5. Kiểm tra setup

Sau khi điền các biến, chạy:
```bash
npm run dev
```

Kiểm tra console không có lỗi về missing environment variables.

### 6. Backup biến môi trường

Để tránh mất file `.env.local` lần nữa:

1. **Tạo backup file** (không commit):
   ```bash
   cp .env.local .env.backup
   ```

2. **Lưu trữ an toàn** trong password manager hoặc note app

3. **Document các keys** bạn đang sử dụng

### 7. File structure sau khi setup:

```
autopost-vn/
├── .env.local          # ✅ Production environment variables
├── .env.test           # ✅ Test environment variables  
├── .env.gemini.example # ✅ Template for Gemini setup
├── .gitignore          # ✅ Bảo vệ .env files
└── package.json
```

### 8. Troubleshooting

#### Lỗi: "NEXTAUTH_SECRET is not defined"
- Kiểm tra file `.env.local` có tồn tại
- Đảm bảo `NEXTAUTH_SECRET` được điền
- Restart server sau khi thay đổi

#### Lỗi: "Supabase connection failed"
- Kiểm tra URL và keys Supabase
- Đảm bảo project Supabase đang active
- Kiểm tra network connection

#### Lỗi: "Gemini API key not configured"
- Điền `GEMINI_API_KEY` vào `.env.local`
- Kiểm tra API key còn valid
- Đảm bảo đã enable Gemini API

### 9. Security Notes

- ❌ **KHÔNG BAO GIỜ** commit `.env.local` vào git
- ✅ Chỉ share environment variables qua channel an toàn
- ✅ Rotate keys định kỳ
- ✅ Sử dụng principle of least privilege

### 10. Next Steps

Sau khi setup xong environment variables:
1. Test authentication: `/auth/signin`
2. Test database connection: Check console logs
3. Test AI features: Sử dụng các nút AI trong compose modal
4. Test social media posting: Connect accounts và thử post

---

**🚨 Quan trọng**: File `.env.local` chứa các thông tin nhạy cảm. Luôn giữ an toàn và không chia sẻ publicly!
