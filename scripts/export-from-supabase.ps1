# Export Database from Supabase
# Run this script to export schema and data

Write-Host "🚀 Exporting database from Supabase..." -ForegroundColor Cyan

# Check if Supabase CLI is installed
$supabase = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabase) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Install with: scoop install supabase" -ForegroundColor Yellow
    Write-Host "Or: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Create export directory
$exportDir = "supabase/exports"
New-Item -ItemType Directory -Force -Path $exportDir | Out-Null

# Login to Supabase (if not already)
Write-Host "📝 Checking Supabase authentication..." -ForegroundColor Yellow
supabase login

# Link to project
Write-Host "🔗 Linking to Supabase project..." -ForegroundColor Yellow
supabase link --project-ref fmvxmvahknbzzjzhofql

# Export schema only
Write-Host "📦 Exporting schema..." -ForegroundColor Green
supabase db dump --file "$exportDir/schema-export.sql" --schema public

# Export data only
Write-Host "📦 Exporting data..." -ForegroundColor Green
supabase db dump --file "$exportDir/data-export.sql" --data-only

# Export full (schema + data)
Write-Host "📦 Exporting full database..." -ForegroundColor Green
supabase db dump --file "$exportDir/full-export.sql"

Write-Host "✅ Export completed!" -ForegroundColor Green
Write-Host "Files saved in: $exportDir" -ForegroundColor Cyan
