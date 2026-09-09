/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import jakarta.validation.Valid;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.ai.dto.AiIfundAssessmentRequest;
import ph.gov.dost.aisetup.ai.dto.AiIfundAssessmentResponse;
import ph.gov.dost.aisetup.audit.AuditService;
import ph.gov.dost.aisetup.auth.SecurityUtils;
import ph.gov.dost.aisetup.auth.UserPrincipal;
import ph.gov.dost.aisetup.common.TextUtils;
import ph.gov.dost.aisetup.config.AisetupProperties;
import ph.gov.dost.aisetup.config.SlidingWindowRateLimiter;

@RestController
@RequestMapping("/ai")
public class AiIfundAssessmentController {

    private final SlidingWindowRateLimiter userLimiter;
    private final AiIfundAssessmentService assessmentService;
    private final AuditService auditService;

    public AiIfundAssessmentController(
            AiIfundAssessmentService assessmentService,
            AuditService auditService,
            AisetupProperties properties) {
        this.assessmentService = assessmentService;
        this.auditService = auditService;
        Duration window = Duration.ofMinutes(Math.max(1, properties.getRateLimit().getAiWindowMinutes()));
        this.userLimiter = new SlidingWindowRateLimiter(
                Math.max(1, properties.getRateLimit().getAiPerUser()), window);
    }

    @PostMapping("/assess-ifund")
    public AiIfundAssessmentResponse assess(@Valid @RequestBody AiIfundAssessmentRequest request) {
        SecurityUtils.requireStaff();
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        if (!userLimiter.tryAcquire(principal.getUserId())) {
            throw new IllegalArgumentException(
                    "AI assessment rate limit exceeded. Please try again later.");
        }
        AiIfundAssessmentResponse response = assessmentService.assess(request);
        auditService.record(
                "ai.assess-ifund",
                "applicant",
                TextUtils.stringVal(request.getContext().get("applicationId")),
                auditDetail(request, response));
        return response;
    }

    private static Map<String, Object> auditDetail(
            AiIfundAssessmentRequest request, AiIfundAssessmentResponse response) {
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("api", "/ai/assess-ifund");
        detail.put("enterpriseName", TextUtils.stringVal(request.getContext().get("enterpriseName")));
        detail.put("proposedAmount", TextUtils.safe(response.getProposedAmount()));
        detail.put("refundRisk", TextUtils.safe(response.getRefundRisk()));
        detail.put("authorityBand", TextUtils.safe(response.getAuthorityBand()));
        detail.put("aiGenerated", response.isAiGenerated());
        detail.put("sourcesMissing", response.getSourcesMissing().size());
        detail.put("preview", AuditService.preview(response.getRationale()));
        return detail;
    }
}
