/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.otp;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.config.AisetupProperties;

@Service
public class EmailOtpSender {

    private static final Logger log = LoggerFactory.getLogger(EmailOtpSender.class);

    private final JavaMailSender mailSender;
    private final AisetupProperties properties;

    public EmailOtpSender(JavaMailSender mailSender, AisetupProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    public boolean isConfigured() {
        return properties.getMail().isConfigured();
    }

    public void send(String toEmail, String code) {
        if (!isConfigured()) {
            throw new IllegalStateException("Email OTP is not configured (set SMTP_USERNAME / SMTP_PASSWORD)");
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            String from = properties.getMail().getFrom();
            if (from == null || from.isBlank()) {
                from = properties.getMail().getUsername();
            }
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("aiSETUP verification code");
            helper.setText(
                    """
                    Your DOST Region XII aiSETUP verification code is: %s

                    This code expires in 10 minutes. If you did not request this, you can ignore this email.
                    """.formatted(code),
                    false);
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw new IllegalStateException("Failed to send verification email. Please try again.", e);
        }
    }
}
