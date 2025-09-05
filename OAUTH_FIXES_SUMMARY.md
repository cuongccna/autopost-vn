# OAuth Callback Fixes 🔧

## 🐛 Các lỗi đã được sửa:

### 1. ❌ Token Exchange Failed: Bad Request
**Nguyên nhân**: Facebook API expect URLSearchParams format
**Giải pháp**: 
- Sử dụng `new URLSearchParams()` thay vì object
- Thêm debug logs để trace request/response

### 2. ❌ Database Constraint: provider_account_id null
**Nguyên nhân**: Facebook API `/me/accounts` trả về pages, nhưng user chưa có pages
**Giải pháp**:
- Đổi endpoint thành `/me?fields=id,name,email` để lấy user info
- Validation `providerId` trước khi save database
- Thêm fallback values

### 3. ❌ Redirect URL Malformed
**Nguyên nhân**: NextJS yêu cầu absolute URLs cho redirect
**Giải pháp**:
- Thêm `baseUrl` vào tất cả redirect URLs
- Format: `${baseUrl}/app?oauth_error=...`

## 🔧 Chi tiết các fixes:

### exchangeCodeForToken()
```javascript
// OLD (❌ Lỗi)
body: new URLSearchParams(params),

// NEW (✅ Fixed)  
const params = new URLSearchParams({...});
body: params.toString(),
```

### getAccountInfo()
```javascript
// OLD (❌ Lỗi)
facebook: 'https://graph.facebook.com/v18.0/me/accounts',

// NEW (✅ Fixed)
facebook: 'https://graph.facebook.com/v18.0/me?fields=id,name,email',
```

### Redirect URLs
```javascript
// OLD (❌ Lỗi)
return NextResponse.redirect(`/app?oauth_error=...`);

// NEW (✅ Fixed)
return NextResponse.redirect(`${baseUrl}/app?oauth_error=...`);
```

## 🎯 Test Flow mới:

1. **OAuth Request**: ✅ Permissions đã fix (pages_show_list,pages_read_engagement)
2. **Facebook Authorization**: ✅ User grant permissions
3. **Callback với Code**: ✅ Nhận authorization code
4. **Token Exchange**: 🔧 Debug logs cho Facebook API call
5. **User Info**: 🔧 Lấy user profile thay vì pages
6. **Database Save**: 🔧 Validation và error handling
7. **Success Redirect**: 🔧 Absolute URL với success message

## 🚀 Test bây giờ:

1. Truy cập: `http://localhost:3000/api/oauth/facebook?action=connect`
2. Grant permissions trên Facebook
3. Xem debug logs trong terminal
4. Kiểm tra redirect về `/app` với success message

## 📊 Debug Information:

Các debug logs mới sẽ hiển thị:
- Token exchange request/response
- User info API call results  
- Database save operation details
- Detailed error messages

Nếu vẫn có lỗi, logs sẽ cho thấy chính xác bước nào fail!
