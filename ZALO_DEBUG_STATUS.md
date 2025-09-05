# Zalo Debug Information 🔍

## ❌ **Vấn đề đã được xác định:**

### Error từ log:
```
🔍 OAuth Debug - Provider: zalo
🔍 OAuth Debug - Client ID: undefined
```

### Lý do:
- Code đang tìm `process.env.ZALO_APP_ID`
- Nhưng giá trị trả về `undefined`
- Có thể do environment variables chưa được load đúng

## 🔧 **Đã sửa:**

### 1. Environment Variables Mapping
```javascript
// OLD (❌ Lỗi)
zalo: process.env.ZALO_CLIENT_ID!,

// NEW (✅ Fixed)
zalo: process.env.ZALO_APP_ID!,
```

### 2. Client Secret Mapping  
```javascript
// OLD (❌ Lỗi) 
zalo: process.env.ZALO_CLIENT_SECRET!,

// NEW (✅ Fixed)
zalo: process.env.ZALO_APP_SECRET!,
```

## 📋 **Current .env.local values:**
```bash
ZALO_APP_ID=3254824024567022257
ZALO_APP_SECRET=i9LStLLIXVFz9cChG9W4
```

## 🧪 **Test URLs:**

### Facebook OAuth (✅ Working):
```
http://localhost:3000/api/oauth/facebook?action=connect
```

### Instagram OAuth (✅ Working):
```
http://localhost:3000/api/oauth/instagram?action=connect
```

### Zalo OAuth (🔧 Testing):
```
http://localhost:3000/api/oauth/zalo?action=connect
```

## 🎯 **Expected Zalo Debug Output:**
```bash
🔍 OAuth Debug - Provider: zalo
🔍 OAuth Debug - Client ID: 3254824024567022257
🔍 OAuth Debug - Generated URL: https://oauth.zaloapp.com/v4/oa/permission?client_id=3254824024567022257...
```

## 🚨 **Nếu vẫn undefined:**

### Kiểm tra .env.local:
1. Đảm bảo không có spaces xung quanh `=`
2. Không có quotes xung quanh values  
3. File được save properly

### Restart server:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Debug environment:
Thêm vào OAuth route để debug:
```javascript
console.log('🔍 All Zalo env vars:', {
  ZALO_APP_ID: process.env.ZALO_APP_ID,
  ZALO_APP_SECRET: process.env.ZALO_APP_SECRET,
  NODE_ENV: process.env.NODE_ENV
});
```

---

**Status**: Server restarted, ready to test Zalo OAuth với credentials đã fix! 🚀
