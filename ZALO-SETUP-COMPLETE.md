# 📱 Zalo Integration - Setup Complete

## ✅ Tính năng đã sẵn sàng

Zalo integration đã được implement đầy đủ với:
- ✅ OAuth 2.0 authentication flow
- ✅ Post text messages
- ✅ Post với media (ảnh/video)
- ✅ Carousel/Gallery (nhiều ảnh)
- ✅ Error handling với Zalo error codes
- ✅ Token encryption & refresh

---

## 🔑 Thông tin App

**App ID:** `3254824024567022257`
**App Secret:** `i9LStLLIXVFz9cChG9W4`

---

## 🛠️ Cấu hình Zalo Developer Dashboard

### Bước 1: Truy cập Zalo Developer
1. Mở: https://developers.zalo.me/app/3254824024567022257/login
2. Đăng nhập với tài khoản Zalo của bạn
3. Click vào app "AutoPost VN"

### Bước 2: Cấu hình OAuth Settings

#### 📍 Home URL (Development):
```
http://localhost:3000
```

#### 📍 Callback URL (Development):
```
http://localhost:3000/api/oauth/zalo/callback
```

**Cách thêm:**
1. Scroll xuống section "Đăng nhập bằng Zalo" > Tab "Web"
2. Nhập Home URL vào field "Home URL"
3. Nhập Callback URL vào field "Official Account Callback Url"
4. Click nút "Add URL" bên phải
5. Click "Lưu thay đổi"

### Bước 3: Cấu hình cho Production (khi deploy)

#### 📍 Home URL (Production):
```
https://autopost-vn.vercel.app
```
*(Thay bằng domain thực tế của bạn)*

#### 📍 Callback URLs (Production - Thêm CẢ HAI):
```
http://localhost:3000/api/oauth/zalo/callback
https://autopost-vn.vercel.app/api/oauth/zalo/callback
```

**Lưu ý:** Zalo cho phép thêm nhiều callback URLs, nên giữ cả localhost và production.

---

## 🧪 Hướng dẫn Test (Development)

### 1. Start Development Server
```bash
npm run dev
```

### 2. Kết nối Zalo OA
1. Mở: http://localhost:3000/app
2. Click vào "Kết nối Zalo"
3. Đăng nhập Zalo (nếu chưa login)
4. Chọn Official Account (OA) bạn muốn kết nối
5. Click "Đồng ý" để cấp quyền
6. Redirect về app với thông báo "Kết nối thành công"

### 3. Đăng bài lên Zalo
1. Vào page `/compose`
2. Chọn Zalo account vừa kết nối
3. Nhập nội dung bài viết
4. (Optional) Upload hình ảnh/video
5. Click "Đăng bài ngay" hoặc "Lên lịch"
6. Kiểm tra Zalo OA để verify bài đăng

---

## 📊 API Endpoints

### OAuth Flow
```
GET /api/oauth/zalo?action=connect
→ Redirect to Zalo OAuth
→ User grants permission
→ Redirect to /api/oauth/zalo/callback?code=...&state=...
→ Exchange code for access_token
→ Save encrypted token to database
→ Redirect to /app?oauth_success=zalo
```

### Publish Flow
```
POST /api/posts/publish
Body: {
  content: "Nội dung bài viết",
  mediaUrls: ["https://..."],
  platforms: ["zalo"],
  accountIds: ["zalo-account-id"]
}
→ ZaloPublisher.publish()
→ POST https://openapi.zalo.me/v3.0/oa/message/cs
→ Return { success: true, externalPostId: "..." }
```

---

## 🔍 Zalo API Endpoints được sử dụng

### 1. OAuth Authorization
```
https://oauth.zaloapp.com/v4/oa/permission
```
**Params:**
- `app_id`: 3254824024567022257
- `redirect_uri`: http://localhost:3000/api/oauth/zalo/callback
- `state`: base64_encoded_user_data

### 2. Token Exchange
```
POST https://oauth.zaloapp.com/v4/oa/access_token
```
**Body:**
- `client_id`: ZALO_APP_ID
- `client_secret`: ZALO_APP_SECRET
- `code`: authorization_code
- `grant_type`: authorization_code

**Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 86400
}
```

### 3. Get OA Info
```
GET https://openapi.zalo.me/v2.0/oa/getinfo?access_token=...
```
**Response:**
```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "oa_id": "1234567890",
    "name": "Tên OA",
    "description": "..."
  }
}
```

### 4. Send Message (Post Publishing)
```
POST https://openapi.zalo.me/v3.0/oa/message/cs
```
**Headers:**
- `Content-Type: application/json`
- `access_token: <access_token>`

**Body (Text only):**
```json
{
  "recipient": {
    "user_id": "broadcast"
  },
  "message": {
    "text": "Nội dung bài viết"
  }
}
```

**Body (With Image):**
```json
{
  "recipient": {
    "user_id": "broadcast"
  },
  "message": {
    "attachment": {
      "type": "image",
      "payload": {
        "url": "https://...",
        "caption": "Nội dung bài viết"
      }
    }
  }
}
```

**Body (Carousel/Multiple Images):**
```json
{
  "recipient": {
    "user_id": "broadcast"
  },
  "message": {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "list",
        "elements": [
          {
            "title": "Hình 1",
            "image_url": "https://...",
            "subtitle": "Nội dung bài viết"
          },
          {
            "title": "Hình 2",
            "image_url": "https://..."
          }
        ]
      }
    }
  }
}
```

---

## ⚠️ Zalo API Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| -124 | Token expired | Kết nối lại account |
| -201 | OA not approved/blocked | Verify OA status |
| -213 | No permission to message user | Check OA permissions |
| -214 | Content violates policy | Modify content |
| -216 | Daily message limit reached | Wait or upgrade plan |
| -232 | Invalid attachment or too large | Check file size/format |

**Xem full error codes:** https://developers.zalo.me/docs/api/official-account-api/phu-luc/ma-loi-post-5150

---

## 📝 Zalo Publishing Features

### ✅ Supported
- [x] Text posts
- [x] Single image posts
- [x] Single video posts
- [x] Carousel/Gallery (up to 4 images)
- [x] Captions with media
- [x] Immediate publishing
- [x] Token refresh

### ⚠️ Limitations
- [ ] Scheduled posts (Zalo API không support - system sẽ publish ngay)
- [ ] Hashtags (Zalo không recommend dùng hashtags)
- [ ] Video carousels (chỉ support image carousel)
- [ ] Broadcast requires approved OA

---

## 🔐 Security

### Token Encryption
Tokens được encrypt trước khi lưu database:
```typescript
import { OAuthTokenManager } from '@/lib/services/TokenEncryptionService';

