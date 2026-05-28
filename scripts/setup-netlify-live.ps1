# Opens Netlify + Google Cloud for endearing-moonbeam-de044f and copies your Maps API key to the clipboard.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root '.env'

if (-not (Test-Path $envFile)) {
  Write-Host "Missing .env in project root. Add VITE_GOOGLE_MAPS_API_KEY=your_key first." -ForegroundColor Red
  exit 1
}

$line = Get-Content $envFile | Where-Object { $_ -match '^\s*VITE_GOOGLE_MAPS_API_KEY\s*=\s*(.+)\s*$' } | Select-Object -First 1
if (-not $line) {
  Write-Host "VITE_GOOGLE_MAPS_API_KEY not found in .env" -ForegroundColor Red
  exit 1
}

$key = ($line -replace '^\s*VITE_GOOGLE_MAPS_API_KEY\s*=\s*', '').Trim()
if ([string]::IsNullOrWhiteSpace($key)) {
  Write-Host "VITE_GOOGLE_MAPS_API_KEY is empty in .env" -ForegroundColor Red
  exit 1
}

Set-Clipboard -Value $key
Write-Host "`nCopied Maps API key to clipboard.`n" -ForegroundColor Green

Write-Host "NETLIFY (tab opening):" -ForegroundColor Cyan
Write-Host "  1. Add variable  ->  Key: VITE_GOOGLE_MAPS_API_KEY"
Write-Host "  2. Value: paste from clipboard (Ctrl+V)"
Write-Host "  3. Scopes: Production (and Deploy previews if you want)"
Write-Host "  4. Save, then Deploys -> Trigger deploy -> Deploy site`n"

Write-Host "GOOGLE CLOUD (tab opening):" -ForegroundColor Cyan
Write-Host "  1. Click your API key"
Write-Host "  2. Application restrictions -> HTTP referrers, add:"
Write-Host "       https://endearing-moonbeam-de044f.netlify.app/*"
Write-Host "       http://localhost:*"
Write-Host "  3. API restrictions -> Maps JavaScript API only -> Save`n"

Start-Process 'https://app.netlify.com/sites/endearing-moonbeam-de044f/configuration/env'
Start-Process 'https://console.cloud.google.com/google/maps-apis/credentials'

Write-Host "Live site after deploy: https://endearing-moonbeam-de044f.netlify.app`n"
