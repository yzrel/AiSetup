# Local API rehearsal: register one applicant and walk MODULE_ORDER to completed.
# Targets http://localhost:8080/api only (not production).
$ErrorActionPreference = "Stop"
$Base = "http://localhost:8080/api"
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "rehearsal.$stamp@example.com"
$phone = "0917$($stamp.Substring(6,6))"
$password = "Demo@1234"
$appId = "LOI-$(Get-Date -Format 'yyyy')-{0:D6}" -f ([int]($stamp.Substring(8,6)) % 1000000)
$applicantId = [guid]::NewGuid().ToString()
$enterprise = "Koronadal Valley Foods"
$log = New-Object System.Collections.Generic.List[string]

function Step([string]$name, [bool]$ok, [string]$detail = "") {
  $status = if ($ok) { "PASS" } else { "FAIL" }
  if ($detail) {
    $line = "[$status] $name - $detail"
  } else {
    $line = "[$status] $name"
  }
  $script:log.Add($line) | Out-Null
  Write-Host $line
  if (-not $ok) { throw "Stage failed: $name - $detail" }
}

function ApiJson([string]$method, [string]$path, $token, $bodyObj) {
  $headers = @{ "Content-Type" = "application/json" }
  if ($token) { $headers["Authorization"] = "Bearer $token" }
  $uri = "$Base$path"
  try {
    if ($null -eq $bodyObj) {
      return Invoke-RestMethod -Method $method -Uri $uri -Headers $headers
    }
    $body = $bodyObj | ConvertTo-Json -Depth 30 -Compress
    return Invoke-RestMethod -Method $method -Uri $uri -Headers $headers -Body $body
  } catch {
    $msg = $_.Exception.Message
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
      $msg = $_.ErrorDetails.Message
    }
    throw "$method $path failed: $msg"
  }
}

function PatchModule([string]$id, $token, [string]$key, $data, $published = $null) {
  $payload = @{ data = $data }
  if ($null -ne $published) { $payload.published = [bool]$published }
  return ApiJson "PUT" "/applicants/$id/modules/$([uri]::EscapeDataString($key))" $token $payload
}

function SetHeader([string]$id, $token, [string]$module, $profile) {
  return ApiJson "PUT" "/applicants/$id/header" $token @{
    enterpriseName = $enterprise
    currentModule  = $module
    profile        = $profile
  }
}

Write-Host "=== E2E rehearsal $email / $appId ==="

$health = ApiJson "GET" "/health" $null $null
Step "Health" ($health.status -eq "ok") "demoModeEnabled=$($health.demoModeEnabled)"

$staff = ApiJson "POST" "/auth/login" $null @{ email = "agent@dost.gov.ph"; password = "admin123" }
$staffToken = $staff.token
Step "Staff login" (-not [string]::IsNullOrEmpty($staffToken))

$reg = ApiJson "POST" "/auth/register" $null @{
  email          = $email
  password       = $password
  firstName      = "Juan"
  lastName       = "Dela Cruz"
  enterpriseName = $enterprise
  applicantId    = $applicantId
  applicationId  = $appId
  phone          = $phone
  role           = "applicant"
}
$appToken = $reg.token
Step "Register new client" (-not [string]::IsNullOrEmpty($appToken)) "applicantId=$applicantId applicationId=$appId"

$profileBase = @{
  applicantName    = "Juan Dela Cruz"
  designation      = "Owner"
  contactNumber    = $phone
  emailAddress     = $email
  businessType     = "DTI"
  businessNature   = "Registered with DTI or SEC for manufacturing"
  businessSector   = "Food Processing"
  yearsOfOperation = "5"
  enterpriseType   = "Manufacturing"
  msmeSize         = "Small"
  assetSize        = "8000000"
  region           = "Region XII (SOCCSKSARGEN)"
  address          = "Koronadal City, South Cotabato"
  province         = "South Cotabato"
  qualified        = $true
  submittedAt      = (Get-Date).ToString("o")
  lastUpdated      = (Get-Date).ToString("o")
}

$create = ApiJson "PUT" "/applicants/$applicantId" $appToken @{
  id             = $applicantId
  applicationId  = $appId
  enterpriseName = $enterprise
  currentModule  = "prescreening"
  moduleData     = @{
    prescreening = @{
      businessSector       = "Food Processing"
      businessNature       = "Registered with DTI or SEC for manufacturing"
      yearsOfOperation     = "5"
      msmeSize             = "Small"
      exportClassification = "Domestic with export potential"
    }
  }
  profile   = $profileBase
  updatedAt = (Get-Date).ToString("o")
}
Step "Cold create case at prescreening" ($create.currentModule -eq "prescreening")

SetHeader $applicantId $appToken "registration" $profileBase | Out-Null
Step "Advance to registration" $true

