/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.ai.dto.AiFieldSuggestionRequest;
import ph.gov.dost.aisetup.ai.dto.AiFieldSuggestionResponse;
import ph.gov.dost.aisetup.config.AisetupProperties;
import ph.gov.dost.aisetup.config.SlidingWindowRateLimiter;

@RestController
@RequestMapping("/ai")
public class AiFieldSuggestionController {

    private static final Set<String> REGISTER_CONTEXT_KEYS = Set.of(
            "enterpriseName",
            "businessSector",
            "province",
            "address",
            "businessType",
            "registrationType",
            "yearsOfOperation",
            "companyDescription",
            "productServices");

    private final AiFieldSuggestionService suggestionService;
    private final SlidingWindowRateLimiter registerIpLimiter;

    public AiFieldSuggestionController(
            AiFieldSuggestionService suggestionService, AisetupProperties properties) {
        this.suggestionService = suggestionService;
        Duration window = Duration.ofMinutes(Math.max(1, properties.getRateLimit().getAiWindowMinutes()));
        this.registerIpLimiter = new SlidingWindowRateLimiter(
                Math.max(1, properties.getRateLimit().getAiPerUser()), window);
    }

    @PostMapping("/suggest-field")
    public AiFieldSuggestionResponse suggestField(@Valid @RequestBody AiFieldSuggestionRequest request) {
        return suggestionService.suggest(request);
    }

    /**
     * Public registration assist: only the brief company description, rate-limited by IP.
     */
    @PostMapping("/register/suggest-company-description")
    public AiFieldSuggestionResponse suggestRegisterCompanyDescription(
            @Valid @RequestBody AiFieldSuggestionRequest request, HttpServletRequest httpRequest) {
        if (!registerIpLimiter.tryAcquire(clientIp(httpRequest))) {
            throw new IllegalArgumentException(
                    "Too many AI assist requests. Please wait and try again later.");
        }
        request.setModule("register");
        request.setField("companyDescription");
        request.setContext(publicRegisterContext(request.getContext()));
        return suggestionService.suggest(request);
    }

    private static Map<String, Object> publicRegisterContext(Map<String, Object> incoming) {
        Map<String, Object> out = new HashMap<>();
        if (incoming == null) {
            return out;
        }
        for (String key : REGISTER_CONTEXT_KEYS) {
            Object value = incoming.get(key);
            if (!(value instanceof String raw)) {
                continue;
            }
            String trimmed = raw.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            if (trimmed.length() > 500) {
                trimmed = trimmed.substring(0, 500);
            }
            out.put(key, trimmed);
        }
        return out;
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String remote = request.getRemoteAddr();
        return remote != null && !remote.isBlank() ? remote : "unknown";
    }
}
