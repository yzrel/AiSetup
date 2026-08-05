# Full-field local API rehearsal: register one applicant and fill dense payloads
# through MODULE_ORDER to completed. Targets http://localhost:8080/api only.
$ErrorActionPreference = "Stop"
$Base = "http://localhost:8080/api"
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "fullfield.$stamp@example.com"
$phone = "0918$($stamp.Substring(6,6))"
$password = "Demo@1234"
$appId = "LOI-$(Get-Date -Format 'yyyy')-{0:D6}" -f (([int]($stamp.Substring(8,6)) + 17) % 1000000)
$applicantId = [guid]::NewGuid().ToString()
$enterprise = "Full Field Foods Corp"
$log = New-Object System.Collections.Generic.List[string]
$tmpDir = Join-Path $env:TEMP "aisetup-fullfield-$stamp"
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

function Step([string]$name, [bool]$ok, [string]$detail = "") {
  $status = if ($ok) { "PASS" } else { "FAIL" }
  $line = if ($detail) { "[$status] $name - $detail" } else { "[$status] $name" }
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
    $body = $bodyObj | ConvertTo-Json -Depth 40 -Compress
    return Invoke-RestMethod -Method $method -Uri $uri -Headers $headers -Body $body
  } catch {
    $msg = $_.Exception.Message
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $msg = $_.ErrorDetails.Message }
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

function NewStubFile([string]$name) {
  $path = Join-Path $tmpDir $name
  $bytes = [System.Text.Encoding]::ASCII.GetBytes("%PDF-1.4 fullfield stub $name")
  [System.IO.File]::WriteAllBytes($path, $bytes)
  return $path
}

function UploadFile([string]$id, $token, [string]$moduleKey, [string]$filePath) {
  $code = & curl.exe -s -o "$tmpDir\upload-$moduleKey.json" -w "%{http_code}" -X POST `
    -H "Authorization: Bearer $token" `
    -F "file=@$filePath;type=application/pdf" `
    -F "moduleKey=$moduleKey" `
    "$Base/applicants/$id/files?moduleKey=$([uri]::EscapeDataString($moduleKey))"
  if ($code -ne "200" -and $code -ne "201") {
    $body = Get-Content "$tmpDir\upload-$moduleKey.json" -Raw -ErrorAction SilentlyContinue
    throw "Upload $moduleKey failed http=$code $body"
  }
  $json = Get-Content "$tmpDir\upload-$moduleKey.json" -Raw | ConvertFrom-Json
  return $json
}

function ModDoc([string]$fileName, [string]$uploadedBy, $fileId = $null) {
  $d = @{
    fileName   = $fileName
    mimeType   = "application/pdf"
    dataUrl    = "data:application/pdf;base64,JVBERi0xLjQ="
    uploadedAt = (Get-Date).ToString("o")
    uploadedBy = $uploadedBy
  }
  if ($fileId) { $d.fileId = $fileId }
  return $d
}

Write-Host "=== FULL-FIELD E2E $email / $appId ==="

$health = ApiJson "GET" "/health" $null $null
Step "Health" ($health.status -eq "ok") "demoModeEnabled=$($health.demoModeEnabled)"

$staff = ApiJson "POST" "/auth/login" $null @{ email = "agent@dost.gov.ph"; password = "admin123" }
$staffToken = $staff.token
Step "Staff login" (-not [string]::IsNullOrEmpty($staffToken))

$reg = ApiJson "POST" "/auth/register" $null @{
  email          = $email
  password       = $password
  firstName      = "Maria"
  middleName     = "Santos"
  lastName       = "Reyes"
  enterpriseName = $enterprise
  applicantId    = $applicantId
  applicationId  = $appId
  phone          = $phone
  role           = "applicant"
}
$appToken = $reg.token
Step "Register new client" (-not [string]::IsNullOrEmpty($appToken)) "id=$applicantId"

$profile = @{
  applicantName      = "Maria Santos Reyes"
  firstName          = "Maria"
  middleName         = "Santos"
  lastName           = "Reyes"
  designation        = "Proprietor / Owner"
  contactNumber      = $phone
  emailAddress       = $email
  birthday           = "1988-05-12"
  gender             = "Female"
  civilStatus        = "Married"
  isPWD              = $false
  businessType       = "DTI"
  businessNature     = "Registered with DTI or SEC for manufacturing"
  businessSector     = "Food Processing"
  yearsOfOperation   = "5"
  enterpriseType     = "Manufacturing"
  msmeSize           = "Small"
  assetSize          = "8000000"
  classificationRange = "3M-15M"
  essentialPeriod    = "2019-present"
  turnover           = "12000000"
  region             = "Region XII (SOCCSKSARGEN)"
  address            = "Purok 5, General Santos Drive, Koronadal City, South Cotabato"
  province           = "South Cotabato"
  zipCode            = "9506"
  tinNumber          = "456-789-012-000"
  registrationType   = "DTI"
  registrationNumber = "DTI-12-8877665"
  companyStartDate   = "2019-03-01"
  companyDescription = "Processed fruit snacks for regional and export markets."
  coreProducts       = "Dried mangoes, banana chips, fruit puree"
  exportClassification = "Domestic with export potential"
  qualified          = $true
  submittedAt        = (Get-Date).ToString("o")
  lastUpdated        = (Get-Date).ToString("o")
}

