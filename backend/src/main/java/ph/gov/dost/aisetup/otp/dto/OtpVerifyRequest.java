/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.otp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class OtpVerifyRequest {

    @NotBlank
    @Pattern(regexp = "email|sms", message = "must be email or sms")
    private String channel;

    @NotBlank
    private String target;

    @NotBlank
    @Size(min = 6, max = 6)
    private String code;

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
