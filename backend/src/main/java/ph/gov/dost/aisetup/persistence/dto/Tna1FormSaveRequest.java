/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Partial TNA Form 01 save payload (matches FE {@code ApiTnaFormPayload}).
 * Merged into {@code moduleData.tna1} without wiping unrelated TNA1 keys.
 */
public class Tna1FormSaveRequest {

    @NotBlank
    private String applicantId;

    private Map<String, Object> form = new LinkedHashMap<>();

    private Map<String, Object> tables = new LinkedHashMap<>();

    private boolean submitted;

    public String getApplicantId() {
        return applicantId;
    }

    public void setApplicantId(String applicantId) {
        this.applicantId = applicantId;
    }

    public Map<String, Object> getForm() {
        return form;
    }

    public void setForm(Map<String, Object> form) {
        this.form = form != null ? form : new LinkedHashMap<>();
    }

    public Map<String, Object> getTables() {
        return tables;
    }

    public void setTables(Map<String, Object> tables) {
        this.tables = tables != null ? tables : new LinkedHashMap<>();
    }

    public boolean isSubmitted() {
        return submitted;
    }

    public void setSubmitted(boolean submitted) {
        this.submitted = submitted;
    }
}
