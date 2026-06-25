# Starts the backend API and Vite frontend together (Windows).
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

& "$PSScriptRoot\ensure-env.ps1"

Write-Host ""
Write-Host "Starting backend and frontend..."
Write-Host "  API:  http://localhost:8080/api"
Write-Host "  App:  http://localhost:5173/"
Write-Host ""

$backendCmd = "Set-Location '$repoRoot'; npm run backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd | Out-Null

Start-Sleep -Seconds 3
Set-Location $repoRoot
npm run dev
