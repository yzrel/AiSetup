/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth.dto;

import java.util.List;

/** Partial update for a staff account (null fields are left unchanged). */
public class UpdateStaffRequest {

    private String firstName;
    private String middleName;
    private String lastName;
    private String role;
    private String officeId;
    private List<String> assignedProvinces;
    private String enterpriseName;
    private Boolean enabled;

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getMiddleName() {
        return middleName;
    }

    public void setMiddleName(String middleName) {
        this.middleName = middleName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getOfficeId() {
        return officeId;
    }

    public void setOfficeId(String officeId) {
        this.officeId = officeId;
    }

    public List<String> getAssignedProvinces() {
        return assignedProvinces;
    }

    public void setAssignedProvinces(List<String> assignedProvinces) {
        this.assignedProvinces = assignedProvinces;
    }

    public String getEnterpriseName() {
        return enterpriseName;
    }

    public void setEnterpriseName(String enterpriseName) {
        this.enterpriseName = enterpriseName;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}
