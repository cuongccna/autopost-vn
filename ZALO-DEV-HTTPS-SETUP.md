# 🔒 Zalo HTTPS Setup cho Development

## ⚠️ Vấn đề
Zalo yêu cầu **Home URL phải có HTTPS** ngay cả trong development mode, nhưng `http://localhost:3000` không pass được.

---

## ✅ Giải pháp 1: Dùng ngrok (Khuyên dùng - 5 phút)

### Bước 1: Cài đặt ngrok
```powershell
# Cách 1: Dùng Chocolatey (nếu đã cài)
choco install ngrok

# Cách 2: Download trực tiếp
# https://ngrok.com/download
# Extract và copy ngrok.exe vào thư mục project
```

### Bước 2: Tạo tài khoản ngrok (FREE)
1. Truy cập: https://dashboard.ngrok.com/signup
2. Đăng ký (có thể dùng GitHub/Google)
3. Copy **Authtoken** từ: https://dashboard.ngrok.com/get-started/your-authtoken

### Bước 3: Authenticate ngrok
```powershell
ngrok config add-authtoken YOUR_TOKEN_HERE
```

### Bước 4: Start Next.js app
```powershell
npm run dev
```
App chạy tại: http://localhost:3000

### Bước 5: Start ngrok tunnel (Terminal mới)
```powershell
ngrok http 3000
```

**Output sẽ có:**
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```

### Bước 6: Cấu hình Zalo Developer
Copy URL ngrok (ví dụ: `https://abc123.ngrok-free.app`) và điền vào Zalo:

**Home URL:**
```
https://abc123.ngrok-free.app
```

**Callback URL:**
```
https://abc123.ngrok-free.app/api/oauth/zalo/callback
```

### Bước 7: Update .env.local
```bash
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
```

### Bước 8: Restart Next.js
```powershell
# Ctrl+C để stop
npm run dev
```

### Bước 9: Test OAuth
1. Mở: https://abc123.ngrok-free.app/app
2. Click "Kết nối Zalo"
3. ✅ Should work!

---

## ✅ Giải pháp 2: Dùng Cloudflare Tunnel (Miễn phí, ổn định hơn)

### Bước 1: Cài Cloudflare Tunnel
```powershell
# Download cloudflared
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
winget install --id Cloudflare.cloudflared
```

### Bước 2: Authenticate
```powershell
cloudflared tunnel login
```
Browser sẽ mở → Đăng nhập Cloudflare → Chọn domain (hoặc dùng trycloudflare.com miễn phí)

### Bước 3: Start tunnel
```powershell
# Start Next.js trước
npm run dev

# Terminal mới - Start tunnel
cloudflared tunnel --url http://localhost:3000
```

**Output:**
```
Your quick Tunnel has been created! Visit it at:
https://random-name.trycloudflare.com
```

### Bước 4: Cấu hình Zalo
Copy URL cloudflare và điền vào Zalo:

**Home URL:**
```
https://random-name.trycloudflare.com
```

**Callback URL:**
```
https://random-name.trycloudflare.com/api/oauth/zalo/callback
```

### Bước 5: Update .env.local
```bash
NEXT_PUBLIC_APP_URL=https://random-name.trycloudflare.com
```

Restart Next.js và test!

---

## ✅ Giải pháp 3: Tạo HTTPS cho localhost (Phức tạp)

### Dùng mkcert
```powershell
# Cài mkcert
choco install mkcert

# Tạo local CA
mkcert -install

# Tạo certificate cho localhost
mkcert localhost
```

### Cấu hình Next.js với HTTPS
Tạo file `server.js`:
```javascript
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('./localhost-key.pem'),
  cert: fs.readFileSync('./localhost.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
  });
});
```

**Nhưng Zalo VẪN KHÔNG CHẤP NHẬN `https://localhost`** vì cần domain thật!

❌ **Giải pháp này KHÔNG WORK với Zalo**

---

## 🎯 So sánh giải pháp

| Giải pháp | Ưu điểm | Nhược điểm | Khuyên dùng |
|-----------|---------|------------|-------------|
| **ngrok** | ✅ Dễ setup<br>✅ Stable URL với paid plan<br>✅ Nhiều features | ⚠️ URL thay đổi mỗi lần restart (free)<br>⚠️ Có warning page | ⭐⭐⭐⭐⭐ |
| **Cloudflare Tunnel** | ✅ Miễn phí vĩnh viễn<br>✅ Không cần account (trycloudflare)<br>✅ Tốc độ nhanh | ⚠️ URL random mỗi lần restart<br>⚠️ Ít features hơn ngrok | ⭐⭐⭐⭐ |
| **mkcert + localhost** | ✅ Không cần internet<br>✅ Không cần service thứ 3 | ❌ Zalo không chấp nhận localhost<br>❌ Phức tạp setup | ❌ KHÔNG DÙNG |

---

## 🚀 Workflow khuyên dùng (ngrok)

### Setup 1 lần:
```powershell
# 1. Cài ngrok
choco install ngrok

# 2. Authenticate
ngrok config add-authtoken YOUR_TOKEN

# 3. Tạo file start-dev.ps1
```

