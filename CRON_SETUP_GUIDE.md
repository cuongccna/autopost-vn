# AutoPost VN - Hướng dẫn thiết lập Cron Job

## 🎯 Mục tiêu
Thiết lập cron job để tự động chạy scheduler và post bài lên Facebook theo lịch trình.

## 📋 Yêu cầu trước khi thiết lập
- ✅ Facebook OAuth đã được kết nối (có access token hợp lệ)
- ✅ Database có bài posts với status 'scheduled' 
- ✅ Environment variables đã được cấu hình (.env)
- ✅ Node.js và npm đã được cài đặt
- ✅ Application đang chạy (localhost:3000)

## 🪟 Thiết lập trên Windows (Task Scheduler)

### Bước 1: Tạo PowerShell script tự động
Tạo file `scripts/autopost-cron.ps1`:

```powershell
# AutoPost VN Cron Job - Phiên bản cải tiến
param(
    [int]$Limit = 10,
    [string]$LogLevel = "INFO"
)

$ProjectPath = "D:\projects\autopost-vn-v2\autopost-vn"
$LogDir = "$ProjectPath\logs"
$LogFile = "$LogDir\cron-$(Get-Date -Format 'yyyy-MM-dd').log"
$ErrorLog = "$LogDir\error.log"

# Tạo thư mục logs nếu chưa tồn tại
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force
}

function Write-Log {
    param($Message, $Level = "INFO")
    $Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $LogMessage = "[$Timestamp] [$Level] $Message"
    
    Write-Host $LogMessage
    $LogMessage | Out-File -Append $LogFile
    
    if ($Level -eq "ERROR") {
        $LogMessage | Out-File -Append $ErrorLog
    }
}

# Bắt đầu
$StartTime = Get-Date
Write-Log "🚀 Starting AutoPost VN Scheduler (Limit: $Limit)"

try {
    # Kiểm tra xem Next.js app có đang chạy không
    try {
        $HealthCheck = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 10
        Write-Log "✅ Application is running"
    } catch {
        Write-Log "❌ Application not running. Starting Next.js..." "WARN"
        
        # Chuyển đến thư mục project
        Set-Location $ProjectPath
        
        # Start Next.js in background
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
        
        # Đợi app khởi động
        Start-Sleep -Seconds 30
    }
    
    # Gọi scheduler API
    Write-Log "📡 Calling scheduler API..."
    $Response = Invoke-RestMethod -Uri "http://localhost:3000/api/cron/scheduler?limit=$Limit" -Method GET -TimeoutSec 30
    
    if ($Response.success) {
        $Stats = "Processed=$($Response.processed), Success=$($Response.successful), Failed=$($Response.failed)"
        Write-Log "✅ Scheduler completed successfully: $Stats"
        
        # Log chi tiết nếu có
        if ($Response.details -and $Response.details.Count -gt 0) {
            Write-Log "📋 Post details:"
            foreach ($detail in $Response.details) {
                $status = switch ($detail.status) {
                    'success' { '✅' }
                    'failed' { '❌' }
                    default { '⏭️' }
                }
                Write-Log "  $status Post $($detail.postId): $($detail.message)"
            }
        }
    } else {
        Write-Log "❌ Scheduler failed: $($Response.error)" "ERROR"
    }
    
} catch {
    Write-Log "❌ Critical error: $($_.Exception.Message)" "ERROR"
    Write-Log "Stack trace: $($_.Exception.StackTrace)" "ERROR"
} finally {
    $EndTime = Get-Date
    $Duration = ($EndTime - $StartTime).TotalSeconds
    Write-Log "⏱️ Execution completed in $Duration seconds"
    Write-Log "----------------------------------------"
}
```

### Bước 2: Cập nhật package.json
Thêm scripts để dễ quản lý:

```json
{
  "scripts": {
    "dev": "next dev",
    "cron": "tsx scripts/cron-local.ts",
    "cron:js": "node scripts/cron-scheduler.js",
    "cron:windows": "powershell -ExecutionPolicy Bypass -File scripts/autopost-cron.ps1",
    "health": "curl http://localhost:3000/api/health"
  }
}
```

### Bước 3: Tạo Task trong Task Scheduler

#### Option A: Chạy mỗi 5 phút (Khuyến nghị)
1. Mở **Task Scheduler** (Windows + R → `taskschd.msc`)
2. **Action** → **Create Basic Task**
3. **Name**: "AutoPost VN - Every 5 minutes"
4. **Description**: "Auto post scheduled content to Facebook"
5. **Trigger**: Daily
6. **Start**: 00:00:00
7. **Recur every**: 1 days
8. **Action**: Start a program
   - **Program**: `powershell.exe`
   - **Arguments**: `-ExecutionPolicy Bypass -File "D:\projects\autopost-vn-v2\autopost-vn\scripts\autopost-cron.ps1" -Limit 5`
