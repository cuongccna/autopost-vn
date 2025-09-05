# AutoPost VN - Hướng dẫn Navigation & Routing

## 🗺️ Tổng quan về các trang

AutoPost VN có 3 trang chính với mục đích khác nhau:

### 🏠 Trang chủ (`/`) 
**Dành cho:** Khách hàng tiềm năng, người dùng mới
- Giới thiệu sản phẩm AutoPost VN
- QR Code để truy cập trên mobile
- Call-to-action đăng ký/đăng nhập
- **Tự động chuyển hướng:** Nếu đã đăng nhập → `/app`

### 📊 Dashboard (`/dashboard`)
**Dành cho:** User đã đăng nhập muốn xem tổng quan nhanh
- Thống kê cơ bản (số bài viết, tài khoản kết nối...)
- Quick actions (tất cả đều link đến `/app`)
- **Mục đích:** Cung cấp overview và dẫn đến main app

### 🚀 Ứng dụng chính (`/app`)
**Dành cho:** User đã đăng nhập, làm việc thực tế
- Tạo và quản lý bài viết
- Lập lịch đăng bài  
- Kết nối tài khoản Facebook, Instagram, Zalo
- Xem analytics và báo cáo
- **Đây là workspace chính của AutoPost VN**

## 🔄 Luồng đăng nhập và chuyển hướng

### ✅ Trước khi sửa lỗi (có vấn đề):
```
Đăng ký → Đăng nhập → /dashboard → User phải tự tìm /app
```

### ✅ Sau khi sửa lỗi (chính xác):
```
Đăng ký → Đăng nhập → /app (Main Application)
```

## 🎯 Lý do thiết kế như vậy

### 1. **Tách biệt mục đích sử dụng:**
- **Landing page** → Marketing & conversion
- **Dashboard** → Quick overview cho management
- **Main app** → Productive workspace

### 2. **Progressive disclosure:**
- User mới được dẫn dắt từ landing → app
- User có kinh nghiệm có thể access dashboard để overview

### 3. **Technical benefits:**
- **Landing page** → SEO optimized, static generation
- **Dashboard** → Light weight, fast loading
- **Main app** → Rich features, client-side heavy

## 🔧 Cách thức hoạt động kỹ thuật

### Landing Page Logic:
```typescript
// src/app/page.tsx
useEffect(() => {
  if (session) {
    router.push('/app')  // Auto redirect đến main app
  }
}, [session, router])
```

### NextAuth Redirect Configuration:
```typescript
// src/lib/auth.ts
callbacks: {
  async redirect({ url, baseUrl }) {
    return `${baseUrl}/app`  // Default redirect đến main app
  }
}
```

### Middleware Protection:
```typescript
// src/middleware.ts
- '/' → Public, nhưng redirect nếu authenticated
- '/dashboard' → Require authentication  
- '/app' → Require authentication
```

## 📱 User Journey Examples

### **Khách hàng mới:**
1. Vào `localhost:3000` → Landing page
2. Click "Đăng ký" → Form đăng ký
3. Click "Đăng nhập" → Form đăng nhập  
4. Đăng nhập thành công → Tự động vào `/app`
5. Bắt đầu tạo bài viết đầu tiên

### **User đã có tài khoản:**
1. Vào `localhost:3000` → Tự động redirect đến `/app`
2. Làm việc với bài viết, lịch đăng, analytics

### **User muốn xem overview:**
1. Vào `/dashboard` → Xem stats tổng quan
2. Click "Vào ứng dụng chính" → Chuyển đến `/app`

## 🎨 UI/UX Differences

### Landing Page:
- **Header:** Logo + Đăng nhập/Đăng ký buttons
- **Content:** Hero, Features, QR Code, CTA
- **Footer:** Links to legal pages

### Dashboard:
- **Header:** Dashboard title + "Vào ứng dụng chính" button  
- **Content:** Stats cards + Quick actions + Info banner
- **Style:** Clean, minimal

### Main App:
- **Layout:** Sidebar + Topbar + Main content area
- **Navigation:** Tab-based (Calendar, Queue, Analytics...)
- **Features:** Full CRUD, modals, drag-drop
- **Style:** Rich interface, productivity-focused

## ⚡ Quick Actions Mapping

Tất cả quick actions từ Dashboard đều link đến Main App:

| Dashboard Action | Link đến | Mục đích |
|------------------|----------|----------|
| "Tạo bài viết" | `/app` | Mở compose modal |
| "Kết nối tài khoản" | `/app` | Mở accounts management |
| "Xem báo cáo" | `/app` | Tab Analytics |
| "Vào ứng dụng chính" | `/app` | Main workspace |

## 🔍 Debugging & Development

### Kiểm tra routing:
```bash
# Test authentication flow
1. Vào http://localhost:3000
2. Đăng ký tài khoản mới
3. Kiểm tra có redirect đến /app không
4. Logout và test đăng nhập lại
```

### Common issues:
- **Redirect loop:** Check middleware.ts và auth callback
- **Session not found:** Check NextAuth configuration
- **Page not loading:** Check file paths trong app directory

---

## 📞 Liên hệ support

Nếu có vấn đề với routing hoặc navigation:
- **Email:** cuong.vhcc@gmail.com
- **Phone:** 0987 939 605

*Happy coding! 🚀*