# --- Prescreening cold create ---
$create = ApiJson "PUT" "/applicants/$applicantId" $appToken @{
  id             = $applicantId
  applicationId  = $appId
  enterpriseName = $enterprise
  currentModule  = "prescreening"
  moduleData     = @{
    tinNumber          = $profile.tinNumber
    registrationType   = $profile.registrationType
    registrationNumber = $profile.registrationNumber
    companyDescription = $profile.companyDescription
    coreProducts       = $profile.coreProducts
    productServices    = $profile.coreProducts
    projectDescription = "Acquisition of a vacuum packaging and labeling line to raise capacity and reduce spoilage."
    expectedOutcome    = "Increase production capacity by 40% and open Mindanao supermarket channels."
    budget             = "2500000"
    timeline           = "18 months"
    selfie             = @{ fileName = "selfie.jpg"; mimeType = "image/jpeg"; uploadedAt = (Get-Date).ToString("o") }
    prescreening       = @{
      businessSector       = "Food Processing"
      businessNature       = "Registered with DTI or SEC for manufacturing"
      yearsOfOperation     = "5"
      msmeSize             = "Small"
      exportClassification = "Domestic with export potential"
      companyDescription   = $profile.companyDescription
      assetSize            = "8000000"
      turnover             = "12000000"
      classificationRange  = "3M-15M"
      essentialPeriod      = "2019-present"
      coreProducts         = $profile.coreProducts
    }
  }
  profile   = $profile
  updatedAt = (Get-Date).ToString("o")
}
Step "Cold create full prescreening profile" ($create.currentModule -eq "prescreening")

SetHeader $applicantId $appToken "registration" $profile | Out-Null
$permit1 = UploadFile $applicantId $appToken "businessPermits" (NewStubFile "permit-2023.pdf")
$permit2 = UploadFile $applicantId $appToken "businessPermits" (NewStubFile "permit-2024.pdf")
$permit3 = UploadFile $applicantId $appToken "businessPermits" (NewStubFile "permit-2025.pdf")
$fdaUp = UploadFile $applicantId $appToken "fda" (NewStubFile "fda-lto.pdf")
PatchModule $applicantId $appToken "caseMeta" @{
  tinNumber          = $profile.tinNumber
  registrationType   = "DTI"
  registrationNumber = $profile.registrationNumber
  companyStartDate   = "2019-03-01"
  companyDescription = $profile.companyDescription
  fdaNumber          = "FDA-LTO-XII-2024-001"
  businessPermits    = @(
    @{ year = "2023"; document = (ModDoc "permit-2023.pdf" $email $permit1.id) }
    @{ year = "2024"; document = (ModDoc "permit-2024.pdf" $email $permit2.id) }
    @{ year = "2025"; document = (ModDoc "permit-2025.pdf" $email $permit3.id) }
  )
  enterpriseAddress  = $profile.address
  province           = "South Cotabato"
  postalCode         = "9506"
  dtiSec             = "DTI"
} | Out-Null
Step "Enterprise registration permits and FDA" $true

SetHeader $applicantId $appToken "letter-of-intent" $profile | Out-Null
$prodPlan = UploadFile $applicantId $appToken "loiDocument" (NewStubFile "production-plan.pdf")
# Persist LOI form fields on case meta (letter document is a separate letterhead shape).
PatchModule $applicantId $appToken "caseMeta" @{
  dateEstablished      = "2019-03-01"
  province             = "South Cotabato"
  zipCode              = "9506"
  postalCode           = "9506"
  productServices      = $profile.coreProducts
  projectDescription   = "Acquisition of a vacuum packaging and labeling line to raise capacity and reduce spoilage."
  expectedOutcome      = "Increase production capacity by 40% and open Mindanao supermarket channels."
  budget               = "2500000"
  timeline             = "18 months"
  tinNumber            = $profile.tinNumber
  registrationType     = "DTI"
  registrationNumber   = $profile.registrationNumber
  productionPlanFile   = "production-plan.pdf"
  productionPlanNotes  = "Phased commissioning of sealer, labeler, and QA bench."
  productionPlanDocument = (ModDoc "production-plan.pdf" $email $prodPlan.id)
  commitmentAmount     = "Php 2,000,000.00"
  repaymentTerm        = "five (5) years"
  loiSubmittedAt       = (Get-Date).ToString("o")
  loiDocumentProgramId = ""
} | Out-Null
PatchModule $applicantId $appToken "loiDocument" @{
  letterhead = @{
    enterpriseName = $enterprise.ToUpper()
    address        = $profile.address
    email          = $email
    mobile         = $phone
    date           = "August 5, 2026"
  }
  regionalAddressee = @{
    name  = "ENGR. SAMMY P. MALAWAN"
    title = "Regional Director"
    lines = @(
      "ENGR. SAMMY P. MALAWAN"
      "Regional Director"
      "Department of Science and Technology"
      "Regional Office No. XII"
      "Philippine National Halal Laboratory and Science"
      "Center, Brgy. Paraiso, Koronadal City"
    )
  }
  thruAddressee = @{
    name       = "Provincial Director"
    title      = "Provincial Director"
    officeName = "PSTO - South Cotabato"
    thruLine   = "THRU: Provincial Director"
    lines      = @(
      "THRU: Provincial Director"
      "PSTO - South Cotabato"
    )
  }
  salutation = "Dear Regional Director Malawan:"
  bodyParagraphs = @(
    "This Letter of Intent signifies interest in the DOST SETUP seed fund.",
    "The enterprise commits to the refund of the approved seed fund within five years.",
    "Insurance and PDC requirements will be complied with upon approval."
  )
  closing = "Respectfully yours,"
  signature = @{
    typedName      = "Maria Santos Reyes"
    printedName    = $profile.applicantName
    designation    = $profile.designation
    enterpriseName = $enterprise
    dateSigned     = "2026-08-05"
  }
  generatedAt = (Get-Date).ToString("o")
  aiGenerated = $false
  provincialOfficeDefaulted = $false
} | Out-Null
Step "Full SETUP LOI with agreements and commitment" $true

