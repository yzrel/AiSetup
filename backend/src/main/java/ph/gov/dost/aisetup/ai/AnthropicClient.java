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
 * Failover provider: Anthropic Messages API. Used only when the OpenAI call
 * fails, so it keeps a single configured model for every tier.
 */
@Service
public class AnthropicClient extends AbstractLlmClient {

    private static final String API_URL = "https://api.anthropic.com/v1/messages";

    private final AiProperties.Anthropic properties;

    public AnthropicClient(AiProperties properties, ObjectMapper objectMapper) {
        super(objectMapper);
        this.properties = properties.getAnthropic();
    }

    @Override
    public String providerName() {
        return "Anthropic";
    }

    @Override
    public boolean isConfigured() {
        return properties.isConfigured();
    }

    @Override
    public String modelFor(AiTaskTier tier) {
        return properties.getModel();
    }

    @Override
    protected String callModel(String model, String prompt, int maxTokens) {
        if (!isConfigured()) {
            throw new IllegalStateException("Anthropic API key is not configured");
        }

        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", maxTokens,
                "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        String responseBody = restClient.post()
                .uri(API_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-key", properties.getApiKey())
                .header("anthropic-version", "2023-06-01")
                .body(body)
                .retrieve()
                .body(String.class);

        if (responseBody == null || responseBody.isBlank()) {
            throw new IllegalStateException("Empty response from Anthropic API");
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(responseBody);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse Anthropic response", e);
        }

        JsonNode content = root.path("content");
        if (!content.isArray() || content.isEmpty()) {
            throw new IllegalStateException("Unexpected Anthropic response format");
        }
        return content.get(0).path("text").asText("");
    }
}
