# 📝 Facebook App Review Guide - pages_manage_posts Permission

## 🎯 Mục đích
Hướng dẫn chi tiết cách submit Facebook App Review để xin quyền **`pages_manage_posts`** - quyền cần thiết để đăng bài lên Facebook Pages.

---

## 📊 Hiện trạng Permissions

### ✅ Permissions hiện có (KHÔNG cần App Review):
```
✓ public_profile     - Thông tin profile công khai
✓ email              - Email address của user
✓ pages_show_list    - Xem danh sách Pages
✓ pages_read_engagement - Đọc metrics và engagement
```

### 🔒 Permission cần xin (CẦN App Review):
```
⚠️ pages_manage_posts - Tạo, chỉnh sửa và xóa posts trên Pages
```

---

## 🚀 Quy trình Submit App Review

### Bước 1: Chuẩn bị Ứng dụng

#### 1.1 Hoàn thiện thông tin App
Truy cập: https://developers.facebook.com/apps/YOUR_APP_ID/settings/basic/

**Checklist:**
- [x] App Name: Tên rõ ràng, dễ hiểu
- [x] App Icon: Logo 1024x1024px
- [x] Privacy Policy URL: Chính sách bảo mật
- [x] Terms of Service URL: Điều khoản sử dụng
- [x] App Domain: Domain chính thức của app
- [x] Business Use Case: Mô tả rõ ràng mục đích sử dụng

#### 1.2 Cấu hình Facebook Login
Vào **Products** → **Facebook Login** → **Settings**

**Valid OAuth Redirect URIs:**
```
https://yourdomain.com/api/auth/oauth/facebook/callback
https://yourdomain.com/api/oauth/facebook?action=callback
```

⚠️ **LƯU Ý**: Phải sử dụng HTTPS cho production!

#### 1.3 Thêm Verification Contact
Vào **Settings** → **Basic** → **Contact Email**
- Email phải được xác thực
- Dùng để Facebook liên hệ trong quá trình review

---

### Bước 2: Tạo Screencast Demo

#### 2.1 Yêu cầu Screencast
Facebook yêu cầu video demo cho thấy:
1. **User login flow** - Người dùng đăng nhập vào app
2. **Permission request** - App yêu cầu quyền pages_manage_posts
3. **Feature usage** - Sử dụng tính năng đăng bài thực tế
4. **Post result** - Bài đăng xuất hiện trên Facebook Page

#### 2.2 Script Demo (Tiếng Việt)
```
[Cảnh 1 - Login]
"Xin chào, tôi sẽ demo ứng dụng AutoPost VN.
Đầu tiên, tôi đăng nhập bằng tài khoản Facebook..."

[Cảnh 2 - Connect Page]
"Sau khi đăng nhập, tôi kết nối Facebook Page của mình.
App yêu cầu quyền để đăng bài lên Page..."

[Cảnh 3 - Create Post]
"Bây giờ tôi tạo một bài đăng mới với nội dung và hình ảnh..."

[Cảnh 4 - Schedule/Publish]
"Tôi có thể lên lịch hoặc đăng ngay lập tức..."

[Cảnh 5 - Verify on Facebook]
"Và đây là bài đăng đã xuất hiện trên Facebook Page của tôi."
```

#### 2.3 Tools gợi ý
- **OBS Studio** (Free) - https://obsproject.com/
- **Loom** (Free plan available) - https://www.loom.com/
- **Camtasia** (Paid) - https://www.techsmith.com/video-editor.html

**Yêu cầu video:**
- Độ phân giải: Tối thiểu 720p
- Format: MP4, MOV, AVI
- Thời lượng: 2-5 phút
- Audio: Tiếng Anh (khuyến nghị) hoặc phụ đề tiếng Anh

---

### Bước 3: Submit App Review

#### 3.1 Truy cập App Review Dashboard
https://developers.facebook.com/apps/YOUR_APP_ID/app-review/

#### 3.2 Request Permission
1. Click **"Request Advanced Access"**
2. Tìm **"pages_manage_posts"**
3. Click **"Request"**

#### 3.3 Điền Form

**1. Permission Name:**
```
pages_manage_posts
```

**2. How does your app use this permission?**
```
AutoPost VN helps users manage and schedule posts across multiple social media 
platforms. We use pages_manage_posts permission to:

1. Create scheduled posts on behalf of users to their Facebook Pages
2. Allow users to draft, edit, and publish content to their Pages
3. Enable bulk post scheduling for content marketing campaigns
4. Provide a unified dashboard for managing Facebook Page content

Users explicitly grant this permission during the OAuth flow, and we only 
post content that users create through our platform interface.
```

**3. Provide detailed step-by-step instructions:**
```
Step 1: User signs up/logs in to AutoPost VN at https://yourdomain.com
Step 2: User navigates to "Connected Accounts" section
Step 3: User clicks "Connect Facebook Page" button
Step 4: User is redirected to Facebook OAuth dialog
Step 5: User grants pages_manage_posts permission
Step 6: User is redirected back to the app with access token
Step 7: User can now create and schedule posts to their Facebook Page
Step 8: User creates a new post with text, images, and scheduled time
Step 9: User clicks "Publish" or "Schedule"
Step 10: Post appears on the selected Facebook Page at scheduled time

Test User Credentials (if required):
Email: [YOUR_TEST_EMAIL]
Password: [YOUR_TEST_PASSWORD]
```

**4. Upload Screencast:**
- Upload video demo đã chuẩn bị
- Đảm bảo video cho thấy đầy đủ flow như mô tả

