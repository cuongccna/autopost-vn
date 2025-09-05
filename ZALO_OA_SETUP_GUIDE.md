# Hướng dẫn lấy Zalo OA App ID và App Secret 🟦

## 📱 Bước 1: Truy cập Zalo Developer Console

1. Đi đến: **https://developers.zalo.me/**
2. Đăng nhập bằng tài khoản Zalo của bạn
3. Nếu chưa có tài khoản developer, đăng ký mới

## 🆕 Bước 2: Tạo ứng dụng mới

### 2.1 Tạo App
1. Click **"Tạo ứng dụng"** hoặc **"Create App"**
2. Chọn loại app: **"Official Account App"** (Ứng dụng Official Account)
3. Điền thông tin:
   - **Tên ứng dụng**: `AutoPost VN`
   - **Mô tả**: `Ứng dụng quản lý và đăng bài tự động cho Zalo OA`
   - **Website**: `http://localhost:3000` (hoặc domain thật của bạn)
   - **Category**: Business/Marketing

### 2.2 Xác thực
1. Xác nhận số điện thoại
2. Xác nhận email
3. Đồng ý các điều khoản sử dụng

## 🔑 Bước 3: Lấy App Credentials

### 3.1 Tại trang Dashboard
1. Sau khi tạo app thành công, vào **Dashboard**
2. Click vào app vừa tạo (`AutoPost VN`)
3. Vào tab **"Cài đặt"** hoặc **"Settings"**

### 3.2 Lấy thông tin cần thiết
```
App ID: [Số ID ứng dụng]
App Secret: [Chuỗi secret key]
```

**Ví dụ:**
```
App ID: 1234567890123456
App Secret: abcdef1234567890abcdef1234567890
```

## 🏢 Bước 4: Tạo/Kết nối Zalo OA

### 4.1 Tạo Official Account
1. Truy cập: **https://oa.zalo.me/**
2. Đăng nhập và tạo Official Account mới
3. Hoàn thành thông tin:
   - Tên OA
   - Loại hình kinh doanh  
   - Thông tin liên hệ
   - Upload avatar và cover

### 4.2 Kết nối OA với App
1. Trong Zalo Developer Console
2. Vào tab **"Official Account"**
3. Click **"Kết nối OA"** hoặc **"Connect OA"**
4. Chọn OA vừa tạo từ danh sách
5. Xác nhận kết nối

## ⚙️ Bước 5: Cấu hình Permissions

### 5.1 Cấu hình OAuth Redirect
1. Trong Developer Console, tab **"Cài đặt OAuth"**
2. Thêm **Redirect URI**:
   ```
   http://localhost:3000/api/oauth/zalo?action=callback
   ```
3. **Authorized domains**: `localhost`

### 5.2 Cấu hình Permissions
Tick vào các quyền cần thiết:
- ✅ **Quản lý tin nhắn** (Message Management)
- ✅ **Đăng bài viết** (Post Management) 
- ✅ **Xem thông tin OA** (OA Information)
- ✅ **Quản lý followers** (Follower Management)

## 📝 Bước 6: Cập nhật file .env.local

Thêm thông tin Zalo vào file `.env.local`:

```bash
# Zalo Configuration
ZALO_APP_ID=1234567890123456
ZALO_APP_SECRET=abcdef1234567890abcdef1234567890
```

## 🧪 Bước 7: Test Connection

### 7.1 Test OAuth Flow
1. Khởi động server: `npm run dev`
2. Truy cập: `http://localhost:3000/api/oauth/zalo?action=connect`
3. Đăng nhập Zalo và cấp quyền
4. Kiểm tra callback thành công

### 7.2 Kiểm tra logs
```bash
# Terminal sẽ hiển thị:
🔍 OAuth Debug - Provider: zalo
🔍 OAuth Debug - Client ID: 1234567890123456
🔍 Token Exchange Debug - Success: {...}
🔍 Account Info Debug - Data: {...}
```

## 📋 Thông tin cần lưu ý:

### Sandbox vs Production
- **Sandbox**: Test với số lượng user hạn chế
- **Production**: Cần submit app review để public

### Rate Limits
- **Message API**: 1000 tin nhắn/ngày (Sandbox)
- **Post API**: 100 bài viết/ngày (Sandbox)  
- **Production**: Giới hạn cao hơn sau khi review

### Webhook (Optional)
Nếu cần nhận real-time events:
```bash
# Webhook URL
https://yourdomain.com/api/webhooks/zalo

# Webhook Events
- Tin nhắn mới
- Theo dõi/Bỏ theo dõi  
- Tương tác bài viết
```

## 🔧 Troubleshooting

### Lỗi thường gặp:
1. **"Invalid App ID"**: Kiểm tra App ID có đúng không
2. **"Redirect URI mismatch"**: Thêm đúng callback URL trong settings
3. **"Permission denied"**: Kiểm tra OA đã kết nối với app chưa
4. **"Invalid signature"**: Kiểm tra App Secret

### Debug tips:
```bash
# Kiểm tra Zalo API response
curl -X GET "https://openapi.zalo.me/v2.0/oa/getinfo?access_token=YOUR_TOKEN"

# Kiểm tra OA info
curl -X GET "https://openapi.zalo.me/v2.0/oa/getprofile?access_token=YOUR_TOKEN"
```

## 📚 Tài liệu tham khảo:

- **Zalo Developer Docs**: https://developers.zalo.me/docs
- **OA API Reference**: https://developers.zalo.me/docs/api/official-account-api
- **OAuth Flow**: https://developers.zalo.me/docs/api/oauth-api

---

**Lưu ý**: Sau khi có App ID và Secret, hãy cập nhật file `.env.local` và restart server để test Zalo OAuth integration! 🚀
