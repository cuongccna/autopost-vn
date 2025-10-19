# 🔧 Hướng Dẫn Cấu Hình Facebook App Từ Đầu

## 🚨 Lỗi hiện tại:
```
Invalid Scopes: email, pages_show_list, pages_read_engagement
```

**Nguyên nhân:** Facebook App chưa được cấu hình đúng hoặc thiếu Facebook Login product.

---

## ✅ GIẢI PHÁP: Cấu hình lại Facebook App

### Bước 1: Truy cập Facebook Developers

1. Mở https://developers.facebook.com/apps/
2. Đăng nhập với tài khoản Facebook của bạn
3. Tìm App ID: **1525461808873085**
   - Nếu không tìm thấy → Tạo app mới (xem Bước 1b)

### Bước 1b: Tạo App Mới (Nếu chưa có)

1. Click **"Create App"**
2. Chọn **"Business"** use case
3. Điền thông tin:
   - **App Name**: AutoPost VN
   - **App Contact Email**: your-email@example.com
4. Click **"Create App"**
5. **LƯU LẠI App ID và App Secret**

---

### Bước 2: Add Facebook Login Product

#### 2.1 Add Product
1. Vào **Dashboard** của app
2. Click **"Add Product"** (bên trái menu)
3. Tìm **"Facebook Login"**
4. Click **"Set Up"**

#### 2.2 Chọn Platform
- Chọn **"Web"**
- Site URL: `http://localhost:3000`
- Click **"Save"** và **"Continue"**

---

### Bước 3: Cấu hình Facebook Login Settings

#### 3.1 Valid OAuth Redirect URIs
1. Vào **Facebook Login** → **Settings** (menu bên trái)
2. Tìm **"Valid OAuth Redirect URIs"**
3. Thêm ĐÚNG các URLs sau:

```
http://localhost:3000/api/oauth/facebook?action=callback
http://localhost:3000/api/auth/oauth/facebook/callback
```

⚠️ **QUAN TRỌNG**: Copy chính xác, không thêm dấu cách hay ký tự thừa!

4. Click **"Save Changes"**

#### 3.2 Allowed Domains for Web Games (Optional)
- Thêm: `localhost`

---

### Bước 4: Cấu hình Basic Settings

1. Vào **Settings** → **Basic**
2. Điền các thông tin:

#### App Domains
```
localhost
```

#### Privacy Policy URL (Required)
```
http://localhost:3000/privacy
```

#### Terms of Service URL (Optional)
```
http://localhost:3000/terms
```

#### App Icon (Optional nhưng khuyến nghị)
- Upload logo 1024x1024px

3. Click **"Save Changes"**

---

### Bước 5: App Mode - Set to Development

1. Vào **Settings** → **Basic**
2. Tìm **"App Mode"** ở đầu trang
3. Đảm bảo là **"Development"** mode
   - ⚠️ Trong Development mode, chỉ Admin/Developer/Tester mới login được
   - ✅ Đây là mode phù hợp để test

---

### Bước 6: Add Test Users (Quan trọng!)

Vì app đang ở Development mode, bạn cần add tài khoản của mình làm tester:

#### Option A: Add Your Account as Developer
1. Vào **Roles** → **Roles** (menu bên trái)
2. Tìm **"Add Developers"**
3. Nhập tên hoặc email Facebook của bạn
4. Click **"Submit"**

#### Option B: Add Test Users
1. Vào **Roles** → **Test Users**
2. Click **"Add"**
3. Tạo test user mới
4. Login với test user để test OAuth

---

### Bước 7: Kiểm Tra App Review - Permissions

1. Vào **App Review** → **Permissions and Features**
2. Kiểm tra các permissions:

#### ✅ Permissions có sẵn (không cần review):
- `public_profile` - ✅ Should be available by default
- `email` - ⚠️ May need to be enabled

#### ⚠️ Permissions cần App Review:
- `pages_show_list` - ❌ Cần enable
- `pages_read_engagement` - ❌ Cần enable
- `pages_manage_posts` - ❌ Cần App Review

---

### Bước 8: Update Environment Variables

Sau khi cấu hình xong, cập nhật file `.env.local`:

