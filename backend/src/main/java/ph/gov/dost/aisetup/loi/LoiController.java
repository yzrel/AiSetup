/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.loi;

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
import ph.gov.dost.aisetup.loi.dto.LoiDocumentResponse;
import ph.gov.dost.aisetup.loi.dto.LoiGenerationRequest;
import ph.gov.dost.aisetup.workflow.ModuleContentValidationService;

@RestController
@RequestMapping("/loi")
public class LoiController {

    private final LoiGenerationService loiGenerationService;
    private final ModuleContentValidationService moduleContentValidationService;
    private final AuditService auditService;

    public LoiController(
            LoiGenerationService loiGenerationService,
            ModuleContentValidationService moduleContentValidationService,
            AuditService auditService) {
        this.loiGenerationService = loiGenerationService;
        this.moduleContentValidationService = moduleContentValidationService;
        this.auditService = auditService;
    }

    @PostMapping("/generate")
    public ResponseEntity<LoiDocumentResponse> generate(@Valid @RequestBody LoiGenerationRequest request) {
        moduleContentValidationService.assertLoiGeneration(request);
        LoiDocumentResponse document = loiGenerationService.generate(request);
        auditService.record("loi.generate", "loi", null, auditDetail(request, document));
        return ResponseEntity.ok(document);
    }

    private static Map<String, Object> auditDetail(
            LoiGenerationRequest request, LoiDocumentResponse document) {
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("api", "/loi/generate");
        detail.put("enterpriseName", TextUtils.safe(request.getEnterpriseName()));
        detail.put("programName", TextUtils.safe(request.getProgramName()));
        detail.put("aiGenerated", document.isAiGenerated());
        detail.put("generatedAt", TextUtils.safe(document.getGeneratedAt()));
        List<String> paragraphs = document.getBodyParagraphs();
        detail.put("paragraphs", paragraphs != null ? paragraphs.size() : 0);
        detail.put(
                "preview",
                AuditService.preview(
                        paragraphs != null && !paragraphs.isEmpty() ? paragraphs.get(0) : ""));
        return detail;
    }
}
