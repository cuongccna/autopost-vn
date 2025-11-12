# Create upload directories for local file storage
Write-Host "Creating upload directory structure..." -ForegroundColor Cyan

$baseDir = "public\uploads"
$buckets = @("post-images", "post-videos", "avatars", "documents")

# Create base directory
if (-not (Test-Path $baseDir)) {
    New-Item -ItemType Directory -Path $baseDir -Force | Out-Null
    Write-Host "  Created: $baseDir" -ForegroundColor Green
} else {
    Write-Host "  Exists: $baseDir" -ForegroundColor Yellow
}

# Create bucket directories
foreach ($bucket in $buckets) {
    $bucketPath = Join-Path $baseDir $bucket
    if (-not (Test-Path $bucketPath)) {
        New-Item -ItemType Directory -Path $bucketPath -Force | Out-Null
        Write-Host "  Created: $bucketPath" -ForegroundColor Green
    } else {
        Write-Host "  Exists: $bucketPath" -ForegroundColor Yellow
    }
    
    # Create .gitkeep file
    $gitkeep = Join-Path $bucketPath ".gitkeep"
    if (-not (Test-Path $gitkeep)) {
        New-Item -ItemType File -Path $gitkeep -Force | Out-Null
    }
}

Write-Host "`nUpload directories ready!" -ForegroundColor Cyan
Write-Host "Structure:" -ForegroundColor White
Write-Host "  public/uploads/" -ForegroundColor Gray
foreach ($bucket in $buckets) {
    Write-Host "    - $bucket/" -ForegroundColor Gray
}
