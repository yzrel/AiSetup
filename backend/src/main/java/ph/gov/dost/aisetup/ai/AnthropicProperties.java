package ph.gov.dost.aisetup.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "aisetup.anthropic")
public class AnthropicProperties {

    private String apiKey = "";
    private String model = "claude-sonnet-4-20250514";
    private int maxTokens = 1500;

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public int getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(int maxTokens) {
        this.maxTokens = maxTokens;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
