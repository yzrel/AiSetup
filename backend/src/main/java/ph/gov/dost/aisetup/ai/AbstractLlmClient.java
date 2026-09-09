/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Shared transport and response parsing for the LLM providers. Subclasses only
 * implement the provider-specific HTTP call; text/JSON/paragraph shaping and the
 * "always throw on failure" contract live here.
 */
public abstract class AbstractLlmClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(AbstractLlmClient.class);

    protected final ObjectMapper objectMapper;
    protected final RestClient restClient;

    protected AbstractLlmClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        // Timeouts keep a slow/hung provider call from pinning a Tomcat worker thread.
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(60));
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    /** Provider-specific call returning the raw assistant text. */
    protected abstract String callModel(String model, String prompt, int maxTokens);

    @Override
    public String generateText(String model, String prompt, int maxTokens) {
        return guard(() -> callModel(model, prompt, maxTokens).trim());
    }

    @Override
    public JsonNode generateJsonObject(String model, String prompt, int maxTokens) {
        return guard(() -> parseJsonObject(callModel(model, prompt, maxTokens)));
    }

    @Override
    public List<String> generateBodyParagraphs(String model, String prompt, int maxTokens) {
        return guard(() -> parseParagraphsJson(callModel(model, prompt, maxTokens)));
    }

    @FunctionalInterface
    private interface ProviderCall<T> {
        T get() throws Exception;
    }

    private <T> T guard(ProviderCall<T> call) {
        try {
            return call.get();
        } catch (RestClientException e) {
            log.warn("{} API request failed: {}", providerName(), e.getMessage());
            throw new IllegalStateException(providerName() + " API request failed", e);
        } catch (Exception e) {
            log.warn("Failed to parse {} response: {}", providerName(), e.getMessage());
            throw new IllegalStateException("Failed to parse " + providerName() + " response", e);
        }
    }

    protected JsonNode parseJsonObject(String text) throws Exception {
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

    protected List<String> parseParagraphsJson(String text) throws Exception {
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
