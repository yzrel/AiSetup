/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.proposal;

import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.audit.AuditService;
import ph.gov.dost.aisetup.common.TextUtils;
import ph.gov.dost.aisetup.proposal.dto.ProjectProposalDocumentResponse;
import ph.gov.dost.aisetup.proposal.dto.ProjectProposalGenerationRequest;
import ph.gov.dost.aisetup.workflow.ModuleContentValidationService;

@RestController
@RequestMapping("/project-proposal")
public class ProjectProposalController {

    private final ProjectProposalGenerationService generationService;
    private final ModuleContentValidationService moduleContentValidationService;
    private final AuditService auditService;

    public ProjectProposalController(
            ProjectProposalGenerationService generationService,
            ModuleContentValidationService moduleContentValidationService,
            AuditService auditService) {
        this.generationService = generationService;
        this.moduleContentValidationService = moduleContentValidationService;
        this.auditService = auditService;
    }

    @PostMapping("/generate")
    public ResponseEntity<ProjectProposalDocumentResponse> generate(
            @Valid @RequestBody ProjectProposalGenerationRequest request) {
        moduleContentValidationService.assertProposalGeneration(request);
        ProjectProposalDocumentResponse document = generationService.generate(request);
        auditService.record(
                "proposal.generate",
                "applicant",
                TextUtils.safe(request.getApplicationId()),
                auditDetail(request, document));
        return ResponseEntity.ok(document);
    }

    private static Map<String, Object> auditDetail(
            ProjectProposalGenerationRequest request, ProjectProposalDocumentResponse document) {
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("api", "/project-proposal/generate");
        detail.put("applicationId", TextUtils.safe(request.getApplicationId()));
        detail.put("enterpriseName", TextUtils.safe(request.getEnterpriseName()));
        detail.put("aiGenerated", document.isAiGenerated());
        detail.put("generatedAt", TextUtils.safe(document.getGeneratedAt()));
        detail.put("specificObjectives", size(document.getSpecificObjectives()));
        detail.put("riskRows", size(document.getRiskRows()));
        detail.put("preview", AuditService.preview(document.getGeneralObjective()));
        return detail;
    }

    private static int size(List<?> values) {
        return values != null ? values.size() : 0;
    }
}
