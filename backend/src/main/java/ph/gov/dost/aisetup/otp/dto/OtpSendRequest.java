/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.otp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class OtpSendRequest {

    /** "email" or "sms". */
    @NotBlank
    @Pattern(regexp = "email|sms", message = "must be email or sms")
    private String channel;

    /** Email address or Philippine mobile number. */
    @NotBlank
    private String target;

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
}
