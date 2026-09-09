/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

/**
 * One LLM provider behind {@link AiGateway}. Implementations are interchangeable:
 * the gateway tries OpenAI first and falls back to Anthropic, and every failure
 * must surface as an exception so callers keep their template fallback.
 */
public interface LlmClient {

    /** Provider label used in logs. */
    String providerName();

    /** False when the provider has no API key, so the gateway can skip it. */
    boolean isConfigured();

    /** Model this provider uses for the given tier. */
    String modelFor(AiTaskTier tier);

    /** Plain text completion. */
    String generateText(String model, String prompt, int maxTokens);

    /** Completion parsed as a JSON object. */
    JsonNode generateJsonObject(String model, String prompt, int maxTokens);

    /** Completion parsed as a JSON array of non-empty paragraphs. */
    List<String> generateBodyParagraphs(String model, String prompt, int maxTokens);
}
