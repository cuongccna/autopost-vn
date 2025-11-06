# 🚀 VPS Deployment Guide

## 🔧 Quick Fix for Build Errors

### **Problem: `ENOENT: no such file or directory, open '.next/prerender-manifest.json'`**

**Solution:**

```bash
cd /var/www/autopost-vn

# Clean rebuild
rm -rf .next
npm run build
npm run start
```

---

## 📋 Complete Deployment Steps

### **1. One-time Setup (First deployment)**

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
cd /var/www
git clone https://github.com/your-repo/autopost-vn.git
cd autopost-vn

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
nano .env.local  # Edit with your values

# Build
npm run build

# Start with PM2
pm2 start npm --name "autopost-vn" -- start
pm2 save
pm2 startup
```

### **2. Regular Updates (Pull new code)**

**Option A: Automated Script** ✅
```bash
cd /var/www/autopost-vn
chmod +x deploy-vps.sh
./deploy-vps.sh
```

**Option B: Manual Steps**
```bash
cd /var/www/autopost-vn

# Pull code
git pull

# Clean build
rm -rf .next
npm install
npm run build

# Restart
pm2 restart autopost-vn
```

---

## 🐛 Common Issues & Fixes

### **1. Build warnings spam**
```
Dynamic server usage: Route /api/... couldn't be rendered statically
```

**Fix:** These are **NOT errors** - ignore them. Build still succeeds.

To suppress:
```bash
npm run build 2>&1 | grep -v "Dynamic server usage"
```

### **2. Build fails with "ENOENT: prerender-manifest.json"**

**Fix:**
```bash
# Check next.config.mjs - should NOT have:
# output: 'standalone'

# If it does, remove it and rebuild:
rm -rf .next
npm run build
```

### **3. PM2 not starting**

**Fix:**
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs autopost-vn

# Delete and restart
pm2 delete autopost-vn
pm2 start npm --name "autopost-vn" -- start
```

### **4. Port 3000 already in use**

**Fix:**
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill it
sudo kill -9 <PID>

# Or use different port
PORT=3001 npm run start
```

### **5. Environment variables not loaded**

**Fix:**
```bash
# Check .env.local exists
ls -la .env.local

# Verify variables
cat .env.local | grep NEXT_PUBLIC

# Rebuild with new env
rm -rf .next
npm run build
pm2 restart autopost-vn
```

---

## 📊 Monitoring

### **Check Status**
```bash
# PM2 status
pm2 status

# Logs (live)
pm2 logs autopost-vn

# Last 100 lines
pm2 logs autopost-vn --lines 100

# Memory usage
pm2 monit
```

### **Check App Health**
```bash
# Check if app responds
curl http://localhost:3000

# Check specific API
curl http://localhost:3000/api/health

# Check with headers
curl -I http://localhost:3000
```

---

## 🔄 Rollback

If deployment breaks, rollback:

```bash
cd /var/www/autopost-vn

# Rollback git
git log --oneline  # Find last good commit
git reset --hard <commit-hash>

# Rebuild
rm -rf .next
npm install
npm run build

# Restart
pm2 restart autopost-vn
```

---

## 🌐 Nginx Configuration (Optional)

**File:** `/etc/nginx/sites-available/autopost-vn`

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable & Restart:**
```bash
sudo ln -s /etc/nginx/sites-available/autopost-vn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📝 Useful Commands

```bash
# Build info
npm run build 2>&1 | grep -E "(Compiled|pages|Route)"

# Check Next.js version
npx next --version

# Clean all
rm -rf .next node_modules package-lock.json
npm install
npm run build

# PM2 commands
pm2 start autopost-vn
pm2 stop autopost-vn
pm2 restart autopost-vn
pm2 delete autopost-vn
pm2 save
pm2 resurrect

# System info
node -v
npm -v
df -h  # Disk space
free -h  # Memory
```

---

## ✅ Deployment Checklist

Before deploying:
- [ ] Pull latest code: `git pull`
- [ ] Clean build: `rm -rf .next`
- [ ] Install deps: `npm install`
- [ ] Build app: `npm run build`
- [ ] Check build: `ls -la .next/server`
- [ ] Update env: Check `.env.local`
- [ ] Test locally: `npm run start` (Ctrl+C after test)
- [ ] Deploy PM2: `pm2 restart autopost-vn`
- [ ] Check logs: `pm2 logs autopost-vn`
- [ ] Test endpoint: `curl http://localhost:3000`
- [ ] Check browser: Visit your domain

---

## 🎯 Production Best Practices

1. **Always clean build:**
   ```bash
   rm -rf .next
   ```

2. **Check build output:**
   ```bash
   ls -la .next/server  # Should have: app, chunks, pages
   ```

3. **Monitor logs:**
   ```bash
   pm2 logs autopost-vn --lines 50
   ```

4. **Keep PM2 updated:**
   ```bash
   pm2 update
   ```

5. **Backup before deploy:**
   ```bash
   cp -r .next .next.backup
   ```

---

## 📞 Support

If issues persist:
1. Check logs: `pm2 logs autopost-vn`
2. Verify env: `cat .env.local`
3. Test build: `npm run build`
4. Check disk: `df -h`
5. Check memory: `free -h`
