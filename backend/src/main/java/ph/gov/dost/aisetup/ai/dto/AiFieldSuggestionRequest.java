/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.HashMap;
import java.util.Map;

public class AiFieldSuggestionRequest {

    @NotBlank
    private String module;

    @NotBlank
    private String field;

    @NotNull
    private Map<String, Object> context = new HashMap<>();

    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }

    public String getField() { return field; }
    public void setField(String field) { this.field = field; }

    public Map<String, Object> getContext() { return context; }
    public void setContext(Map<String, Object> context) { this.context = context; }
}
