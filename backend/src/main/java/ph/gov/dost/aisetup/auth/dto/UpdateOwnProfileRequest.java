/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/** Partial self-service profile update for staff (null fields are left unchanged). */
public class UpdateOwnProfileRequest {

    private String firstName;

    private String middleName;

    private String lastName;

    @Email
    @Size(max = 254)
    private String email;

    /** Required when {@code email} changes (login identity). */
    private String currentPassword;

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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }
}
