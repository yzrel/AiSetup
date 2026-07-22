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
        // back in so their whole-blob saves cannot erase unpublished documents.
        Map<String, Object> moduleData = clientVisibilityService.preserveHiddenModules(
                body.moduleData(),
                existing != null ? existing.moduleData() : null);
        // #region agent log
        try { boolean staff = ph.gov.dost.aisetup.auth.SecurityUtils.requirePrincipal().isStaff(); java.util.Map<String, Object> in = body.moduleData() != null ? body.moduleData() : java.util.Map.of(); java.util.Map<String, Object> ex = existing != null && existing.moduleData() != null ? existing.moduleData() : java.util.Map.of(); java.nio.file.Files.writeString(java.nio.file.Path.of("c:/Yzrel/AiSetup/debug-c5b70a.log"), "{\"sessionId\":\"c5b70a\",\"hypothesisId\":\"H-B\",\"location\":\"ApplicantController.save\",\"message\":\"blob save\",\"data\":{\"id\":\"" + id + "\",\"staff\":" + staff + ",\"existingFound\":" + (existing != null) + ",\"incoming.tna2Document\":" + in.containsKey("tna2Document") + ",\"existing.tna2Document\":" + ex.containsKey("tna2Document") + ",\"merged.tna2Document\":" + moduleData.containsKey("tna2Document") + ",\"incoming.approvalLetter\":" + in.containsKey("approvalLetter") + ",\"existing.approvalLetter\":" + ex.containsKey("approvalLetter") + ",\"merged.approvalLetter\":" + moduleData.containsKey("approvalLetter") + ",\"incoming.rtecReport\":" + in.containsKey("rtecReport") + ",\"merged.rtecReport\":" + moduleData.containsKey("rtecReport") + ",\"merged.uploads\":" + moduleData.containsKey("uploads") + "},\"timestamp\":" + System.currentTimeMillis() + "}\n", java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND); } catch (Exception ignored) {}
        // #endregion
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
            workflowGateService.assertLandBankWithdrawalAllowed(dto.moduleData());
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

    @PutMapping("/{id}/modules/{moduleKey}")
    public ApplicantRecordDto patchModule(
            @PathVariable String id,
            @PathVariable String moduleKey,
            @Valid @RequestBody ModulePatchRequest body) {
        SecurityUtils.requireCanAccessApplicant(id);
        workflowGateService.assertStaffOnlyModuleWrite(moduleKey);
        ApplicantRecordDto saved = persistenceService.mergeModuleKey(id, moduleKey, body.getData(), body.getPublished());
        // #region agent log
        try { java.nio.file.Files.writeString(java.nio.file.Path.of("c:/Yzrel/AiSetup/debug-c5b70a.log"), "{\"sessionId\":\"c5b70a\",\"hypothesisId\":\"H-E\",\"location\":\"ApplicantController.patchModule\",\"message\":\"module patch persisted\",\"data\":{\"id\":\"" + id + "\",\"moduleKey\":\"" + moduleKey + "\",\"published\":" + body.getPublished() + "},\"timestamp\":" + System.currentTimeMillis() + "}\n", java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND); } catch (Exception ignored) {}
        // #endregion
        auditService.record(
                Boolean.TRUE.equals(body.getPublished()) ? "module.publish" : "module.patch",
                "applicant",
                id,
                Map.of("moduleKey", moduleKey));
        return saved;
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
}
