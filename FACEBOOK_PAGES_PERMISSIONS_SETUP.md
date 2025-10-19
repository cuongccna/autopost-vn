# 🔐 Facebook Pages Permissions - Hướng Dẫn Setup

## 🎯 Vấn đề hiện tại

Bạn đang thấy **User Permissions** (email, user_age_range, user_birthday, v.v.) nhưng để **đăng bài lên Facebook Page**, bạn cần **Pages Permissions**.

---

## 📊 Phân biệt 2 loại Permissions

### 1. **User Permissions** ❌ (Không dùng để post)
```
email, user_birthday, user_friends, user_posts, v.v.
```
- Dùng để đọc thông tin cá nhân của user
- KHÔNG cho phép post lên Facebook Page
- Những gì bạn đang thấy trong danh sách

### 2. **Pages Permissions** ✅ (Cần để post)
```
pages_show_list
pages_read_engagement
pages_manage_posts
pages_manage_metadata
```
- Dùng để quản lý Facebook Pages
- CHO PHÉP đăng bài lên Page
- Cần được request riêng

---

## 🔍 Cách Tìm Pages Permissions trong Facebook Developers

### Bước 1: Add Facebook Login Product (Nếu chưa có)

1. Vào https://developers.facebook.com/apps/1525461808873085
2. Sidebar → Click **"Add Product"**
3. Tìm **"Facebook Login"** → Click **"Set Up"**
4. Chọn **"Web"** platform

### Bước 2: Tìm Pages Permissions

**⚠️ QUAN TRỌNG**: Pages Permissions KHÔNG nằm trong tab "Permissions" của User!

#### Option A: Qua App Review → Permissions and Features

1. Vào **App Review** (sidebar bên trái)
2. Click **"Permissions and Features"**
3. Tìm kiếm: `pages_`
4. Bạn sẽ thấy:
   ```
   ✅ pages_show_list
   ✅ pages_read_engagement  
   ⚠️ pages_manage_posts (Requires App Review)
   ```

#### Option B: Qua Graph API Explorer

1. Vào https://developers.facebook.com/tools/explorer/
2. Chọn app của bạn: **1525461808873085**
3. Click **"Get Token"** → **"Get User Access Token"**
4. Trong popup, bạn sẽ thấy **tất cả permissions** có sẵn
5. Tìm tab hoặc search: **"Pages"**
6. Check các permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`

---

## 🚀 Setup Pages Permissions - Chi Tiết

### Cách 1: Qua Graph API Explorer (Recommended cho Testing)

#### Bước 1: Truy cập Graph API Explorer
```
https://developers.facebook.com/tools/explorer/
```

#### Bước 2: Generate Access Token
1. Chọn **Your App** (1525461808873085)
2. Click **"Get Token"** → **"Get User Access Token"**
3. Popup sẽ hiện lên với danh sách permissions

#### Bước 3: Select Pages Permissions
Trong popup, tìm và check:
- ✅ `pages_show_list` - List user's pages
- ✅ `pages_read_engagement` - Read page metrics
- ⚠️ `pages_manage_posts` - Create/manage posts (cần App Review)

#### Bước 4: Generate Token & Test
1. Click **"Generate Access Token"**
2. Grant permissions trên Facebook
3. Copy token để test

---

### Cách 2: Qua App Review (Cho Production)

#### Bước 1: Request Advanced Access
1. Vào **App Review** → **Permissions and Features**
2. Tìm `pages_show_list` → Click **"Request Advanced Access"**
3. Tìm `pages_read_engagement` → Click **"Request Advanced Access"**

#### Bước 2: For pages_manage_posts (Requires Full Review)
1. Tìm `pages_manage_posts`
2. Click **"Request"**
3. Điền form:
   - **How does your app use this permission?**
   - **Step-by-step instructions**
   - **Upload screencast video**

---

## 🔧 Cập Nhật Code Sau Khi Có Permissions

### Stage 1: Basic Pages Access (Không cần App Review)

```typescript
// File: src/app/api/oauth/[provider]/route.ts
const OAUTH_CONFIGS = {
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    // ✅ Stage 1: Basic Pages Permissions
    scope: 'public_profile,email,pages_show_list,pages_read_engagement',
    responseType: 'code',
  },
```

**Với scope này bạn có thể:**
- ✅ Login user
- ✅ Lấy danh sách Facebook Pages của user
- ✅ Đọc metrics và insights của Page
- ❌ CHƯA thể post lên Page

### Stage 2: Full Pages Management (Sau App Review)

```typescript
const OAUTH_CONFIGS = {
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    // ✅ Stage 2: Full Pages Permissions (after App Review)
    scope: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts',
    responseType: 'code',
  },
