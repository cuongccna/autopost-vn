# AutoPost VN - End-to-End Testing Guide

## 🎯 Mục tiêu
Test toàn bộ flow: Tạo bài → Lên lịch → Cron job auto post → Facebook

## 📋 Checklist trước khi test

### ✅ 1. Kiểm tra Facebook OAuth
```bash
# Verify Facebook account connected
curl -X GET "http://localhost:3000/api/user/accounts" -H "Cookie: your-session"
```

### ✅ 2. Kiểm tra Scheduler hoạt động
```bash
# Test scheduler manually
npm run cron:render
```

### ✅ 3. Kiểm tra Database
- Có Facebook account trong `autopostvn_social_accounts`
- Database connection working

## 🚀 Test Flow

### Bước 1: Tạo bài post test
1. Vào `/app` dashboard
2. Tạo bài mới với nội dung: "🧪 Test auto post - $(timestamp)"
3. **Quan trọng**: Chọn thời gian lên lịch = Hiện tại + 2-3 phút
4. Chọn Facebook platform
5. Lưu bài

### Bước 2: Kiểm tra bài đã lưu
```sql
-- Check in database
SELECT id, content, datetime, status, providers 
FROM autopostvn_posts 
WHERE status = 'scheduled' 
ORDER BY datetime DESC 
LIMIT 5;
```

### Bước 3: Chạy cron job manual (để test ngay)
```bash
# Option 1: Test với script Render
npm run cron:render

# Option 2: Test với script Windows  
npm run cron:windows

# Option 3: Test trực tiếp API
curl "http://localhost:3000/api/cron/scheduler?limit=10"
```

### Bước 4: Thiết lập Windows Task Scheduler (cho auto)
```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$PWD\scripts\autopost-cron-simple.ps1`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 2)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U

Register-ScheduledTask -TaskName "AutoPost VN Test" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "AutoPost VN - Test auto posting every 2 minutes"
```

## 📊 Monitoring Commands

### Check logs:
```bash
# Today's cron logs
type "logs\cron-$(Get-Date -Format 'yyyy-MM-dd').log"

# Last 10 lines
Get-Content "logs\cron-$(Get-Date -Format 'yyyy-MM-dd').log" -Tail 10
```

### Check task status:
```powershell
# Check if task exists
Get-ScheduledTask -TaskName "*AutoPost*"

# Check task history
Get-ScheduledTaskInfo -TaskName "AutoPost VN Test"

# Run task manually
Start-ScheduledTask -TaskName "AutoPost VN Test"
```

### Check database post status:
```sql
-- Check post status changes
SELECT id, content, status, datetime, 
       created_at, updated_at,
       providers
FROM autopostvn_posts 
WHERE datetime >= NOW() - INTERVAL '1 hour'
ORDER BY datetime DESC;
```

## 🎯 Expected Timeline

### Minute 0: Tạo bài post
- Content: "🧪 Test auto post - [timestamp]"
- Schedule: Current time + 3 minutes
- Platform: Facebook
- Status: `scheduled`

### Minute 1-2: Cron job chạy
- Task Scheduler triggers every 2 minutes
- Script calls `/api/cron/scheduler`
- Finds post with `datetime <= now`
- Status changes: `scheduled` → `published`

### Minute 3-5: Facebook posting
- API call to Facebook Graph API
- Post appears on Facebook Page
- Response logged in cron logs

## 🐛 Troubleshooting

### Cron job không chạy:
```bash
# Check if task exists
Get-ScheduledTask | Where-Object {$_.TaskName -like "*AutoPost*"}

# Check last run time
Get-ScheduledTaskInfo -TaskName "AutoPost VN Test"

# Check logs for errors
Get-Content logs\error.log -Tail 20
```

### Post không được publish:
```bash
# Check scheduler API manually
curl "http://localhost:3000/api/cron/scheduler?limit=5"

# Check Facebook token
curl "http://localhost:3000/api/user/accounts"

# Check post datetime
# Ensure datetime is <= current time
```

### Facebook API errors:
- Token expired → Re-authenticate OAuth
- Rate limit → Wait or reduce frequency  
- Invalid permissions → Check Facebook App settings

## ✅ Success Criteria

### Test thành công khi:
1. **Bài post tạo**: Status = `scheduled`, datetime trong tương lai gần
2. **Cron job chạy**: Logs show successful execution
3. **Status update**: Post status changes to `published`
4. **Facebook post**: Content appears on Facebook Page
5. **Logs clean**: No errors in cron logs

### Sample successful log:
```
[2025-09-06 22:45:01] Starting AutoPost VN Scheduler (Limit: 10)
[2025-09-06 22:45:02] Application is healthy: healthy
[2025-09-06 22:45:03] Scheduler completed successfully: Processed=1, Success=1, Failed=0
[2025-09-06 22:45:03] ✅ Post 123: Published to Facebook successfully
[2025-09-06 22:45:03] Execution completed in 2.1 seconds
```

Ready to test! 🚀
