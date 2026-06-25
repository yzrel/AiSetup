/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.ai.AnthropicProperties;

import java.util.Map;

@RestController
public class HealthController {

    private final AnthropicProperties anthropicProperties;

    public HealthController(AnthropicProperties anthropicProperties) {
        this.anthropicProperties = anthropicProperties;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        boolean aiConfigured = anthropicProperties.isConfigured();
        if (aiConfigured) {
            return Map.of(
                    "status", "ok",
                    "aiConfigured", true);
        }
        return Map.of(
                "status", "ok",
                "aiConfigured", false,
                "aiSetupHint", "Run npm run ai:setup and add ANTHROPIC_API_KEY to backend/.env, then restart the backend.");
    }
}
