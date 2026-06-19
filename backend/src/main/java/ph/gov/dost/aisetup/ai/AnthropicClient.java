/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AnthropicClient {

    private static final Logger log = LoggerFactory.getLogger(AnthropicClient.class);
    private static final String API_URL = "https://api.anthropic.com/v1/messages";

    private final AnthropicProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public AnthropicClient(AnthropicProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
    }

    public List<String> generateBodyParagraphs(String prompt) {
        try {
            return parseParagraphsJson(callAnthropic(prompt));
        } catch (RestClientException e) {
            log.warn("Anthropic API request failed: {}", e.getMessage());
            throw new IllegalStateException("Anthropic API request failed", e);
        } catch (Exception e) {
            log.warn("Failed to parse Anthropic response: {}", e.getMessage());
            throw new IllegalStateException("Failed to parse Anthropic response", e);
        }
    }

    public JsonNode generateJsonObject(String prompt) {
        try {
            String text = callAnthropic(prompt);
            return parseJsonObject(text);
        } catch (RestClientException e) {
            log.warn("Anthropic API request failed: {}", e.getMessage());
            throw new IllegalStateException("Anthropic API request failed", e);
        } catch (Exception e) {
            log.warn("Failed to parse Anthropic response: {}", e.getMessage());
            throw new IllegalStateException("Failed to parse Anthropic response", e);
        }
    }

    private String callAnthropic(String prompt) {
        if (!properties.isConfigured()) {
            throw new IllegalStateException("Anthropic API key is not configured");
        }

        Map<String, Object> body = Map.of(
                "model", properties.getModel(),
                "max_tokens", properties.getMaxTokens(),
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

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode content = root.path("content");
            if (!content.isArray() || content.isEmpty()) {
                throw new IllegalStateException("Unexpected Anthropic response format");
            }
            return content.get(0).path("text").asText("");
        } catch (RestClientException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse Anthropic response", e);
        }
    }

    private JsonNode parseJsonObject(String text) throws Exception {
        String trimmed = text.trim();
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            trimmed = trimmed.substring(start, end + 1);
        }

        JsonNode node = objectMapper.readTree(trimmed);
        if (!node.isObject()) {
            throw new IllegalStateException("AI response is not a JSON object");
        }
        return node;
    }

    private List<String> parseParagraphsJson(String text) throws Exception {
        String trimmed = text.trim();
        int start = trimmed.indexOf('[');
        int end = trimmed.lastIndexOf(']');
        if (start >= 0 && end > start) {
            trimmed = trimmed.substring(start, end + 1);
        }

        JsonNode array = objectMapper.readTree(trimmed);
        if (!array.isArray()) {
            throw new IllegalStateException("AI response is not a JSON array");
        }

        List<String> paragraphs = new ArrayList<>();
        for (JsonNode node : array) {
            String paragraph = node.asText("").trim();
            if (!paragraph.isEmpty()) {
                paragraphs.add(paragraph);
            }
        }

        if (paragraphs.isEmpty()) {
            throw new IllegalStateException("AI returned no paragraphs");
        }

        return paragraphs;
    }
}
