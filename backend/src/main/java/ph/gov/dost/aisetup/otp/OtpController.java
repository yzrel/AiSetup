/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.otp;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Duration;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.config.AisetupProperties;
import ph.gov.dost.aisetup.config.SlidingWindowRateLimiter;
import ph.gov.dost.aisetup.otp.dto.OtpSendRequest;
import ph.gov.dost.aisetup.otp.dto.OtpVerifyRequest;

@RestController
@RequestMapping("/auth/otp")
public class OtpController {

    private final SlidingWindowRateLimiter ipSendLimiter;
    private final SlidingWindowRateLimiter targetSendLimiter;
    private final OtpService otpService;

    public OtpController(OtpService otpService, AisetupProperties properties) {
        this.otpService = otpService;
        Duration window = Duration.ofMinutes(Math.max(1, properties.getRateLimit().getOtpWindowMinutes()));
        this.ipSendLimiter = new SlidingWindowRateLimiter(
                Math.max(1, properties.getRateLimit().getOtpPerIp()), window);
        this.targetSendLimiter = new SlidingWindowRateLimiter(
                Math.max(1, properties.getRateLimit().getOtpPerTarget()), window);
    }

    @PostMapping("/send")
    public Map<String, Object> send(
            @Valid @RequestBody OtpSendRequest request, HttpServletRequest httpRequest) {
        String ip = clientIp(httpRequest);
        String targetKey = (request.getChannel() + ":" + request.getTarget()).toLowerCase();
        if (!ipSendLimiter.tryAcquire(ip) || !targetSendLimiter.tryAcquire(targetKey)) {
            throw new IllegalArgumentException(
                    "Too many verification requests. Please wait and try again later.");
        }
        return otpService.send(request.getChannel(), request.getTarget());
    }

    @PostMapping("/verify")
    public Map<String, Object> verify(@Valid @RequestBody OtpVerifyRequest request) {
        return otpService.verify(request.getChannel(), request.getTarget(), request.getCode());
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
