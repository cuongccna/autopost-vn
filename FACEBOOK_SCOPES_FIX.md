# Khắc phục lỗi "Invalid Scopes" khi kết nối Facebook/Instagram

## 🔴 Lỗi bạn gặp phải:

```
Invalid Scopes: pages_manage_posts, pages_show_list, 
pages_read_engagement, pages_read_user_content
```

## ✅ Nguyên nhân:

Facebook đã thay đổi **permissions system** vào năm 2024-2025. Một số permissions cũ:
- ❌ `pages_manage_posts` - Cần App Review
- ❌ `pages_read_user_content` - Đã deprecated
- ❌ `instagram_content_publish` - Cần App Review
- ❌ `instagram_basic` - Cần App Review

## 🔧 Đã sửa:

### 1. **Facebook Scopes** (Cập nhật trong code)
```javascript
// ❌ CŨ - Gây lỗi
scope: 'pages_manage_posts,pages_show_list,pages_read_engagement,pages_read_user_content'

// ✅ MỚI - Hoạt động
scope: 'pages_show_list,pages_read_engagement,public_profile,email'
```

### 2. **Instagram Scopes** (Cập nhật trong code)
```javascript
// ❌ CŨ - Gây lỗi
scope: 'instagram_basic,instagram_content_publish,pages_show_list'

// ✅ MỚI - Hoạt động
scope: 'pages_show_list,pages_read_engagement'
```

## 📝 Files đã được cập nhật:

1. ✅ `src/app/api/oauth/[provider]/route.ts` - OAuth scopes chính
2. ✅ `src/components/features/AddAccountModal.tsx` - UI hướng dẫn
3. ✅ `src/components/features/AccountsManagement.tsx` - Hiển thị permissions

## 🚀 Hướng dẫn sử dụng:

### Kết nối Facebook Page (Chế độ Development)
1. Truy cập trang **Tài khoản mạng xã hội**
2. Click **"Kết nối Facebook Page"**
3. Đăng nhập Facebook
4. Chấp nhận permissions:
   - ✅ `pages_show_list` - Xem danh sách Pages
   - ✅ `pages_read_engagement` - Đọc insights
5. Chọn Page cần kết nối
6. ✅ Hoàn tất!

### Kết nối Instagram Business
1. Click **"Kết nối Instagram Business"**
2. Đăng nhập Facebook (Instagram Business cần liên kết với Facebook)
3. Chấp nhận permissions:
   - ✅ `pages_show_list` - Xem Instagram Business Accounts
   - ✅ `pages_read_engagement` - Đọc insights
4. Chọn Instagram Business Account
5. ✅ Hoàn tất!

## ⚠️ Giới hạn hiện tại (Development Mode):

Với permissions hiện tại (không cần App Review), bạn có thể:
- ✅ Xem danh sách Facebook Pages
- ✅ Xem danh sách Instagram Business Accounts  
- ✅ Đọc insights và analytics
- ✅ Lấy thông tin cơ bản về account

**KHÔNG THỂ** (cần App Review):
- ❌ Đăng bài trực tiếp lên Facebook Page
- ❌ Đăng bài trực tiếp lên Instagram
- ❌ Quản lý nội dung (edit/delete posts)

## 🎯 Để có quyền đăng bài (Production):

Bạn cần submit **Facebook App Review** và yêu cầu các permissions:
1. `pages_manage_posts` - Đăng bài lên Facebook Page
2. `instagram_content_publish` - Đăng bài lên Instagram
3. `pages_manage_metadata` - Quản lý Page settings

### Quy trình App Review:

1. **Chuẩn bị Facebook App:**
   - Điền đầy đủ thông tin App (Privacy Policy, Terms of Service)
   - Thêm App Icon và Screenshots
   - Verify business/domain

2. **Submit App Review:**
   - Truy cập [Facebook App Dashboard](https://developers.facebook.com/apps)
   - Vào tab **App Review** > **Permissions and Features**
   - Request permissions: `pages_manage_posts`, `instagram_content_publish`
   - Cung cấp video demo và mô tả use case
   - Đợi 3-7 ngày để Facebook review

3. **Sau khi được approve:**
   - Update lại scopes trong code
   - Switch App từ Development mode sang Production mode
   - ✅ Có thể đăng bài thực sự!

## 🧪 Test trong Development Mode:

Hiện tại (với permissions có sẵn), bạn có thể test:

```javascript
// ✅ Hoạt động
- Kết nối accounts
- Lấy danh sách Pages/Instagram Accounts
- Xem insights và analytics
- Preview bài viết (UI)

// ❌ Chưa hoạt động (cần App Review)
- Đăng bài thực tế lên Facebook
- Đăng bài thực tế lên Instagram
```

## 📚 Tham khảo:

- [Facebook Permissions Reference](https://developers.facebook.com/docs/permissions/reference)
- [Facebook App Review Process](https://developers.facebook.com/docs/app-review)
- [Instagram Basic Display vs Graph API](https://developers.facebook.com/docs/instagram-basic-display-api)

## 🆘 Troubleshooting:

### Vẫn gặp lỗi "Invalid Scopes"?

1. **Clear browser cache:**
   ```bash
   Ctrl + Shift + Delete (Windows)
   Cmd + Shift + Delete (Mac)
   ```

2. **Revoke Facebook app permissions:**
   - Vào [Facebook Settings > Apps](https://www.facebook.com/settings?tab=applications)
   - Xóa app "AutoPost VN"
   - Thử kết nối lại

3. **Check Facebook App Settings:**
   - Đảm bảo App trong **Development Mode**
   - Thêm test users vào App Roles
   - Verify App không bị restricted

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

---

**Cập nhật:** 2025-10-15  
**Trạng thái:** ✅ Đã fix lỗi Invalid Scopes trong Development Mode
