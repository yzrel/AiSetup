# Removes the k6 stress-harness applicant cases and everything hanging off them.
#
# The harness writes to a throwaway case named "k6 Stress Harness ..."; older runs
# created one per run. No foreign keys exist between applicant_records and its
# children, so child rows have to go first, and the uploaded files on disk have to
# be removed alongside their file_uploads rows or downloads break.
#
# Dry run by default:  powershell -ExecutionPolicy Bypass -File scripts/k6/cleanup.ps1
# Actually delete:     powershell -ExecutionPolicy Bypass -File scripts/k6/cleanup.ps1 -Execute
param(
    [switch]$Execute,
    [string]$NamePattern = "k6 Stress Harness%"
)

$ErrorActionPreference = "Stop"

if ($NamePattern -match "['\\]") {
    throw "NamePattern must not contain quotes or backslashes."
}

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backendRoot = Join-Path $repoRoot "backend"

function Read-DotEnv([string]$path) {
    $map = @{}
    if (-not (Test-Path $path)) { return $map }
    foreach ($line in Get-Content $path) {
        $trimmed = $line.Trim()
        if ($trimmed -eq "" -or $trimmed.StartsWith("#")) { continue }
        $eq = $trimmed.IndexOf("=")
        if ($eq -lt 1) { continue }
        $map[$trimmed.Substring(0, $eq).Trim()] = $trimmed.Substring($eq + 1).Trim().Trim('"').Trim("'")
    }
    return $map
}

function Get-Setting([hashtable]$envMap, [string]$name, [string]$fallback) {
    $fromProcess = [Environment]::GetEnvironmentVariable($name)
    if ($fromProcess) { return $fromProcess }
    if ($envMap.ContainsKey($name) -and $envMap[$name]) { return $envMap[$name] }
    return $fallback
}

$dotEnv = Read-DotEnv (Join-Path $backendRoot ".env")
$profiles = Get-Setting $dotEnv "SPRING_PROFILES_ACTIVE" ""
$useMysql = $profiles -split "," | Where-Object { $_.Trim() -eq "mysql" }

# --- engine wiring -----------------------------------------------------------

if ($useMysql) {
    $jdbcUrl = Get-Setting $dotEnv "MYSQL_URL" "jdbc:mysql://localhost:3306/aisetup"
    if ($jdbcUrl -notmatch "jdbc:mysql://([^:/]+)(?::(\d+))?/([^?]+)") {
        throw "Could not parse MYSQL_URL: $jdbcUrl"
    }
    $dbHost = $Matches[1]
    $dbPort = if ($Matches[2]) { $Matches[2] } else { "3306" }
    $dbName = $Matches[3]
    $dbUser = Get-Setting $dotEnv "MYSQL_USER" "aisetup"
    $dbPassword = Get-Setting $dotEnv "MYSQL_PASSWORD" "aisetup"

    $mysqlExe = (Get-Command mysql -ErrorAction SilentlyContinue).Source
    if (-not $mysqlExe) {
        $mysqlExe = Get-ChildItem "C:\Program Files\MySQL" -Filter "mysql.exe" -Recurse -ErrorAction SilentlyContinue |
            Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
    }
    if (-not $mysqlExe) {
        throw "mysql.exe not found. Add it to PATH or install MySQL client tools."
    }
    Write-Host "Target: MySQL $dbName on ${dbHost}:$dbPort (profile '$profiles')"
} else {
    $h2Jar = Get-ChildItem (Join-Path $env:USERPROFILE ".m2\repository\com\h2database\h2") -Filter "h2-*.jar" -Recurse -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
    if (-not $h2Jar) {
        throw "H2 jar not found under ~/.m2. Build the backend once (mvnw.cmd -q compile) so Maven downloads it."
    }
    $javaExe = Join-Path $backendRoot ".jdk\bin\java.exe"
    if (-not (Test-Path $javaExe)) {
        if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
            $javaExe = Join-Path $env:JAVA_HOME "bin\java.exe"
        } else {
            $javaExe = "java"
        }
    }
    $h2Url = "jdbc:h2:file:./data/aisetup;AUTO_SERVER=TRUE"
    Write-Host "Target: H2 file database at backend/data/aisetup (profile '$profiles')"
}

