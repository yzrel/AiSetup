/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Primary provider: OpenAI Chat Completions. The model comes from the tier
 * mapping in {@code aisetup.ai.tiers} so Luna/Terra/Sol are swappable in config.
 */
@Service
public class OpenAiClient extends AbstractLlmClient {

    private static final String SYSTEM_PROMPT =
            "You are the DOST SOCCSKSARGEN (Region XII) SETUP drafting assistant. "
                    + "Follow the user instructions exactly and return only the requested output format "
                    + "with no markdown fences or commentary.";

    private final AiProperties.OpenAi properties;
    private final AiProperties.Tiers tiers;

    public OpenAiClient(AiProperties properties, ObjectMapper objectMapper) {
        super(objectMapper);
        this.properties = properties.getOpenai();
        this.tiers = properties.getTiers();
    }

    @Override
    public String providerName() {
        return "OpenAI";
    }

    @Override
    public boolean isConfigured() {
        return properties.isConfigured();
    }

    @Override
    public String modelFor(AiTaskTier tier) {
        return tiers.modelFor(tier);
    }

    @Override
    protected String callModel(String model, String prompt, int maxTokens) {
        if (!isConfigured()) {
            throw new IllegalStateException("OpenAI API key is not configured");
        }
        if (model == null || model.isBlank()) {
            throw new IllegalStateException("No OpenAI model configured for this task tier");
        }

        Map<String, Object> body = Map.of(
                "model", model,
                "max_completion_tokens", maxTokens,
                "messages", List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user", "content", prompt))
        );

        String responseBody = restClient.post()
                .uri(chatCompletionsUrl())
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + properties.getApiKey())
                .body(body)
                .retrieve()
                .body(String.class);

        if (responseBody == null || responseBody.isBlank()) {
            throw new IllegalStateException("Empty response from OpenAI API");
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(responseBody);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse OpenAI response", e);
        }

        JsonNode choices = root.path("choices");
        if (!choices.isArray() || choices.isEmpty()) {
            throw new IllegalStateException("Unexpected OpenAI response format");
        }
        String text = choices.get(0).path("message").path("content").asText("");
        if (text.isBlank()) {
            throw new IllegalStateException("OpenAI returned empty content");
        }
        return text;
    }

    private String chatCompletionsUrl() {
        String base = properties.getBaseUrl() == null ? "" : properties.getBaseUrl().trim();
        while (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        if (base.isEmpty()) {
            throw new IllegalStateException("OpenAI base URL is not configured");
        }
        return base + "/chat/completions";
    }
}