# --- TNA1 ---
SetHeader $applicantId $appToken "tna1" $profile | Out-Null
$plant = UploadFile $applicantId $appToken "tna1" (NewStubFile "plant-layout.pdf")
$tna1Form = @{
  enterpriseName             = $enterprise
  contactPerson              = $profile.applicantName
  position                   = "Owner"
  officeAddress              = $profile.address
  officeTel                  = $phone
  officeFax                  = ""
  officeEmail                = $email
  factoryAddress             = $profile.address
  factoryTel                 = $phone
  factoryFax                 = ""
  factoryEmail               = $email
  website                    = "https://fullfieldfoods.example"
  organizationType           = "Sole Proprietorship (DTI)"
  sector                     = "Food Processing"
  commodity                  = "Processed fruits"
  mainProduct                = $profile.coreProducts
  yearEstablished            = "2019"
  capitalClassification      = "Small"
  employeesMale              = "8"
  employeesFemale            = "10"
  employeesIndirect          = "4"
  employeesContract          = "2"
  employmentClass            = "Small"
  productionSite             = "Owned plant, Koronadal"
  businessPermitNo           = "BP-KOR-2025-441"
  yearRegistered             = "2019"
  enterpriseBackground       = "Family-owned fruit processing firm serving SOCCSKSARGEN markets since 2019."
  initialCapital             = "1500000"
  registrationNo             = $profile.registrationNumber
  presentCapital             = "4500000"
  genderInvolvement          = "Women comprise majority of packing and QC staff; equal pay policy applied."
  consultedOther             = "Yes"
  consultedAgency            = "DOST XII / PSTO South Cotabato"
  assistanceType             = "Technology upgrading - packaging"
  whyNotConsulted            = ""
  plan5Years                 = "Expand to modern retail and export-ready packs."
  plan10Years                = "Regional brand with cold-chain partners."
  agreements                 = "MOA with local farmers for mango supply."
  reasonsForAssistance       = "Manual packaging bottlenecks limit volume and shelf life."
  productionProblemsConcerns = "Inconsistent seal quality; high spoilage on humid days; slow labeling."
  processFlowMode            = "text"
  processFlow                = "Receiving -> sorting -> slicing -> dehydration -> QC -> packaging -> storage -> dispatch"
  productionPlan             = "Install vacuum sealer and auto-labeler; train operators; validate seal integrity."
  productionPlanFileName     = "production-plan.pdf"
  plantLayoutFileName        = "plant-layout.pdf"
  plantLayoutFileId          = $plant.id
  wasteManagement            = "Peels composted; wash water to septic with grease trap."
  inventorySystem            = "Weekly physical count; FIFO; Excel + barcode trial."
  maintenanceProgram         = "Preventive schedule monthly; logbook for repairs."
  cgmpHaccp                  = "Basic GMP practiced; HACCP plan drafted for dried fruit line."
  purchasingSystem           = "Approved supplier list; incoming inspection checklist."
  marketingPlan              = "Focus on modern trade in GenSan and Koronadal; online B2B."
  marketOutlets              = "Public markets, pasalubong centers, 2 supermarket trials"
  promotionalStrategies      = "Trade fairs, tasting booths, social media"
  marketCompetitors          = "Regional dried-fruit brands and imported snacks"
  packNutrition              = "Yes"
  packNutritionRemarks       = "Per 100g panel drafted"
  packBarcode                = "Yes"
  packBarcodeRemarks         = "GS1 application in progress"
  packLabel                  = "Yes"
  packLabelRemarks           = "FDA label review pending"
  packExpiry                 = "Yes"
  packExpiryRemarks          = "12 months ambient"
  cashFlow                   = "Positive operating cash flow FY2025"
  capitalSource              = "Owner equity and retained earnings"
  accountingSystem           = "Manual books with quarterly CPA review"
  hiringCriteria             = "Local hire preference; skills test for operators"
  employeeIncentives         = "Attendance bonus; 13th month"
  trainingDevelopment        = "GMP and machine safety orientation"
  safetyMeasures             = "PPE, fire extinguishers, first aid kit"
  employeeWelfare            = "SSS/PhilHealth/Pag-IBIG coverage"
  otherConcerns              = "Need stable power for continuous sealing runs."
  agreeGA1                   = $true
  agreeGA2                   = $true
  agreeGA3                   = $true
  agreeGA4                   = $true
  agreeGA5                   = $true
  agreeGA6                   = $true
  undertakingName            = $profile.applicantName
  undertakingPosition        = "Owner"
  undertakingDate            = "2026-08-05"
  preparedDate               = "2026-08-05"
  validatedByName            = ""
  validatedDate              = ""
}
$tna1Tables = @{
  rawMaterials = @(
    @("Fresh mango", "Local farmers", "80%", "12000 kg/year"),
    @("Banana", "Local traders", "60%", "8000 kg/year"),
    @("Packaging film", "Manila supplier", "100%", "500 rolls/year")
  )
  production = @(
    @("Dried mangoes", "4000 kg/year", "180", "720000"),
    @("Banana chips", "3500 kg/year", "120", "420000")
  )
  equipment = @(
    @("Tray dehydrator", "50kg/batch", "50kg/day", "2", "2018"),
    @("Manual sealer", "small packs", "200 packs/day", "3", "2020")
  )
}
ApiJson "PUT" "/applicants/$applicantId/tna1" $appToken @{
  applicantId = $applicantId
  form        = $tna1Form
  tables      = $tna1Tables
  submitted   = $true
} | Out-Null
$tna1Form.validatedByName = "Engr. Agent Reviewer"
$tna1Form.validatedDate = "2026-08-05"
PatchModule $applicantId $staffToken "tna1" @{
  form                     = $tna1Form
  tables                   = $tna1Tables
  submitted                = $true
  submittedAt              = (Get-Date).ToString("o")
  staffReviewed            = $true
  staffReviewedAt          = (Get-Date).ToString("o")
  directorValidated        = $true
  directorValidatedBy      = "Provincial Director"
  directorValidatedByEmail = "pd@dost.gov.ph"
  directorValidatedAt      = (Get-Date).ToString("o")
} | Out-Null
SetHeader $applicantId $appToken "tna2" $profile | Out-Null
Step "Full TNA1 + staff/director validation" $true

