/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai.dto;

import jakarta.validation.constraints.NotNull;

import java.util.HashMap;
import java.util.Map;

public class AiIfundAssessmentRequest {

    /** Structured cooperator financial / request fields for Guidelines 3.0 assessment. */
    @NotNull
    private Map<String, Object> context = new HashMap<>();

    public Map<String, Object> getContext() {
        return context;
    }

    public void setContext(Map<String, Object> context) {
        this.context = context != null ? context : new HashMap<>();
    }
}
