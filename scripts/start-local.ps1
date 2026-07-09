# Starts the packaged aiSETUP app (backend JAR + static frontend).
$ErrorActionPreference = "Stop"
$packageRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $packageRoot "backend"
$scriptsDir = Join-Path $packageRoot "scripts"
$jdkDir = Join-Path $packageRoot ".jdk"
$javaExe = Join-Path $jdkDir "bin\java.exe"
$jarPath = Join-Path $backendDir "aisetup-backend.jar"
$envFile = Join-Path $backendDir ".env"
$frontendPort = 4173

if (-not (Test-Path $jarPath)) {
    Write-Error "Missing $jarPath — run npm run package:local on the dev machine first."
}

if (-not (Test-Path $javaExe)) {
    Write-Host "Portable JDK not found. Downloading OpenJDK 17..."
    & (Join-Path $scriptsDir "setup-jdk.ps1")
}

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) { return }
        $eq = $line.IndexOf("=")
        if ($eq -lt 1) { return }
        $name = $line.Substring(0, $eq).Trim()
        $value = $line.Substring($eq + 1).Trim().Trim('"').Trim("'")
        Set-Item -Path "env:$name" -Value $value
    }
} else {
    Write-Warning "No backend/.env — AI assist will use template-only mode until you add ANTHROPIC_API_KEY."
}

Write-Host ""
Write-Host "Starting aiSETUP..."
Write-Host "  API:  http://localhost:8080/api"
Write-Host "  App:  http://localhost:$frontendPort/"
Write-Host ""

$backendArgs = @(
    "-jar", $jarPath,
    "--spring.profiles.active=local"
)

Start-Process -FilePath $javaExe -ArgumentList $backendArgs -WorkingDirectory $backendDir -WindowStyle Normal | Out-Null

Start-Sleep -Seconds 4

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "& '$scriptsDir\serve-frontend.ps1' -Root '$packageRoot\frontend' -Port $frontendPort"
) | Out-Null

Start-Sleep -Seconds 2
Start-Process "http://localhost:$frontendPort/"

Write-Host "Backend and frontend are running in separate windows."
Write-Host "Close those windows to stop the app."
