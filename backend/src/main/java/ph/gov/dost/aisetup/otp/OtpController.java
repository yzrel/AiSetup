/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.otp;

import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.otp.dto.OtpSendRequest;
import ph.gov.dost.aisetup.otp.dto.OtpVerifyRequest;

@RestController
@RequestMapping("/auth/otp")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/send")
    public Map<String, Object> send(@Valid @RequestBody OtpSendRequest request) {
        return otpService.send(request.getChannel(), request.getTarget());
    }

    @PostMapping("/verify")
    public Map<String, Object> verify(@Valid @RequestBody OtpVerifyRequest request) {
        return otpService.verify(request.getChannel(), request.getTarget(), request.getCode());
    }
}
