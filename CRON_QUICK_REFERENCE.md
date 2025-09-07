# AutoPost VN Cron Job - Quick Reference Card

## 🚀 Quick Setup (5 minutes)

### 1. Test Setup
```bash
# Test if everything works
node test-cron-final.js

# Test PowerShell script
powershell -ExecutionPolicy Bypass -File "scripts\autopost-cron-simple.ps1" -Limit 3
```

### 2. Create Windows Task
1. **Windows + R** → `taskschd.msc`
2. **Create Basic Task**
3. **Name**: AutoPost VN Scheduler
4. **Trigger**: Daily, repeat every 5 minutes
5. **Action**: 
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "D:\projects\autopost-vn-v2\autopost-vn\scripts\autopost-cron-simple.ps1"`

### 3. Test & Monitor
```bash
# Check logs
type "logs\cron-$(Get-Date -Format 'yyyy-MM-dd').log"

# Manual test
npm run cron:windows
```

## 📋 Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js app (required) |
| `npm run cron` | Run scheduler manually |
| `npm run cron:windows` | Run PowerShell script |
| `npm run health` | Check app health |
| `node test-cron-final.js` | Verify setup |

## 📊 Log Examples

### ✅ Success
```
[2025-09-06 08:05:07] Scheduler completed successfully: Processed=2, Success=2, Failed=0
```

### ❌ Common Issues
```
Application not running → Start: npm run dev
Token expired → Re-authenticate Facebook OAuth
No scheduled posts → Create posts with future datetime
```

## ⚙️ Task Scheduler Settings

- **Trigger**: Daily, repeat every 5 minutes
- **Duration**: Indefinitely  
- **Stop if runs longer**: 10 minutes
- **Restart on failure**: 3 times, every 1 minute
- **Run with highest privileges**: ✅

## 🎯 Expected Behavior

1. **Every 5 minutes**: Task runs automatically
2. **Checks health**: Ensures app is running
3. **Calls scheduler**: Processes scheduled posts
4. **Logs results**: Records success/failure
5. **Posts to Facebook**: When posts are due

## 📞 Troubleshooting

| Problem | Solution |
|---------|----------|
| Task fails | Check app is running (`npm run dev`) |
| No posts processed | Verify posts with `status='scheduled'` exist |
| Facebook errors | Re-authenticate OAuth tokens |
| Script errors | Run manual test: `npm run cron:windows` |

---
**🎉 Setup complete! AutoPost VN will now automatically post to Facebook every 5 minutes.**
