# 🚀 VPS Deployment Fix Guide

## ❌ Lỗi: `ENOENT: no such file or directory, open '.next/prerender-manifest.json'`

### Nguyên nhân
Build **CHƯA HOÀN TẤT** hoặc bị lỗi giữa chừng.

---

## ✅ Giải pháp (Chạy trên VPS)

### **Bước 1: Chạy script chẩn đoán**
```bash
cd /var/www/autopost-vn
chmod +x diagnose.sh
./diagnose.sh
```

### **Bước 2: Clean rebuild (QUAN TRỌNG)**
```bash
# Xóa TOÀN BỘ build cũ và dependencies
rm -rf .next
rm -rf node_modules
rm -rf .swc

# Cài lại dependencies
npm install --legacy-peer-deps

# Build lại từ đầu
npm run build 2>&1 | tee build.log
```

### **Bước 3: Kiểm tra build thành công**
```bash
# Check file quan trọng
ls -la .next/prerender-manifest.json

# Nếu thấy file → OK
# Nếu không thấy → Check build.log
```

### **Bước 4: Nếu build failed - Check log**
```bash
# Xem 100 dòng cuối của build log
tail -100 build.log

# Hoặc search lỗi
grep -i "error" build.log
```

---

## 🔍 Các lỗi thường gặp

### **1. Lỗi: `output: 'standalone'` in next.config.mjs**

**Check:**
```bash
grep "standalone" next.config.mjs
```

**Fix:**
```bash
# Edit next.config.mjs
nano next.config.mjs

# Xóa dòng: output: 'standalone',
# Save: Ctrl+X, Y, Enter

# Rebuild
rm -rf .next
npm run build
```

### **2. Lỗi: OAuth callback routes failed**

**Symptom:**
```
Export encountered errors on following paths:
  /api/auth/oauth/facebook/callback/route
  /api/auth/oauth/instagram/callback/route
```

**Fix:** Đã fix trong code - pull code mới:
```bash
git pull
rm -rf .next node_modules
npm install
npm run build
```

### **3. Lỗi: Out of memory**

**Symptom:**
```
FATAL ERROR: Ineffective mark-compacts near heap limit
```

**Fix:**
```bash
# Build với more memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### **4. Lỗi: Missing dependencies**

**Symptom:**
```
Module not found: Can't resolve '@supabase/...'
```

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

---

## 📋 Complete Deployment Checklist

```bash
# === ON VPS ===

# 1. Go to project directory
cd /var/www/autopost-vn

# 2. Pull latest code
git pull origin main

# 3. Check Node version (need >= 18)
node --version

# 4. Run diagnostic
chmod +x diagnose.sh
./diagnose.sh

# 5. Clean install
rm -rf .next node_modules .swc
npm install --legacy-peer-deps

# 6. Build
npm run build 2>&1 | tee build.log

# 7. Verify build
ls -la .next/prerender-manifest.json  # Must exist
ls -la .next/BUILD_ID                  # Must exist
ls -la .next/server/                   # Must exist

# 8. Start server
npm run start

# 9. Test
curl http://localhost:3000
```

---

## 🎯 Quick Fix Script

Chạy script tự động:
```bash
cd /var/www/autopost-vn
chmod +x vps-deploy.sh
./vps-deploy.sh
```

Script sẽ:
1. ✅ Clean old build
2. ✅ Install dependencies
3. ✅ Build app
4. ✅ Verify build success
5. ✅ Show next steps

---

## 🔧 Manual Verification

### Check build output structure:
```bash
cd /var/www/autopost-vn
tree -L 2 .next/

# Should see:
# .next/
# ├── BUILD_ID
# ├── build-manifest.json
# ├── prerender-manifest.json  ← MUST HAVE
# ├── server/
# ├── static/
# └── trace
```

### Check critical files:
```bash
# Build ID
cat .next/BUILD_ID

# Prerender manifest (MUST exist)
cat .next/prerender-manifest.json | head -5

# Server routes
ls .next/server/app/
```

---

## 🐛 Still Not Working?

### Collect debug info:
```bash
# 1. System info
uname -a
node --version
npm --version

# 2. Build info
cat .next/BUILD_ID
ls -la .next/

# 3. Build log (last 200 lines)
tail -200 build.log

# 4. Config
cat next.config.mjs

# 5. Environment
cat .env.production
```

### Send info to developer:
```bash
# Create debug package
tar -czf debug-$(date +%Y%m%d-%H%M%S).tar.gz \
  build.log \
  .next/BUILD_ID \
  .next/required-server-files.json \
  next.config.mjs

# Download and send to team
```

---

## ✅ Success Indicators

When everything works:
```bash
$ npm run start

> autopost-vn@0.1.0 start
> next start

  ▲ Next.js 14.2.32
  - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in 2.3s
```

Test:
```bash
curl http://localhost:3000
# Should return HTML (not error)
```

---

## 📞 Support Commands

```bash
# Check if app is running
ps aux | grep "next"

# Check port 3000
netstat -tlnp | grep 3000

# Kill existing process
pkill -f "next start"

# Start fresh
npm run start

# Start with PM2 (production)
pm2 start "npm run start" --name autopost-vn
pm2 save
pm2 startup
```

---

## 🎉 Summary

**Problem:** Missing `.next/prerender-manifest.json`

**Root cause:** Incomplete build

**Solution:**
1. Remove: `output: 'standalone'` from `next.config.mjs`
2. Clean rebuild: `rm -rf .next node_modules && npm install && npm run build`
3. Verify: `ls .next/prerender-manifest.json`
4. Start: `npm run start`

**Prevention:** Always run full clean build on VPS after code changes.
