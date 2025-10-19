# 🔧 Hướng Dẫn Enable Facebook Pages API

## 🚨 Vấn đề: Không thấy pages_show_list, pages_read_engagement

Nếu trong **Graph API Explorer** bạn chỉ thấy:
- ✅ `email`, `public_profile`
- ✅ `user_photos`, `user_posts`, `user_videos`
- ❌ **KHÔNG** thấy `pages_show_list`, `pages_read_engagement`

→ **Facebook App chưa được setup Pages API**

---

## ✅ GIẢI PHÁP 1: Enable Pages Features (Preferred)

### Bước 1: Truy cập Facebook App Dashboard

```
https://developers.facebook.com/apps/1525461808873085/
```

### Bước 2: Check App Type/Use Case

1. Vào **Settings** → **Basic**
2. Xem **"Category"** hoặc **"App Type"**
3. Nếu không phải **"Business"**:
   - App có thể không support Pages API
   - Cần tạo app mới (xem Giải pháp 2)

### Bước 3: Add Facebook Login Product

1. Sidebar bên trái → Tìm **"Products"** hoặc **"Add Product"**
2. Tìm **"Facebook Login"**
3. Click **"Set Up"**
4. Chọn platform: **"Web"**
5. Site URL: `http://localhost:3000`
6. Click **"Save"** → **"Continue"**

### Bước 4: Configure Facebook Login Settings

1. Vào **Facebook Login** → **Settings**
2. **Valid OAuth Redirect URIs**:
   ```
   http://localhost:3000/api/oauth/facebook?action=callback
   http://localhost:3000/api/auth/oauth/facebook/callback
   ```
3. **Save Changes**

### Bước 5: Check App Review → Permissions

1. Vào **App Review** → **Permissions and Features**
2. Search: `pages`
3. **Nếu thấy Pages permissions:**
   - ✅ Tiếp tục với Bước 6
4. **Nếu KHÔNG thấy:**
   - ⚠️ App type không support Pages
   - 🔄 Chuyển sang Giải pháp 2

### Bước 6: Request Advanced Access (Nếu có Pages permissions)

1. Tìm `pages_show_list`
2. Click **"Request Advanced Access"**
3. Điền form (nếu có):
   - **Purpose**: "View user's Facebook Pages for social media management"
   - Click **"Request"**

4. Làm tương tự với `pages_read_engagement`

### Bước 7: Verify trong Graph API Explorer

1. Mở: https://developers.facebook.com/tools/explorer/
2. Chọn app: **1525461808873085**
3. Click **"Get Token"** → **"Get User Access Token"**
4. **Bây giờ bạn sẽ thấy:**
   - ✅ `pages_show_list`
   - ✅ `pages_read_engagement`

---

## ✅ GIẢI PHÁP 2: Tạo App Mới với Business Type

Nếu app hiện tại không support Pages API, tạo app mới:

### Bước 1: Create New App

1. Vào: https://developers.facebook.com/apps/create/
2. Click **"Create App"**

### Bước 2: Select App Type

Chọn **"Business"** (QUAN TRỌNG!)

**Các option thường có:**
- ❌ Consumer - Cho user authentication only
- ✅ **Business** - Support Pages API, Instagram API
- ❌ Gaming - Cho game apps

### Bước 3: Fill App Details

```
App Name: AutoPost VN Business
App Contact Email: your-email@example.com
```

Click **"Create App"**

### Bước 4: App Dashboard

Sau khi tạo xong:
1. **Lưu lại App ID và App Secret**
2. Vào **Settings** → **Basic**
3. Copy:
   ```
   App ID: XXXXXXXXXX
   App Secret: Click "Show" to reveal
   ```

### Bước 5: Add Products

1. Click **"Add Product"**
2. Add **"Facebook Login"**
3. Setup như Giải pháp 1, Bước 3-4

### Bước 6: Configure Settings

**App Domains:**
```
localhost
```

**Privacy Policy URL:**
```
http://localhost:3000/privacy
```

**Save Changes**

### Bước 7: Update .env.local

```bash
# New Facebook App Credentials
FACEBOOK_CLIENT_ID=NEW_APP_ID_HERE
FACEBOOK_CLIENT_SECRET=NEW_APP_SECRET_HERE
```

### Bước 8: Verify Pages API

1. Vào **App Review** → **Permissions and Features**
2. Search: `pages`
3. Bạn sẽ thấy:
   ```
   ✅ pages_show_list
   ✅ pages_read_engagement
   ⚠️ pages_manage_posts (needs full review)
   ```

