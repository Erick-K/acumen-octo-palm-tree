# One-time setup: enable Maps JavaScript API and save key to .env
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root '.env'

Write-Host "`nAcumen — Google Maps setup (Kenya)`n" -ForegroundColor Cyan
Write-Host "1. Sign in to Google Cloud and create/select a project."
Write-Host "2. Enable 'Maps JavaScript API' and create an API key."
Write-Host "3. Paste the key when prompted below.`n"

Start-Process 'https://console.cloud.google.com/google/maps-apis/credentials'

$key = Read-Host 'Paste your Maps JavaScript API key (or press Enter to skip)'
if ([string]::IsNullOrWhiteSpace($key)) {
  Write-Host 'No key saved. Edit .env manually when ready.' -ForegroundColor Yellow
  exit 0
}

$content = @"
# Local only — not committed (.gitignore)
VITE_GOOGLE_MAPS_API_KEY=$key
"@
Set-Content -Path $envFile -Value $content -Encoding UTF8
Write-Host "Saved to $envFile" -ForegroundColor Green
Write-Host "Restart the dev server: npm run dev`n"