```

**Với scope này bạn có thể:**
- ✅ Login user
- ✅ Lấy danh sách Facebook Pages
- ✅ Đọc metrics
- ✅ **ĐĂng BÀI LÊN PAGE** 🎯

---

## 🎯 Roadmap Triển Khai

### Phase 1: Hiện tại ✅
```
Scope: public_profile
Status: WORKING
```

**Next Action:** Cập nhật scope để lấy Pages list

### Phase 2: List Pages (Không cần App Review) 🔄
```
Scope: public_profile,email,pages_show_list,pages_read_engagement
Status: CẦN UPDATE CODE
```

**Checklist:**
- [ ] Add permissions qua Graph API Explorer (test)
- [ ] Request Advanced Access cho `pages_show_list`
- [ ] Request Advanced Access cho `pages_read_engagement`
- [ ] Update code với scope mới
- [ ] Test OAuth flow
- [ ] Implement API để lấy danh sách Pages

### Phase 3: Post to Pages (Cần App Review) 📝
```
Scope: ...pages_manage_posts
Status: CẦN APP REVIEW
```

**Checklist:**
- [ ] Hoàn thiện app information (Privacy Policy, Terms)
- [ ] Record demo video
- [ ] Submit App Review cho `pages_manage_posts`
- [ ] Đợi approval (1-2 tuần)
- [ ] Update code với scope mới
- [ ] Implement API để post lên Page

---

## 🛠️ Test Pages Permissions với Graph API Explorer

### Step-by-Step Test:

#### 1. Get User Access Token
```
https://developers.facebook.com/tools/explorer/
→ Get Token → Get User Access Token
→ Select: pages_show_list, pages_read_engagement
→ Generate Token
```

#### 2. Test Get Pages List
```
GET /me/accounts
```

**Expected Response:**
```json
{
  "data": [
    {
      "access_token": "PAGE_ACCESS_TOKEN_HERE",
      "category": "Business",
      "name": "Your Page Name",
      "id": "123456789",
      "tasks": ["ANALYZE", "ADVERTISE", "CREATE_CONTENT"]
    }
  ]
}
```

#### 3. Test Post to Page (với pages_manage_posts)
```
POST /{page-id}/feed
?message=Test post from AutoPost VN
&access_token={page-access-token}
```

---

## 📋 Checklist Setup Pages Permissions

### Immediate Actions (Development):
- [ ] Vào Graph API Explorer
- [ ] Generate token với `pages_show_list,pages_read_engagement`
- [ ] Test lấy danh sách Pages
- [ ] Verify token permissions
- [ ] Update code với scope mới

### Short-term (1-2 days):
- [ ] Request Advanced Access cho `pages_show_list`
- [ ] Request Advanced Access cho `pages_read_engagement`
- [ ] Update OAuth scope trong code
- [ ] Test OAuth flow end-to-end
- [ ] Implement Pages list API

### Long-term (2-4 weeks):
- [ ] Prepare App Review materials
- [ ] Record screencast demo
- [ ] Submit App Review cho `pages_manage_posts`
- [ ] Wait for approval
- [ ] Update code với posting permission
- [ ] Implement post publishing API

---

## 💡 Quick Test Script

Tạo file test để verify permissions:

```javascript
// test-facebook-pages-permissions.js
const axios = require('axios');

async function testPagesPermissions(userAccessToken) {
  try {
    console.log('🧪 Testing Facebook Pages Permissions\n');
    
    // 1. Get current token permissions
    const debugRes = await axios.get(
      `https://graph.facebook.com/v18.0/debug_token`,
      {
        params: {
          input_token: userAccessToken,
          access_token: userAccessToken
        }
      }
    );
    
    console.log('📋 Current Permissions:');
    console.log(debugRes.data.data.scopes);
    console.log('');
    
    // 2. Get user's pages
    const pagesRes = await axios.get(
      'https://graph.facebook.com/v18.0/me/accounts',
      {
        params: {
          access_token: userAccessToken
        }
      }
    );
    
    console.log('📄 Your Facebook Pages:');
    pagesRes.data.data.forEach(page => {
      console.log(`  - ${page.name} (ID: ${page.id})`);
      console.log(`    Tasks: ${page.tasks ? page.tasks.join(', ') : 'none'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Usage:
// 1. Get token from Graph API Explorer
// 2. Run: node test-facebook-pages-permissions.js
const TOKEN = 'YOUR_USER_ACCESS_TOKEN_HERE';
testPagesPermissions(TOKEN);
```

---

## 🚨 Troubleshooting

### Issue 1: Không thấy Pages Permissions
**Solution:**
- Permissions pages_ không nằm trong User Permissions list
- Phải tìm qua App Review → Permissions and Features
- Hoặc dùng Graph API Explorer để request

### Issue 2: pages_manage_posts không available
**Solution:**
- Permission này **YÊU CẦU App Review**
- Không thể test trong Development mode
- Phải submit full App Review với video demo

### Issue 3: Advanced Access vs Standard Access
**Solution:**
- **Standard Access**: Limited testing
- **Advanced Access**: Production use, không cần review cho basic permissions
- Request Advanced Access cho `pages_show_list` và `pages_read_engagement`

---

## 🎯 Action Items - NGAY BÂY GIỜ

1. **Vào Graph API Explorer:**
   ```
   https://developers.facebook.com/tools/explorer/
   ```

2. **Generate token với Pages permissions:**
   - Select app: 1525461808873085
   - Get Token → Get User Access Token
   - Check: `pages_show_list`, `pages_read_engagement`

3. **Test lấy danh sách Pages:**
   - Query: `/me/accounts`
   - Verify bạn thấy danh sách Pages

4. **Nếu thành công:**
   - Update code scope
   - Test OAuth flow
   - Implement Pages list feature

5. **Nếu muốn đăng bài:**
   - Cần submit App Review cho `pages_manage_posts`
   - Follow hướng dẫn trong `FACEBOOK_APP_REVIEW_GUIDE.md`

---

**Ready to update code với Pages permissions? 🚀**
