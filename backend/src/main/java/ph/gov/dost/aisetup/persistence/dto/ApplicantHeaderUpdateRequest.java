/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence.dto;

import java.util.Map;

/**
 * Thin case-header update: profile + currentModule without rewriting module payloads.
 */
public class ApplicantHeaderUpdateRequest {

    private String enterpriseName;
    private String currentModule;
    private Map<String, Object> profile;

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

    public Map<String, Object> getProfile() {
        return profile;
    }

    public void setProfile(Map<String, Object> profile) {
        this.profile = profile;
    }
}