// Save
const encrypted = OAuthTokenManager.encryptForStorage(accessToken);
await db.insert({ token_encrypted: encrypted });

// Use
const decrypted = OAuthTokenManager.decryptForUse(encrypted);
```

### Token Refresh
```typescript
// Auto-refresh khi token gần hết hạn
await userManagementService.refreshToken(accountId);
```

---

## 🧩 Code Architecture

### 1. OAuth Handler
**File:** `src/app/api/oauth/zalo/callback/route.ts`
- Nhận code từ Zalo
- Exchange code → access_token
- Get OA info
- Save encrypted token

### 2. Publisher Service
**File:** `src/lib/social-publishers.ts`
- Class: `ZaloPublisher extends BaseSocialPublisher`
- Methods:
  - `publish()` - Main publish logic
  - `createSingleMediaMessage()` - Single image/video
  - `createCarouselMessage()` - Multiple images
  - `getZaloErrorMessage()` - Parse error codes

### 3. Database Schema
**Table:** `autopostvn_user_social_accounts`
```sql
{
  provider: 'zalo',
  provider_id: 'oa_id',
  account_name: 'Tên OA',
  token_encrypted: '...',
  refresh_token_encrypted: '...',
  expires_at: timestamp
}
```

---

## 🎯 Testing Checklist

### OAuth Flow
- [ ] Click "Kết nối Zalo" → redirect to Zalo
- [ ] Login with Zalo account
- [ ] Select OA
- [ ] Grant permissions
- [ ] Redirect back với success message
- [ ] Account hiển thị trong danh sách

### Publishing
- [ ] Post text only → verify trên OA
- [ ] Post với 1 ảnh → verify caption + image
- [ ] Post với nhiều ảnh → verify carousel
- [ ] Post với video → verify video plays
- [ ] Schedule post → publish ngay (Zalo không support schedule)

### Error Handling
- [ ] Token expired → show re-connect message
- [ ] Network error → show retry option
- [ ] Content policy violation → show error details

---

## 📞 Support Resources

- **Zalo Developer Docs:** https://developers.zalo.me/docs/official-account
- **OA API Reference:** https://developers.zalo.me/docs/api/official-account-api
- **Error Codes:** https://developers.zalo.me/docs/api/official-account-api/phu-luc/ma-loi-post-5150
- **Testing:** Use Zalo Developer Console to test API calls

---

## 🚀 Production Deployment

### Before Deploy
1. ✅ Update `.env` với production URLs:
   ```bash
   NEXT_PUBLIC_APP_URL=https://autopost-vn.vercel.app
   ZALO_APP_ID=3254824024567022257
   ZALO_APP_SECRET=i9LStLLIXVFz9cChG9W4
   ```

2. ✅ Add production callback URL in Zalo Developer:
   ```
   https://autopost-vn.vercel.app/api/oauth/zalo/callback
   ```

3. ✅ Test OAuth flow với production URL

4. ✅ Test publishing từ production app

### Post-Deploy
- Monitor error logs trong Supabase
- Check activity logs: `autopostvn_system_activity_logs`
- Verify token refresh hoạt động

---

## 📊 Database Queries

### Check Zalo Accounts
```sql
SELECT 
  id,
  account_name,
  provider_id,
  created_at,
  expires_at
FROM autopostvn_user_social_accounts
WHERE provider = 'zalo';
```

### Check Zalo Posts
```sql
SELECT 
  p.id,
  p.content,
  p.media_urls,
  p.status,
  p.created_at
FROM autopostvn_posts p
WHERE p.platforms @> '["zalo"]'::jsonb
ORDER BY p.created_at DESC;
```

### Check Publish Logs
```sql
SELECT 
  action_type,
  description,
  status,
  additional_data,
  created_at
FROM autopostvn_system_activity_logs
WHERE action_category = 'post'
  AND additional_data->>'provider' = 'zalo'
ORDER BY created_at DESC;
```

---

## ✨ Summary

**Setup Steps:**
1. ✅ Credentials đã có trong `.env.local`
2. ✅ Code đã implement đầy đủ
3. 🔧 Cần config Zalo Developer Dashboard:
   - Home URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/oauth/zalo/callback`
4. 🧪 Test OAuth flow
5. 🚀 Deploy production

**Ready to use! 🎉**
