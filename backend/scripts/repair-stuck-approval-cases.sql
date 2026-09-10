-- Repair cases stranded by an out-of-order RTEC "Mark Complete".
--
-- Failure mode (see LOI-2026-408723): Submission Requirements was approved but
-- "Confirm & Proceed to RTEC Evaluation" was never pressed, so `routingDecision`
-- stayed NULL and `current_module` stayed `requirements`. RTEC Mark Complete ran
-- anyway: module rows sync before the header, so the `rtec-completed` assessment
-- persisted while the header advance was rejected. The Regional Director then
-- approved and published the Notice, but applicant navigation unlocks off
-- `current_module`, so the cooperator's Approval Letter stayed disabled.
--
-- This script only repairs cases where the Notice is already RD-approved AND
-- published — i.e. the human decisions genuinely happened and only the recorded
-- routing/header state is missing. It never creates an approval.
--
-- Usage (MySQL profile):
--   mysql -u aisetup -p aisetup < repair-stuck-approval-cases.sql
-- Or wrapped with the dry-run default:
--   .\repair-stuck-approval-cases.ps1            # report only
--   .\repair-stuck-approval-cases.ps1 -Apply     # write
--
-- Set @app_id to repair a single case; leave it NULL to repair every match.
-- The wrapper sets it from -ApplicationId.
SET @app_id = IFNULL(@app_id, NULL);

-- ── 1. Report affected cases before writing ──────────────────────────────────
SELECT
    r.application_id,
    r.enterprise_name,
    r.current_module,
    JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.routingDecision'))         AS routing_decision,
    JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.staffDecision'))           AS staff_decision,
    JSON_EXTRACT(r.module_data_json, '$.rtecReport.submitted')                  AS rtec_submitted,
    JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.approvalLetter.rdDecision')) AS rd_decision,
    JSON_EXTRACT(r.module_data_json, '$.approvalLetter.published')              AS notice_published
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
  AND (@app_id IS NULL OR r.application_id = @app_id);

-- ── 2. Backfill a missing routingDecision ────────────────────────────────────
-- Only when routing is entirely absent. An existing value is authoritative:
-- `mpex` is a real decision, and `setup` is a legacy RTEC-track value that the
-- gates already accept, so neither is overwritten.
UPDATE applicant_records r
SET r.module_data_json = JSON_SET(
        CAST(r.module_data_json AS JSON), '$.routingDecision', 'conduct-rtec')
WHERE JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.approvalLetter.rdDecision')) = 'approved'
  AND JSON_EXTRACT(r.module_data_json, '$.approvalLetter.published') = TRUE
  AND JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.staffDecision')) = 'approved'
  AND JSON_EXTRACT(r.module_data_json, '$.routingDecision') IS NULL
  AND (@app_id IS NULL OR r.application_id = @app_id);

UPDATE applicant_module_data m
JOIN applicant_records r ON r.id = m.applicant_id
SET m.data_json = JSON_SET(CAST(m.data_json AS JSON), '$.routingDecision', 'conduct-rtec'),
    m.updated_at = NOW(6)
WHERE m.module_key = 'caseMeta'
  AND JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.approvalLetter.rdDecision')) = 'approved'
  AND JSON_EXTRACT(r.module_data_json, '$.approvalLetter.published') = TRUE
  AND JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.staffDecision')) = 'approved'
  AND JSON_EXTRACT(m.data_json, '$.routingDecision') IS NULL
  AND (@app_id IS NULL OR r.application_id = @app_id);

-- ── 3. Mark the RTEC report submitted where the assessment says it completed ──
-- Requires an `rtec-completed` staff assessment, so this records a completion
-- that actually happened rather than inventing one.
UPDATE applicant_records r
SET r.module_data_json = JSON_SET(
        CAST(r.module_data_json AS JSON),
        '$.rtecReport.submitted', TRUE)
WHERE JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.approvalLetter.rdDecision')) = 'approved'
  AND JSON_EXTRACT(r.module_data_json, '$.approvalLetter.published') = TRUE
  AND JSON_EXTRACT(r.module_data_json, '$.rtecReport') IS NOT NULL
  AND COALESCE(JSON_EXTRACT(r.module_data_json, '$.rtecReport.submitted'), FALSE) <> TRUE
  AND JSON_SEARCH(
        JSON_EXTRACT(r.module_data_json, '$.assessments[*].decision'),
        'one', 'rtec-completed') IS NOT NULL
  AND (@app_id IS NULL OR r.application_id = @app_id);

UPDATE applicant_module_data m
JOIN applicant_records r ON r.id = m.applicant_id
SET m.data_json = JSON_SET(CAST(m.data_json AS JSON), '$.submitted', TRUE),
    m.updated_at = NOW(6)
WHERE m.module_key = 'rtecReport'
  AND JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.approvalLetter.rdDecision')) = 'approved'
  AND JSON_EXTRACT(r.module_data_json, '$.approvalLetter.published') = TRUE
  AND COALESCE(JSON_EXTRACT(m.data_json, '$.submitted'), FALSE) <> TRUE
  AND JSON_SEARCH(
        JSON_EXTRACT(r.module_data_json, '$.assessments[*].decision'),
        'one', 'rtec-completed') IS NOT NULL
  AND (@app_id IS NULL OR r.application_id = @app_id);

-- ── 4. Advance the header so applicant navigation unlocks ────────────────────
-- Only for cases that actually reached RTEC (`rtec-completed` assessment) and
-- are still sitting on Requirements or Conduct of RTEC. Cases parked earlier in
-- MODULE_ORDER are inconsistent for a different reason (usually seed/e2e data)
-- and must not be dragged forward by this repair.
UPDATE applicant_records r
SET r.current_module = 'approval-letter',
    r.updated_at = NOW(6)
WHERE JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.approvalLetter.rdDecision')) = 'approved'
  AND JSON_EXTRACT(r.module_data_json, '$.approvalLetter.published') = TRUE
  AND r.current_module IN ('requirements', 'conduct-rtec')
  AND JSON_SEARCH(
        JSON_EXTRACT(r.module_data_json, '$.assessments[*].decision'),
        'one', 'rtec-completed') IS NOT NULL
  AND (@app_id IS NULL OR r.application_id = @app_id);

-- ── 5. Verify ────────────────────────────────────────────────────────────────
SELECT
    r.application_id,
    r.current_module,
    JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.routingDecision')) AS routing_decision,
    JSON_EXTRACT(r.module_data_json, '$.rtecReport.submitted')          AS rtec_submitted
FROM applicant_records r
WHERE JSON_UNQUOTE(JSON_EXTRACT(r.module_data_json, '$.approvalLetter.rdDecision')) = 'approved'
  AND JSON_EXTRACT(r.module_data_json, '$.approvalLetter.published') = TRUE
  AND (@app_id IS NULL OR r.application_id = @app_id);
