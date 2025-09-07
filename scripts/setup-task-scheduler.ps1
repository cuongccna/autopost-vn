# Windows Task Scheduler Setup Script
# Chạy script này với quyền Administrator

param(
    [string]$ProjectPath = "D:\projects\autopost-vn-v2\autopost-vn",
    [int]$IntervalMinutes = 5
)

$TaskName = "AutoPost-VN-Scheduler"
$ScriptPath = Join-Path $ProjectPath "scripts\run-scheduler.ps1"

Write-Host "Setting up Windows Task Scheduler for AutoPost-VN..." -ForegroundColor Green
Write-Host "Project Path: $ProjectPath" -ForegroundColor Yellow
Write-Host "Script Path: $ScriptPath" -ForegroundColor Yellow
Write-Host "Interval: Every $IntervalMinutes minutes" -ForegroundColor Yellow

# Kiểm tra file script có tồn tại không
if (!(Test-Path $ScriptPath)) {
    Write-Error "Script file not found: $ScriptPath"
    exit 1
}

try {
    # Xóa task cũ nếu tồn tại
    $ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($ExistingTask) {
        Write-Host "Removing existing task..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }
    
    # Tạo action - chạy PowerShell script
    $Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$ScriptPath`""
    
    # Tạo trigger - chạy mỗi X phút
    $Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) -RepetitionDuration (New-TimeSpan -Days 365)
    
    # Cấu hình task settings
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable
    
    # Tạo principal - chạy với user hiện tại
    $Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
    
    # Đăng ký task
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description "AutoPost-VN Auto Scheduler - Runs every $IntervalMinutes minutes to process scheduled posts"
    
    Write-Host "✅ Task Scheduler setup completed successfully!" -ForegroundColor Green
    Write-Host "Task Name: $TaskName" -ForegroundColor Cyan
    Write-Host "Next Run: $(Get-ScheduledTask -TaskName $TaskName | Get-ScheduledTaskInfo | Select-Object -ExpandProperty NextRunTime)" -ForegroundColor Cyan
    
    # Hiển thị hướng dẫn
    Write-Host "`n📋 Management Commands:" -ForegroundColor Green
    Write-Host "View task: Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host "Start now: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host "Stop task: Stop-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host "Remove task: Unregister-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host "View logs: Get-Content '$ProjectPath\logs\scheduler.log' -Tail 20" -ForegroundColor White
    
} catch {
    Write-Error "Failed to setup task scheduler: $($_.Exception.Message)"
    exit 1
}

# Test run
Write-Host "`n🧪 Running test..." -ForegroundColor Green
try {
    Start-ScheduledTask -TaskName $TaskName
    Write-Host "✅ Test run triggered. Check logs in a few seconds." -ForegroundColor Green
} catch {
    Write-Warning "Could not trigger test run: $($_.Exception.Message)"
}
