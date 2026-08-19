# Local SETUP case-pack importer: register one applicant, PATCH module islands,
# upload original PDFs, and staff-publish gated documents.
# Targets http://localhost:8080/api only. Payload JSON must not be committed
# (pass -PayloadPath to a gitignored / temp file that contains client data).
#
# Example:
#   .\scripts\import-setup-case-pack.ps1 `
#     -ZipPath "C:\path\to\pack.zip" `
#     -PayloadPath "$env:TEMP\case-pack\payload.json" `
#     -Email "client@example.demo" `
#     -Password "Demo@1234"
param(
  [Parameter(Mandatory = $true)][string]$ZipPath,
  [Parameter(Mandatory = $true)][string]$PayloadPath,
  [Parameter(Mandatory = $true)][string]$Email,
  [string]$Password = "Demo@1234",
  [string]$BaseUrl = "http://localhost:8080/api",
  [string]$StaffEmail = "agent@dost.gov.ph",
  [string]$StaffPassword = "admin123",
  [string]$WorkDir = ""
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ZipPath)) {
  throw "Zip not found: $ZipPath"
}
if (-not (Test-Path -LiteralPath $PayloadPath)) {
  throw "Payload JSON not found: $PayloadPath"
}

$payload = Get-Content -LiteralPath $PayloadPath -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $WorkDir) {
  $WorkDir = Join-Path $env:TEMP ("aisetup-case-pack-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
}
New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null
Expand-Archive -LiteralPath $ZipPath -DestinationPath $WorkDir -Force
$pdfRoot = Get-ChildItem -LiteralPath $WorkDir -Directory | Select-Object -First 1
if (-not $pdfRoot) { $pdfRoot = Get-Item -LiteralPath $WorkDir }

function Step([string]$name, [bool]$ok, [string]$detail = "") {
  $line = if ($detail) { "[$(if ($ok) {'PASS'} else {'FAIL'})] $name - $detail" } else { "[$(if ($ok) {'PASS'} else {'FAIL'})] $name" }
  Write-Host $line
  if (-not $ok) { throw "Stage failed: $name - $detail" }
}

function ApiJson([string]$method, [string]$path, $token, $bodyObj) {
  $headers = @{ "Content-Type" = "application/json" }
  if ($token) { $headers["Authorization"] = "Bearer $token" }
  $uri = "$BaseUrl$path"
  try {
    if ($null -eq $bodyObj) {
      return Invoke-RestMethod -Method $method -Uri $uri -Headers $headers
    }
    $body = $bodyObj | ConvertTo-Json -Depth 40 -Compress
    return Invoke-RestMethod -Method $method -Uri $uri -Headers $headers -Body $body
  } catch {
    $msg = $_.Exception.Message
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $msg = $_.ErrorDetails.Message }
    throw "$method $path failed: $msg"
  }
}

function PatchModule([string]$id, $token, [string]$key, $data, $published = $null) {
  $payloadBody = @{ data = $data }
  if ($null -ne $published) { $payloadBody.published = [bool]$published }
  return ApiJson "PUT" "/applicants/$id/modules/$([uri]::EscapeDataString($key))" $token $payloadBody
}

function Convert-PsToNet($value) {
  if ($null -eq $value) { return $null }
  if ($value -is [System.Management.Automation.PSCustomObject]) {
    $map = [ordered]@{}
    foreach ($p in $value.PSObject.Properties) {
      $map[$p.Name] = Convert-PsToNet $p.Value
    }
    return $map
  }
  if ($value -is [System.Collections.IEnumerable] -and $value -isnot [string]) {
    $list = @()
    foreach ($item in $value) { $list += ,(Convert-PsToNet $item) }
    return $list
  }
  return $value
}

Write-Host "=== Case pack import $Email ==="

$health = ApiJson "GET" "/health" $null $null
Step "Health" ($health.status -eq "ok") "demoModeEnabled=$($health.demoModeEnabled)"

$staff = ApiJson "POST" "/auth/login" $null @{ email = $StaffEmail; password = $StaffPassword }
$staffToken = $staff.token
Step "Staff login" (-not [string]::IsNullOrEmpty($staffToken))

