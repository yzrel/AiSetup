/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

/**
 * Validated envelope for whole-blob applicant PUT.
 * {@code moduleData} remains a map; shape rules live in ModuleDataIntegrityService.
 */
public class ApplicantSaveRequest {

    private String id;

    @NotBlank
    private String applicationId;

    private String enterpriseName;

    private String currentModule;

    private Map<String, Object> moduleData;

    private Map<String, Object> profile;

    private String updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }

    public String getEnterpriseName() {
        return enterpriseName;
    }

    public void setEnterpriseName(String enterpriseName) {
        this.enterpriseName = enterpriseName;
    }

    public String getCurrentModule() {
        return currentModule;
    }

    public void setCurrentModule(String currentModule) {
        this.currentModule = currentModule;
    }

    public Map<String, Object> getModuleData() {
        return moduleData;
    }

    public void setModuleData(Map<String, Object> moduleData) {
        this.moduleData = moduleData;
    }

    public Map<String, Object> getProfile() {
        return profile;
    }

    public void setProfile(Map<String, Object> profile) {
        this.profile = profile;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
