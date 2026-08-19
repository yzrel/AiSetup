/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.financeprojection;

import java.time.Instant;
import java.util.Map;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.financeprojection.dto.FinancialProjectionDocumentResponse;
import ph.gov.dost.aisetup.financeprojection.dto.FinancialProjectionGenerationRequest;
import ph.gov.dost.aisetup.workflow.ModuleContentValidationService;

@Service
public class FinancialProjectionGenerationService {

    private final ModuleContentValidationService contentValidation;

    public FinancialProjectionGenerationService(ModuleContentValidationService contentValidation) {
        this.contentValidation = contentValidation;
    }

    public FinancialProjectionDocumentResponse generate(FinancialProjectionGenerationRequest request) {
        Map<String, Object> inputs = request.getInputs() == null ? Map.of() : request.getInputs();
        contentValidation.assertFinancialProjectionGenerate(inputs);
        Map<String, Object> snapshot = FinancialProjectionEngine.compute(inputs);
        String now = Instant.now().toString();
        FinancialProjectionDocumentResponse response = new FinancialProjectionDocumentResponse();
        response.setApplicationId(request.getApplicationId());
        response.setGeneratedAt(now);
        response.setFrozenAt(now);
        response.setSource("wizard");
        response.setSubmitted(true);
        response.setInputs(inputs);
        response.setSnapshot(snapshot);
        return response;
    }
}
