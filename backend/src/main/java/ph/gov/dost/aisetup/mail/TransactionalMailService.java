/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.mail;

import jakarta.mail.internet.MimeMessage;
import java.util.Collection;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.config.AisetupProperties;

/**
 * Shared SMTP sender for OTP and document / Sent Emails delivery via Spring Mail
 * (typically free Gmail App Password on smtp.gmail.com).
 *
 * <p>Always sends {@code multipart/alternative} (plain + branded HTML). File
 * attachments use mixed multipart; the DOST logo is inlined via CID.
 */
@Service
public class TransactionalMailService {

    private static final Logger log = LoggerFactory.getLogger(TransactionalMailService.class);

    /** Practical per-attachment cap under Gmail's ~25 MB message limit. */
    public static final long MAX_ATTACHMENT_BYTES = 20L * 1024 * 1024;

    private final JavaMailSender mailSender;
    private final AisetupProperties properties;

    public TransactionalMailService(JavaMailSender mailSender, AisetupProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    public boolean isConfigured() {
        return properties.getMail().isConfigured();
    }

    /**
     * Send branded mail: plain text body plus HTML layout wrapping the same
     * content (or a custom HTML inner document when {@code htmlBody} is set).
     *
     * @param htmlBody full HTML document, or {@code null} to wrap {@code body} via {@link MailHtmlLayout#wrapPlainText}
     */
    public void sendText(
            Collection<String> to,
            Collection<String> cc,
            String subject,
            String body,
            List<MailAttachment> attachments) {
        send(to, cc, subject, body, null, attachments);
    }

    /**
     * @param htmlBody full HTML document when non-null; otherwise plain {@code body} is wrapped
     */
    public void send(
            Collection<String> to,
            Collection<String> cc,
            String subject,
            String body,
            String htmlBody,
            List<MailAttachment> attachments) {
        if (!isConfigured()) {
            throw new IllegalStateException(
                    "Email is not configured (set SMTP_USERNAME / SMTP_PASSWORD)");
        }
        List<String> toList = sanitizeAddresses(to);
        if (toList.isEmpty()) {
            throw new IllegalArgumentException("At least one recipient (to) is required");
        }
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("Subject is required");
        }
        if (body == null || body.isBlank()) {
            throw new IllegalArgumentException("Body is required");
        }
        String html =
                htmlBody != null && !htmlBody.isBlank()
                        ? htmlBody
                        : MailHtmlLayout.wrapPlainText(body);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // Always multipart: alternative (plain+html) and optional file attachments / inline logo.
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(resolveFrom());
            helper.setTo(toList.toArray(String[]::new));
            List<String> ccList = sanitizeAddresses(cc);
            if (!ccList.isEmpty()) {
                helper.setCc(ccList.toArray(String[]::new));
            }
            helper.setSubject(subject.trim());
            helper.setText(body, html);
            attachInlineLogo(helper);
            if (attachments != null) {
                for (MailAttachment attachment : attachments) {
                    if (attachment == null || attachment.content() == null) {
                        continue;
                    }
                    String name =
                            attachment.fileName() != null && !attachment.fileName().isBlank()
                                    ? attachment.fileName()
                                    : "attachment.bin";
                    String type =
                            attachment.contentType() != null && !attachment.contentType().isBlank()
                                    ? attachment.contentType()
                                    : "application/octet-stream";
                    helper.addAttachment(
                            name,
                            new org.springframework.core.io.ByteArrayResource(attachment.content()),
                            type);
                }
            }
            mailSender.send(message);
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Failed to send mail to {}: {}", toList, e.getMessage());
            throw new IllegalStateException("Failed to send email. Please try again.", e);
        }
    }

    private static void attachInlineLogo(MimeMessageHelper helper) {
        try {
            ClassPathResource logo = new ClassPathResource("mail/dost-logo-horizontal-light.png");
            if (!logo.exists()) {
                log.warn("Mail logo resource missing: mail/dost-logo-horizontal-light.png");
                return;
            }
            // ByteArrayResource avoids ClassPathResource stream issues with some SMTP clients.
            byte[] bytes = logo.getContentAsByteArray();
            helper.addInline(
                    MailHtmlLayout.LOGO_CID,
                    new org.springframework.core.io.ByteArrayResource(bytes) {
                        @Override
                        public String getFilename() {
                            return "dost-logo-horizontal-light.png";
                        }
                    },
                    "image/png");
        } catch (Exception e) {
            log.warn("Could not attach inline mail logo: {}", e.getMessage());
        }
    }

    private String resolveFrom() {
        String from = properties.getMail().getFrom();
        if (from == null || from.isBlank()) {
            from = properties.getMail().getUsername();
        }
        return from;
    }

    private static List<String> sanitizeAddresses(Collection<String> addresses) {
        if (addresses == null) {
            return List.of();
        }
        return addresses.stream()
                .filter(a -> a != null && !a.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
    }
}