$profile = Convert-PsToNet $payload.profile
$enterprise = [string]$profile.enterpriseName
$applicantId = [guid]::NewGuid().ToString()
$appId = [string]$payload.applicationId
if ([string]::IsNullOrWhiteSpace($appId)) {
  $stamp = Get-Date -Format "yyyyMMddHHmmss"
  $appId = "LOI-$(Get-Date -Format 'yyyy')-{0:D6}" -f ([int]($stamp.Substring(8, 6)) % 1000000)
}
$profile.emailAddress = $Email
$profile.applicationId = $appId
$phone = [string]$profile.contactNumber

$nameParts = ([string]$profile.applicantName).Trim() -split "\s+"
$firstName = $nameParts[0]
$lastName = if ($nameParts.Length -gt 1) { $nameParts[-1] } else { $enterprise }
$middleName = if ($nameParts.Length -gt 2) { ($nameParts[1..($nameParts.Length - 2)] -join " ") } else { "" }

$appToken = $null
try {
  $reg = ApiJson "POST" "/auth/register" $null @{
    email          = $Email
    password       = $Password
    firstName      = $firstName
    middleName     = $middleName
    lastName       = $lastName
    enterpriseName = $enterprise
    applicantId    = $applicantId
    applicationId  = $appId
    phone          = $phone
    role           = "applicant"
  }
  $appToken = $reg.token
  Step "Register client" (-not [string]::IsNullOrEmpty($appToken)) "applicantId=$applicantId applicationId=$appId"
} catch {
  $login = ApiJson "POST" "/auth/login" $null @{ email = $Email; password = $Password }
  $appToken = $login.token
  if ($login.user.applicantId) { $applicantId = [string]$login.user.applicantId }
  if ($login.user.applicationId) { $appId = [string]$login.user.applicationId }
  Step "Login existing client" (-not [string]::IsNullOrEmpty($appToken)) "applicantId=$applicantId applicationId=$appId"
}

$create = ApiJson "PUT" "/applicants/$applicantId" $appToken @{
  id             = $applicantId
  applicationId  = $appId
  enterpriseName = $enterprise
  currentModule  = "prescreening"
  moduleData     = @{
    prescreening = Convert-PsToNet $payload.prescreening
  }
  profile   = $profile
  updatedAt = (Get-Date).ToString("o")
}
Step "Cold create case" ($create.id -eq $applicantId)

if ($payload.caseMeta) {
  PatchModule $applicantId $staffToken "caseMeta" (Convert-PsToNet $payload.caseMeta) | Out-Null
  Step "caseMeta" $true
}

$applicantKeys = @(
  "loiDocument", "tna1", "projectProposal", "financialProjection",
  "projectInformationSheet", "procurement", "refund", "projectCloseOut", "signedDocuments"
)
foreach ($key in $applicantKeys) {
  $mod = $payload.modules.$key
  if ($null -eq $mod) { continue }
  $data = Convert-PsToNet $mod
  $published = $null
  if ($data.Contains("published") -and $data.published -eq $true) { $published = $true }
  PatchModule $applicantId $appToken $key $data $published | Out-Null
  Step "PATCH $key (applicant)" $true
}

$staffKeys = @(
  "tna2Document", "rtecReport", "approvalLetter", "lbpIntroduction",
  "signedMoa", "landBank", "requirementStaffReview"
)
foreach ($key in $staffKeys) {
  $mod = $payload.staffModules.$key
  if ($null -eq $mod) { continue }
  $data = Convert-PsToNet $mod
  $published = $null
  if ($data.Contains("published") -and [bool]$data.published) { $published = $true }
  PatchModule $applicantId $staffToken $key $data $published | Out-Null
  Step "PATCH $key (staff)" $true
}

