# Task Scheduler Management Script
param(
    [string]$Action = "status",  # status, start, stop, remove, logs
    [string]$TaskName = "AutoPost-VN-Scheduler"
)

function Show-Usage {
    Write-Host "AutoPost-VN Task Scheduler Manager" -ForegroundColor Green
    Write-Host "Usage: .\manage-scheduler.ps1 [action]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Cyan
    Write-Host "  status  - Show task status (default)" -ForegroundColor White
    Write-Host "  start   - Start the scheduler task" -ForegroundColor White
    Write-Host "  stop    - Stop the scheduler task" -ForegroundColor White
    Write-Host "  remove  - Remove the scheduler task" -ForegroundColor White
    Write-Host "  logs    - Show recent logs" -ForegroundColor White
    Write-Host "  setup   - Run initial setup" -ForegroundColor White
}

function Show-TaskStatus {
    try {
        $Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
        $TaskInfo = Get-ScheduledTaskInfo -TaskName $TaskName
        
        Write-Host "📋 Task Status: $TaskName" -ForegroundColor Green
        Write-Host "State: $($Task.State)" -ForegroundColor $(if($Task.State -eq "Ready") {"Green"} else {"Yellow"})
        Write-Host "Last Run: $($TaskInfo.LastRunTime)" -ForegroundColor Cyan
        Write-Host "Next Run: $($TaskInfo.NextRunTime)" -ForegroundColor Cyan
        Write-Host "Last Result: $($TaskInfo.LastTaskResult)" -ForegroundColor $(if($TaskInfo.LastTaskResult -eq 0) {"Green"} else {"Red"})
        
        if ($Task.Triggers) {
            Write-Host "Trigger: Every $($Task.Triggers[0].Repetition.Interval)" -ForegroundColor Cyan
        }
        
    } catch {
        Write-Host "❌ Task not found: $TaskName" -ForegroundColor Red
        Write-Host "Run setup first: .\setup-task-scheduler.ps1" -ForegroundColor Yellow
    }
}

function Start-Task {
    try {
        Start-ScheduledTask -TaskName $TaskName
        Write-Host "✅ Task started: $TaskName" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to start task: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Stop-Task {
    try {
        Stop-ScheduledTask -TaskName $TaskName
        Write-Host "✅ Task stopped: $TaskName" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to stop task: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Remove-Task {
    try {
        $Confirm = Read-Host "Are you sure you want to remove the scheduler task? (y/N)"
        if ($Confirm -eq "y" -or $Confirm -eq "Y") {
            Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
            Write-Host "✅ Task removed: $TaskName" -ForegroundColor Green
        } else {
            Write-Host "❌ Operation cancelled" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Failed to remove task: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Show-Logs {
    $LogPath = Join-Path $PSScriptRoot "..\logs\scheduler.log"
    
    if (Test-Path $LogPath) {
        Write-Host "📄 Recent Scheduler Logs (Last 20 lines):" -ForegroundColor Green
        Write-Host "─" * 60 -ForegroundColor Gray
        Get-Content $LogPath -Tail 20
        Write-Host "─" * 60 -ForegroundColor Gray
        Write-Host "Full log: $LogPath" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Log file not found: $LogPath" -ForegroundColor Red
    }
}

function Run-Setup {
    $SetupScript = Join-Path $PSScriptRoot "setup-task-scheduler.ps1"
    if (Test-Path $SetupScript) {
        & $SetupScript
    } else {
        Write-Host "❌ Setup script not found: $SetupScript" -ForegroundColor Red
    }
}

# Main logic
switch ($Action.ToLower()) {
    "status" { Show-TaskStatus }
    "start" { Start-Task }
    "stop" { Stop-Task }
    "remove" { Remove-Task }
    "logs" { Show-Logs }
    "setup" { Run-Setup }
    "help" { Show-Usage }
    default { 
        Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
        Show-Usage 
    }
}