SetHeader $applicantId $appToken "letter-of-intent" $profileBase | Out-Null
PatchModule $applicantId $appToken "loiDocument" @{
  form = @{
    applicantName      = "Juan Dela Cruz"
    enterpriseName     = $enterprise
    projectDescription = "Vacuum packaging line to raise capacity"
  }
  bodyParagraphs = @("SETUP seed fund", "refund of the approved seed fund")
  submitted      = $true
} | Out-Null
Step "SETUP LOI stored" $true

SetHeader $applicantId $appToken "tna1" $profileBase | Out-Null
$tna1Form = @{
  enterpriseName             = $enterprise
  contactPerson              = "Juan Dela Cruz"
  position                   = "Owner"
  officeAddress              = "Koronadal City, South Cotabato"
  officeTel                  = $phone
  officeEmail                = $email
  organizationType           = "Sole Proprietorship (DTI)"
  sector                     = "Food Processing"
  commodity                  = "Food Processing"
  mainProduct                = "Dried mangoes, banana chips"
  employeesMale              = "6"
  employeesFemale            = "5"
  employmentClass            = "Small"
  capitalClassification      = "Small"
  yearEstablished            = "2019"
  reasonsForAssistance       = "Packaging line acquisition"
  productionProblemsConcerns = "Manual packing bottlenecks"
  processFlow                = "Receiving to packaging"
  processFlowMode            = "text"
  productionPlan             = "Increase capacity plan"
  plantLayoutFileName        = "layout.pdf"
  undertakingName            = "Juan Dela Cruz"
  preparedDate               = "2026-08-05"
}
ApiJson "PUT" "/applicants/$applicantId/tna1" $appToken @{
  applicantId = $applicantId
  form        = $tna1Form
  tables      = @{
    rawMaterials = @(, @("Fresh fruit", "Local", "80", "5000"))
    production   = @(, @("Dried mangoes", "3000", "120", "360000"))
    equipment    = @(, @("Dehydrator", "50kg", "50kg/day", "2", "2018"))
  }
  submitted = $true
} | Out-Null
PatchModule $applicantId $staffToken "tna1" @{
  form              = $tna1Form
  submitted         = $true
  staffReviewed     = $true
  directorValidated = $true
} | Out-Null
SetHeader $applicantId $appToken "tna2" $profileBase | Out-Null
Step "TNA1 submit and staff review to tna2" $true

PatchModule $applicantId $staffToken "tna2Document" @{
  form           = @{ enterpriseName = $enterprise; summary = "Draft TNA2" }
  bodyParagraphs = @("Technical findings draft")
} $false | Out-Null
$asClient = ApiJson "GET" "/applicants/$applicantId" $appToken $null
$tna2Visible = $null -ne $asClient.moduleData.tna2Document
Step "Client cannot see unpublished TNA2" (-not $tna2Visible) "tna2Document present=$tna2Visible"

PatchModule $applicantId $staffToken "tna2Document" @{
  form           = @{ enterpriseName = $enterprise; summary = "Published TNA2" }
  bodyParagraphs = @("Technical findings published")
  publishedAt    = (Get-Date).ToString("o")
} $true | Out-Null
SetHeader $applicantId $staffToken "project-proposal" $profileBase | Out-Null
Step "TNA2 publish to project-proposal" $true

PatchModule $applicantId $appToken "projectProposal" @{
  form = @{
    projectTitle    = "Vacuum Packaging Line Upgrade"
    proponentName   = "Juan Dela Cruz"
    amountRequested = "Php 2,000,000.00"
    firmName        = $enterprise
  }
  attachmentKinds = @("vicinityMap", "plantLayout")
  attachments     = @(
    @{ kind = "vicinityMap"; fileName = "map.png" },
    @{ kind = "plantLayout"; fileName = "layout.png" }
  )
  submitted = $true
} | Out-Null
SetHeader $applicantId $appToken "requirements" $profileBase | Out-Null
Step "Project proposal to requirements" $true

PatchModule $applicantId $staffToken "caseMeta" @{
  documentsSubmitted = $true
  staffDecision      = "approved"
  routingDecision    = "setup"
} | Out-Null
SetHeader $applicantId $staffToken "conduct-rtec" $profileBase | Out-Null
Step "Requirements approved SETUP to conduct-rtec" $true

PatchModule $applicantId $staffToken "rtecReport" @{
  form = @{
    proposalSnapshot = @{ projectTitle = "Vacuum Packaging Line Upgrade" }
    complianceItems  = @(@{ id = "1"; status = "complied" })
    recommendation   = "RTEC recommends approval."
    signatures       = @{ chairperson = "Engr. Test Chair" }
  }
  submitted = $true
} $true | Out-Null
SetHeader $applicantId $staffToken "approval-letter" $profileBase | Out-Null
Step "RTEC submit to approval-letter" $true

