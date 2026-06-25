/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai.dto;

import jakarta.validation.constraints.NotBlank;

public class AiCompletionRequest {

    @NotBlank
    private String prompt;

    private Integer maxTokens;

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public Integer getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(Integer maxTokens) {
        this.maxTokens = maxTokens;
    }
}
