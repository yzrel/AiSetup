/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.otp;

import java.util.List;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.mail.MailHtmlLayout;
import ph.gov.dost.aisetup.mail.TransactionalMailService;

@Service
public class EmailOtpSender {

    private final TransactionalMailService mailService;

    public EmailOtpSender(TransactionalMailService mailService) {
        this.mailService = mailService;
    }

    public boolean isConfigured() {
        return mailService.isConfigured();
    }

    public void send(String toEmail, String code) {
        if (!isConfigured()) {
            throw new IllegalStateException("Email OTP is not configured (set SMTP_USERNAME / SMTP_PASSWORD)");
        }
        String plain =
                """
                Your DOST SOCCSKSARGEN aiSETUP verification code is: %s

                This code expires in 10 minutes. If you did not request this, you can ignore this email.
                """
                        .formatted(code);
        mailService.send(
                List.of(toEmail),
                List.of(),
                "aiSETUP verification code",
                plain,
                MailHtmlLayout.wrapOtp(code),
                List.of());
    }
}
