# 🚀 AutoPost-VN: Complete Setup Guide

## ✅ Đã hoàn thành

### 1. Hệ thống Auto-Posting
- ✅ Scheduler engine hoạt động
- ✅ Validation system 
- ✅ Database structure
- ✅ API endpoints
- ✅ Error handling

### 2. Cron Job System
- ✅ PowerShell scripts
- ✅ Windows Task Scheduler setup
- ✅ Logging system
- ✅ Health monitoring

### 3. Database Cleanup
- ✅ Removed fake social accounts
- ✅ Cleaned failed schedules

## 🔧 Cần thực hiện tiếp theo

### A) Facebook/Instagram API Setup

#### Bước 1: Tạo Facebook App
1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Tạo App mới → Chọn "Business" type
3. Thêm products: "Facebook Login" + "Instagram Basic Display"

#### Bước 2: Cấu hình App
```env
# Thêm vào .env.local
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
```

#### Bước 3: OAuth Redirect URLs
Thêm vào Facebook App settings:
```
http://localhost:3000/api/auth/callback/facebook
http://localhost:3000/api/auth/callback/instagram
```

#### Bước 4: Permissions
- **Facebook**: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`
- **Instagram**: `instagram_basic`, `instagram_content_publish`

### B) Windows Task Scheduler Setup

#### Cách 1: Automatic Setup (Recommended)
```powershell
# Chạy với quyền Administrator
cd D:\projects\autopost-vn-v2\autopost-vn
.\scripts\setup-task-scheduler.ps1
```

#### Cách 2: Manual Test
```powershell
# Test manual
.\scripts\run-scheduler.ps1

# View logs
Get-Content logs\scheduler.log -Tail 20
```

#### Cách 3: Task Management
```powershell
# Check status
.\scripts\manage-scheduler.ps1 status

# Start/stop
.\scripts\manage-scheduler.ps1 start
.\scripts\manage-scheduler.ps1 stop

# View logs
.\scripts\manage-scheduler.ps1 logs
```

## 📊 Monitoring & Testing

### 1. Health Check
```
GET http://localhost:3000/api/health
```

### 2. Scheduler Status
```
GET http://localhost:3000/api/admin/scheduler-status
```

### 3. Manual Trigger
```
GET http://localhost:3000/api/cron/scheduler?limit=10
```

### 4. Real-time Logs
```powershell
Get-Content logs\scheduler.log -Wait
```

## 🎯 Production Deployment

### Vercel (Recommended)
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/scheduler",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Environment Variables for Production
```env
FACEBOOK_APP_ID=production_app_id
FACEBOOK_APP_SECRET=production_app_secret
INSTAGRAM_APP_ID=production_instagram_id  
INSTAGRAM_APP_SECRET=production_instagram_secret
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=production_nextauth_secret
```

## 🧪 Testing Flow

### 1. Kết nối Social Accounts
1. Vào dashboard → "Tài khoản kết nối"
2. Click "Kết nối Facebook" 
3. Authorize permissions
4. Repeat for Instagram

### 2. Tạo Scheduled Post
1. Vào "Chi tiết bài đăng"
2. Tạo bài mới với scheduled time trong tương lai gần (vd: +10 phút)
3. Select platforms (Facebook/Instagram)
4. Save

### 3. Verify Scheduling
```powershell
# Check scheduled posts
node check-scheduled-posts.js

# Check schedule table  
node check-schedule-table.js
```

### 4. Trigger Scheduler
```powershell
# Manual trigger
Invoke-WebRequest -Uri "http://localhost:3000/api/cron/scheduler?limit=10" -Method GET

# Or use script
.\scripts\run-scheduler.ps1
```

### 5. Verify Results
- Check activity logs in dashboard
- Check social media platforms
- Review logs: `logs\scheduler.log`

## 🔍 Troubleshooting

### Common Issues

#### 1. "No social accounts connected"
- Verify Facebook/Instagram apps are configured
- Check OAuth redirect URLs
- Test manual connection in dashboard

#### 2. "Validation failed"
- Check post status is "scheduled"
- Verify scheduled_at is in future
- Confirm social accounts have valid tokens

#### 3. "PowerShell execution policy"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 4. "Health check failed"
- Ensure Next.js dev server is running (`npm run dev`)
- Check port 3000 is not blocked
- Verify .env.local configuration

### Debug Commands
```powershell
# Check task scheduler
Get-ScheduledTask -TaskName "AutoPost-VN-Scheduler"

# View detailed logs
Get-Content logs\scheduler.log | Select-String "ERROR\|Failed\|Success"

# Check database manually
node check-scheduled-posts.js
node check-failed-schedules.js

# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/admin/scheduler-status
```

## 📝 Notes

- Scheduler chạy mỗi 5 phút để check scheduled posts
- Posts được xử lý khi `scheduled_at <= current_time`
- Failed posts sẽ retry theo config
- Logs được trim tự động (giữ 1000 dòng cuối)
- Production deployment cần real Facebook/Instagram API keys

## 🎉 Success Criteria

✅ Scheduled posts appear in dashboard
✅ PowerShell script runs without errors  
✅ Task Scheduler shows "Ready" status
✅ API health checks return 200
✅ Posts publish to social media at scheduled time
✅ Activity logs show successful publications
