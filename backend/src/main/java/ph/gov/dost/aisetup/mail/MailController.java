/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.mail;

import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.mail.dto.MailSendRequest;

@RestController
@RequestMapping("/mail")
public class MailController {

    private final MailSendService mailSendService;

    public MailController(MailSendService mailSendService) {
        this.mailSendService = mailSendService;
    }

    @PostMapping("/send")
    public Map<String, Object> send(@Valid @RequestBody MailSendRequest request) {
        return mailSendService.send(request);
    }
}