# --- TNA2 full document ---
$tna2Doc = @{
  assessmentDate = "2026-08-06"
  enterpriseProfile = @{
    enterpriseName = $enterprise
    address        = $profile.address
    sector         = "Food Processing"
    contactPerson  = $profile.applicantName
    contactNumber  = $phone
    products       = $profile.coreProducts
    employees      = "18"
    yearsOperating = "5"
  }
  scopeItems = @(
    @{ id = "prod"; covered = $true; notes = "Packaging and process flow" }
    @{ id = "mkt"; covered = $true; notes = "Market outlets" }
    @{ id = "fin"; covered = $true; notes = "Cash flow overview" }
  )
  background   = "Enterprise seeks SETUP assistance for packaging modernization after sustained operations."
  methodology  = "Document review, plant walkthrough, and structured interview with owner and QC lead."
  findingsByArea = @(
    @{
      title = "3. Technical Aspect"
      content = ""
      subsections = @(
        @{ id = "production-system"; label = "Production System"; content = "Dehydration adequate; sealing is bottleneck." }
        @{ id = "equipment-mgmt"; label = "Equipment Management and Maintenance"; content = "Manual sealers cause inconsistent vacuum." }
      )
    }
    @{
      title = "1. Strategic Direction"
      content = ""
      subsections = @(
        @{ id = "plans"; label = "Plans"; content = "Strong local demand; supermarket specs need better packs." }
      )
    }
  )
  otherObservations = "Plant layout allows room for one packaging station upgrade."
  conclusions       = "Technology intervention on vacuum packaging is justified."
  recommendations   = @(
    "Procure industrial vacuum sealer and labeler",
    "Train operators on seal validation",
    "Update labeling to meet FDA/supermarket specs"
  )
  interventionRows = @(
    @{
      problem      = "Inconsistent seals and short shelf life"
      intervention = "Vacuum packaging line"
      equipment    = "Vacuum sealer + conveyor labeler"
      impact       = "Higher throughput and reduced spoilage"
    }
  )
  tnaTeam = @{
    leader  = @{ name = "Engr. TNA Lead"; title = "TNA Team Leader" }
    members = @(
      @{ name = "Analyst A"; title = "Science Research Specialist" }
      @{ name = "Analyst B"; title = "Science Research Analyst" }
    )
  }
  assessor   = @{ name = "Engr. TNA Lead"; title = "SRS"; office = "PSTO South Cotabato" }
  attestedBy = @{ name = "Provincial Director"; title = "PD"; office = "DOST XII" }
  siteValidationFindings = @(
    "Site suitable for proposed equipment footprint."
  )
  productionProcessAnalysis = @{
    summary  = "Current process sound; packaging is constraint."
    findings = @("Seal integrity varies by operator", "Labeling is fully manual")
  }
  technologyGaps = @(
    "No vacuum capability",
    "Limited labeling automation"
  )
  proposedInterventions = @(
    "SETUP-funded packaging equipment package."
  )
  recommendedEquipment = @(
    @{ name = "Vacuum sealer"; specifications = "Industrial dual-chamber"; quantity = "1"; estimatedCost = "Php 450,000"; priority = "High" }
    @{ name = "Labeler"; specifications = "Conveyor label applicator"; quantity = "1"; estimatedCost = "Php 280,000"; priority = "Medium" }
  )
  productivityImprovement = @{
    kpis = @(
      @{ label = "Packs per hour"; before = "80"; after = "140"; change = "+75%" }
    )
    outcomes = @("Estimated 40% capacity uplift.")
  }
  publishedAt = (Get-Date).ToString("o")
}
PatchModule $applicantId $staffToken "tna2Document" $tna2Doc $true | Out-Null
SetHeader $applicantId $staffToken "project-proposal" $profile | Out-Null
Step "Full TNA2 published" $true

