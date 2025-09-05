# Instagram Permissions Guide 2025 📸

## ❌ LỖI: Invalid Scopes: instagram_basic, instagram_content_publish

### Nguyên nhân:
Facebook đã thay đổi **Instagram API permissions system** và nhiều permissions cũ không còn hợp lệ hoặc yêu cầu App Review.

## 🔍 Instagram API Options:

### 1. Instagram Basic Display API (Deprecated)
- ❌ **instagram_basic** - Đã deprecated từ 2024
- ❌ **instagram_content_publish** - Không còn hỗ trợ cho apps mới
- ⚠️ Chỉ còn hoạt động cho apps đã tồn tại trước đó

### 2. Instagram Graph API (Business/Creator)
- ✅ **pages_show_list** - Liệt kê Instagram Business Accounts 
- ✅ **pages_read_engagement** - Đọc insights và metrics
- ❌ **instagram_manage_posts** - Cần App Review
- ❌ **instagram_manage_comments** - Cần App Review

## ✅ GIẢI PHÁP hiện tại:

### Phase 1: Development (Instagram Business)
```javascript
// Instagram via Facebook Pages API
scope: 'pages_show_list,pages_read_engagement'
```

**Lưu ý**: Instagram Business accounts được quản lý thông qua Facebook Pages API, không cần Instagram-specific permissions cho basic access.

## 🔧 Cấu hình đã sửa:

**Trước (❌ Lỗi):**
```javascript
instagram: {
  authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  scope: 'instagram_basic,instagram_content_publish,pages_show_list',
  responseType: 'code',
}
```

**Sau (✅ Hoạt động):**
```javascript
instagram: {
  authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  scope: 'pages_show_list,pages_read_engagement',
  responseType: 'code',
}
```

## 📋 Instagram Setup Requirements:

### 1. Facebook Developer Console
- App cần được setup trong Facebook Developer Console
- Same App ID/Secret cho cả Facebook và Instagram
- Instagram Business API access

### 2. Instagram Business Account
- User cần có Instagram Business Account
- Instagram Business Account phải connect với Facebook Page
- Không hoạt động với Personal Instagram accounts

### 3. Permissions Flow
1. User authorize Facebook permissions
2. App lấy danh sách Facebook Pages
3. Từ Pages, lấy connected Instagram Business accounts
4. Access Instagram data thông qua Pages API

## 🎯 API Endpoints cho Instagram:

### Get Instagram Business Accounts:
```
GET /v18.0/{page-id}?fields=instagram_business_account
```

### Get Instagram Media:
```
GET /v18.0/{instagram-business-account-id}/media
```

### Get Instagram Insights:
```
GET /v18.0/{instagram-media-id}/insights
```

## 🚫 Limitations hiện tại:

### What Works:
- ✅ List Instagram Business accounts
- ✅ Read Instagram insights/metrics  
- ✅ Get Instagram media information
- ✅ Basic account information

### What Requires App Review:
- ❌ Post to Instagram
- ❌ Manage Instagram comments
- ❌ Access Instagram DMs
- ❌ Advanced content management

## 🔄 Migration Path:

### Old Instagram Basic Display API:
```javascript
// DEPRECATED - Không còn hoạt động
scope: 'instagram_basic,user_profile,user_media'
authUrl: 'https://api.instagram.com/oauth/authorize'
```

### New Instagram Business API:
```javascript
// CURRENT - Hoạt động thông qua Facebook
scope: 'pages_show_list,pages_read_engagement'
authUrl: 'https://www.facebook.com/v18.0/dialog/oauth'
```

## 🎯 Test Flow cho Instagram:

1. **OAuth Request**: ✅ Same as Facebook với updated permissions
2. **Facebook Authorization**: ✅ User grant Facebook permissions  
3. **Get Pages**: ✅ Lấy danh sách Facebook Pages
4. **Get Instagram Accounts**: ✅ Từ Pages lấy connected Instagram accounts
5. **Access Instagram Data**: ✅ Thông qua Pages API

## 📊 Expected Results:

Sau khi OAuth thành công, app sẽ có access đến:
- Facebook Pages của user
- Instagram Business accounts connected với các Pages đó
- Basic insights và metrics
- Media information (không phải content posting)

**Lưu ý**: Để post content lên Instagram, cần submit App Review cho advanced permissions!

---
**Cập nhật**: Instagram OAuth bây giờ sẽ hoạt động với cùng flow như Facebook, không còn lỗi "Invalid Scopes"! 🎉
