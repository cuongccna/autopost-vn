# AutoPost VN - Tự động đăng bài lên mạng xã hội

AutoPost VN là một ứng dụng web cho phép bạn tự động đăng bài lên các nền tảng mạng xã hội như Facebook, Instagram và Zalo.

## ✨ Tính năng chính

- 🔐 **Xác thực an toàn**: Đăng ký, đăng nhập với mã hóa mạnh mẽ
- 📱 **Responsive Design**: Hỗ trợ tối ưu cho mobile với QR Code
- 🔄 **Đăng bài tự động**: Lập lịch đăng bài lên Facebook, Instagram, Zalo
- ⏰ **Quản lý lịch**: Hẹn giờ đăng bài theo kế hoạch
- 📊 **Theo dõi**: Thống kê và báo cáo hiệu quả
- 🔒 **Bảo mật**: Mã hóa AES-256, quản lý token an toàn

## 🚀 Cài đặt

1. Clone repository:
```bash
git clone https://github.com/yourusername/autopost-vn.git
cd autopost-vn
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Cấu hình environment variables:
```bash
cp .env.example .env.local
```

Cập nhật các biến trong `.env.local`:
**Database (PostgreSQL):**
- `POSTGRES_HOST`: Host của PostgreSQL server
- `POSTGRES_PORT`: Port PostgreSQL (default: 5432)
- `POSTGRES_DATABASE`: Tên database
- `POSTGRES_USER`: Username PostgreSQL
- `POSTGRES_PASSWORD`: Password PostgreSQL

**Storage (Local Files):**
- Files được lưu trữ trong thư mục `public/uploads/`
- Không cần cấu hình thêm cho VPS deployment
- Tự động tạo thư mục con theo loại file (images, videos, documents)

**Email (SMTP):**
- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP port (587 hoặc 465)
- `SMTP_USER`: SMTP username/email
- `SMTP_PASS`: SMTP password
- `SMTP_FROM`: Email gửi từ

**Authentication:**
- `NEXTAUTH_SECRET`: Secret key cho NextAuth (tối thiểu 32 ký tự)
- `NEXTAUTH_URL`: URL của ứng dụng (http://localhost:3000 cho dev)
- `JWT_SECRET`: Secret key cho JWT tokens

**Debug:**
- `DEBUG_API_ENABLED`: `true/false` để bật/tắt các debug API (mặc định nên để `false`)

4. Setup PostgreSQL Database:
```bash
-- Chạy script để tạo database schema
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DATABASE -f database/schema-postgres.sql
```

Hoặc copy và chạy nội dung file `database/schema-postgres.sql` trong PostgreSQL client.

5. Chạy development server:
```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 🏗️ Kiến trúc hệ thống

### Frontend
- **Next.js 14**: App Router, Server Components
- **TypeScript**: Type safety cho toàn bộ codebase
- **Tailwind CSS**: Styling và responsive design
- **NextAuth.js**: Authentication và session management

### Backend
- **Next.js API Routes**: RESTful APIs
- **Supabase**: Database và authentication
- **Custom Schema**: AutoPostVN schema cho multi-tenancy

### Security
- **AES-256 Encryption**: Mã hóa tokens và sensitive data
- **bcryptjs**: Hash passwords
- **JWT**: Secure session management
- **CSRF Protection**: NextAuth built-in protection

## 📱 Tính năng Mobile

Ứng dụng hỗ trợ QR Code để truy cập nhanh trên mobile:
- Quét QR code từ landing page
- Responsive design cho tất cả devices
- Progressive Web App (PWA) ready

## 🔐 Authentication Flow

1. **Đăng ký**: Tạo tài khoản với email/password
2. **Xác thực email**: Verification qua Supabase Auth
3. **Đăng nhập**: Session management với NextAuth
4. **Quên mật khẩu**: Reset password flow
5. **Profile Management**: Cập nhật thông tin cá nhân

## 🗂️ Cấu trúc thư mục

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── api/               # API endpoints
│   └── legal/             # Legal pages (terms, privacy)
├── lib/                   # Utilities và configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── supabase/         # Supabase clients
│   └── providers/        # Social media integrations
└── components/           # Reusable components
```

## 🔧 Development

### Chạy tests
```bash
npm run test
```

### Build production
```bash
npm run build
```

### Lint code
```bash
npm run lint
```

## 📄 Trang pháp lý

- [Điều khoản sử dụng](/legal/terms)
- [Chính sách bảo mật](/legal/privacy)
- [Liên hệ](/legal/contact)

## 📞 Liên hệ

- **Email**: cuong.vhcc@gmail.com
- **Điện thoại**: 0987 939 605
- **Địa chỉ**: FPT Tower, 36 Hoàng Cầu, Đống Đa, Hà Nội

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Made with ❤️ by AutoPost VN Team

## 🚀 Quick Start

Xem [README-DEPLOY.md](./README-DEPLOY.md) để setup và deploy nhanh.
