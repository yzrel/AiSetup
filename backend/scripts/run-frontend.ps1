# Ensures AI env, then starts the Vite dev server.
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

& "$PSScriptRoot\ensure-env.ps1"

Push-Location $repoRoot
try {
  npx vite @args
} finally {
  Pop-Location
}
