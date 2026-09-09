/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna1;

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
import ph.gov.dost.aisetup.tna1.dto.Tna1DocumentResponse;
import ph.gov.dost.aisetup.tna1.dto.Tna1GenerationRequest;

@RestController
@RequestMapping("/tna1")
public class Tna1Controller {

    private final Tna1GenerationService tna1GenerationService;
    private final AuditService auditService;

    public Tna1Controller(Tna1GenerationService tna1GenerationService, AuditService auditService) {
        this.tna1GenerationService = tna1GenerationService;
        this.auditService = auditService;
    }

    @PostMapping("/generate")
    public ResponseEntity<Tna1DocumentResponse> generate(@Valid @RequestBody Tna1GenerationRequest request) {
        Tna1DocumentResponse document = tna1GenerationService.generate(request);
        auditService.record(
                "tna1.generate",
                "applicant",
                TextUtils.safe(request.getApplicationId()),
                auditDetail(request, document));
        return ResponseEntity.ok(document);
    }

    private static Map<String, Object> auditDetail(
            Tna1GenerationRequest request, Tna1DocumentResponse document) {
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("api", "/tna1/generate");
        detail.put("applicationId", TextUtils.safe(request.getApplicationId()));
        detail.put("enterpriseName", TextUtils.safe(request.getEnterpriseName()));
        detail.put("aiGenerated", document.isAiGenerated());
        detail.put("generatedAt", TextUtils.safe(document.getGeneratedAt()));
        Map<String, Object> form = document.getForm() != null ? document.getForm() : Map.of();
        detail.put("suggestedFields", List.copyOf(form.keySet()));
        detail.put(
                "preview",
                AuditService.preview(
                        form.values().stream()
                                .map(TextUtils::stringVal)
                                .filter(value -> !value.isEmpty())
                                .findFirst()
                                .orElse("")));
        return detail;
    }
}