---

## ✅ GIẢI PHÁP 3: Use Business Integration (Advanced)

Nếu 2 cách trên không work:

### Create Business Integration

1. Thay vì "Create App", chọn **"Create Business Integration"**
2. Select **"Facebook Pages"** as primary use case
3. Fill details và complete setup

---

## 🧪 TEST: Verify Pages Permissions Available

### Quick Check Script:

```bash
# 1. Get User Access Token from Graph API Explorer
#    Select app → Get Token → Check available permissions

# 2. Test if you can see Pages permissions
curl -X GET "https://graph.facebook.com/v18.0/me/permissions?access_token=YOUR_TOKEN"

# Expected output should include:
# {
#   "data": [
#     { "permission": "public_profile", "status": "granted" },
#     { "permission": "email", "status": "granted" },
#     { "permission": "pages_show_list", "status": "granted" },  <-- Looking for this
#     { "permission": "pages_read_engagement", "status": "granted" }  <-- And this
#   ]
# }
```

---

## 📊 Comparison: App Types

| Feature | Consumer App | Business App | Business Integration |
|---------|-------------|--------------|---------------------|
| User Login | ✅ | ✅ | ✅ |
| User Permissions | ✅ | ✅ | ✅ |
| **Pages API** | ❌ | ✅ | ✅ |
| **Instagram API** | ❌ | ✅ | ✅ |
| Graph API | Limited | Full | Full |
| App Review | Simple | Required | Required |

---

## 🎯 Recommended Path

### Path A: If Current App Supports (Try First)
1. ✅ Add Facebook Login product
2. ✅ Request Advanced Access for pages_show_list
3. ✅ Request Advanced Access for pages_read_engagement
4. ✅ Update code with new permissions

### Path B: If Current App Doesn't Support (Most Likely)
1. ✅ Create new **Business** type app
2. ✅ Setup Facebook Login
3. ✅ Update .env.local with new credentials
4. ✅ Request Advanced Access for Pages permissions
5. ✅ Update code

### Path C: Long-term (For Production)
1. ✅ Complete App Review for pages_manage_posts
2. ✅ Submit demo video
3. ✅ Get approval (1-2 weeks)
4. ✅ Enable posting features

---

## 🔄 After Setup: Update Code

Once you have Pages permissions available:

### Update OAuth Scope:

```typescript
// File: src/app/api/oauth/[provider]/route.ts
const OAUTH_CONFIGS = {
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    // ✅ With Pages API enabled
    scope: 'public_profile,email,pages_show_list,pages_read_engagement',
    responseType: 'code',
  },
```

### Restart Dev Server:

```powershell
npm run dev
```

### Test OAuth:

```
http://localhost:3000/api/oauth/facebook?action=connect
```

---

## 🚨 Troubleshooting

### Issue 1: Still don't see Pages permissions after setup
**Solution:**
- Wait 5-10 minutes for Facebook to propagate changes
- Clear browser cache
- Try Graph API Explorer again
- Verify app type is "Business"

### Issue 2: "This permission is not available"
**Solution:**
- App must be Business type
- Facebook Login must be configured
- May need Business Verification for some features

### Issue 3: App Review required
**Solution:**
- `pages_show_list` usually doesn't need review
- `pages_read_engagement` usually doesn't need review
- `pages_manage_posts` ALWAYS needs full App Review

---

## 📝 Current Status & Next Steps

### ✅ Current Code (Updated):
```typescript
scope: 'public_profile,email'
```

### 🔄 After Pages API Setup:
```typescript
scope: 'public_profile,email,pages_show_list,pages_read_engagement'
```

### 🎯 After App Review:
```typescript
scope: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts'
```

---

## 💡 Pro Tips

1. **Always start with Business app type** - Saves time later
2. **Request Advanced Access early** - Some permissions take time to approve
3. **Test in Graph API Explorer first** - Before updating code
4. **Keep old app as backup** - Don't delete until new app works
5. **Document app credentials** - Save App ID/Secret securely

---

## 🆘 If Nothing Works

**Last Resort Options:**

### Option 1: Use Facebook Business Suite API
- More complex but more reliable
- Direct access to Pages
- Better for production

### Option 2: Use Third-party Service
- Buffer API
- Hootsuite API
- Later.com API

### Option 3: Manual Page Token
- Get Page Access Token manually from Graph API Explorer
- Use directly in code (not recommended for production)
- Only for testing

---

**Hãy thử tạo Business app mới nếu app hiện tại không có Pages permissions! 🚀**
