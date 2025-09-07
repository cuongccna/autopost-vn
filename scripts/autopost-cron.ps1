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
        Write-Log "❌ Application not running. Please start Next.js app first: npm run dev" "ERROR"
        exit 1
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