```bash
# Facebook App Configuration
FACEBOOK_CLIENT_ID=1525461808873085
FACEBOOK_CLIENT_SECRET=YOUR_APP_SECRET_HERE

# URLs
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **LƯU Ý**: Lấy App Secret từ **Settings** → **Basic** → **App Secret** (click Show)

---

## 🧪 Testing Flow

### Test 1: Basic OAuth (Chỉ public_profile)

Code đã được update để chỉ dùng `public_profile`:

```typescript
scope: 'public_profile'
```

**Test steps:**
1. Restart dev server:
   ```powershell
   npm run dev
   ```

2. Mở browser và test OAuth:
   ```
   http://localhost:3000/api/oauth/facebook?action=connect
   ```

3. **Kết quả mong đợi:**
   - ✅ Redirect đến Facebook login
   - ✅ Hiển thị permission dialog
   - ✅ Chỉ yêu cầu "public_profile"
   - ✅ Callback thành công

4. **Nếu vẫn lỗi:**
   - Kiểm tra lại Redirect URIs
   - Đảm bảo account của bạn là Developer/Tester
   - Check App Mode = Development

---

## 🔍 Troubleshooting

### Lỗi 1: "App Not Set Up: This app is still in development mode"
**Solution:**
- ✅ OK, đây là normal trong development
- Thêm tài khoản của bạn vào Roles → Developers

### Lỗi 2: "redirect_uri_mismatch"
**Solution:**
- Copy chính xác redirect URI từ error message
- Add vào Facebook Login Settings → Valid OAuth Redirect URIs
- Thường là: `http://localhost:3000/api/oauth/facebook?action=callback`

### Lỗi 3: "Invalid Scopes: email, pages_show_list..."
**Solution:**
- ✅ Code đã được update để chỉ dùng `public_profile`
- Restart dev server
- Clear browser cache
- Test lại

### Lỗi 4: "Can't Load URL: The domain of this URL isn't included"
**Solution:**
- Vào Settings → Basic → App Domains
- Thêm: `localhost`
- Save Changes

### Lỗi 5: Access denied
**Solution:**
- User phải là Admin/Developer/Tester của app
- Add user vào Roles → Roles

---

## 📊 Current Configuration Status

### ✅ WORKING NOW (Minimal Setup):
```typescript
Scope: 'public_profile'
Can: Login, Get basic user info
Cannot: Access Pages, Post content
```

### 🔄 NEXT STEPS (After Facebook App Setup):

#### Phase 1: Add Email Permission
```typescript
scope: 'public_profile,email'
```
- Cần: Enable "email" trong App Review (usually available)

#### Phase 2: Add Pages Permissions
```typescript
scope: 'public_profile,email,pages_show_list,pages_read_engagement'
```
- Cần: Enable permissions trong Facebook App
- Có thể cần Business Verification

#### Phase 3: Add Publishing Permission
```typescript
scope: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts'
```
- Cần: Full App Review
- Cần: Business Verification
- Cần: Demo video & Documentation

---

## 🎯 Quick Checklist

Sau khi setup xong, check lại:

- [ ] Facebook Login product đã được add
- [ ] Valid OAuth Redirect URIs đã được add chính xác
- [ ] App Domains có `localhost`
- [ ] App Mode = Development
- [ ] User account là Developer/Tester của app
- [ ] Environment variables đã cập nhật đúng
- [ ] Dev server đã restart
- [ ] Browser cache đã clear

---

## 🚀 Test Commands

```powershell
# 1. Restart dev server
npm run dev

# 2. Test OAuth URL in browser
http://localhost:3000/api/oauth/facebook?action=connect

# 3. Check console logs for errors
# (Trong VS Code Terminal hoặc Browser Console)
```

---

## 📞 Support Resources

### Facebook Developer Documentation
- **Login**: https://developers.facebook.com/docs/facebook-login/
- **Permissions**: https://developers.facebook.com/docs/permissions/reference
- **App Review**: https://developers.facebook.com/docs/app-review

### Facebook Developer Support
- **Community**: https://developers.facebook.com/community/
- **Bug Reports**: https://developers.facebook.com/support/bugs/

---

## ✅ Success Criteria

Khi setup thành công, bạn sẽ thấy:

1. ✅ OAuth flow redirect đến Facebook
2. ✅ Permission dialog hiển thị
3. ✅ User có thể grant permissions
4. ✅ Callback về app thành công
5. ✅ Console log hiển thị user data

**Expected console output:**
```javascript
{
  provider: 'facebook',
  userId: 'facebook_user_id_123',
  name: 'Your Name',
  profilePicture: 'https://...'
}
```

---

## 🎓 Next Steps After Successful OAuth

1. **Test với minimal scope** (`public_profile`) ✅
2. **Add email permission** sau khi verify hoạt động
3. **Gradually add permissions** khi cần thiết
4. **Submit App Review** khi cần pages_manage_posts
5. **Move to Production** khi mọi thứ ổn định

---

**Good luck! 🚀**

*Nếu vẫn gặp lỗi, check lại từng bước trong checklist và đảm bảo đã làm đúng.*
