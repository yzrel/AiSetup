/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.ai.dto.AiFieldSuggestionRequest;
import ph.gov.dost.aisetup.ai.dto.AiFieldSuggestionResponse;

@RestController
@RequestMapping("/ai")
public class AiFieldSuggestionController {

    private final AiFieldSuggestionService suggestionService;

    public AiFieldSuggestionController(AiFieldSuggestionService suggestionService) {
        this.suggestionService = suggestionService;
    }

    @PostMapping("/suggest-field")
    public AiFieldSuggestionResponse suggestField(@Valid @RequestBody AiFieldSuggestionRequest request) {
        return suggestionService.suggest(request);
    }
}
