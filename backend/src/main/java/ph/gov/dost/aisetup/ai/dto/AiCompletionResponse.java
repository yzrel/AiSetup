/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai.dto;

public class AiCompletionResponse {

    private String text;
    private boolean aiGenerated;

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public boolean isAiGenerated() {
        return aiGenerated;
    }

    public void setAiGenerated(boolean aiGenerated) {
        this.aiGenerated = aiGenerated;
    }
}