# Returns the result rows as raw lines. Callers split columns with Split-Row;
# keeping lines as strings avoids PowerShell unrolling single-column results.
function Invoke-Sql([string]$sql) {
    if ($useMysql) {
        $previous = $env:MYSQL_PWD
        $env:MYSQL_PWD = $dbPassword
        try {
            $output = & $mysqlExe "--host=$dbHost" "--port=$dbPort" "--user=$dbUser" `
                "--database=$dbName" "--batch" "--raw" "--skip-column-names" "--execute=$sql" 2>&1
            if ($LASTEXITCODE -ne 0) { throw "mysql failed: $output" }
        } finally {
            $env:MYSQL_PWD = $previous
        }
        $lines = New-Object System.Collections.Generic.List[string]
        foreach ($line in $output) {
            $text = "$line"
            if ($text.Trim() -eq "") { continue }
            $lines.Add($text)
        }
        return $lines
    }

    Push-Location $backendRoot
    try {
        $output = & $javaExe -cp $h2Jar org.h2.tools.Shell -url $h2Url -user sa -password '""' -sql $sql 2>&1
        if ($LASTEXITCODE -ne 0) { throw "H2 shell failed: $output" }
    } finally {
        Pop-Location
    }
    # H2 shell prints "COL | COL", then rows, then "(n rows, m ms)".
    $lines = New-Object System.Collections.Generic.List[string]
    $isFirst = $true
    foreach ($line in $output) {
        $text = "$line"
        if ($text.Trim() -eq "" -or $text -match "^\(\d+ rows?, " -or $text -match "^\(Update count") { continue }
        if ($isFirst) { $isFirst = $false; continue }
        $lines.Add($text)
    }
    return $lines
}

# Callers must wrap results in @(): PowerShell collapses single-element output
# to a scalar, and indexing a scalar string yields characters, not columns.
function Split-Row([string]$line) {
    if ($useMysql) { return @($line -split "`t") }
    return @($line -split "\s*\|\s*")
}

function Invoke-SqlScalar([string]$sql) {
    $lines = @(Invoke-Sql $sql)
    if ($lines.Count -eq 0) { return 0 }
    $fields = @(Split-Row $lines[0])
    return [int]$fields[0]
}

# --- find the harness cases --------------------------------------------------

$matched = @(Invoke-Sql "SELECT id, enterprise_name FROM applicant_records WHERE enterprise_name LIKE '$NamePattern' ORDER BY enterprise_name")
if ($matched.Count -eq 0) {
    Write-Host "No applicant records match '$NamePattern'. Nothing to clean."
    exit 0
}

$ids = @()
Write-Host ""
Write-Host "Matched $($matched.Count) harness case(s):"
foreach ($line in $matched) {
    $fields = @(Split-Row $line)
    $id = $fields[0]
    if ($id -notmatch "^[A-Za-z0-9._:-]+$") {
        throw "Refusing to act on unexpected applicant id: $id"
    }
    $ids += $id
    Write-Host ("  {0}  {1}" -f $id, $fields[1])
}
$idList = ($ids | ForEach-Object { "'$_'" }) -join ","

$counts = [ordered]@{
    applicant_module_data = Invoke-SqlScalar "SELECT COUNT(*) FROM applicant_module_data WHERE applicant_id IN ($idList)"
    file_uploads          = Invoke-SqlScalar "SELECT COUNT(*) FROM file_uploads WHERE applicant_id IN ($idList)"
    notifications         = Invoke-SqlScalar "SELECT COUNT(*) FROM notifications WHERE applicant_id IN ($idList)"
    audit_events          = Invoke-SqlScalar "SELECT COUNT(*) FROM audit_events WHERE entity_type = 'applicant' AND entity_id IN ($idList)"
    users                 = Invoke-SqlScalar "SELECT COUNT(*) FROM users WHERE applicant_id IN ($idList)"
    applicant_records     = $ids.Count
}

Write-Host ""
Write-Host "Rows that will be deleted:"
foreach ($key in $counts.Keys) {
    Write-Host ("  {0,-22} {1}" -f $key, $counts[$key])
}

$storagePaths = @(Invoke-Sql "SELECT storage_path FROM file_uploads WHERE applicant_id IN ($idList)" | ForEach-Object { @(Split-Row $_)[0] })
$existingFiles = @($storagePaths | Where-Object { $_ -and (Test-Path -LiteralPath $_) })
$fileBytes = 0
if ($existingFiles.Count -gt 0) {
    $fileBytes = (Get-Item -LiteralPath $existingFiles | Measure-Object Length -Sum).Sum
}
Write-Host ("  {0,-22} {1} ({2} KB)" -f "files on disk", $existingFiles.Count, [math]::Round($fileBytes / 1KB))

if (-not $Execute) {
    Write-Host ""
    Write-Host "Dry run only. Re-run with -Execute to delete."
    exit 0
}

# --- delete ------------------------------------------------------------------

Write-Host ""
Write-Host "Deleting..."

foreach ($file in $existingFiles) {
    Remove-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue
}

$uploadDir = Get-Setting $dotEnv "AISETUP_UPLOAD_DIR" (Join-Path $backendRoot "data\uploads")
foreach ($id in $ids) {
    $dir = Join-Path $uploadDir $id
    if (Test-Path -LiteralPath $dir) {
        Remove-Item -LiteralPath $dir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "  removed $($existingFiles.Count) file(s) and their case folders"

# Children first: nothing enforces this in the schema, but leaving orphan rows
# behind makes the case look half-deleted in the audit trail and file list.
$deletes = @(
    "DELETE FROM applicant_module_data WHERE applicant_id IN ($idList)",
    "DELETE FROM file_uploads WHERE applicant_id IN ($idList)",
    "DELETE FROM notifications WHERE applicant_id IN ($idList)",
    "DELETE FROM audit_events WHERE entity_type = 'applicant' AND entity_id IN ($idList)",
    "DELETE FROM users WHERE applicant_id IN ($idList)",
    "DELETE FROM applicant_records WHERE id IN ($idList)"
)
foreach ($statement in $deletes) {
    Invoke-Sql $statement | Out-Null
    Write-Host ("  {0}" -f ($statement -replace " WHERE.*", ""))
}

$remaining = Invoke-SqlScalar "SELECT COUNT(*) FROM applicant_records WHERE enterprise_name LIKE '$NamePattern'"
Write-Host ""
if ($remaining -eq 0) {
    Write-Host "Done. No harness cases remain."
} else {
    Write-Warning "$remaining harness case(s) still present."
    exit 1
}
