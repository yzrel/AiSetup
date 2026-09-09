/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.health;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.ai.AiGateway;
import ph.gov.dost.aisetup.config.AisetupProperties;

@RestController
public class HealthController {

    private final AiGateway aiGateway;
    private final AisetupProperties aisetupProperties;

    public HealthController(AiGateway aiGateway, AisetupProperties aisetupProperties) {
        this.aiGateway = aiGateway;
        this.aisetupProperties = aisetupProperties;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "ok");
        boolean aiConfigured = aiGateway.isConfigured();
        body.put("aiConfigured", aiConfigured);
        body.put("demoModeEnabled", aisetupProperties.isDemoModeEnabled());
        body.put("authRequired", true);
        boolean smtpEnabled = aisetupProperties.getMail().isConfigured();
        boolean smsEnabled = aisetupProperties.getSms().isConfigured();
        body.put("smtpEnabled", smtpEnabled);
        body.put("smsEnabled", smsEnabled);
        body.put(
                "emailOutbox",
                smtpEnabled ? "smtp-configured" : "local-only-until-smtp");
        if (!aiConfigured) {
            body.put(
                    "aiSetupHint",
                    "Run npm run ai:setup and add OPENAI_API_KEY to backend/.env, then restart the backend.");
        }
        return body;
    }
}