9. **Finish**

#### Cấu hình Advanced (Quan trọng!)
1. Right-click task vừa tạo → **Properties**
2. **Triggers** tab → **Edit**
3. **Advanced settings**:
   - ✅ **Repeat task every**: 5 minutes
   - ✅ **For a duration of**: Indefinitely
   - ✅ **Stop task if it runs longer than**: 10 minutes
4. **Settings** tab:
   - ✅ **Allow task to be run on demand**
   - ✅ **Run task as soon as possible after a scheduled start is missed**
   - ✅ **If the task fails, restart every**: 1 minute (up to 3 times)

#### Option B: Chạy vào giờ cố định
Để chạy vào các giờ vàng (8AM, 12PM, 6PM, 9PM):
1. Tạo 4 tasks riêng biệt với trigger:
   - 8:00 AM daily
   - 12:00 PM daily  
   - 6:00 PM daily
   - 9:00 PM daily
2. Mỗi task chạy với limit cao hơn: `-Limit 20`

## ✅ Test Cron Job Setup

### Bước 1: Test thủ công
```powershell
# Test script đơn giản
powershell -ExecutionPolicy Bypass -File "scripts\autopost-cron-simple.ps1" -Limit 3

# Test script đầy đủ
powershell -ExecutionPolicy Bypass -File "scripts\autopost-cron.ps1" -Limit 5

# Test health check
npm run health

# Test scheduler trực tiếp
npm run cron
```

### Bước 2: Kiểm tra logs
```powershell
# Xem log file hôm nay
type "logs\cron-$(Get-Date -Format 'yyyy-MM-dd').log"

# Theo dõi log real-time (nếu có)
Get-Content "logs\cron-$(Get-Date -Format 'yyyy-MM-dd').log" -Wait
```

### Bước 3: Test Task Scheduler
1. Tạo task với thời gian chạy trong vài phút tới
2. Right-click task → **Run** để test ngay
3. Kiểm tra **Last Run Result** = 0x0 (success)
4. Xem log file để confirm

## 🎯 Kết quả mong đợi

### Log file mẫu thành công:
```
[2025-09-06 22:23:07] Starting AutoPost VN Scheduler (Limit: 3)
[2025-09-06 22:23:07] Checking application health...
[2025-09-06 22:23:07] Application is healthy: healthy
[2025-09-06 22:23:07] Calling scheduler API...
[2025-09-06 22:23:09] Scheduler completed successfully: Processed=2, Success=2, Failed=0
[2025-09-06 22:23:09] Execution completed in 1.8 seconds
[2025-09-06 22:23:09] ----------------------------------------
```

### Khi có posts được publish:
```
[2025-09-06 08:05:01] Starting AutoPost VN Scheduler (Limit: 10)
[2025-09-06 08:05:02] Application is healthy: healthy
[2025-09-06 08:05:03] Calling scheduler API...
[2025-09-06 08:05:07] Scheduler completed successfully: Processed=3, Success=2, Failed=1
[2025-09-06 08:05:07] Post details:
[2025-09-06 08:05:07]   ✅ Post 123: Published to Facebook successfully
[2025-09-06 08:05:07]   ✅ Post 124: Published to Facebook successfully  
[2025-09-06 08:05:07]   ❌ Post 125: Facebook API error - token expired
[2025-09-06 08:05:07] Execution completed in 6.2 seconds
[2025-09-06 08:05:07] ----------------------------------------
```

## 📊 Monitoring & Troubleshooting

### Common Issues

1. **Application not running**
   ```
   [ERROR] Application not running. Please start Next.js app first: npm run dev
   ```
   **Solution**: Ensure `npm run dev` is running on localhost:3000

2. **Token expired**
   ```
   [ERROR] Facebook API error - token expired
   ```
   **Solution**: Re-authenticate Facebook OAuth in app

3. **No scheduled posts**
   ```
   Processed=0, Success=0, Failed=0
   ```
   **Solution**: Create posts with future datetime and status='scheduled'

### Performance Monitoring
- Check execution time (should be < 10 seconds)
- Monitor success/failure rates
- Watch for memory leaks in long-running tasks

## 🚀 Final Setup Steps

### 1. Ensure app auto-starts (Optional)
```powershell
# Add to Windows startup
# Create shortcut to: npm run dev
# Place in: shell:startup
```

### 2. Setup log rotation (Optional)
```powershell
# PowerShell script to clean old logs
Get-ChildItem "logs\*.log" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item
```