# --- Project proposal full Form 001 ---
$vic = UploadFile $applicantId $appToken "projectProposal" (NewStubFile "vicinity-map.pdf")
$lay = UploadFile $applicantId $appToken "projectProposal" (NewStubFile "plant-layout-pp.pdf")
$org = UploadFile $applicantId $appToken "projectProposal" (NewStubFile "org-chart.pdf")
$fin = UploadFile $applicantId $appToken "projectProposal" (NewStubFile "financial-reports.pdf")
$proposalForm = @{
  projectTitle           = "Vacuum Packaging and Labeling Line for Full Field Foods"
  proponentName          = $profile.applicantName
  proponentAddress       = $profile.address
  projectCost            = "Php 2,500,000.00"
  amountRequested        = "Php 2,000,000.00"
  generalObjective       = "Modernize packaging to raise capacity, quality, and market access."
  specificObjectives     = @(
    "Install vacuum packaging equipment",
    "Train operators on GMP and seal QC",
    "Meet supermarket packaging specifications"
  )
  firmName               = $enterprise
  firmAddress            = $profile.address
  contactPerson          = $profile.applicantName
  contactNumber          = $phone
  email                  = $email
  yearEstablished        = "2019"
  organizationType       = "Sole Proprietorship"
  profitType             = "Profit"
  msmeSize               = "Small"
  employeesMale          = "8"
  employeesFemale        = "10"
  employeesDirect        = "18"
  employeesIndirect      = "4"
  registrationOffice     = "DTI Region XII"
  registrationNumber     = $profile.registrationNumber
  registrationDate       = "2019-03-15"
  businessPermitNumber   = "BP-KOR-2025-441"
  businessPermitDate     = "2025-01-10"
  businessActivity       = "Food processing - dried fruits"
  prioritySectorSpecify  = "Food Processing"
  productsServices       = $profile.coreProducts
  enterpriseBackground   = "MSME processor with five years continuous operations in Koronadal."
  skillsExpertise        = "Owner experienced in dehydration and QC; staff trained in GMP basics."
  compensation           = "Standard wages with benefits; piece-rate packing incentives."
  plantSiteNarrative     = "Owned plant with utilities and drainage suitable for upgrade."
  capacityVolumeNarrative = "Current 50kg/day dehydration; packaging limits finished goods."
  rawMaterialsNarrative  = "Mango and banana from local farms; film from Manila."
  rawMaterialsTable      = @(
    @("Fresh mango", "Local farms", "12000 kg/year"),
    @("Banana", "Traders", "8000 kg/year"),
    @("Film rolls", "Supplier X", "500 rolls/year")
  )
  marketSituation        = "Growing demand for packaged dried fruit in Region XII."
  productDemandSupply    = "Demand exceeds packaged supply in peak season."
  productPriceTable      = @(
    @("Dried mango 100g", "Php 85"),
    @("Banana chips 100g", "Php 55")
  )
  distributionChannel    = "Public markets, pasalubong, supermarket trials"
  competitors            = "Regional brands and imported snacks"
  marketStrategies       = @("Trade fair participation", "Private label pilots", "Online B2B")
  productionProcess      = "Receive, process, dehydrate, QC, pack, store, distribute"
  equipmentTable         = @(
    @("Vacuum sealer", "1", "Php 1,200,000"),
    @("Labeler", "1", "Php 500,000"),
    @("Spare parts", "1 lot", "Php 100,000")
  )
  equipmentNarrative     = "Proposed package replaces manual sealing."
  interventionProblem    = "Packaging bottleneck and spoilage"
  interventionProposed   = "Vacuum packaging and labeling technology"
  interventionEquipment  = "Vacuum sealer and labeler"
  interventionImpact     = "40% capacity increase; longer shelf life"
  interventionCostTable  = @(
    @("Vacuum sealer", "1200000", "SETUP", "1200000"),
    @("Labeler", "500000", "SETUP", "500000"),
    @("Installation", "300000", "Proponent", "300000")
  )
  fabricatorTable        = @(
    @("Metro Packaging Systems", "Quezon City", "02-8888-1111"),
    @("Mindanao Fab Works", "GenSan", "083-555-2222")
  )
  scheduleTable          = @(
    @("Procurement", "Month 1-2"),
    @("Installation", "Month 3"),
    @("Training and commissioning", "Month 4")
  )
  expectedOutputBullets  = @(
    "Vacuum-packed dried fruit SKUs",
    "Trained operators",
    "Updated labels compliant with FDA"
  )
  wasteManagement        = "Compost organics; recycle film scrap where possible"
  liquidityRatioTable    = @(
    @("1", "450000", "200000", "2.25"),
    @("2", "520000", "210000", "2.48")
  )
  quickRatioTable        = @(
    @("1", "450000", "80000", "200000", "1.85"),
    @("2", "520000", "90000", "210000", "2.05")
  )
  roiTable               = @(
    @("1", "300000", "2000000", "15%"),
    @("2", "450000", "2000000", "22.5%"),
    @("3", "600000", "2000000", "30%")
  )
  financialAnalysis      = "Project recovers investment within SETUP refund horizon under base case demand."
  genderInvolvement      = "Majority female workforce in packing/QC retained and upskilled."
  financialConstraintsNote = "Please refer to the attached financial reports."
  budgetItems            = @(
    @{
      id          = "b1"
      item        = "Vacuum sealer"
      quantity    = "1"
      unitCost    = "1200000"
      total       = "1200000"
      setupShare  = "1200000"
      proponentShare = "0"
    }
    @{
      id          = "b2"
      item        = "Labeler"
      quantity    = "1"
      unitCost    = "500000"
      total       = "500000"
      setupShare  = "500000"
      proponentShare = "0"
    }
    @{
      id          = "b3"
      item        = "Installation and training"
      quantity    = "1"
      unitCost    = "300000"
      total       = "300000"
      setupShare  = "300000"
      proponentShare = "0"
    }
  )
  refundSchedule = @(
    @("Months", "Y1", "Y2", "Y3", "Y4", "Total"),
    @("January", "33333", "33333", "33333", "33333", "133332")
  )
  riskRows = @(
    @{ risk = "Supplier delay"; mitigation = "Dual quotations; buffer schedule"; likelihood = "Medium"; impact = "Medium" }
    @{ risk = "Power interruption"; mitigation = "UPS for sealer controls"; likelihood = "Medium"; impact = "High" }
    @{ risk = "Market soft period"; mitigation = "Diversify outlets"; likelihood = "Low"; impact = "Medium" }
  )
}
PatchModule $applicantId $appToken "projectProposal" @{
  form            = $proposalForm
  attachmentKinds = @("vicinityMap", "plantLayout", "orgChart", "financialReports")
  attachments     = @(
    @{ kind = "vicinityMap"; fileName = "vicinity-map.pdf"; fileId = $vic.id }
    @{ kind = "plantLayout"; fileName = "plant-layout-pp.pdf"; fileId = $lay.id }
    @{ kind = "orgChart"; fileName = "org-chart.pdf"; fileId = $org.id }
    @{ kind = "financialReports"; fileName = "financial-reports.pdf"; fileId = $fin.id }
  )
  submitted   = $true
  submittedAt = (Get-Date).ToString("o")
} | Out-Null
SetHeader $applicantId $appToken "requirements" $profile | Out-Null
Step "Full project proposal Form 001" $true

