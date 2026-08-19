/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.financeprojection.dto;

import jakarta.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.Map;

public class FinancialProjectionGenerationRequest {

    private String applicationId;
    private String applicantId;

    @NotNull
    private Map<String, Object> inputs = new HashMap<>();

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }

    public String getApplicantId() {
        return applicantId;
    }

    public void setApplicantId(String applicantId) {
        this.applicantId = applicantId;
    }

    public Map<String, Object> getInputs() {
        return inputs;
    }

    public void setInputs(Map<String, Object> inputs) {
        this.inputs = inputs == null ? new HashMap<>() : inputs;
    }
}
