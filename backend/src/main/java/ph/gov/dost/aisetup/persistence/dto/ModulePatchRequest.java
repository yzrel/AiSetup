/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public class ModulePatchRequest {

    @NotNull
    private Map<String, Object> data;

    private Boolean published;

    public Map<String, Object> getData() {
        return data;
    }

    public void setData(Map<String, Object> data) {
        this.data = data;
    }

    public Boolean getPublished() {
        return published;
    }

    public void setPublished(Boolean published) {
        this.published = published;
    }
}
