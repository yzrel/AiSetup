/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth.dto;

import java.util.List;

/** Staff account row for admin account management. */
public class StaffUserDto {

    private String id;
    private String email;
    private String firstName;
    private String middleName;
    private String lastName;
    private String role;
    private String enterpriseName;
    private String officeId;
    private List<String> assignedProvinces;
    private boolean enabled;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

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

    public String getEnterpriseName() {
        return enterpriseName;
    }

    public void setEnterpriseName(String enterpriseName) {
        this.enterpriseName = enterpriseName;
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

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
