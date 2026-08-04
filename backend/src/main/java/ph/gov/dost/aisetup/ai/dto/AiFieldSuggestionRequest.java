/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.HashMap;
import java.util.Map;

public class AiFieldSuggestionRequest {

    @NotBlank
    private String module;

    @NotBlank
    private String field;

    @NotNull
    private Map<String, Object> context = new HashMap<>();

    /** Optional free-text hint merged into the AI prompt. */
    @Size(max = 500)
    private String userInstruction;

    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }

    public String getField() { return field; }
    public void setField(String field) { this.field = field; }

    public Map<String, Object> getContext() { return context; }
    public void setContext(Map<String, Object> context) { this.context = context; }

    public String getUserInstruction() { return userInstruction; }
    public void setUserInstruction(String userInstruction) { this.userInstruction = userInstruction; }
}