**5. Additional Information:**
```
- App is used by content creators and social media managers
- All posts are created by users through our interface
- We do not auto-generate or spam content
- Users can review posts before publishing
- Users can revoke access anytime through Facebook settings
```

---

### Bước 4: Cấu hình App cho Review

#### 4.1 Tạo Test User
Vào **Roles** → **Test Users** → **Add**

Tạo test user với:
- Test account có Facebook Page
- Page đã có vài bài đăng để trông tự nhiên
- Credentials rõ ràng cho reviewer

#### 4.2 App Mode
- **Development Mode**: Chỉ Admin/Developer/Tester test được
- **Live Mode**: Public users có thể sử dụng

⚠️ **KHÔNG** chuyển sang Live Mode cho đến khi App Review approved!

---

## 🎯 Checklist Trước Khi Submit

### App Configuration
- [ ] App Icon uploaded (1024x1024px)
- [ ] Privacy Policy URL active
- [ ] Terms of Service URL active
- [ ] App Domain configured
- [ ] OAuth Redirect URIs correct (HTTPS for production)

### Demo Materials
- [ ] Screencast video recorded (2-5 minutes)
- [ ] Video shows complete user flow
- [ ] Video quality good (720p+)
- [ ] Audio clear or has English subtitles

### Test Account
- [ ] Test user created
- [ ] Test user has Facebook Page
- [ ] Test credentials documented
- [ ] Test flow works end-to-end

### Documentation
- [ ] Use case clearly explained
- [ ] Step-by-step instructions detailed
- [ ] Additional information provided

---

## ⏱️ Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| **Preparation** | 1-2 days | Hoàn thiện app info, tạo video demo |
| **Submit** | 1 hour | Điền form và upload materials |
| **Review** | 3-7 days | Facebook review app (có thể lâu hơn) |
| **Revisions** | 2-3 days | Nếu bị reject, sửa và submit lại |

**Tổng thời gian dự kiến:** 1-2 tuần

---

## ✅ Sau Khi Được Approve

### 1. Cập nhật Scope trong Code

**File:** `src/app/api/auth/oauth/[provider]/route.ts`
```typescript
const OAUTH_CONFIGS = {
  facebook: {
    baseUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    // ✅ PRODUCTION: With App Review approval
    scope: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/facebook/callback`
  },
```

**File:** `src/app/api/oauth/[provider]/route.ts`
```typescript
const OAUTH_CONFIGS = {
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    // ✅ PRODUCTION: With App Review approval
    scope: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts',
    responseType: 'code',
  },
```

### 2. Test với Real Users
- Yêu cầu một vài beta users test flow
- Verify posts xuất hiện đúng trên Pages
- Monitor error logs

### 3. Chuyển App sang Live Mode
Vào **Settings** → **Basic** → **App Mode** → Switch to **Live**

⚠️ **CHỈ** chuyển sang Live sau khi:
- App Review approved
- Code đã update với full permissions
- Test thành công với beta users

---

## 🚨 Lý Do Có Thể Bị Reject

### ❌ Common Rejection Reasons:

1. **Incomplete Demo**
   - Video không rõ ràng
   - Thiếu bước trong flow
   - Không show post result trên Facebook

2. **Privacy Policy Issues**
   - URL không hoạt động
   - Không đầy đủ thông tin
   - Không mention Facebook data usage

3. **Use Case Unclear**
   - Mô tả không chi tiết
   - Không giải thích tại sao cần permission
   - Use case không hợp lệ

4. **Test Credentials Invalid**
   - Test user không hoạt động
   - Không có Facebook Page
   - Flow bị lỗi

### ✅ Cách Khắc Phục:

1. **Đọc kỹ feedback** từ Facebook
2. **Sửa đúng vấn đề** được chỉ ra
3. **Update documentation** nếu cần
4. **Re-record video** nếu demo không rõ
5. **Re-submit** với changes noted

---

## 📚 Resources

### Official Documentation
- **Facebook App Review**: https://developers.facebook.com/docs/app-review
- **Pages API**: https://developers.facebook.com/docs/pages-api
- **Login Permissions**: https://developers.facebook.com/docs/permissions/reference

### Support
- **Developer Community**: https://developers.facebook.com/community/
- **Bug Reports**: https://developers.facebook.com/support/bugs/

### Privacy Policy Templates
- **Termly**: https://termly.io/products/privacy-policy-generator/
- **PrivacyPolicies.com**: https://www.privacypolicies.com/

---

## 💡 Tips & Best Practices

### ✅ DO's:
- Mô tả use case rõ ràng và chi tiết
- Video demo chất lượng cao, có audio
- Test credentials hoạt động 100%
- Privacy Policy đầy đủ và accessible
- Trả lời reviewer questions nhanh chóng

### ❌ DON'Ts:
- Submit khi app chưa hoàn chỉnh
- Video quá dài hoặc quá ngắn
- Use case mơ hồ hoặc spam-like
- Ignore reviewer feedback
- Rush vào Live mode khi chưa sẵn sàng

---

## 🎯 Next Steps

1. **Hoàn thiện app** theo checklist trên
2. **Record demo video** theo script
3. **Prepare test account** với Facebook Page
4. **Review lại tất cả** trước khi submit
5. **Submit App Review** và đợi response
6. **Monitor email** để nhận feedback từ Facebook

---

**Good luck với App Review! 🚀**

*Nếu có câu hỏi, tham khảo Facebook Developer Community hoặc documentation.*
