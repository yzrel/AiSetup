/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.financeprojection;

import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.audit.AuditService;
import ph.gov.dost.aisetup.common.TextUtils;
import ph.gov.dost.aisetup.financeprojection.dto.FinancialProjectionDocumentResponse;
import ph.gov.dost.aisetup.financeprojection.dto.FinancialProjectionGenerationRequest;

@RestController
@RequestMapping("/financial-projection")
public class FinancialProjectionController {

    private final FinancialProjectionGenerationService generationService;
    private final AuditService auditService;

    public FinancialProjectionController(
            FinancialProjectionGenerationService generationService, AuditService auditService) {
        this.generationService = generationService;
        this.auditService = auditService;
    }

    @PostMapping("/generate")
    public ResponseEntity<FinancialProjectionDocumentResponse> generate(
            @Valid @RequestBody FinancialProjectionGenerationRequest request) {
        FinancialProjectionDocumentResponse document = generationService.generate(request);
        auditService.record(
                "financial-projection.generate",
                "applicant",
                TextUtils.safe(request.getApplicationId()),
                auditDetail(document));
        return ResponseEntity.ok(document);
    }

    private static Map<String, Object> auditDetail(FinancialProjectionDocumentResponse document) {
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("api", "/financial-projection/generate");
        detail.put("applicationId", TextUtils.safe(document.getApplicationId()));
        detail.put("source", TextUtils.safe(document.getSource()));
        detail.put("submitted", document.isSubmitted());
        detail.put("generatedAt", TextUtils.safe(document.getGeneratedAt()));
        detail.put("frozenAt", TextUtils.safe(document.getFrozenAt()));
        Map<String, Object> snapshot = document.getSnapshot();
        detail.put("snapshotKeys", snapshot != null ? snapshot.size() : 0);
        return detail;
    }
}
