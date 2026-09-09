/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna2;

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
import ph.gov.dost.aisetup.tna2.dto.Tna2DocumentResponse;
import ph.gov.dost.aisetup.tna2.dto.Tna2GenerationRequest;

@RestController
@RequestMapping("/tna2")
public class Tna2Controller {

    private final Tna2GenerationService tna2GenerationService;
    private final AuditService auditService;

    public Tna2Controller(Tna2GenerationService tna2GenerationService, AuditService auditService) {
        this.tna2GenerationService = tna2GenerationService;
        this.auditService = auditService;
    }

    @PostMapping("/generate")
    public ResponseEntity<Tna2DocumentResponse> generate(@Valid @RequestBody Tna2GenerationRequest request) {
        Tna2DocumentResponse document = tna2GenerationService.generate(request);
        auditService.record(
                "tna2.generate",
                "applicant",
                TextUtils.safe(request.getApplicationId()),
                auditDetail(request, document));
        return ResponseEntity.ok(document);
    }

    private static Map<String, Object> auditDetail(
            Tna2GenerationRequest request, Tna2DocumentResponse document) {
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("api", "/tna2/generate");
        detail.put("applicationId", TextUtils.safe(request.getApplicationId()));
        detail.put("enterpriseName", TextUtils.safe(request.getEnterpriseName()));
        detail.put("documentRef", TextUtils.safe(document.getDocumentRef()));
        detail.put("aiGenerated", document.isAiGenerated());
        detail.put("generatedAt", TextUtils.safe(document.getGeneratedAt()));
        detail.put("findingAreas", size(document.getFindingsByArea()));
        detail.put("recommendations", size(document.getRecommendations()));
        detail.put("recommendedEquipment", size(document.getRecommendedEquipment()));
        detail.put("preview", AuditService.preview(document.getBackground()));
        return detail;
    }

    private static int size(List<?> values) {
        return values != null ? values.size() : 0;
    }
}