# --- Requirements all uploads ---
$reqIds = @(
  "permits", "registration", "financial", "projected", "official-receipt",
  "affidavit", "quotations", "drawings", "fda-certificate", "ecc"
)
$uploads = @()
$remarks = @{}
foreach ($rid in $reqIds) {
  $up = UploadFile $applicantId $appToken "requirements" (NewStubFile "$rid.pdf")
  $uploads += @{
    id         = $rid
    required   = $true
    uploaded   = $true
    fileName   = "$rid.pdf"
    fileId     = $up.id
    uploadedAt = (Get-Date).ToString("o")
  }
  $remarks[$rid] = @{ status = "ok"; remark = "Verified complete" }
}
PatchModule $applicantId $appToken "caseMeta" @{
  requirementUploads        = $uploads
  documentsSubmitted        = $true
  requirementAdditionalNotes = "All documentary requirements uploaded for SETUP track."
} | Out-Null
PatchModule $applicantId $staffToken "requirementStaffReview" @{
  remarks   = $remarks
  staffNotes = "Documents complete for RTEC."
  staffName  = "Agent Reviewer"
} | Out-Null
PatchModule $applicantId $staffToken "caseMeta" @{
  requirementUploads     = $uploads
  documentsSubmitted     = $true
  staffDecision          = "approved"
  routingDecision        = "setup"
  staffVerifiedBy        = "Agent Reviewer"
  requirementRevisionNotes = ""
} | Out-Null
SetHeader $applicantId $staffToken "conduct-rtec" $profile | Out-Null
Step "All requirement uploads + staff approve SETUP" $true

# --- RTEC full ---
$compliance = @(
  "loi","tna1","tna2","form001","permits","financial","projected","official-receipt",
  "registration","articles","affidavit","resolution","quotations","drawings"
) | ForEach-Object {
  @{ id = $_; label = $_; status = "complied"; remarks = "In order" }
}
PatchModule $applicantId $staffToken "rtecReport" @{
  form = @{
    proposalSnapshot = @{
      projectTitle    = $proposalForm.projectTitle
      proponentName   = $proposalForm.proponentName
      amountRequested = $proposalForm.amountRequested
      firmName        = $enterprise
    }
    projectCostProponent = "Php 500,000.00"
    projectCostSetup     = "Php 2,000,000.00"
    projectCostLgia      = "Php 0.00"
    projectCostTotal     = "Php 2,500,000.00"
    ratioNarrative       = "SETUP share within guidelines for MSME packaging intervention."
    complianceItems      = $compliance
    constraintRows       = @(
      @{ id = "c1"; constraint = "Power quality"; action = "Install UPS" }
    )
    fabricatorRows       = @(
      @{ id = "f1"; name = "Metro Packaging Systems"; address = "Quezon City"; contactNo = "02-8888-1111" }
    )
    recommendation       = "RTEC recommends APPROVAL of the project for SETUP funding."
    signatures           = @{
      chairperson       = "Engr. RTEC Chairperson"
      member1           = "Member One"
      member2           = "Member Two"
      member3           = "Member Three"
      rpmo              = "RPMO Representative"
      regionalDirector  = "Regional Director"
      evaluationDate    = "2026-08-07"
    }
  }
  submitted   = $true
  submittedAt = (Get-Date).ToString("o")
} $true | Out-Null
SetHeader $applicantId $staffToken "approval-letter" $profile | Out-Null
Step "Full RTEC with all compliance items" $true

# --- Approval ---
PatchModule $applicantId $staffToken "approvalLetter" @{
  form = @{
    projectTitle           = $proposalForm.projectTitle
    referenceNumber        = "NOA-XII-$stamp"
    seriesYear             = "2026"
    approvalDate           = "2026-08-08"
    recipientName          = $profile.applicantName
    recipientDesignation   = "Proprietor"
    enterpriseName         = $enterprise
    enterpriseAddress      = $profile.address
    approvedAmount         = "Php 2,000,000.00"
    refundTermYears        = "5"
    insuranceRatePercent   = "1.0"
    pstoOfficeName         = "PSTO - South Cotabato"
    pstoDirectorTitle      = "Provincial Science and Technology Director"
    signatoryName          = "Provincial Director"
    signatoryTitle         = "Provincial Director"
    conformeDeadlineDays   = "15"
    bodyParagraphs         = @(
      "Your project is approved for SETUP assistance.",
      "Please accomplish conforme and proceed to MOA signing."
    )
  }
  publishedAt = (Get-Date).ToString("o")
} $true | Out-Null
ApiJson "PUT" "/applicants/$applicantId/approval-letter/acknowledge" $appToken @{
  conformeSignedName = $profile.applicantName
} | Out-Null
$moa = UploadFile $applicantId $staffToken "signedMoa" (NewStubFile "signed-moa.pdf")
PatchModule $applicantId $staffToken "signedMoa" @{
  fileName      = "signed-moa.pdf"
  fileId        = $moa.id
  moaSignedDate = "2026-08-10"
  signingVenue  = "PSTO South Cotabato"
  notes         = "MOA signed by parties"
  mimeType      = "application/pdf"
  uploadedAt    = (Get-Date).ToString("o")
  uploadedBy    = "agent@dost.gov.ph"
} | Out-Null
SetHeader $applicantId $staffToken "landbank-withdrawal" $profile | Out-Null
Step "Approval publish, conforme, signed MOA" $true

