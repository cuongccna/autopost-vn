# FIX INSTAGRAM PERMISSION ERROR

## ❌ Lỗi hiện tại:
```json
{
  "error": "(#10) Requires instagram_content_publish permission to manage the object",
  "code": 10,
  "type": "OAuthException"
}
```

## ✅ NGUYÊN NHÂN:

Access token hiện tại **KHÔNG CÓ** permission `instagram_content_publish` vì:
1. Khi kết nối Instagram account, code chưa request permission này
2. Facebook App phải có permission này được enabled (✅ Đã có trong App settings)
3. Cần **RECONNECT** Instagram account để lấy token mới với permission đầy đủ

## 🔧 GIẢI PHÁP:

### Bước 1: Update Code (✅ ĐÃ HOÀN THÀNH)

File `src/app/api/oauth/[provider]/route.ts` đã được update:

```typescript
instagram: {
  scope: 'public_profile,email,pages_show_list,instagram_basic,instagram_content_publish,instagram_manage_comments,business_management',
  //                                                           ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
  //                                                        Permission mới được thêm
}
```

### Bước 2: Verify Facebook App Permissions

1. Đi tới https://developers.facebook.com/apps/1402460547980710/app-review/permissions/
2. Kiểm tra `instagram_content_publish` có status là:
   - ✅ **Standard Access** (không cần review)
   - ⏳ **In Review** (đang chờ duyệt)
   - ❌ **Not Requested** (cần request)

**LƯU Ý**: Trong **Development Mode**, permission này vẫn hoạt động với:
- Test Users
- Admins, Developers, Testers của App
- Accounts có role trong App

### Bước 3: Reconnect Instagram Account

#### Option A: Disconnect & Reconnect (KHUYẾN NGHỊ)

1. **Vào trang App:**
   - URL: `https://autopostvn.cloud/app`
   - Hoặc `http://localhost:3000/app`

2. **Disconnect Instagram account cũ:**
   - Tìm tài khoản Instagram trong danh sách
   - Click "Disconnect" hoặc "Xóa kết nối"

3. **Reconnect Instagram:**
   - Click "Connect Instagram" button
   - Facebook sẽ hiển thị popup yêu cầu permissions
   - **QUAN TRỌNG**: Kiểm tra popup có show `instagram_content_publish` không
   - Click "Continue" để authorize
   - Chọn Facebook Page đã link với Instagram Business account
   - Click "Done"

4. **Verify permissions của token mới:**
   ```bash
   # Kiểm tra trong database
   SELECT 
     account_name,
     provider,
     created_at,
     updated_at
   FROM autopostvn_social_accounts
   WHERE provider = 'instagram'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

#### Option B: Manual Token Refresh (Nếu có lỗi)

Nếu reconnect không hoạt động, xóa account trong database:

```sql
-- Connect to PostgreSQL
psql -U autopost_admin -d autopost_vn

-- Delete old Instagram connection
DELETE FROM autopostvn_social_accounts 
WHERE provider = 'instagram' 
AND user_email = 'teo@gmail.com';

-- Verify deleted
SELECT * FROM autopostvn_social_accounts 
WHERE provider = 'instagram';
```

Sau đó connect lại từ UI.

### Bước 4: Test Publishing

1. **Tạo bài viết test:**
   - Vào `/compose`
   - Thêm 1 ảnh hoặc video
   - Nhập caption
   - Chọn Instagram account

2. **Publish ngay hoặc schedule:**
   - Click "Post Now" hoặc "Schedule"
   - Check logs:
     ```bash
     # Development
     npm run dev
     
     # Production
     pm2 logs autopost-vn --lines 50
     ```

3. **Expected success response:**
   ```json
   {
     "success": true,
     "externalPostId": "17xxx...",
     "platformResponse": {
       "id": "17xxx..."
     }
   }
   ```

## 🔍 DEBUG CHECKLIST:

### 1. Verify App Permissions in Facebook Console
```
✅ instagram_basic - Available
✅ instagram_content_publish - MUST BE ENABLED
✅ pages_show_list - Available
✅ business_management - Available
```

### 2. Verify OAuth Scope in Code
File: `src/app/api/oauth/[provider]/route.ts`
```typescript
instagram: {
  scope: '...instagram_content_publish...'  // ✅ MUST INCLUDE THIS
}
```

### 3. Verify Token Permissions (GraphQL Debug)
```bash
curl -i -X GET "https://graph.facebook.com/v18.0/me/permissions?access_token=YOUR_INSTAGRAM_TOKEN"
```

Expected response:
```json
{
  "data": [
    {"permission": "instagram_basic", "status": "granted"},
    {"permission": "instagram_content_publish", "status": "granted"},
    {"permission": "pages_show_list", "status": "granted"}
  ]
}
```

### 4. Check Account Type
Instagram account **PHẢI LÀ**:
- ✅ Business Account
- ✅ Creator Account
- ❌ KHÔNG PHẢI Personal Account

Kiểm tra:
1. Mở Instagram app
2. Settings > Account
3. Xem loại account:
   - "Switch to Professional Account" → Personal (cần switch)
   - "Account Type: Business" → ✅ OK

## ⚠️ COMMON ISSUES:

### Issue 1: "instagram_content_publish not available"
**Giải pháp:**
- App đang ở Development Mode → Chỉ test được với Test Users
- Add tài khoản Instagram vào "Roles" > "Test Users" trong Facebook App

### Issue 2: "Permission already granted but still error"
**Giải pháp:**
- Token cũ không có permission mới
- **PHẢI DISCONNECT & RECONNECT** để lấy token mới

### Issue 3: "Invalid scope: instagram_content_publish"
**Giải pháp:**
- Facebook App chưa add Instagram product
- Vào App Dashboard > Add Product > Instagram

## 📊 APP REVIEW (For Production):

Để sử dụng với **bất kỳ user nào** (không chỉ Test Users), cần:

### 1. Submit App Review
- Vào https://developers.facebook.com/apps/1402460547980710/app-review/
- Request `instagram_content_publish` permission
- Cung cấp:
  - Video demo app
  - Detailed use case description
  - Privacy Policy URL
  - Terms of Service URL

### 2. App Requirements
- ✅ Verified Business
- ✅ Privacy Policy (public URL)
- ✅ Terms of Service (public URL)
- ✅ App Icon
- ✅ App Description

### 3. Review Time
- Thường: 3-7 ngày
- Có thể bị reject → cần điều chỉnh và submit lại

## 🎯 NEXT STEPS:

1. ✅ Code đã được update với `instagram_content_publish`
2. ⏳ **RECONNECT Instagram account để lấy token mới**
3. ⏳ Test publish một bài viết
4. ⏳ Monitor logs để verify success
5. ⏳ (Optional) Submit App Review cho Production

## ⚡ QUICK FIX (RIGHT NOW):

```bash
# 1. Deploy code changes (nếu trên production)
cd /var/www/autopost-vn
git pull
npm run build
pm2 restart autopost-vn

# 2. Reconnect Instagram:
# - Vào https://autopostvn.cloud/app
# - Disconnect Instagram
# - Connect lại Instagram
# - Chọn Page đã link với IG Business

# 3. Test publish:
# - Vào /compose
# - Upload 1 image
# - Select Instagram account
# - Click "Post Now"

# 4. Check logs:
pm2 logs autopost-vn --lines 20
```

Sau khi làm các bước trên, Instagram publishing sẽ hoạt động! 🎉
