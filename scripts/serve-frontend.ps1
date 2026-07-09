# Serves the built Vite frontend over HTTP (no Node.js required).
param(
    [string]$Root = (Join-Path $PSScriptRoot "..\frontend"),
    [int]$Port = 4173
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path (Join-Path $Root "index.html"))) {
    Write-Error "Frontend not found at $Root — run npm run package:local first."
}

$mime = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2" = "font/woff2"
    ".webp" = "image/webp"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()

Write-Host "Frontend: http://localhost:$Port/"
Write-Host "Press Ctrl+C to stop."

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        try {
            $relative = [Uri]::UnescapeDataString($request.Url.LocalPath.TrimStart("/"))
            if ([string]::IsNullOrWhiteSpace($relative)) {
                $relative = "index.html"
            }

            $candidate = Join-Path $Root ($relative -replace "/", [IO.Path]::DirectorySeparatorChar)
            $rootFull = (Resolve-Path $Root).Path

            if (-not $candidate.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
                $response.StatusCode = 403
                $response.Close()
                continue
            }

            if (-not (Test-Path $candidate -PathType Leaf)) {
                $candidate = Join-Path $Root "index.html"
            }

            $ext = [IO.Path]::GetExtension($candidate).ToLowerInvariant()
            $bytes = [IO.File]::ReadAllBytes($candidate)
            $response.ContentType = $mime[$ext]
            if (-not $response.ContentType) {
                $response.ContentType = "application/octet-stream"
            }
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch {
            $response.StatusCode = 500
        } finally {
            $response.OutputStream.Close()
            $response.Close()
        }
    }
} finally {
    $listener.Stop()
}
