# Facebook Permissions Guide 2025 📚

## ❌ LỖI: Invalid Scopes: pages_manage_posts

### Nguyên nhân:
Facebook đã thay đổi **permissions system** và một số permissions cũ không còn hợp lệ hoặc yêu cầu App Review.

## ✅ GIẢI PHÁP:

### 1. Permissions Hợp Lệ Hiện Tại (Không cần App Review):

**Facebook:**
```
pages_show_list          - Liệt kê các Facebook Pages
pages_read_engagement   - Đọc metrics và insights của Page
```

**Instagram:**
```
pages_show_list          - Liệt kê các Pages/Instagram Business Accounts
pages_read_engagement   - Đọc metrics của Instagram
instagram_basic         - Basic Instagram access (CẦN KIỂM TRA App Review)
```

### 2. Permissions Cần App Review:
```
pages_manage_posts        - Đăng bài lên Page (YÊU CẦU APP REVIEW)
instagram_content_publish - Đăng bài lên Instagram (YÊU CẦU APP REVIEW)
pages_manage_metadata     - Quản lý Page settings
publish_to_groups         - Đăng bài lên Groups
```

## 🔧 Cấu hình hiện tại đã sửa:

**Facebook - Trước (❌ Lỗi):**
```javascript
scope: 'pages_manage_posts,pages_read_engagement,pages_show_list'
```

**Facebook - Sau (✅ Hoạt động):**
```javascript
scope: 'pages_show_list,pages_read_engagement'
```

**Instagram - Trước (❌ Lỗi):**
```javascript
scope: 'instagram_basic,instagram_content_publish,pages_show_list'
```

**Instagram - Sau (✅ Hoạt động):**
```javascript
scope: 'pages_show_list,pages_read_engagement,instagram_basic'
```

## 📋 Kế hoạch phát triển:

### Phase 1: Development Testing (Hiện tại)
- ✅ OAuth flow với basic permissions
- ✅ Lấy danh sách Facebook Pages
- ✅ Đọc Page metrics và insights
- ✅ Test user authentication

### Phase 2: App Review Submission
Để có thể đăng bài, cần:
1. **Hoàn thiện App Information:**
   - Privacy Policy URL
   - Terms of Service URL
   - App Category
   - App Description

2. **Submit App Review cho permissions:**
   - `pages_manage_posts`
   - `pages_manage_metadata` (nếu cần)

3. **Cung cấp documentation:**
   - Use case cho việc đăng bài
   - Screenshots của app workflow
   - Video demo

### Phase 3: Production Ready
- ✅ All permissions approved
- ✅ Public users có thể login
- ✅ Full posting functionality

## 🎯 Testing hiện tại:

### Test OAuth Flow:
1. Truy cập: `http://localhost:3000/api/oauth/facebook?action=connect`
2. Sẽ redirect đến Facebook OAuth
3. Grant permissions: `pages_show_list`, `pages_read_engagement`
4. Callback sẽ nhận authorization code
5. Exchange code for access token

### Expected Results:
- ✅ Không còn "Invalid Scopes" error
- ✅ OAuth dialog hiển thị đúng permissions
- ✅ Có thể lấy danh sách Facebook Pages

## 🚨 Lưu ý quan trọng:

1. **Development Mode:**
   - Chỉ Admin/Developer/Tester của app login được
   - Cần add test users trong Facebook App settings

2. **Production Mode:**
   - Cần App Review cho advanced permissions
   - Public users có thể login với basic permissions

3. **Alternative Solutions:**
   - Có thể sử dụng Facebook Creator Studio API
   - Graph API với Business Manager
   - Third-party scheduling tools integration

## 📊 Permissions Reference:

| Permission | Description | Review Required |
|------------|-------------|-----------------|
| `pages_show_list` | List user's pages | ❌ No |
| `pages_read_engagement` | Read page metrics | ❌ No |
| `pages_manage_posts` | Create/manage posts | ✅ Yes |
| `pages_manage_metadata` | Manage page settings | ✅ Yes |
| `business_management` | Business Manager access | ✅ Yes |

Với cấu hình mới, OAuth flow sẽ hoạt động mà không có lỗi "Invalid Scopes"!