**File `start-dev.ps1`:**
```powershell
# Start Next.js trong background
Start-Process powershell -ArgumentList "npm run dev" -WindowStyle Minimized

# Đợi 5 giây cho Next.js khởi động
Start-Sleep -Seconds 5

# Start ngrok
ngrok http 3000
```

### Mỗi lần dev:
```powershell
.\start-dev.ps1
```

### Update Zalo URLs:
- Copy ngrok URL từ terminal
- Paste vào Zalo Developer Dashboard
- Update `NEXT_PUBLIC_APP_URL` trong `.env.local`
- Restart Next.js (`Ctrl+C` và `npm run dev`)

---

## 💡 Tip: Dùng ngrok paid để có static URL

**Ngrok Paid ($8/month):**
- Static subdomain: `https://autopostvn.ngrok.app`
- Không cần update Zalo mỗi lần restart
- Không có warning page

**Setup static domain:**
```powershell
ngrok http 3000 --domain=autopostvn.ngrok.app
```

**Cấu hình Zalo 1 LẦN:**
```
Home URL: https://autopostvn.ngrok.app
Callback: https://autopostvn.ngrok.app/api/oauth/zalo/callback
```

**.env.local (KHÔNG CẦN THAY ĐỔI):**
```bash
NEXT_PUBLIC_APP_URL=https://autopostvn.ngrok.app
```

---

## 🎯 Quick Start (Khuyên dùng nhất)

### 1. Cài ngrok
```powershell
# Download: https://ngrok.com/download
# Hoặc dùng Chocolatey:
choco install ngrok
```

### 2. Đăng ký ngrok FREE
https://dashboard.ngrok.com/signup

### 3. Copy authtoken
https://dashboard.ngrok.com/get-started/your-authtoken

### 4. Authenticate
```powershell
ngrok config add-authtoken YOUR_TOKEN_HERE
```

### 5. Start dev environment
```powershell
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000
```

### 6. Copy ngrok URL
Ví dụ: `https://1a2b3c4d.ngrok-free.app`

### 7. Cấu hình Zalo
**Home URL:**
```
https://1a2b3c4d.ngrok-free.app
```

**Callback URL:**
```
https://1a2b3c4d.ngrok-free.app/api/oauth/zalo/callback
```

### 8. Update .env.local
```bash
NEXT_PUBLIC_APP_URL=https://1a2b3c4d.ngrok-free.app
```

### 9. Restart Next.js
```powershell
# Ctrl+C trong Terminal 1
npm run dev
```

### 10. Test
Mở: `https://1a2b3c4d.ngrok-free.app/app`

---

## 🔧 Troubleshooting

### Lỗi: "ngrok not found"
**Giải pháp:** Restart PowerShell sau khi cài ngrok

### Lỗi: "Failed to validate credentials"
**Giải pháp:** 
```powershell
ngrok config add-authtoken YOUR_TOKEN
```

### Lỗi: "Session Expired"
**Giải pháp:** ngrok free session hết hạn sau 2h, restart ngrok:
```powershell
# Ctrl+C để stop ngrok
ngrok http 3000
```

### Lỗi: "Visit site" warning page
**Giải pháp:** 
- Click "Visit Site" (1 lần mỗi session)
- Hoặc upgrade ngrok paid ($8/month) để bỏ warning

### Zalo callback error: "redirect_uri mismatch"
**Nguyên nhân:** URL trong `.env.local` khác với URL trong Zalo Dashboard

**Giải pháp:**
1. Check ngrok URL: Xem terminal ngrok
2. Update Zalo Dashboard: Paste exact URL
3. Update `.env.local`: `NEXT_PUBLIC_APP_URL=https://...`
4. Restart Next.js

---

## 📊 Kiểm tra setup thành công

### 1. Check ngrok running
```powershell
# Terminal ngrok phải hiển thị:
Session Status: online
Forwarding: https://xxx.ngrok-free.app -> http://localhost:3000
```

### 2. Check Next.js running
```powershell
# Terminal Next.js phải hiển thị:
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 3. Check .env.local
```bash
NEXT_PUBLIC_APP_URL=https://xxx.ngrok-free.app
```

### 4. Check Zalo Dashboard
- Home URL: ✅ `https://xxx.ngrok-free.app`
- Callback URL: ✅ `https://xxx.ngrok-free.app/api/oauth/zalo/callback`

### 5. Test OAuth flow
1. Mở: `https://xxx.ngrok-free.app/app`
2. Click "Kết nối Zalo"
3. Should redirect to Zalo login
4. After login → redirect back with success

---

## 🎉 Summary

**Khuyên dùng: ngrok FREE**
- ✅ Setup 5 phút
- ✅ Miễn phí
- ✅ Đủ cho development

**Lưu ý:**
- ⚠️ URL thay đổi mỗi lần restart ngrok
- ⚠️ Cần update Zalo Dashboard + `.env.local` mỗi lần đổi URL
- 💡 Upgrade paid ($8/month) để có static URL

**Production:**
- Deploy lên Vercel/Netlify → có HTTPS sẵn
- Không cần ngrok
- URL cố định: `https://autopostvn.vercel.app`
