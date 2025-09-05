# AutoPost VN - Architecture & Routing Documentation

## 📋 Tổng quan hệ thống

AutoPost VN được thiết kế với kiến trúc phân tầng rõ ràng, có 3 trang chính phục vụ các mục đích khác nhau:

### 1. **Landing Page (`/`)** - Trang chủ cho người dùng chưa đăng nhập
- **File:** `src/app/page.tsx`
- **Mục đích:** Giới thiệu sản phẩm và chuyển đổi khách hàng
- **Tính năng:**
  - Hero section với CTA buttons
  - Features showcase 
  - QR Code cho truy cập mobile
  - Footer với legal links
- **Logic routing:** Nếu user đã authenticated → redirect đến `/app`

### 2. **Dashboard Page (`/dashboard`)** - Trang tổng quan đơn giản
- **File:** `src/app/dashboard/page.tsx`
- **Mục đích:** Cung cấp overview nhanh và làm cầu nối đến full app
- **Tính năng:**
  - Stats cards (tổng bài viết, lịch đăng, tài khoản kết nối)
  - Quick actions buttons (tất cả đều link đến `/app`)
  - Info banner giải thích sự khác biệt với `/app`
- **Khi nào sử dụng:** Khi user muốn xem overview nhanh

### 3. **Main Application (`/app`)** - Ứng dụng chính với đầy đủ tính năng
- **File:** `src/app/app/page.tsx`
- **Mục đích:** Workspace chính để tạo, quản lý và theo dõi bài viết
- **Tính năng:**
  - Sidebar navigation với tabs (Calendar, Queue, Analytics, etc.)
  - Compose modal để tạo bài viết
  - Calendar view cho lập lịch
  - Queue management để quản lý hàng đợi
  - Analytics dashboard
  - Accounts management
  - Settings panel

## 🔄 Authentication Flow & Routing Logic

### Flow hiện tại (đã được sửa):
```
1. User vào `/` (Landing Page)
   ├─ Chưa đăng nhập → Hiển thị landing page với register/login buttons
   └─ Đã đăng nhập → Auto redirect đến `/app`

2. User click "Đăng ký" → `/auth/signup`
   └─ Đăng ký thành công → Redirect đến `/auth/signin`

3. User click "Đăng nhập" → `/auth/signin`
   └─ Đăng nhập thành công → Redirect đến `/app`

4. NextAuth default redirect → `/app` (configured in auth.ts)
```

### Middleware Protection:
```typescript
// src/middleware.ts
- `/` → Public (có logic redirect nếu authenticated)
- `/auth/*` → Public 
- `/legal/*` → Public
- `/api/*` → Public (handle own auth)
- `/dashboard` → Require auth
- `/app` → Require auth (main workspace)
- All other routes → Require auth
```

## 🏗️ Technical Architecture

### 1. **Frontend Stack:**
- **Next.js 14** - App Router với Server/Client Components
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **NextAuth.js** - Authentication

### 2. **Backend Stack:**
- **Next.js API Routes** - RESTful endpoints
- **Supabase** - Database & Auth provider
- **Custom Schema "AutoPostVN"** - Multi-tenancy support

### 3. **State Management:**
- **NextAuth Session** - Global auth state
- **React useState/useEffect** - Local component state
- **URL params** - Tab navigation state in `/app`

### 4. **Security Features:**
- **Middleware route protection**
- **AES-256 encryption** for sensitive data
- **bcryptjs** password hashing
- **JWT tokens** với NextAuth
- **CSRF protection** built-in

## 📱 User Experience Flow

### First-time User:
1. **Landing Page (`/`)** → Giới thiệu sản phẩm
2. **Register (`/auth/signup`)** → Tạo tài khoản
3. **Login (`/auth/signin`)** → Xác thực
4. **Main App (`/app`)** → Bắt đầu sử dụng

### Returning User:
1. **Landing Page (`/`)** → Auto redirect đến `/app`
2. **Main App (`/app`)** → Làm việc với bài viết

### Dashboard Access:
- User có thể truy cập `/dashboard` để xem overview
- Từ dashboard có thể click vào `/app` để vào workspace chính

## 🔧 Development Guidelines

### Khi nào tạo tính năng mới:

1. **Basic features** → Thêm vào `/dashboard`
2. **Advanced features** → Thêm vào `/app`
3. **Marketing content** → Thêm vào landing page `/`

### File Organization:
```
src/app/
├── page.tsx                    # Landing page
├── dashboard/page.tsx          # Simple dashboard
├── app/page.tsx               # Main application
├── auth/                      # Authentication pages
├── legal/                     # Legal pages
└── api/                       # Backend endpoints

src/components/
├── ui/                        # Reusable UI components
├── layout/                    # Layout components
└── features/                  # Feature-specific components
```

### Component Reuse Strategy:
- **UI Components** → Shared across all pages
- **Layout Components** → Different layouts for different page types
- **Feature Components** → Specific to `/app` workspace

## 🚀 Deployment Considerations

### Environment Variables:
- All pages share same environment configuration
- Different build optimizations for different page types
- Static generation for landing page, SSR for authenticated pages

### Performance:
- **Landing page** → Static generation + CDN
- **Dashboard** → Server-side rendering with auth check
- **Main app** → Client-side rendering với dynamic imports

### SEO & Marketing:
- **Landing page** → Full SEO optimization
- **Dashboard & App** → No-index (authenticated areas)

---

## 📞 Support & Contact

Nếu có thắc mắc về architecture:
- **Email:** cuong.vhcc@gmail.com  
- **Phone:** 0987 939 605

*Tài liệu này được cập nhật lần cuối: September 2, 2025*
