$body = @{
    title = "Test Post from PowerShell"
    content = "Test content for debugging post creation"
    providers = @("facebook", "instagram")
    scheduled_at = $null
    media_urls = @()
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/posts" -Method POST -Body $body -Headers $headers
    Write-Host "Response Status:" $response.StatusCode
    Write-Host "Response Body:" $response.Content
} catch {
    Write-Host "Error:" $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Error Response:" $reader.ReadToEnd()
    }
}
