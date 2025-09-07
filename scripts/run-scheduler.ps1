# PowerShell script để chạy scheduler tự động
param(
    [string]$BaseUrl = "http://localhost:3000",
    [int]$Limit = 10
)

# Thiết lập paths
$LogDir = Join-Path $PSScriptRoot "..\logs"
$LogFile = Join-Path $LogDir "scheduler.log"

# Tạo thư mục logs nếu chưa tồn tại
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force
}

# Function ghi log
function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] $Message"
    Write-Output $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

Write-Log "=== Starting AutoPost Scheduler ==="
Write-Log "Base URL: $BaseUrl"
Write-Log "Limit: $Limit"

try {
    # Kiểm tra xem server có chạy không
    $HealthCheck = "$BaseUrl/api/health"
    try {
        $HealthResponse = Invoke-RestMethod -Uri $HealthCheck -Method GET -TimeoutSec 10
        Write-Log "Health check passed"
    } catch {
        Write-Log "WARNING: Health check failed - $($_.Exception.Message)"
        Write-Log "Trying to call scheduler anyway..."
    }
    
    # Gọi scheduler API
    $SchedulerUrl = "$BaseUrl/api/cron/scheduler?limit=$Limit"
    Write-Log "Calling scheduler: $SchedulerUrl"
    
    $Response = Invoke-RestMethod -Uri $SchedulerUrl -Method GET -TimeoutSec 30
    
    if ($Response.success) {
        $Stats = "Processed=$($Response.processed), Successful=$($Response.successful), Failed=$($Response.failed), Skipped=$($Response.skipped)"
        Write-Log "✅ Scheduler completed successfully: $Stats"
        
        # Log chi tiết nếu có lỗi
        if ($Response.failed -gt 0 -and $Response.details) {
            Write-Log "Failed job details:"
            foreach ($detail in $Response.details) {
                if ($detail.status -eq "failed") {
                    Write-Log "  - Post $($detail.postId): $($detail.message)"
                }
            }
        }
    } else {
        Write-Log "❌ Scheduler reported failure: $($Response.error)"
    }
    
} catch {
    Write-Log "❌ Error running scheduler: $($_.Exception.Message)"
    Write-Log "Full error: $($_.Exception.ToString())"
}

Write-Log "=== Scheduler run completed ==="
Write-Log ""

# Cleanup logs - chỉ giữ 1000 dòng cuối
try {
    $LogContent = Get-Content $LogFile
    if ($LogContent.Count -gt 1000) {
        $LogContent[-1000..-1] | Set-Content $LogFile
        Write-Log "Log file trimmed to last 1000 lines"
    }
} catch {
    Write-Log "Warning: Could not trim log file - $($_.Exception.Message)"
}
