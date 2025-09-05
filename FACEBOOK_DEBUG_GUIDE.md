🔧 **Facebook App Configuration Checklist**

## ✅ **Bước 1: Kiểm tra App ID trong Facebook Developers**

1. Vào https://developers.facebook.com/apps/
2. Chọn app ID: `758504150137739`
3. Verify thông tin:
   - App ID: `758504150137739` ✓
   - App Secret: `af038b51f044c1456d3a4d30d3aeab22` ✓

## ✅ **Bước 2: Cấu hình OAuth Redirect URIs**

```
App Dashboard > Products > Facebook Login > Settings > Valid OAuth Redirect URIs:

✓ http://localhost:3000/api/oauth/facebook?action=callback
✓ http://localhost:3000/api/oauth/facebook/callback
✓ https://yourdomain.com/api/oauth/facebook?action=callback (for production)
```

## ✅ **Bước 3: App Review & Permissions**

```
App Dashboard > App Review:
- App Mode: Development (cho testing)
- Test Users: Thêm Facebook account của bạn vào Test Users
- Permissions cần approve: pages_manage_posts, pages_read_engagement
```

## ✅ **Bước 4: Testing với Test Account**

```
1. Tạo test user trong Facebook App Dashboard
2. Login với test user
3. Test OAuth flow
```

## 🚨 **Common Issues:**

### Issue 1: App in Development Mode
- **Problem**: Chỉ test users có thể connect
- **Solution**: Thêm tài khoản của bạn vào Test Users

### Issue 2: Invalid Redirect URI  
- **Problem**: localhost callback URL chưa được add
- **Solution**: Add exact callback URL vào Facebook App settings

### Issue 3: Missing Permissions
- **Problem**: App chưa request đúng permissions
- **Solution**: Add pages_manage_posts, pages_read_engagement

## 🔍 **Debug Steps:**

1. Check console logs trong browser
2. Check Network tab để xem redirect URL
3. Verify App ID trong request
4. Check Facebook App Dashboard > Webhooks for errors
