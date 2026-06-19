# Downloads a portable Microsoft OpenJDK 17 into backend/.jdk (no admin required)
$ErrorActionPreference = "Stop"
$backendRoot = Split-Path -Parent $PSScriptRoot
$jdkDir = Join-Path $backendRoot ".jdk"
$zipPath = Join-Path $env:TEMP "microsoft-jdk-17-windows-x64.zip"
$jdkUrl = "https://aka.ms/download-jdk/microsoft-jdk-17.0.19-windows-x64.zip"
$javaExe = Join-Path $jdkDir "bin/java.exe"

if (Test-Path $javaExe) {
    Write-Host "Portable JDK already present at $jdkDir"
    & $javaExe -version
    exit 0
}

Write-Host "Downloading portable OpenJDK 17 (~160 MB)..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $jdkUrl -OutFile $zipPath

Write-Host "Extracting to $jdkDir ..."
if (Test-Path $jdkDir) { Remove-Item $jdkDir -Recurse -Force }
New-Item -ItemType Directory -Path $jdkDir | Out-Null
Expand-Archive -Path $zipPath -DestinationPath $jdkDir -Force

$nested = Get-ChildItem $jdkDir -Directory | Select-Object -First 1
if ($nested -and -not (Test-Path $javaExe)) {
    Get-ChildItem $nested.FullName | Move-Item -Destination $jdkDir -Force
    Remove-Item $nested.FullName -Force
}

Remove-Item $zipPath -Force -ErrorAction SilentlyContinue

if (-not (Test-Path $javaExe)) {
    Write-Error "JDK setup failed - java.exe not found"
    exit 1
}

Write-Host "Portable JDK ready:"
& $javaExe -version