# --- LBP intro + PDCs + LandBank full ---
PatchModule $applicantId $staffToken "lbpIntroduction" @{
  form = @{
    letterDate            = "2026-08-11"
    branchManagerName     = "Branch Manager Santos"
    branchManagerTitle    = "Branch Manager"
    landbankBranch        = "LBP Koronadal Branch"
    branchCityProvince    = "Koronadal City, South Cotabato"
    proponentName         = $profile.applicantName
    enterpriseName        = $enterprise
    projectTitle          = $proposalForm.projectTitle
    approvedAmount        = "Php 2,000,000.00"
    approvedAmountWords   = "Two Million Pesos"
    signatoryName         = "Provincial Director"
    signatoryTitle        = "Provincial Director"
    regionalOfficeName    = "DOST Regional Office XII"
  }
  publishedAt = (Get-Date).ToString("o")
} $true | Out-Null

$pdcs = @(
  @{ checkNumber = "PDC-001"; dueDate = "2026-11-01"; accountNumber = "0011-2222-33"; amount = "33333"; status = "pending"; note = "Month 1" }
  @{ checkNumber = "PDC-002"; dueDate = "2026-12-01"; accountNumber = "0011-2222-33"; amount = "33333"; status = "pending"; note = "Month 2" }
  @{ checkNumber = "PDC-003"; dueDate = "2027-01-01"; accountNumber = "0011-2222-33"; amount = "33333"; status = "pending"; note = "Month 3" }
)
PatchModule $applicantId $staffToken "refund" @{
  form = @{
    pdcsRecorded         = $true
    pdcs                 = $pdcs
    refundSchedule       = $proposalForm.refundSchedule
    delinquencyStatus    = "current"
    soaIssued            = $false
    lastPaymentDate      = ""
    technologyTransferFee = "0"
    totalRefundWithTtf   = "2000000"
    refundGraceMonths    = "3"
  }
} | Out-Null

$snap = UploadFile $applicantId $staffToken "landBank" (NewStubFile "lbp-passbook.pdf")
$letter = UploadFile $applicantId $staffToken "landBank" (NewStubFile "withdrawal-letter-t1.pdf")
$q1 = UploadFile $applicantId $staffToken "landBank" (NewStubFile "quotation-1.pdf")
$q2 = UploadFile $applicantId $staffToken "landBank" (NewStubFile "quotation-2.pdf")
$q3 = UploadFile $applicantId $staffToken "landBank" (NewStubFile "quotation-3.pdf")
$ph = UploadFile $applicantId $staffToken "landBank" (NewStubFile "equipment-photo.pdf")
PatchModule $applicantId $staffToken "landBank" @{
  form = @{
    accountSnapshot = (ModDoc "lbp-passbook.pdf" "agent@dost.gov.ph" $snap.id)
    withdrawalRemarks = "First tranche for vacuum sealer and labeler."
    authorityLetterGenerated = $true
    tranches = @{
      first = @{
        tranche      = 1
        status       = "signed"
        supplierName = "Metro Packaging Systems"
        equipment    = @(
          @{ id = "we1"; item = "Vacuum sealer"; amount = "1200000"; sourceBudgetItemId = "b1" }
          @{ id = "we2"; item = "Labeler"; amount = "500000"; sourceBudgetItemId = "b2" }
        )
        quotations = @(
          (ModDoc "quotation-1.pdf" "agent@dost.gov.ph" $q1.id)
          (ModDoc "quotation-2.pdf" "agent@dost.gov.ph" $q2.id)
          (ModDoc "quotation-3.pdf" "agent@dost.gov.ph" $q3.id)
        )
        equipmentPhotos = @(
          (ModDoc "equipment-photo.pdf" "agent@dost.gov.ph" $ph.id)
        )
        signedLetter = (ModDoc "withdrawal-letter-t1.pdf" "agent@dost.gov.ph" $letter.id)
        letterDraft  = @{
          date            = "2026-08-12"
          addressee       = "Branch Manager Santos"
          amountRequested = "Php 1,700,000.00"
          purpose         = "Purchase of vacuum sealer and labeler"
        }
      }
      second = @{
        tranche      = 2
        status       = "draft"
        supplierName = ""
        equipment    = @()
        quotations   = @()
        equipmentPhotos = @()
        signedLetter = $null
      }
    }
  }
  introductionLetter = @{
    published   = $true
    publishedAt = (Get-Date).ToString("o")
  }
  submitted   = $true
  submittedAt = (Get-Date).ToString("o")
  submittedBy = "agent@dost.gov.ph"
} | Out-Null
SetHeader $applicantId $staffToken "procurement-liquidation" $profile | Out-Null
Step "Full LBP intro, PDCs, LandBank tranche 1" $true

