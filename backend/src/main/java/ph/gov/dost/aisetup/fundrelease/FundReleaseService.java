/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.fundrelease;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ph.gov.dost.aisetup.audit.AuditService;
import ph.gov.dost.aisetup.auth.SecurityUtils;
import ph.gov.dost.aisetup.persistence.ApplicantPersistenceService;
import ph.gov.dost.aisetup.persistence.ApplicantRecordDto;
import ph.gov.dost.aisetup.workflow.WorkflowGateService;

@Service
public class FundReleaseService {

    private final ApplicantPersistenceService applicantPersistenceService;
    private final WorkflowGateService workflowGateService;
    private final AuditService auditService;

    public FundReleaseService(
            ApplicantPersistenceService applicantPersistenceService,
            WorkflowGateService workflowGateService,
            AuditService auditService) {
        this.applicantPersistenceService = applicantPersistenceService;
        this.workflowGateService = workflowGateService;
        this.auditService = auditService;
    }

    /** Minimal HTML escaping for values interpolated into generated documents. */
    private static String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    @Transactional
    public Map<String, Object> authorityLetter(String applicationId, Map<String, Object> payload) {
        ApplicantRecordDto applicant = requireApplicant(applicationId);
        SecurityUtils.requireCanAccessApplicant(applicant.id());
        workflowGateService.assertLandBankWithdrawalAllowed(applicant.id());

        String holder = escapeHtml(String.valueOf(payload.getOrDefault("accountHolder", "Account Holder")));
        String enterprise = escapeHtml(String.valueOf(payload.getOrDefault("enterpriseName", "Enterprise")));
        String project = escapeHtml(String.valueOf(payload.getOrDefault("projectTitle", "SETUP Project")));
        String amount = escapeHtml(String.valueOf(payload.getOrDefault("approvedAmount", "₱0")));
        String html = """
                <html><body style='font-family:Georgia,serif;font-size:12px;line-height:1.6'>
                <h2 style='text-align:center'>AUTHORITY TO WITHDRAW — SETUP FUND</h2>
                <p><strong>Application:</strong> %s</p>
                <p>This authorizes <strong>%s</strong> of <strong>%s</strong> to withdraw SETUP funds for
                project <strong>%s</strong> in the amount of <strong>%s</strong>.</p>
                </body></html>
                """.formatted(escapeHtml(applicationId), holder, enterprise, project, amount);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("applicationId", applicationId);
        result.put("documentType", "authority-letter");
        result.put("generatedAt", Instant.now().toString());
        result.put("status", "ready");
        result.put("html", html);
        result.putAll(payload);

        persistFundReleaseSlice(applicant, "authorityLetter", result);
        auditService.record("fund-release.authority-letter", "applicant", applicant.id(),
                Map.of("applicationId", applicationId));
        return result;
    }

    @Transactional
    public Map<String, Object> refundSchedule(String applicationId, Map<String, Object> payload) {
        ApplicantRecordDto applicant = requireApplicant(applicationId);
        SecurityUtils.requireCanAccessApplicant(applicant.id());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("applicationId", applicationId);
        result.put("documentType", "refund-schedule");
        result.put("generatedAt", Instant.now().toString());
        result.put("status", "ready");
        result.put("termYears", payload.getOrDefault("termYears", 5));
        result.put("pdcCount", payload.getOrDefault("pdcCount", 0));
        result.put("technologyTransferFee", payload.getOrDefault("technologyTransferFee", "0"));
        result.put("graceMonths", 12);
        result.putAll(payload);

        persistFundReleaseSlice(applicant, "refundSchedule", result);
        auditService.record("fund-release.refund-schedule", "applicant", applicant.id(),
                Map.of("applicationId", applicationId));
        return result;
    }

    @Transactional
    public Map<String, Object> lbpIntroduction(Map<String, Object> payload) {
        Object applicationIdObj = payload.getOrDefault("applicationId", "unknown");
        String applicationId = String.valueOf(applicationIdObj);
        ApplicantRecordDto applicant = requireApplicant(applicationId);
        SecurityUtils.requireCanAccessApplicant(applicant.id());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("applicationId", applicationId);
        result.put("documentType", "lbp-introduction");
        result.put("generatedAt", Instant.now().toString());
        result.put("status", "ready");
        result.put("recipient", payload.getOrDefault("branchManager", "Land Bank Branch Manager"));
        result.put("enterpriseName", payload.getOrDefault("enterpriseName", ""));
        result.putAll(payload);

        persistFundReleaseSlice(applicant, "lbpIntroduction", result);
        auditService.record("fund-release.lbp-introduction", "applicant", applicant.id(),
                Map.of("applicationId", applicationId));
        return result;
    }

    private ApplicantRecordDto requireApplicant(String applicationId) {
        return applicantPersistenceService.findByApplicationId(applicationId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Applicant not found for applicationId: " + applicationId));
    }

    private void persistFundReleaseSlice(
            ApplicantRecordDto applicant,
            String key,
            Map<String, Object> slice) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put(key, slice);
        data.put("updatedAt", Instant.now().toString());
        applicantPersistenceService.mergeModuleKey(applicant.id(), "fundRelease", data, null);
    }
}
