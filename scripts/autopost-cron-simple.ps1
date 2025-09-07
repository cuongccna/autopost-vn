# AutoPost VN Cron Job - Simple Version
param(
    [int]$Limit = 10
)

$ProjectPath = "D:\projects\autopost-vn-v2\autopost-vn"
$LogDir = "$ProjectPath\logs"
$LogFile = "$LogDir\cron-$(Get-Date -Format 'yyyy-MM-dd').log"

# Create logs directory if not exists
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force
}

function Write-Log {
    param($Message)
    $Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $LogMessage = "[$Timestamp] $Message"
    
    Write-Host $LogMessage
    $LogMessage | Out-File -Append $LogFile
}

# Start
$StartTime = Get-Date
Write-Log "Starting AutoPost VN Scheduler (Limit: $Limit)"

try {
    # Check if app is running
    Write-Log "Checking application health..."
    $HealthResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 10
    Write-Log "Application is healthy: $($HealthResponse.status)"
    
    # Call scheduler API
    Write-Log "Calling scheduler API..."
    $Response = Invoke-RestMethod -Uri "http://localhost:3000/api/cron/scheduler?limit=$Limit" -Method GET -TimeoutSec 30
    
    if ($Response.success) {
        $Stats = "Processed=$($Response.processed), Success=$($Response.successful), Failed=$($Response.failed)"
        Write-Log "Scheduler completed successfully: $Stats"
    } else {
        Write-Log "Scheduler failed: $($Response.error)"
    }
    
} catch {
    Write-Log "Error: $($_.Exception.Message)"
}

$EndTime = Get-Date
$Duration = ($EndTime - $StartTime).TotalSeconds
Write-Log "Execution completed in $Duration seconds"
Write-Log "----------------------------------------"
