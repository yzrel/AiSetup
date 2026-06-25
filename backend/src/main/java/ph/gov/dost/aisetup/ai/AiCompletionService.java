/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.ai.dto.AiCompletionRequest;
import ph.gov.dost.aisetup.ai.dto.AiCompletionResponse;

@Service
public class AiCompletionService {

    private static final Logger log = LoggerFactory.getLogger(AiCompletionService.class);
    private static final int DEFAULT_MAX_TOKENS = 2048;

    private final AnthropicClient anthropicClient;
    private final AnthropicProperties anthropicProperties;

    public AiCompletionService(AnthropicClient anthropicClient, AnthropicProperties anthropicProperties) {
        this.anthropicClient = anthropicClient;
        this.anthropicProperties = anthropicProperties;
    }

    public AiCompletionResponse complete(AiCompletionRequest request) {
        AiCompletionResponse response = new AiCompletionResponse();
        int maxTokens = request.getMaxTokens() != null && request.getMaxTokens() > 0
                ? request.getMaxTokens()
                : DEFAULT_MAX_TOKENS;

        try {
            String text = anthropicClient.generateText(request.getPrompt().trim(), maxTokens);
            if (!text.isBlank()) {
                response.setText(text.trim());
                response.setAiGenerated(true);
                return response;
            }
        } catch (Exception e) {
            log.warn("AI completion failed: {}", e.getMessage());
        }

        response.setText(fallbackText(request.getPrompt()));
        response.setAiGenerated(false);
        return response;
    }

    private String fallbackText(String prompt) {
        if (!anthropicProperties.isConfigured()) {
            return "AI assist is unavailable. Set ANTHROPIC_API_KEY in backend/.env and restart the backend (npm run backend).";
        }
        return "AI assist could not complete this request right now. Please try again in a moment.";
    }
}