if ($payload.financialProjectionInputs) {
  # Serialize from the source JSON file so single-element arrays stay arrays
  # (PowerShell ConvertTo-Json collapses them).
  $tmp = [System.IO.Path]::GetTempPath()
  $fpBuild = [System.IO.Path]::Combine($tmp, "aisetup-fp-build.js")
  @'
const fs = require("fs");
const payload = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const body = {
  applicationId: process.argv[3],
  applicantId: process.argv[4],
  inputs: payload.financialProjectionInputs,
};
fs.writeFileSync(process.argv[5], JSON.stringify(body));
'@ | Set-Content -LiteralPath $fpBuild -Encoding UTF8
  $fpReqPath = [System.IO.Path]::Combine($tmp, "aisetup-fp-req.json")
  node $fpBuild $PayloadPath $appId $applicantId $fpReqPath
  $fpHeaders = @{ Authorization = "Bearer $appToken"; "Content-Type" = "application/json" }
  $fpGen = Invoke-RestMethod -Method POST -Uri "$BaseUrl/financial-projection/generate" -Headers $fpHeaders -InFile $fpReqPath
  $fpPatchBuild = [System.IO.Path]::Combine($tmp, "aisetup-fp-patch-build.js")
  @'
const fs = require("fs");
const payload = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const gen = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
fs.writeFileSync(process.argv[4], JSON.stringify({
  data: {
    inputs: payload.financialProjectionInputs,
    snapshot: gen.snapshot,
    frozenAt: gen.frozenAt,
    source: "wizard",
    submitted: true,
  },
}));
'@ | Set-Content -LiteralPath $fpPatchBuild -Encoding UTF8
  $fpGenPath = [System.IO.Path]::Combine($tmp, "aisetup-fp-gen.json")
  $fpPatchPath = [System.IO.Path]::Combine($tmp, "aisetup-fp-patch.json")
  [System.IO.File]::WriteAllText($fpGenPath, ($fpGen | ConvertTo-Json -Depth 40))
  node $fpPatchBuild $PayloadPath $fpGenPath $fpPatchPath
  Invoke-RestMethod -Method PUT -Uri "$BaseUrl/applicants/$applicantId/modules/financialProjection" -Headers $fpHeaders -InFile $fpPatchPath | Out-Null
  Step "Financial projection snapshot" ([bool]$fpGen.snapshot) "balanced=$($fpGen.snapshot.balanced) y1Sales=$($fpGen.snapshot.incomeStatement.grossSales[0])"
}

function Find-Pdf([string]$fileName) {
  $hit = Get-ChildItem -LiteralPath $pdfRoot.FullName -Recurse -File |
    Where-Object { $_.Name -eq $fileName } |
    Select-Object -First 1
  return $hit
}

$uploaded = @{}
if ($payload.files) {
  foreach ($fileSpec in $payload.files) {
    $name = [string]$fileSpec.name
    $moduleKey = [string]$fileSpec.moduleKey
    $pdf = Find-Pdf $name
    if (-not $pdf) {
      Write-Host "[WARN] Missing PDF $name"
      continue
    }
    $token = $staffToken
    $tempRoot = [System.IO.Path]::GetTempPath()
    $safeCopy = [System.IO.Path]::Combine($tempRoot, "aisetup-upl-" + [guid]::NewGuid().ToString("N").Substring(0, 8) + ".pdf")
    [System.IO.File]::Copy($pdf.FullName, $safeCopy, $true)
    $outJson = [System.IO.Path]::Combine($tempRoot, "aisetup-upload-out.json")
    $curlOut = & curl.exe -s -o $outJson -w "%{http_code}" -X POST `
      -H "Authorization: Bearer $token" `
      -F "file=@$safeCopy;type=application/pdf;filename=$name" `
      -F "moduleKey=$moduleKey" `
      "$BaseUrl/applicants/$applicantId/files?moduleKey=$([uri]::EscapeDataString($moduleKey))"
    try { [System.IO.File]::Delete($safeCopy) } catch { }
    $ok = ($curlOut -eq "200" -or $curlOut -eq "201")
    $meta = $null
    if (Test-Path -LiteralPath $outJson) {
      try { $meta = Get-Content -LiteralPath $outJson -Raw | ConvertFrom-Json } catch { }
    }
    Step "Upload $name" $ok "http=$curlOut moduleKey=$moduleKey"
    if ($meta -and $meta.id) {
      $uploaded[$name] = $meta
    }
  }
}

function New-ModuleDoc($meta, [string]$notes) {
  if (-not $meta) { return $null }
  return @{
    fileName       = [string]$meta.originalFilename
    mimeType       = $(if ($meta.contentType) { [string]$meta.contentType } else { "application/pdf" })
    uploadedAt     = $(if ($meta.createdAt) { [string]$meta.createdAt } else { (Get-Date).ToString("o") })
    uploadedBy     = "import-setup-case-pack"
    notes          = $notes
    fileId         = [string]$meta.id
    hasFileContent = $true
  }
}

