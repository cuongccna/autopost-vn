# Facebook App Setup Checklist

## Cấu hình cần thiết trong Facebook Developer Console

### 1. Basic Settings (Cài đặt cơ bản)
- ✅ App ID: `758504150137739` 
- ✅ App Secret: `af038b51f044c1456d3a4d30d3aeab22`
- ✅ App Name: `AutoPostVN`

### 2. App Domains (Miền ứng dụng)
Thêm vào "App Domains":
```
localhost
```

### 3. Privacy Policy & Terms (Chính sách bảo mật)
Cần điền:
- **URL chính sách quyền riêng tư**: `http://localhost:3000/privacy`
- **URL Điều khoản dịch vụ**: `http://localhost:3000/terms`

### 4. Facebook Login Settings
Vào **Products** → **Facebook Login** → **Settings**:

**Valid OAuth Redirect URIs** thêm:
```
http://localhost:3000/api/oauth/facebook?action=callback
```

### 5. App Review (Xem xét ứng dụng)
Để test trong Development mode:
- App cần ở chế độ "Development"
- Thêm test users hoặc users có role trong app

### 6. Permissions Required (CẬP NHẬT 2025)
⚠️ **LƯU Ý**: Facebook đã thay đổi permissions system!

**Permissions hiện tại hợp lệ:**
- `pages_show_list` - Liệt kê các Pages (Basic permission)
- `pages_read_engagement` - Đọc metrics của Page

**Permissions KHÔNG còn hợp lệ:**
- ❌ `pages_manage_posts` - Đã bị deprecated
- ❌ `publish_to_groups` - Requires App Review

**Để đăng bài lên Facebook Page, cần:**
1. Sử dụng **Facebook Pages API** với Graph API
2. App cần được approved trong **App Review**
3. Permissions cần: `pages_manage_posts` (chỉ sau khi approved)

**Giải pháp tạm thời cho Development:**
- Chỉ sử dụng `pages_show_list,pages_read_engagement`
- Test với việc lấy danh sách Pages và metrics
- Đăng bài sẽ cần implement sau khi App Review

## URLs cần cấu hình:

### OAuth Callback URL:
```
http://localhost:3000/api/oauth/facebook?action=callback
```

### Test URL:
```
http://localhost:3000/api/oauth/facebook?action=connect
```

## Kiểm tra App Status:
1. App Mode: Development hoặc Live
2. App Review: Các permissions đã được approve chưa
3. Test Users: Có thể thêm test users để test OAuth flow

## Lưu ý quan trọng:
- App đang ở Development mode nên chỉ Admin/Developer/Tester mới login được
- Cần submit App Review để public users có thể sử dụng
- Webhook cần setup để nhận real-time updates
