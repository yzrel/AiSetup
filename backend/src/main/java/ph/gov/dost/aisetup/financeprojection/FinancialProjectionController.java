/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.financeprojection;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.financeprojection.dto.FinancialProjectionDocumentResponse;
import ph.gov.dost.aisetup.financeprojection.dto.FinancialProjectionGenerationRequest;

@RestController
@RequestMapping("/financial-projection")
public class FinancialProjectionController {

    private final FinancialProjectionGenerationService generationService;

    public FinancialProjectionController(FinancialProjectionGenerationService generationService) {
        this.generationService = generationService;
    }

    @PostMapping("/generate")
    public ResponseEntity<FinancialProjectionDocumentResponse> generate(
            @Valid @RequestBody FinancialProjectionGenerationRequest request) {
        return ResponseEntity.ok(generationService.generate(request));
    }
}
