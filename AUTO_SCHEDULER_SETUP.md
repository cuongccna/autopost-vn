# 🤖 Auto Scheduler Setup Guide

## 🎯 MỤC TIÊU
Thiết lập scheduler tự động chạy mỗi 1-5 phút để post bài đã lên lịch.

---

## ✅ HIỆN TRẠNG

### Đã có:
- ✅ `src/lib/scheduler.ts` - Scheduler logic
- ✅ `/api/cron/scheduler` - API endpoint (GET/POST)
- ✅ `scripts/cron-local.ts` - Manual script
- ✅ `npm run cron` - Package command

### Chưa có:
- ❌ **TỰ ĐỘNG CHẠY** - Không có job chạy nền
- ❌ Cron configuration
- ❌ Background worker

---

## 🚀 CÁCH SETUP TỰ ĐỘNG

### **OPTION 1: Vercel Cron (Khuyến nghị cho Production)**

#### Bước 1: Tạo `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/scheduler?limit=10",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### Bước 2: Deploy lên Vercel
```bash
vercel deploy
```

**Lợi ích:**
- ✅ Chạy tự động mỗi 5 phút
- ✅ Không cần setup thủ công
- ✅ Monitoring built-in
- ✅ Free tier: 100 invocations/day

---

### **OPTION 2: External Cron Service (Development & Production)**

Sử dụng service bên ngoài gọi API:

#### **2.1. EasyCron** (Free: 20 jobs/month)
```
URL: http://localhost:3000/api/cron/scheduler?limit=10
Schedule: */5 * * * * (Mỗi 5 phút)
Method: GET
```

#### **2.2. cron-job.org** (Free unlimited)
```
URL: https://your-domain.vercel.app/api/cron/scheduler?limit=10
Schedule: 0,5,10,15,20,25,30,35,40,45,50,55 * * * *
```

#### **2.3. GitHub Actions** (Free for public repos)

Tạo `.github/workflows/cron.yml`:
```yaml
name: AutoPost Scheduler
on:
  schedule:
    - cron: '*/5 * * * *'  # Mỗi 5 phút
  workflow_dispatch:  # Manual trigger

jobs:
  run-scheduler:
    runs-on: ubuntu-latest
    steps:
      - name: Call Scheduler API
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/scheduler \
            -H "Content-Type: application/json" \
            -d '{"limit":10}'
```

---

### **OPTION 3: Windows Task Scheduler (Development - Local)**

#### Bước 1: Tạo script tự động
File: `run-scheduler.ps1`
```powershell
cd "D:\projects\autopost-vn-v2\autopost-vn"
npm run cron
```

#### Bước 2: Tạo Scheduled Task
```powershell
# Chạy mỗi 5 phút
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File D:\projects\autopost-vn-v2\autopost-vn\run-scheduler.ps1"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration ([TimeSpan]::MaxValue)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
Register-ScheduledTask -TaskName "AutoPost Scheduler" -Action $action -Trigger $trigger -Settings $settings
```

**Kiểm tra:**
```powershell
Get-ScheduledTask -TaskName "AutoPost Scheduler"
```

---

### **OPTION 4: Node.js Background Worker (Development)**

Tạo file `server-with-cron.js`:
```javascript
const { spawn } = require('child_process');

// Start Next.js server
const nextServer = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Run scheduler every 5 minutes
setInterval(async () => {
  console.log('🔄 Running scheduler...');
  
  try {
    const response = await fetch('http://localhost:3000/api/cron/scheduler?limit=10');
    const result = await response.json();
    console.log('✅ Scheduler result:', result);
  } catch (error) {
    console.error('❌ Scheduler error:', error.message);
  }
}, 5 * 60 * 1000); // 5 phút

console.log('✅ Server started with auto scheduler');
```

**Chạy:**
```bash
node server-with-cron.js
```

---

## 🎯 KHUYẾN NGHỊ

### **Development (localhost):**
- **Option 3** (Windows Task Scheduler) hoặc
- **Option 4** (Node background worker)
- Manual: `npm run cron` khi cần test

### **Production (Vercel/Render):**
- **Option 1** (Vercel Cron) - Best cho Vercel
- **Option 2** (External service) - Best cho Render/VPS

---

## 📊 MONITORING

Sau khi setup, kiểm tra logs:

```bash
# Check recent activity
curl http://localhost:3000/api/test/scheduler

# Check logs (nếu dùng Option 3/4)
cat logs/cron-$(date +%Y-%m-%d).log
```

---

## 🐛 TROUBLESHOOTING

### Scheduler không chạy?
1. ✅ Kiểm tra có posts với `status='scheduled'` không
2. ✅ Kiểm tra `scheduled_at` < current time
3. ✅ Kiểm tra social accounts có token hợp lệ
4. ✅ Check logs: `logs/cron-*.log`

### Posts không được publish?
1. ✅ Test manual: `curl http://localhost:3000/api/test/scheduler?limit=1`
2. ✅ Check validation errors trong response
3. ✅ Verify Facebook Page Access Token còn hiệu lực

---

## ✅ NEXT STEPS

1. Chọn option phù hợp với environment
2. Setup theo hướng dẫn
3. Test với 1 post đơn giản
4. Monitor logs trong 1 ngày
5. Scale up số lượng posts

**Bạn muốn setup option nào?**
