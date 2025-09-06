#!/usr/bin/env powershell

Write-Host "🚀 Setting up Supabase Storage for AutoPost VN..." -ForegroundColor Yellow

# Check if required environment variables are set
Write-Host "`n📋 Checking environment variables..." -ForegroundColor Cyan

if (-not $env:NEXT_PUBLIC_SUPABASE_URL) {
    Write-Host "❌ NEXT_PUBLIC_SUPABASE_URL is not set" -ForegroundColor Red
    Write-Host "Please check your .env.local file" -ForegroundColor Gray
    exit 1
}

if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ SUPABASE_SERVICE_ROLE_KEY is not set" -ForegroundColor Red
    Write-Host "Please check your .env.local file" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Environment variables found" -ForegroundColor Green

# Load environment variables from .env.local
if (Test-Path ".env.local") {
    Write-Host "📁 Loading .env.local..." -ForegroundColor Gray
    Get-Content .env.local | ForEach-Object {
        if ($_ -match "^([^#].*?)=(.*)$") {
            $name = $matches[1]
            $value = $matches[2]
            [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Run the TypeScript setup script
Write-Host "`n🔧 Running storage setup..." -ForegroundColor Cyan
try {
    npx ts-node scripts/setup-storage.ts
    Write-Host "`n✅ Storage setup completed!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Error running setup script:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    Write-Host "`n🛠️  Manual Setup Instructions:" -ForegroundColor Yellow
    Write-Host "1. Go to your Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "2. Select your project: autopost-vn" -ForegroundColor White
    Write-Host "3. Go to Storage section" -ForegroundColor White
    Write-Host "4. Create a new bucket:" -ForegroundColor White
    Write-Host "   - Name: post-images" -ForegroundColor Gray
    Write-Host "   - Public: Yes" -ForegroundColor Gray
    Write-Host "   - File size limit: 5MB" -ForegroundColor Gray
    Write-Host "   - Allowed MIME types: image/png, image/jpeg, image/jpg, image/webp" -ForegroundColor Gray
    Write-Host "5. Set up Policies:" -ForegroundColor White
    Write-Host "   - Allow authenticated users to INSERT" -ForegroundColor Gray
    Write-Host "   - Allow public to SELECT (read)" -ForegroundColor Gray
    Write-Host "   - Allow authenticated users to DELETE own files" -ForegroundColor Gray
}

Write-Host "`n📖 Next steps if bucket is created:" -ForegroundColor Cyan
Write-Host "1. Test image upload in the app" -ForegroundColor White
Write-Host "2. Check browser console for any errors" -ForegroundColor White
Write-Host "3. Verify images appear in Supabase Storage dashboard" -ForegroundColor White
