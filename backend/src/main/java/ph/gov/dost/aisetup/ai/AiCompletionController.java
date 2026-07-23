/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import jakarta.validation.Valid;
import java.time.Duration;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.ai.dto.AiCompletionRequest;
import ph.gov.dost.aisetup.ai.dto.AiCompletionResponse;
import ph.gov.dost.aisetup.auth.SecurityUtils;
import ph.gov.dost.aisetup.auth.UserPrincipal;
import ph.gov.dost.aisetup.config.AisetupProperties;
import ph.gov.dost.aisetup.config.SlidingWindowRateLimiter;

@RestController
@RequestMapping("/ai")
public class AiCompletionController {

    private final SlidingWindowRateLimiter userLimiter;
    private final AiCompletionService completionService;

    public AiCompletionController(AiCompletionService completionService, AisetupProperties properties) {
        this.completionService = completionService;
        Duration window = Duration.ofMinutes(Math.max(1, properties.getRateLimit().getAiWindowMinutes()));
        this.userLimiter = new SlidingWindowRateLimiter(
                Math.max(1, properties.getRateLimit().getAiPerUser()), window);
    }

    @PostMapping("/complete")
    public AiCompletionResponse complete(@Valid @RequestBody AiCompletionRequest request) {
        SecurityUtils.requireStaff();
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        if (!userLimiter.tryAcquire(principal.getUserId())) {
            throw new IllegalArgumentException(
                    "AI completion rate limit exceeded. Please try again later.");
        }
        return completionService.complete(request);
    }
}
