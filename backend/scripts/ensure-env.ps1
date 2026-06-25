# Ensures backend/.env exists and ANTHROPIC_API_KEY is available for AI assist.
$ErrorActionPreference = "Stop"
$backendRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $backendRoot ".env"
$exampleFile = Join-Path $backendRoot ".env.example"

function Get-EnvFileValue([string]$path, [string]$name) {
    if (-not (Test-Path $path)) { return "" }
    foreach ($line in Get-Content $path) {
        $trimmed = $line.Trim()
        if ($trimmed -eq "" -or $trimmed.StartsWith("#")) { continue }
        $eq = $trimmed.IndexOf("=")
        if ($eq -lt 1) { continue }
        $key = $trimmed.Substring(0, $eq).Trim()
        if ($key -ne $name) { continue }
        return $trimmed.Substring($eq + 1).Trim().Trim('"').Trim("'")
    }
    return ""
}

function Set-EnvFileValue([string]$path, [string]$name, [string]$value) {
    $lines = @()
    $found = $false
    if (Test-Path $path) {
        $lines = @(Get-Content $path)
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $trimmed = $lines[$i].Trim()
            if ($trimmed.StartsWith("#") -or $trimmed -eq "") { continue }
            $eq = $trimmed.IndexOf("=")
            if ($eq -lt 1) { continue }
            $key = $trimmed.Substring(0, $eq).Trim()
            if ($key -eq $name) {
                $lines[$i] = "$name=$value"
                $found = $true
            }
        }
    }
    if (-not $found) {
        if ($lines.Count -gt 0 -and $lines[-1].Trim() -ne "") {
            $lines += ""
        }
        $lines += "$name=$value"
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($path, ($lines -join [Environment]::NewLine), $utf8NoBom)
}

function Import-KeyFromFile([string]$path) {
    $key = Get-EnvFileValue $path "ANTHROPIC_API_KEY"
    if (-not [string]::IsNullOrWhiteSpace($key)) { return $key }
    return ""
}

if (-not (Test-Path $exampleFile)) {
    Write-Warning "Missing backend/.env.example"
    exit 0
}

if (-not (Test-Path $envFile)) {
    Copy-Item $exampleFile $envFile
    Write-Host "Created backend/.env from backend/.env.example"
}

$currentKey = Get-EnvFileValue $envFile "ANTHROPIC_API_KEY"
if ([string]::IsNullOrWhiteSpace($currentKey)) {
    $repoRoot = Split-Path -Parent $backendRoot
    $rootEnv = Join-Path $repoRoot ".env"
    $currentKey = Import-KeyFromFile $rootEnv
    if (-not [string]::IsNullOrWhiteSpace($currentKey)) {
        Set-EnvFileValue $envFile "ANTHROPIC_API_KEY" $currentKey
        Write-Host "Copied ANTHROPIC_API_KEY from project .env into backend/.env"
    }
}
if ([string]::IsNullOrWhiteSpace($currentKey)) {
    $fromEnv = [Environment]::GetEnvironmentVariable("ANTHROPIC_API_KEY", "Process")
    if ([string]::IsNullOrWhiteSpace($fromEnv)) {
        $fromEnv = [Environment]::GetEnvironmentVariable("ANTHROPIC_API_KEY", "User")
    }
    if ([string]::IsNullOrWhiteSpace($fromEnv)) {
        $fromEnv = [Environment]::GetEnvironmentVariable("ANTHROPIC_API_KEY", "Machine")
    }
    if (-not [string]::IsNullOrWhiteSpace($fromEnv)) {
        Set-EnvFileValue $envFile "ANTHROPIC_API_KEY" $fromEnv
        Write-Host "Synced ANTHROPIC_API_KEY from system environment into backend/.env"
        $currentKey = $fromEnv
    }
}

if ([string]::IsNullOrWhiteSpace($currentKey)) {
    Write-Warning "ANTHROPIC_API_KEY is not set. Run: npm run ai:setup"
} else {
    $env:ANTHROPIC_API_KEY = $currentKey
    Write-Host "AI assist ready (Anthropic API key loaded)"
}

# Root Vite env (optional)
$repoRoot = Split-Path -Parent $backendRoot
$rootEnv = Join-Path $repoRoot ".env"
$rootExample = Join-Path $repoRoot ".env.example"
if ((Test-Path $rootExample) -and -not (Test-Path $rootEnv)) {
    Copy-Item $rootExample $rootEnv
    Write-Host "Created .env from .env.example"
}
