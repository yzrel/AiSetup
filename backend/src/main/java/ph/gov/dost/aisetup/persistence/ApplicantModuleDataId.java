/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import java.io.Serializable;
import java.util.Objects;

public class ApplicantModuleDataId implements Serializable {

    private String applicantId;
    private String moduleKey;

    public ApplicantModuleDataId() {}

    public ApplicantModuleDataId(String applicantId, String moduleKey) {
        this.applicantId = applicantId;
        this.moduleKey = moduleKey;
    }

    public String getApplicantId() {
        return applicantId;
    }

    public void setApplicantId(String applicantId) {
        this.applicantId = applicantId;
    }

    public String getModuleKey() {
        return moduleKey;
    }

    public void setModuleKey(String moduleKey) {
        this.moduleKey = moduleKey;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ApplicantModuleDataId that)) {
            return false;
        }
        return Objects.equals(applicantId, that.applicantId)
                && Objects.equals(moduleKey, that.moduleKey);
    }

    @Override
    public int hashCode() {
        return Objects.hash(applicantId, moduleKey);
    }
}
