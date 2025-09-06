Write-Host "=== RESET POST USAGE LIMITS ===" -ForegroundColor Green

try {
  $response = Invoke-RestMethod -Uri "http://localhost:3000/api/debug/reset-post-usage" -Method POST
  Write-Host "✅ SUCCESS: Post usage limits have been reset" -ForegroundColor Green
  $response | ConvertTo-Json -Depth 5
} catch {
  Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.Exception.Response) {
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
  }
}
