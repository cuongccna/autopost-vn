@echo off
REM Windows Batch script để chạy scheduler
echo Starting AutoPost Scheduler...

REM Chuyển đến thư mục dự án
cd /d "D:\projects\autopost-vn-v2\autopost-vn"

REM Chạy PowerShell script
powershell -ExecutionPolicy Bypass -File "scripts\run-scheduler.ps1"

REM Hiển thị kết quả
echo.
echo Scheduler completed. Check logs\scheduler.log for details.
pause
