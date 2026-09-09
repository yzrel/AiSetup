# Ensures backend/.env exists and the AI provider keys are available for AI assist.
# OPENAI_API_KEY is the primary provider; ANTHROPIC_API_KEY is an optional failover.
param(
    [switch]$SkipInteractiveSetup
)
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

# Resolves a key from backend/.env, then the project .env, then the system environment,
# writing it back into backend/.env so Spring picks it up on the next boot.
function Resolve-ApiKey([string]$name) {
    $current = Get-EnvFileValue $envFile $name
    if (-not [string]::IsNullOrWhiteSpace($current)) {
        Set-Item -Path "env:$name" -Value $current
        return $current
    }

    $repoRoot = Split-Path -Parent $backendRoot
    $fromRootEnv = Get-EnvFileValue (Join-Path $repoRoot ".env") $name
    if (-not [string]::IsNullOrWhiteSpace($fromRootEnv)) {
        Set-EnvFileValue $envFile $name $fromRootEnv
        Write-Host "Copied $name from project .env into backend/.env"
        Set-Item -Path "env:$name" -Value $fromRootEnv
        return $fromRootEnv
    }

    foreach ($scope in @("Process", "User", "Machine")) {
        $fromEnv = [Environment]::GetEnvironmentVariable($name, $scope)
        if (-not [string]::IsNullOrWhiteSpace($fromEnv)) {
            Set-EnvFileValue $envFile $name $fromEnv
            Write-Host "Synced $name from system environment into backend/.env"
            Set-Item -Path "env:$name" -Value $fromEnv
            return $fromEnv
        }
    }

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

$openAiKey = Resolve-ApiKey "OPENAI_API_KEY"
# Anthropic is the failover provider only: sync it if present, never prompt for it.
$anthropicKey = Resolve-ApiKey "ANTHROPIC_API_KEY"

if ([string]::IsNullOrWhiteSpace($openAiKey)) {
    if ($env:AISETUP_SKIP_AI_SETUP -eq "1") {
        Write-Warning "OPENAI_API_KEY is not set (AISETUP_SKIP_AI_SETUP=1)."
    } elseif (-not $SkipInteractiveSetup) {
        Write-Host ""
        Write-Host "OPENAI_API_KEY is not set. Running interactive AI setup..."
        & "$PSScriptRoot\ai-setup.ps1"
        $openAiKey = Get-EnvFileValue $envFile "OPENAI_API_KEY"
        if (-not [string]::IsNullOrWhiteSpace($openAiKey)) {
            $env:OPENAI_API_KEY = $openAiKey
        }
    } else {
        Write-Warning "OPENAI_API_KEY is not set. Run: npm run ai:setup"
    }
}

if (-not [string]::IsNullOrWhiteSpace($openAiKey)) {
    if (-not [string]::IsNullOrWhiteSpace($anthropicKey)) {
        Write-Host "AI assist ready (OpenAI primary, Anthropic fallback)"
    } else {
        Write-Host "AI assist ready (OpenAI primary, template fallback)"
    }
} elseif (-not [string]::IsNullOrWhiteSpace($anthropicKey)) {
    Write-Host "AI assist ready (Anthropic only — set OPENAI_API_KEY for the primary provider)"
} else {
    Write-Warning "No AI provider key found. Template-only mode."
}

# Root Vite env (optional)
$repoRoot = Split-Path -Parent $backendRoot
$rootEnv = Join-Path $repoRoot ".env"
$rootExample = Join-Path $repoRoot ".env.example"
if ((Test-Path $rootExample) -and -not (Test-Path $rootEnv)) {
    Copy-Item $rootExample $rootEnv
    Write-Host "Created .env from .env.example"
}
