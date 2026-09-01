/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.common;

import java.util.function.Supplier;

import org.slf4j.Logger;

/**
 * Shared "try AI, fall back to template" wrapper for the document generation
 * services. AI is optional in AiSETUP: any failure (missing key, timeout,
 * empty output) downgrades to the deterministic template result.
 */
public final class AiTemplateFallback {

    private AiTemplateFallback() {}

    /** Outcome of a generation attempt: the payload plus whether AI produced it. */
    public record Result<T>(T value, boolean aiGenerated) {}

    /** AI call that may fail; failures trigger the template fallback. */
    @FunctionalInterface
    public interface AiCall<T> {
        T get() throws Exception;
    }

    public static <T> Result<T> generate(Logger log, String label, AiCall<T> ai, Supplier<T> template) {
        try {
            return new Result<>(ai.get(), true);
        } catch (Exception e) {
            log.info("Using template {} (AI unavailable): {}", label, e.getMessage());
            return new Result<>(template.get(), false);
        }
    }
}