### 3. Monitor Task Scheduler
- Check **Task Scheduler Library** regularly
- Review **History** tab for execution details
- Set up email notifications for failures (optional)

**🎉 Congratulations! AutoPost VN cron job is now set up and ready to automatically post to Facebook!**

### Option A: Vercel Cron (Recommended)
File: `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/scheduler",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option B: GitHub Actions Cron
File: `.github/workflows/scheduler.yml`
```yaml
name: Auto Post Scheduler

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  run-scheduler:
    runs-on: ubuntu-latest
    steps:
      - name: Call Scheduler API
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/cron/scheduler?limit=10"
```

### Option C: Self-hosted với PM2
File: `ecosystem.config.js`
```javascript
module.exports = {
  apps: [
    {
      name: 'autopost-scheduler',
      script: 'scripts/cron-scheduler.js',
      cron_restart: '*/5 * * * *',
      watch: false,
      autorestart: false
    }
  ]
}
```

## 3. Monitoring & Logging

### Enhanced Scheduler với Logging
Cập nhật `src/app/api/cron/scheduler/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { runScheduler } from '@/lib/scheduler';
import { writeFile, appendFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: Request) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] Scheduler started\n`;
  
  try {
    // Log start
    await appendFile(join(process.cwd(), 'logs/scheduler.log'), logEntry);
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    console.log(`🚀 [CRON] Starting scheduler with limit: ${limit}`);
    
    const result = await runScheduler(limit);
    
    // Log results
    const resultLog = `[${timestamp}] Completed: Processed=${result.processed}, Success=${result.successful}, Failed=${result.failed}\n`;
    await appendFile(join(process.cwd(), 'logs/scheduler.log'), resultLog);
    
    console.log(`✅ [CRON] Scheduler completed:`, result);
    
    return NextResponse.json({
      success: true,
      timestamp,
      ...result
    });
    
  } catch (error: any) {
    const errorLog = `[${timestamp}] Error: ${error?.message || String(error)}\n`;
    await appendFile(join(process.cwd(), 'logs/scheduler.log'), errorLog);
    
    console.error('❌ [CRON] Scheduler error:', error);
    
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
      timestamp
    }, { status: 500 });
  }
}
```

### Log Viewer API
File: `src/app/api/admin/scheduler-logs/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const logContent = await readFile(join(process.cwd(), 'logs/scheduler.log'), 'utf-8');
    const lines = logContent.split('\n').filter(Boolean).slice(-100); // Last 100 lines
    
    return NextResponse.json({
      success: true,
      logs: lines,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unable to read logs',
      logs: []
    });
  }
}
```

## 4. Health Check & Status

### Scheduler Status API
File: `src/app/api/admin/scheduler-status/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { sbServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = sbServer(true);
    
    // Check pending schedules
    const { data: pending } = await supabase
      .from('autopostvn_post_schedules')
      .select('count')
      .eq('status', 'pending')
      .lt('scheduled_at', new Date().toISOString());
    
    // Check recent activity
    const { data: recent } = await supabase
      .from('autopostvn_post_schedules')
      .select('*')
      .in('status', ['completed', 'failed'])
      .gte('updated_at', new Date(Date.now() - 24*60*60*1000).toISOString())
      .order('updated_at', { ascending: false })
      .limit(10);
    
    return NextResponse.json({
      status: 'healthy',
      pendingCount: pending?.[0]?.count || 0,
      recentActivity: recent || [],
      lastCheck: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: String(error),
      lastCheck: new Date().toISOString()
    }, { status: 500 });
  }
}
```

## 5. Dashboard Integration

### Scheduler Monitor Component
File: `src/components/admin/SchedulerMonitor.tsx`
```tsx
import { useState, useEffect } from 'react';

export default function SchedulerMonitor() {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    const fetchStatus = async () => {
      const response = await fetch('/api/admin/scheduler-status');
      const data = await response.json();
      setStatus(data);
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Every 30s
    
    return () => clearInterval(interval);
  }, []);
  
  const triggerScheduler = async () => {
    const response = await fetch('/api/cron/scheduler?limit=10');
    const result = await response.json();
    console.log('Manual trigger result:', result);
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Scheduler Monitor</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 bg-blue-50 rounded">
          <p className="text-sm text-gray-600">Pending Jobs</p>
          <p className="text-2xl font-bold">{status?.pendingCount || 0}</p>
        </div>
        
        <div className="p-4 bg-green-50 rounded">
          <p className="text-sm text-gray-600">Status</p>
          <p className="text-lg font-semibold">{status?.status || 'Unknown'}</p>
        </div>
      </div>
      
      <button
        onClick={triggerScheduler}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Trigger Manually
      </button>
    </div>
  );
}
```
