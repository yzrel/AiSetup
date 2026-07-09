# Builds frontend + backend and assembles release/aisetup-local for another PC.
param(
    [switch]$SkipBuild,
    [switch]$IncludeJdk
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $repoRoot "backend"
$releaseRoot = Join-Path $repoRoot "release\aisetup-local"
$releaseBackend = Join-Path $releaseRoot "backend"
$releaseFrontend = Join-Path $releaseRoot "frontend"
$releaseScripts = Join-Path $releaseRoot "scripts"

function Remove-IfExists([string]$path) {
    if (Test-Path $path) {
        Remove-Item $path -Recurse -Force
    }
}

Write-Host "=== aiSETUP local deployment package ==="
Write-Host ""

if (-not $SkipBuild) {
    Write-Host "[1/4] Ensuring frontend dependencies..."
    Push-Location $repoRoot
    try {
        if (-not (Test-Path (Join-Path $repoRoot "node_modules\vite"))) {
            npm install
        }
    } finally {
        Pop-Location
    }

    Write-Host "[2/4] Building frontend (Vite)..."
    Push-Location $repoRoot
    try {
        $env:VITE_API_URL = "http://localhost:8080/api"
        npm run build
    } finally {
        Pop-Location
    }

    Write-Host "[3/4] Building backend (Spring Boot JAR)..."
    Push-Location $backendRoot
    try {
        & .\mvnw.cmd -q -DskipTests package
    } finally {
        Pop-Location
    }
} else {
    Write-Host "[1-3/4] Skipping builds (-SkipBuild)"
}

$jar = Get-ChildItem (Join-Path $backendRoot "target") -Filter "aisetup-backend-*.jar" |
    Where-Object { $_.Name -notmatch "original" } |
    Select-Object -First 1

if (-not $jar) {
    Write-Error "Backend JAR not found. Run without -SkipBuild or build manually."
}

if (-not (Test-Path (Join-Path $repoRoot "dist\index.html"))) {
    Write-Error "Frontend dist/ not found. Run without -SkipBuild or build manually."
}

Write-Host "[4/4] Assembling release folder..."
Remove-IfExists $releaseRoot
New-Item -ItemType Directory -Path $releaseBackend, $releaseFrontend, $releaseScripts | Out-Null

Copy-Item $jar.FullName (Join-Path $releaseBackend "aisetup-backend.jar")
Copy-Item (Join-Path $repoRoot "dist\*") $releaseFrontend -Recurse
Copy-Item (Join-Path $backendRoot ".env.example") (Join-Path $releaseBackend ".env.example")

Copy-Item (Join-Path $repoRoot "scripts\serve-frontend.ps1") $releaseScripts
Copy-Item (Join-Path $repoRoot "scripts\start-local.ps1") $releaseScripts
Copy-Item (Join-Path $repoRoot "scripts\setup-jdk-release.ps1") (Join-Path $releaseScripts "setup-jdk.ps1")

@'
aiSETUP — Local deployment package
==================================

Requirements on the target PC:
  - Windows 10/11
  - Internet (first run only, to download portable Java 17 ~160 MB)

Quick start:
  1. Copy this entire folder to the other PC (USB, network share, zip, etc.)
  2. Optional: copy backend/.env.example to backend/.env and set ANTHROPIC_API_KEY
  3. Double-click START.bat  OR  run:  powershell -ExecutionPolicy Bypass -File scripts\start-local.ps1
  4. Browser opens at http://localhost:4173/
     API health: http://localhost:8080/api/health

Ports used:
  - 8080  Spring Boot API
  - 4173  Frontend (static files)

Data:
  - H2 database files are stored in backend/data/ (created on first run)

Troubleshooting:
  - If Java download fails, install JDK 17 manually and run:
      java -jar backend\aisetup-backend.jar --spring.profiles.active=local
    then in another terminal:
      powershell -ExecutionPolicy Bypass -File scripts\serve-frontend.ps1
'@ | Set-Content -Path (Join-Path $releaseRoot "README-DEPLOY.txt") -Encoding UTF8

@'
@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1"
pause
'@ | Set-Content -Path (Join-Path $releaseRoot "START.bat") -Encoding ASCII

if ($IncludeJdk) {
    Write-Host "Including portable JDK in package..."
    & (Join-Path $repoRoot "backend\scripts\setup-jdk.ps1")
    $devJdk = Join-Path $backendRoot ".jdk"
    if (Test-Path $devJdk) {
        Copy-Item $devJdk (Join-Path $releaseRoot ".jdk") -Recurse
    }
}

$zipPath = Join-Path $repoRoot "release\aisetup-local.zip"
Remove-IfExists $zipPath
Compress-Archive -Path $releaseRoot -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "Done!"
Write-Host "  Folder: $releaseRoot"
Write-Host "  Zip:    $zipPath"
Write-Host ""
Write-Host "Copy release\aisetup-local.zip (or the folder) to the other PC and run START.bat."
