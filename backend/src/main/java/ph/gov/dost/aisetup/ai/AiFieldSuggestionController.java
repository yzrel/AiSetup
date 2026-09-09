/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Duration;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.ai.dto.AiFieldSuggestionRequest;
import ph.gov.dost.aisetup.ai.dto.AiFieldSuggestionResponse;
import ph.gov.dost.aisetup.audit.AuditService;
import ph.gov.dost.aisetup.common.TextUtils;
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
    private final AuditService auditService;
    private final SlidingWindowRateLimiter registerIpLimiter;

    public AiFieldSuggestionController(
            AiFieldSuggestionService suggestionService,
            AuditService auditService,
            AisetupProperties properties) {
        this.suggestionService = suggestionService;
        this.auditService = auditService;
        Duration window = Duration.ofMinutes(Math.max(1, properties.getRateLimit().getAiWindowMinutes()));
        this.registerIpLimiter = new SlidingWindowRateLimiter(
                Math.max(1, properties.getRateLimit().getAiPerUser()), window);
    }

    @PostMapping("/suggest-field")
    public AiFieldSuggestionResponse suggestField(@Valid @RequestBody AiFieldSuggestionRequest request) {
        AiFieldSuggestionResponse response = suggestionService.suggest(request);
        auditService.record(
                "ai.suggest-field",
                "ai_field",
                request.getModule() + "." + request.getField(),
                auditDetail("/ai/suggest-field", response));
        return response;
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
        AiFieldSuggestionResponse response = suggestionService.suggest(request);
        auditService.record(
                "ai.suggest-field",
                "ai_field",
                "register.companyDescription",
                auditDetail("/ai/register/suggest-company-description", response));
        return response;
    }

    private static Map<String, Object> auditDetail(String api, AiFieldSuggestionResponse response) {
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("api", api);
        detail.put("module", TextUtils.safe(response.getModule()));
        detail.put("field", TextUtils.safe(response.getField()));
        detail.put("aiGenerated", response.isAiGenerated());
        detail.put("bullets", response.getBullets() != null ? response.getBullets().size() : 0);
        detail.put("riskRows", response.getRiskRows() != null ? response.getRiskRows().size() : 0);
        detail.put("preview", AuditService.preview(response.getText()));
        return detail;
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