$requirementUploads = @()
if ($payload.files) {
  foreach ($fileSpec in $payload.files) {
    $reqId = [string]$fileSpec.requirementId
    if (-not $reqId) { continue }
    $meta = $uploaded[$fileSpec.name]
    $requirementUploads += @{
      id            = $reqId
      complianceId  = $reqId
      name          = $(if ($fileSpec.label) { [string]$fileSpec.label } else { [string]$fileSpec.name })
      required      = $true
      uploaded      = [bool]$meta
      fileName      = $(if ($meta) { [string]$meta.originalFilename } else { [string]$fileSpec.name })
      mimeType      = "application/pdf"
      fileSizeBytes = $(if ($meta) { [int64]$meta.sizeBytes } else { 0 })
      uploadedAt    = $(if ($meta) { [string]$meta.createdAt } else { $null })
      fileId        = $(if ($meta) { [string]$meta.id } else { $null })
    }
  }
}
if ($requirementUploads.Count -gt 0) {
  $caseMeta = Convert-PsToNet $payload.caseMeta
  if (-not $caseMeta) { $caseMeta = [ordered]@{} }
  $caseMeta.requirementUploads = $requirementUploads
  $caseMeta.documentsSubmitted = $true
  PatchModule $applicantId $staffToken "caseMeta" $caseMeta | Out-Null
  Step "requirementUploads linked" $true
}

$landBank = Convert-PsToNet $payload.staffModules.landBank
if ($landBank) {
  if (-not $landBank.form) { $landBank.form = [ordered]@{} }
  $snapMeta = $uploaded["18. Snapshot.pdf"]
  if ($snapMeta) { $landBank.form.accountSnapshot = New-ModuleDoc $snapMeta "LandBank account snapshot" }
  if (-not $landBank.form.tranches) { $landBank.form.tranches = [ordered]@{} }
  if (-not $landBank.form.tranches.first) { $landBank.form.tranches.first = @{ tranche = 1 } }
  if (-not $landBank.form.tranches.second) { $landBank.form.tranches.second = @{ tranche = 2 } }
  $t1Letter = $uploaded["19. Letter Request (1st Tranche).pdf"]
  if ($t1Letter) { $landBank.form.tranches.first.signedLetter = New-ModuleDoc $t1Letter "T1 withdrawal request" }
  $t1Quote = $uploaded["20. Updated Quotation.pdf"]
  if ($t1Quote) { $landBank.form.tranches.first.quotations = @((New-ModuleDoc $t1Quote "Updated quotation")) }
  $t1Photos = $uploaded["24. Photos of Equipment (1st Tranche).pdf"]
  if ($t1Photos) { $landBank.form.tranches.first.equipmentPhotos = @((New-ModuleDoc $t1Photos "T1 equipment photos")) }
  $t2Letter = $uploaded["25. Letter Request (2nd Tranche).pdf"]
  if ($t2Letter) { $landBank.form.tranches.second.signedLetter = New-ModuleDoc $t2Letter "T2 withdrawal request" }
  $t2Photos = $uploaded["29. Photos of Equipment (2nd Tranche).pdf"]
  if ($t2Photos) { $landBank.form.tranches.second.equipmentPhotos = @((New-ModuleDoc $t2Photos "T2 equipment photos")) }
  $landBank.submitted = $true
  PatchModule $applicantId $staffToken "landBank" $landBank $true | Out-Null
  Step "landBank fileIds" $true
}

$moaMeta = $uploaded["15. Notarized MOA.pdf"]
if ($moaMeta) {
  $moa = Convert-PsToNet $payload.staffModules.signedMoa
  if (-not $moa) { $moa = [ordered]@{} }
  $moa.fileName = [string]$moaMeta.originalFilename
  $moa.mimeType = "application/pdf"
  $moa.fileId = [string]$moaMeta.id
  $moa.hasFileContent = $true
  $moa.uploadedAt = [string]$moaMeta.createdAt
  PatchModule $applicantId $staffToken "signedMoa" $moa | Out-Null
  $approval = Convert-PsToNet $payload.staffModules.approvalLetter
  if ($approval) {
    $approval.signedMoa = $moa
    PatchModule $applicantId $staffToken "approvalLetter" $approval $true | Out-Null
  }
  Step "signedMoa linked" $true
}

