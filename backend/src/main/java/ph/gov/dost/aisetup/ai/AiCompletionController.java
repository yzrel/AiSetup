/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.ai.dto.AiCompletionRequest;
import ph.gov.dost.aisetup.ai.dto.AiCompletionResponse;

@RestController
@RequestMapping("/ai")
public class AiCompletionController {

    private final AiCompletionService completionService;

    public AiCompletionController(AiCompletionService completionService) {
        this.completionService = completionService;
    }

    @PostMapping("/complete")
    public AiCompletionResponse complete(@Valid @RequestBody AiCompletionRequest request) {
        return completionService.complete(request);
    }
}
