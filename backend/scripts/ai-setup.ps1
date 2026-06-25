# Saves your Anthropic API key to backend/.env for AI assist.
$ErrorActionPreference = "Stop"
$backendRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $backendRoot ".env"
$exampleFile = Join-Path $backendRoot ".env.example"

& "$PSScriptRoot\ensure-env.ps1" | Out-Null

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
    } elseif (Test-Path $exampleFile) {
        $lines = @(Get-Content $exampleFile)
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

Write-Host ""
Write-Host "Anthropic API key setup for aiSETUP AI assist"
Write-Host "Get a key at https://console.anthropic.com/"
Write-Host ""

$key = Read-Host "Paste ANTHROPIC_API_KEY (input hidden)" -AsSecureString
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($key)
).Trim()

if ([string]::IsNullOrWhiteSpace($plain)) {
    Write-Error "No key entered."
}

if (-not $plain.StartsWith("sk-ant-")) {
    Write-Warning "This does not look like an Anthropic key (expected sk-ant-...). Saving anyway."
}

Set-EnvFileValue $envFile "ANTHROPIC_API_KEY" $plain
$env:ANTHROPIC_API_KEY = $plain

Write-Host ""
Write-Host "Saved to backend/.env"
Write-Host "Restart the backend: npm run backend"
Write-Host "Then check http://localhost:8080/api/health (aiConfigured should be true)"
Write-Host ""