PatchModule $applicantId $staffToken "approvalLetter" @{
  form = @{
    projectTitle      = "Vacuum Packaging Line Upgrade"
    referenceNumber   = "NOA-$stamp"
    recipientName     = "Juan Dela Cruz"
    enterpriseName    = $enterprise
    enterpriseAddress = "Koronadal City, South Cotabato"
    pstoOfficeName    = "PSTO - South Cotabato"
    signatoryName     = "Provincial Director"
    approvedAmount    = "2000000"
  }
  publishedAt = (Get-Date).ToString("o")
} $true | Out-Null
ApiJson "PUT" "/applicants/$applicantId/approval-letter/acknowledge" $appToken @{
  conformeSignedName = "Juan Dela Cruz"
} | Out-Null
SetHeader $applicantId $staffToken "landbank-withdrawal" $profileBase | Out-Null
Step "Approval publish and conforme to landbank-withdrawal" $true

$tmp = Join-Path $env:TEMP "signed-moa-$stamp.pdf"
[System.IO.File]::WriteAllBytes($tmp, [System.Text.Encoding]::ASCII.GetBytes("%PDF-1.4 rehearsal moa"))
$curlOut = & curl.exe -s -o "$env:TEMP\moa-upload-out.txt" -w "%{http_code}" -X POST `
  -H "Authorization: Bearer $staffToken" `
  -F "file=@$tmp;type=application/pdf" `
  -F "moduleKey=signedMoa" `
  "$Base/applicants/$applicantId/files?moduleKey=signedMoa"
Step "Staff upload signedMoa file" ($curlOut -eq "200" -or $curlOut -eq "201") "http=$curlOut"

PatchModule $applicantId $staffToken "refund" @{
  form = @{
    pdcsRecorded = $true
    pdcs         = @(@{ checkNumber = "1"; amount = "100000"; dueDate = "2026-12-01" })
  }
} | Out-Null
PatchModule $applicantId $staffToken "lbpIntroduction" @{
  form = @{
    approvedAmount = "2000000"
    enterpriseName = $enterprise
  }
  publishedAt = (Get-Date).ToString("o")
} $true | Out-Null
Step "PDCs and LBP intro published" $true

PatchModule $applicantId $staffToken "landBank" @{
  form = @{
    accountSnapshot = "passbook.pdf"
    tranches        = @{
      first = @{
        signedLetter = @{ fileName = "letter.pdf" }
        quotations   = @(@{ fileName = "q1.pdf" })
        photos       = @(@{ fileName = "eq.jpg" })
      }
    }
  }
  submitted = $true
} | Out-Null
SetHeader $applicantId $staffToken "procurement-liquidation" $profileBase | Out-Null
Step "LandBank submitted to procurement" $true

PatchModule $applicantId $appToken "procurement" @{
  form      = @{ notes = "Procurement complete" }
  submitted = $true
} | Out-Null
SetHeader $applicantId $appToken "refund-delinquent" $profileBase | Out-Null
Step "Procurement to refund" $true

PatchModule $applicantId $appToken "refund" @{
  form = @{
    pdcsRecorded = $true
    pdcs         = @(@{ checkNumber = "1"; amount = "100000"; dueDate = "2026-12-01" })
  }
  submitted = $true
} | Out-Null
SetHeader $applicantId $appToken "project-closeout" $profileBase | Out-Null
Step "Refund to project-closeout" $true

PatchModule $applicantId $appToken "projectCloseOut" @{
  form = @{
    terminalReportFileName           = "form010.pdf"
    auditedFinancialFileName         = "afs.pdf"
    equipmentAcknowledgementFileName = "ack.pdf"
    certificateOfOwnershipIssued     = $true
    equipmentInventory               = @(@{ description = "Vacuum sealer" })
  }
  submitted = $true
} | Out-Null
SetHeader $applicantId $appToken "completed" $profileBase | Out-Null
$final = ApiJson "GET" "/applicants/$applicantId" $appToken $null
Step "Close-out to completed" ($final.currentModule -eq "completed") "currentModule=$($final.currentModule)"

$hasApproval = $final.moduleData.approvalLetter -and $final.moduleData.approvalLetter.published
Step "Client sees published approval letter" ([bool]$hasApproval)

Write-Host ""
Write-Host "REHEARSAL_OK applicationId=$appId applicantId=$applicantId email=$email"
$script:log.Add("META applicationId=$appId applicantId=$applicantId email=$email password=$password") | Out-Null
$script:log.Add("META demoModeEnabled=$($health.demoModeEnabled)") | Out-Null
$outPath = Join-Path $PSScriptRoot "..\docs\presentation\_e2e_rehearsal_raw.txt"
$script:log | Set-Content -Path $outPath -Encoding UTF8
Write-Host "Wrote $outPath"
