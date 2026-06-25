# Loads backend/.env (if present) and starts the Spring Boot API.
$ErrorActionPreference = "Stop"
$backendRoot = Split-Path -Parent $PSScriptRoot
& "$PSScriptRoot\ensure-env.ps1"
$envFile = Join-Path $backendRoot ".env"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) { return }
        $eq = $line.IndexOf("=")
        if ($eq -lt 1) { return }
        $name = $line.Substring(0, $eq).Trim()
        $value = $line.Substring($eq + 1).Trim().Trim('"').Trim("'")
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
        Set-Item -Path "env:$name" -Value $value
    }
    Write-Host "Loaded environment from $envFile"
} else {
    Write-Host "No backend/.env found - run: npm run ai:setup"
}

Push-Location $backendRoot
try {
    & .\mvnw.cmd spring-boot:run @args
} finally {
    Pop-Location
}