# --- Procurement full ---
$pod = UploadFile $applicantId $appToken "procurement" (NewStubFile "po-delivery.pdf")
$liq = UploadFile $applicantId $staffToken "procurement" (NewStubFile "liquidation-1.pdf")
PatchModule $applicantId $staffToken "procurement" @{
  form = @{
    documents = @(
      @{ fileName = "po-delivery.pdf"; fileId = $pod.id; amount = "1700000"; remarks = "PO and delivery" }
    )
    items = @(
      @{ description = "Vacuum sealer"; supplier = "Metro Packaging Systems"; purchaseDate = "2026-09-01"; quantity = "1"; totalCost = "1200000" }
      @{ description = "Labeler"; supplier = "Metro Packaging Systems"; purchaseDate = "2026-09-01"; quantity = "1"; totalCost = "500000" }
    )
    liquidations = @(
      @{
        title       = "Tranche 1 liquidation"
        amount      = "1700000"
        date        = "2026-09-15"
        remarks     = "Equipment installed and commissioned"
        attachments = @(
          (ModDoc "liquidation-1.pdf" "agent@dost.gov.ph" $liq.id)
        )
      }
    )
    staffReview = @{
      reviewerName = "Agent Reviewer"
      reviewedAt   = (Get-Date).ToString("o")
      remarks      = "Liquidation verified"
      verified     = $true
    }
    untagged   = $true
    untaggedAt = (Get-Date).ToString("o")
  }
  submitted   = $true
  submittedAt = (Get-Date).ToString("o")
} | Out-Null
SetHeader $applicantId $staffToken "refund-delinquent" $profile | Out-Null
Step "Full procurement with liquidation and untag" $true

# --- Refund submit ---
PatchModule $applicantId $staffToken "refund" @{
  form = @{
    pdcsRecorded          = $true
    pdcs                  = $pdcs
    refundSchedule        = $proposalForm.refundSchedule
    delinquencyStatus     = "current"
    soaIssued             = $true
    lastPaymentDate       = ""
    technologyTransferFee = "0"
    totalRefundWithTtf    = "2000000"
    refundGraceMonths     = "3"
  }
  submitted   = $true
  submittedAt = (Get-Date).ToString("o")
} | Out-Null
SetHeader $applicantId $staffToken "project-closeout" $profile | Out-Null
Step "Full refund monitoring submit" $true

# --- Close-out ---
$tr = UploadFile $applicantId $appToken "projectCloseOut" (NewStubFile "form-010-terminal.pdf")
$afs = UploadFile $applicantId $appToken "projectCloseOut" (NewStubFile "audited-fs.pdf")
$ack = UploadFile $applicantId $appToken "projectCloseOut" (NewStubFile "equipment-ack.pdf")
PatchModule $applicantId $appToken "projectCloseOut" @{
  form = @{
    terminalReportFileName           = "form-010-terminal.pdf"
    terminalReportFileId             = $tr.id
    auditedFinancialFileName         = "audited-fs.pdf"
    auditedFinancialFileId           = $afs.id
    equipmentAcknowledgementFileName = "equipment-ack.pdf"
    equipmentAcknowledgementFileId   = $ack.id
    certificateOfOwnershipIssued     = $true
    certificateIssuedDate            = "2027-03-01"
    notes                            = "Project completed; equipment under cooperator custody."
    equipmentInventory               = @(
      @{ description = "Vacuum sealer"; serialNumber = "VS-2026-001"; acquisitionCost = "1200000"; location = "Packaging area" }
      @{ description = "Labeler"; serialNumber = "LB-2026-001"; acquisitionCost = "500000"; location = "Packaging area" }
    )
  }
  submitted   = $true
  submittedAt = (Get-Date).ToString("o")
  submittedBy = $email
} | Out-Null
SetHeader $applicantId $appToken "completed" $profile | Out-Null
$finalApp = ApiJson "GET" "/applicants/$applicantId" $appToken $null
$finalStaff = ApiJson "GET" "/applicants/$applicantId" $staffToken $null
Step "Close-out to completed" ($finalApp.currentModule -eq "completed") "currentModule=$($finalApp.currentModule)"

# Spot-checks
$bg = $finalStaff.moduleData.tna1.form.enterpriseBackground
Step "Staff GET has TNA1 enterpriseBackground" (-not [string]::IsNullOrEmpty($bg))
$budgetOk = $finalStaff.moduleData.projectProposal.form.budgetItems.Count -ge 2
Step "Staff GET has proposal budgetItems" $budgetOk "count=$($finalStaff.moduleData.projectProposal.form.budgetItems.Count)"
$chair = $finalStaff.moduleData.rtecReport.form.signatures.chairperson
Step "Staff GET has RTEC chairperson" ($chair -eq "Engr. RTEC Chairperson")
$tna2Pub = $finalApp.moduleData.tna2Document.published
Step "Applicant sees published TNA2" ([bool]$tna2Pub)
$apprPub = $finalApp.moduleData.approvalLetter.published
Step "Applicant sees published approval" ([bool]$apprPub)
$inv = $finalApp.moduleData.projectCloseOut.form.equipmentInventory.Count
Step "Close-out inventory rows persisted" ($inv -ge 2) "rows=$inv"

Write-Host ""
Write-Host "FULLFIELD_OK applicationId=$appId applicantId=$applicantId email=$email"
$script:log.Add("META applicationId=$appId applicantId=$applicantId email=$email") | Out-Null
$script:log.Add("META demoModeEnabled=$($health.demoModeEnabled)") | Out-Null
$outPath = Join-Path $PSScriptRoot "..\docs\presentation\_e2e_fullfield_raw.txt"
$script:log | Set-Content -Path $outPath -Encoding UTF8
Write-Host "Wrote $outPath"
