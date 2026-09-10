# Repairs cases stranded by an out-of-order RTEC "Mark Complete" — where the
# Regional Director already approved AND staff already published the Notice of
# Approval, but `current_module` / `routingDecision` / `rtecReport.submitted`
# were never recorded, so the cooperator's Approval Letter stays locked.
#
# Reports by default. Pass -Apply to write.
#
#   .\repair-stuck-approval-cases.ps1
#   .\repair-stuck-approval-cases.ps1 -Apply
#   .\repair-stuck-approval-cases.ps1 -ApplicationId LOI-2026-408723 -Apply
param(
    [switch]$Apply,
    [string]$ApplicationId,
    [string]$MysqlHost = "localhost",
    [int]$Port = 3306,
    [string]$Database = "aisetup",
    [string]$User = "aisetup"
)
$ErrorActionPreference = "Stop"

# Windows PowerShell 5.1 has no null-conditional operator, so resolve in two steps.
$mysqlCommand = Get-Command mysql -ErrorAction SilentlyContinue
$mysqlExe = if ($mysqlCommand) { $mysqlCommand.Source } else { $null }
if (-not $mysqlExe) {
    $candidates = Get-ChildItem "C:\Program Files\MySQL\*\bin\mysql.exe" -ErrorAction SilentlyContinue
    if ($candidates) { $mysqlExe = $candidates[-1].FullName }
}
if (-not $mysqlExe) {
    throw "mysql client not found. Add it to PATH or install MySQL Server."
}

# Password is read interactively so it never lands in a script, env var, or shell history.
$securePassword = Read-Host "MySQL password for '$User'" -AsSecureString
$plainPassword = [System.Net.NetworkCredential]::new("", $securePassword).Password

$reportSql = @"
SELECT
    r.application_id                                                              AS applicationId,
    r.enterprise_name                                                             AS enterprise,
    r.current_module                                                              AS currentModule,
    JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.routingDecision'))            AS routingDecision,
    JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.staffDecision'))              AS staffDecision,
    JSON_EXTRACT(r.module_data_json, '$.rtecReport.submitted')                     AS rtecSubmitted,
    JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.approvalLetter.rdDecision'))  AS rdDecision,
    JSON_EXTRACT(r.module_data_json, '$.approvalLetter.published')                 AS noticePublished
FROM applicant_records r
WHERE JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.approvalLetter.rdDecision')) = 'approved'
  AND JSON_EXTRACT(r.module_data_json, '$.approvalLetter.published') = TRUE
  AND JSON_SEARCH(
        JSON_EXTRACT(r.module_data_json, '$.assessments[*].decision'),
        'one', 'rtec-completed') IS NOT NULL
  AND (
        r.current_module IN ('requirements', 'conduct-rtec')
     OR JSON_EXTRACT(r.module_data_json, '$.routingDecision') IS NULL
     OR COALESCE(JSON_EXTRACT(r.module_data_json, '$.rtecReport.submitted'), FALSE) <> TRUE
  )
"@

if ($ApplicationId) {
    $safeId = $ApplicationId.Replace("'", "''")
    $reportSql += "`n  AND r.application_id = '$safeId'"
    # Scopes the UPDATEs too, not just this report.
    $scopePrefix = "SET @app_id = '$safeId';`n"
} else {
    $scopePrefix = "SET @app_id = NULL;`n"
}
$reportSql += ";"

function Invoke-MySql([string]$sql) {
    $sql | & $mysqlExe "--host=$MysqlHost" "--port=$Port" "--user=$User" "--password=$plainPassword" `
        "--database=$Database" --table 2>&1
}

Write-Host "`n=== Stuck cases (RD-approved + published, but state incomplete) ===" -ForegroundColor Cyan
Invoke-MySql $reportSql

if (-not $Apply) {
    Write-Host "`nReport only. Re-run with -Apply to repair these rows." -ForegroundColor Yellow
    return
}

$scriptSql = Join-Path $PSScriptRoot "repair-stuck-approval-cases.sql"
if (-not (Test-Path $scriptSql)) {
    throw "Missing $scriptSql"
}

Write-Host "`n=== Applying repair ===" -ForegroundColor Cyan
if ($ApplicationId) {
    Write-Host "Scoped to $ApplicationId" -ForegroundColor Yellow
} else {
    Write-Host "Scope: ALL matching cases" -ForegroundColor Yellow
}
Invoke-MySql ($scopePrefix + (Get-Content $scriptSql -Raw))
Write-Host "`nDone. Ask affected staff to reload the portal so hydrate picks up the new header." -ForegroundColor Green