$proc = Convert-PsToNet $payload.modules.procurement
if ($proc) {
  $docs = @()
  foreach ($n in @(
      "22. Original Receipt (1st Tranche).pdf",
      "23. Audited Financial Report (1st Tranche).pdf",
      "27. Original Receipt (2nd Tranche).pdf",
      "28. Audited Financial Report (2nd Tranche).pdf",
      "30. Letter Request to Untag.pdf",
      "31. Letter to Untag.pdf"
    )) {
    if ($uploaded[$n]) { $docs += New-ModuleDoc $uploaded[$n] $n }
  }
  if (-not $proc.form) { $proc.form = [ordered]@{} }
  $proc.form.documents = $docs
  $liq = @()
  $or1 = $uploaded["22. Original Receipt (1st Tranche).pdf"]
  $afr1 = $uploaded["23. Audited Financial Report (1st Tranche).pdf"]
  $liq += @{
    id          = "liq-t1"
    title       = "1st tranche liquidation - 10.5 ft Large Format Printer (Ecosolvent)"
    amount      = "785000"
    date        = "2025-04-22"
    remarks     = "MCH Commercial OR / SETUP Form 004 as of April 2025"
    attachments = @($(if ($or1) { New-ModuleDoc $or1 "T1 OR" }), $(if ($afr1) { New-ModuleDoc $afr1 "T1 AFR" })) | Where-Object { $_ }
    createdAt   = "2025-04-22T00:00:00.000Z"
  }
  $or2 = $uploaded["27. Original Receipt (2nd Tranche).pdf"]
  $afr2 = $uploaded["28. Audited Financial Report (2nd Tranche).pdf"]
  $liq += @{
    id          = "liq-t2"
    title       = "2nd tranche liquidation - remaining SETUP share"
    amount      = "785000"
    date        = "2025-04-24"
    remarks     = "MCH Commercial / SETUP Form 004 grand total Php 1,570,000.00"
    attachments = @($(if ($or2) { New-ModuleDoc $or2 "T2 OR" }), $(if ($afr2) { New-ModuleDoc $afr2 "T2 AFR" })) | Where-Object { $_ }
    createdAt   = "2025-04-24T00:00:00.000Z"
  }
  $proc.form.liquidations = $liq
  $proc.form.untagged = $true
  $proc.form.untaggedAt = "2025-10-29T00:00:00.000Z"
  $proc.submitted = $true
  PatchModule $applicantId $appToken "procurement" $proc | Out-Null
  Step "procurement liquidations" $true
}

$pis = Convert-PsToNet $payload.modules.projectInformationSheet
$prePisMeta = $uploaded["16. Pre-PIS.pdf"]
if ($pis -and $prePisMeta) {
  $pis.signedPrePis = New-ModuleDoc $prePisMeta "Pre-implementation PIS"
  $pis.signedPrePis.prePisSignedDate = "2025-03-11"
  $pis.signingDayComplete = $true
  PatchModule $applicantId $appToken "projectInformationSheet" $pis | Out-Null
  Step "Pre-PIS file linked" $true
}

try {
  ApiJson "PUT" "/applicants/$applicantId/approval-letter/acknowledge" $appToken @{
    conformeSignedName = [string]$profile.applicantName
  } | Out-Null
  Step "Approval conforme" $true
} catch {
  Write-Host "[WARN] Conforme: $($_.Exception.Message)"
}

$headerModule = "project-closeout"
if ($payload.currentModule) { $headerModule = [string]$payload.currentModule }
ApiJson "PUT" "/applicants/$applicantId/header" $staffToken @{
  enterpriseName = $enterprise
  currentModule  = $headerModule
  profile        = $profile
} | Out-Null
Step "Header $headerModule" $true

$final = ApiJson "GET" "/applicants/$applicantId" $appToken $null
Step "Client GET" ($final.id -eq $applicantId) "currentModule=$($final.currentModule)"

Write-Host ""
Write-Host "IMPORT_OK applicationId=$appId applicantId=$applicantId email=$Email"
Write-Host "Password was supplied via -Password (not echoed)."
