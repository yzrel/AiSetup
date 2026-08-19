/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.financeprojection.dto;

import java.util.HashMap;
import java.util.Map;

public class FinancialProjectionDocumentResponse {

    private String applicationId;
    private String generatedAt;
    private String frozenAt;
    private String source = "wizard";
    private boolean submitted = true;
    private Map<String, Object> inputs = new HashMap<>();
    private Map<String, Object> snapshot = new HashMap<>();

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }

    public String getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(String generatedAt) {
        this.generatedAt = generatedAt;
    }

    public String getFrozenAt() {
        return frozenAt;
    }

    public void setFrozenAt(String frozenAt) {
        this.frozenAt = frozenAt;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public boolean isSubmitted() {
        return submitted;
    }

    public void setSubmitted(boolean submitted) {
        this.submitted = submitted;
    }

    public Map<String, Object> getInputs() {
        return inputs;
    }

    public void setInputs(Map<String, Object> inputs) {
        this.inputs = inputs;
    }

    public Map<String, Object> getSnapshot() {
        return snapshot;
    }

    public void setSnapshot(Map<String, Object> snapshot) {
        this.snapshot = snapshot;
    }
}
