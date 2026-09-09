/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Single entry point for every AI call in aiSETUP.
 *
 * <p>Routes the task tier to an OpenAI model (Luna / Terra / Sol), falls back to
 * Anthropic when OpenAI fails or has no key, and throws when neither provider can
 * answer so callers keep their deterministic template fallback.
 */
@Service
public class AiGateway {

    private static final Logger log = LoggerFactory.getLogger(AiGateway.class);

    private final OpenAiClient openAiClient;
    private final AnthropicClient anthropicClient;
    private final AiProperties properties;

    public AiGateway(OpenAiClient openAiClient, AnthropicClient anthropicClient, AiProperties properties) {
        this.openAiClient = openAiClient;
        this.anthropicClient = anthropicClient;
        this.properties = properties;
    }

    /** True when at least one provider has an API key. */
    public boolean isConfigured() {
        return openAiClient.isConfigured() || anthropicClient.isConfigured();
    }

    public String generateText(AiTaskTier tier, String prompt) {
        return generateText(tier, prompt, properties.getMaxTokens());
    }

    public String generateText(AiTaskTier tier, String prompt, int maxTokens) {
        return call(tier, (client, model) -> client.generateText(model, prompt, maxTokens));
    }

    public JsonNode generateJsonObject(AiTaskTier tier, String prompt) {
        return generateJsonObject(tier, prompt, properties.getMaxTokens());
    }

    public JsonNode generateJsonObject(AiTaskTier tier, String prompt, int maxTokens) {
        return call(tier, (client, model) -> client.generateJsonObject(model, prompt, maxTokens));
    }

    public List<String> generateBodyParagraphs(AiTaskTier tier, String prompt) {
        return generateBodyParagraphs(tier, prompt, properties.getMaxTokens());
    }

    public List<String> generateBodyParagraphs(AiTaskTier tier, String prompt, int maxTokens) {
        return call(tier, (client, model) -> client.generateBodyParagraphs(model, prompt, maxTokens));
    }

    @FunctionalInterface
    private interface Invocation<T> {
        T apply(LlmClient client, String model);
    }

    private <T> T call(AiTaskTier tier, Invocation<T> invocation) {
        RuntimeException primaryFailure = null;

        if (openAiClient.isConfigured()) {
            String model = openAiClient.modelFor(tier);
            try {
                T result = invocation.apply(openAiClient, model);
                log.debug("AI {} task served by OpenAI ({})", tier, model);
                return result;
            } catch (RuntimeException e) {
                primaryFailure = e;
                log.warn("OpenAI ({}) failed for {} task: {}", model, tier, e.getMessage());
            }
        }

        if (anthropicClient.isConfigured()) {
            String model = anthropicClient.modelFor(tier);
            try {
                T result = invocation.apply(anthropicClient, model);
                log.info("AI {} task served by Anthropic fallback ({})", tier, model);
                return result;
            } catch (RuntimeException e) {
                if (primaryFailure != null) {
                    e.addSuppressed(primaryFailure);
                }
                throw e;
            }
        }

        if (primaryFailure != null) {
            throw primaryFailure;
        }
        throw new IllegalStateException(
                "No AI provider is configured (set OPENAI_API_KEY, or ANTHROPIC_API_KEY for fallback)");
    }
}
