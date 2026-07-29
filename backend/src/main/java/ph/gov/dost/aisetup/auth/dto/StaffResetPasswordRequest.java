/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class StaffResetPasswordRequest {

    @NotBlank
    @Size(min = 8, max = 128)
    private String newPassword;

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
