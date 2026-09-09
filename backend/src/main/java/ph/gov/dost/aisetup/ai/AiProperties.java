/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "aisetup.ai")
public class AiProperties {

    private final OpenAi openai = new OpenAi();
    private final Anthropic anthropic = new Anthropic();
    private final Tiers tiers = new Tiers();
    private int maxTokens = 1500;

    public OpenAi getOpenai() {
        return openai;
    }

    public Anthropic getAnthropic() {
        return anthropic;
    }

    public Tiers getTiers() {
        return tiers;
    }

    public int getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(int maxTokens) {
        this.maxTokens = maxTokens;
    }

    /** Primary provider. */
    public static class OpenAi {

        private String apiKey = "";
        private String baseUrl = "https://api.openai.com/v1";

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public boolean isConfigured() {
            return apiKey != null && !apiKey.isBlank();
        }
    }

    /** Failover provider, used only when the OpenAI call fails. */
    public static class Anthropic {

        private String apiKey = "";
        private String model = "claude-sonnet-4-20250514";

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

        public boolean isConfigured() {
            return apiKey != null && !apiKey.isBlank();
        }
    }

    /** OpenAI model per task tier (Luna / Terra / Sol). */
    public static class Tiers {

        private String simple = "gpt-5.6-luna";
        private String normal = "gpt-5.6-luna";
        private String complex = "gpt-5.6-terra";

        public String getSimple() {
            return simple;
        }

        public void setSimple(String simple) {
            this.simple = simple;
        }

        public String getNormal() {
            return normal;
        }

        public void setNormal(String normal) {
            this.normal = normal;
        }

        public String getComplex() {
            return complex;
        }

        public void setComplex(String complex) {
            this.complex = complex;
        }

        public String modelFor(AiTaskTier tier) {
            return switch (tier) {
                case SIMPLE -> simple;
                case NORMAL -> normal;
                case COMPLEX -> complex;
            };
        }
    }
}
