/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.audit.AuditService;
import ph.gov.dost.aisetup.auth.SecurityUtils;
import ph.gov.dost.aisetup.persistence.dto.ApplicantHeaderUpdateRequest;
import ph.gov.dost.aisetup.persistence.dto.ApprovalAcknowledgeRequest;
import ph.gov.dost.aisetup.persistence.dto.ModulePatchRequest;
import ph.gov.dost.aisetup.persistence.dto.Tna1FormSaveRequest;
import ph.gov.dost.aisetup.persistence.dto.Tna1FormSaveResponse;
import ph.gov.dost.aisetup.workflow.ClientVisibilityService;
import ph.gov.dost.aisetup.workflow.WorkflowGateService;

@RestController
@RequestMapping("/applicants")
public class ApplicantController {

    private final ApplicantPersistenceService persistenceService;
    private final WorkflowGateService workflowGateService;
    private final ClientVisibilityService clientVisibilityService;
    private final AuditService auditService;

    public ApplicantController(
            ApplicantPersistenceService persistenceService,
            WorkflowGateService workflowGateService,
            ClientVisibilityService clientVisibilityService,
            AuditService auditService) {
        this.persistenceService = persistenceService;
        this.workflowGateService = workflowGateService;
        this.clientVisibilityService = clientVisibilityService;
        this.auditService = auditService;
    }

    @GetMapping
    public List<ApplicantRecordDto> list() {
        SecurityUtils.requireStaff();
        return persistenceService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicantRecordDto> get(@PathVariable String id) {
        SecurityUtils.requireCanAccessApplicant(id);
        return persistenceService.findById(id)
                .map(clientVisibilityService::forViewer)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ApplicantRecordDto save(
            @PathVariable String id,
            @RequestBody ApplicantRecordDto body) {
        if (body.applicationId() == null || body.applicationId().isBlank()) {
            throw new IllegalArgumentException("applicationId is required");
        }
        ApplicantRecordDto existing = persistenceService.findById(id).orElse(null);
        // Applicants hydrate a publish-filtered blob; merge hidden staff drafts
        // back in so their whole-blob saves cannot erase or forge staff documents.
        Map<String, Object> moduleData = clientVisibilityService.preserveHiddenModules(
                body.moduleData(),
                existing != null ? existing.moduleData() : null);
        ApplicantRecordDto dto = new ApplicantRecordDto(
                id,
                body.applicationId(),
                body.enterpriseName(),
                body.currentModule(),
                moduleData,
                body.profile(),
                body.updatedAt());
        workflowGateService.assertSaveAllowed(dto, existing);
        if ("landbank-withdrawal".equals(dto.currentModule())) {
            workflowGateService.assertLandBankWithdrawalAllowed(id);
        }
        ApplicantRecordDto saved = persistenceService.save(dto);
        auditService.record(
                existing == null ? "applicant.create" : "applicant.update",
                "applicant",
                id,
                Map.of(
                        "applicationId", saved.applicationId(),
                        "currentModule", saved.currentModule() != null ? saved.currentModule() : ""));
        return saved;
    }

    /**
     * Thin header write for profile / currentModule without rewriting module JSON.
     * Primary FE path after cold create — module payloads go through {@code /modules/{key}}.
     */
    @PutMapping("/{id}/header")
    public ResponseEntity<ApplicantRecordDto> updateHeader(
            @PathVariable String id,
            @RequestBody ApplicantHeaderUpdateRequest body) {
        SecurityUtils.requireCanAccessApplicant(id);
        ApplicantRecordDto existing = persistenceService.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        String nextModule = body.getCurrentModule() != null
                ? body.getCurrentModule()
                : existing.currentModule();
        ApplicantRecordDto proposed = new ApplicantRecordDto(
                id,
                existing.applicationId(),
                body.getEnterpriseName() != null ? body.getEnterpriseName() : existing.enterpriseName(),
                nextModule,
                existing.moduleData(),
                body.getProfile() != null ? body.getProfile() : existing.profile(),
                existing.updatedAt());
        workflowGateService.assertSaveAllowed(proposed, existing);
        if ("landbank-withdrawal".equals(nextModule)) {
            workflowGateService.assertLandBankWithdrawalAllowed(id);
        }
        ApplicantRecordDto saved = persistenceService.updateHeader(
                id,
                existing.applicationId(),
                body.getEnterpriseName(),
                body.getCurrentModule(),
                body.getProfile());
        auditService.record(
                "applicant.header",
                "applicant",
                id,
                Map.of(
                        "currentModule",
                        saved.currentModule() != null ? saved.currentModule() : ""));
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/modules/{moduleKey}")
    public ApplicantRecordDto patchModule(
            @PathVariable String id,
            @PathVariable String moduleKey,
            @Valid @RequestBody ModulePatchRequest body) {
        SecurityUtils.requireCanAccessApplicant(id);
        workflowGateService.assertStaffOnlyModuleWrite(moduleKey);
        workflowGateService.assertCanPublish(body.getPublished());
        Map<String, Object> data = sanitizeModulePatchData(moduleKey, body.getData());
        ApplicantRecordDto saved = persistenceService.mergeModuleKey(id, moduleKey, data, body.getPublished());
        auditService.record(
                Boolean.TRUE.equals(body.getPublished()) ? "module.publish" : "module.patch",
                "applicant",
                id,
                Map.of("moduleKey", moduleKey));
        return saved;
    }

    /**
     * Client conforme acknowledgment. {@code approvalLetter} is staff-owned on
     * every other write path, so the acknowledgment needs this dedicated,
     * published-gated endpoint to persist server-side.
     */
    @PutMapping("/{id}/approval-letter/acknowledge")
    public ApplicantRecordDto acknowledgeApprovalLetter(
            @PathVariable String id,
            @Valid @RequestBody ApprovalAcknowledgeRequest body) {
        SecurityUtils.requireCanAccessApplicant(id);
        ApplicantRecordDto saved = persistenceService.acknowledgeApprovalLetter(
                id, body.getConformeSignedName().trim());
        auditService.record(
                "approval.acknowledge",
                "applicant",
                id,
                Map.of("conformeSignedName", body.getConformeSignedName().trim()));
        return clientVisibilityService.forViewer(saved);
    }

    @PutMapping("/{id}/tna1")
    public ResponseEntity<Tna1FormSaveResponse> saveTna1(
            @PathVariable String id,
            @Valid @RequestBody Tna1FormSaveRequest body) {
        try {
            SecurityUtils.requireCanAccessApplicant(id);
            if (body.getApplicantId() == null || body.getApplicantId().isBlank()) {
                body.setApplicantId(id);
            }
            Tna1FormSaveResponse response = persistenceService.saveTna1(id, body);
            auditService.record("tna1.save", "applicant", id, Map.of("submitted", body.isSubmitted()));
            return ResponseEntity.ok(response);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Non-staff landBank patches cannot set MOA attestation fields; those are
     * established by staff upload ({@code signedMoa} file) / staff-owned keys.
     */
    private Map<String, Object> sanitizeModulePatchData(String moduleKey, Map<String, Object> data) {
        if (data == null || SecurityUtils.requirePrincipal().isStaff()) {
            return data;
        }
        if (!"landBank".equals(moduleKey)) {
            return data;
        }
        Map<String, Object> cleaned = new java.util.LinkedHashMap<>(data);
        cleaned.remove("signedMoa");
        cleaned.remove("signedMoaSnapshot");
        cleaned.remove("introductionLetter");
        return cleaned;
    }
}
