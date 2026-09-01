/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.mail;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ph.gov.dost.aisetup.auth.SecurityUtils;
import ph.gov.dost.aisetup.files.FileUpload;
import ph.gov.dost.aisetup.files.FileUploadService;
import ph.gov.dost.aisetup.mail.dto.MailAttachmentRequest;
import ph.gov.dost.aisetup.mail.dto.MailSendRequest;

@Service
public class MailSendService {

    private final TransactionalMailService mailService;
    private final FileUploadService fileUploadService;

    public MailSendService(
            TransactionalMailService mailService, FileUploadService fileUploadService) {
        this.mailService = mailService;
        this.fileUploadService = fileUploadService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> send(MailSendRequest request) {
        SecurityUtils.requirePrincipal();
        if (!mailService.isConfigured()) {
            throw new IllegalStateException(
                    "Email delivery is unavailable. Configure SMTP_USERNAME / SMTP_PASSWORD.");
        }

        boolean needsApplicant =
                request.getAttachments() != null
                        && request.getAttachments().stream()
                                .anyMatch(a -> a.getFileId() != null && !a.getFileId().isBlank());
        if (needsApplicant) {
            if (request.getApplicantId() == null || request.getApplicantId().isBlank()) {
                throw new IllegalArgumentException(
                        "applicantId is required when attachments include fileId");
            }
            SecurityUtils.requireCanAccessApplicant(request.getApplicantId());
        } else if (request.getApplicantId() != null && !request.getApplicantId().isBlank()) {
            SecurityUtils.requireCanAccessApplicant(request.getApplicantId());
        }

        StringBuilder body = new StringBuilder(request.getBody() != null ? request.getBody() : "");
        List<MailAttachment> resolved = new ArrayList<>();
        List<String> skipped = new ArrayList<>();

        if (request.getAttachments() != null) {
            for (MailAttachmentRequest att : request.getAttachments()) {
                if (att == null) {
                    continue;
                }
                try {
                    MailAttachment loaded = resolveAttachment(request.getApplicantId(), att);
                    if (loaded == null) {
                        continue;
                    }
                    if (loaded.content().length > TransactionalMailService.MAX_ATTACHMENT_BYTES) {
                        skipped.add(loaded.fileName());
                        continue;
                    }
                    resolved.add(loaded);
                } catch (IllegalArgumentException e) {
                    throw e;
                } catch (Exception e) {
                    String name =
                            att.getFileName() != null && !att.getFileName().isBlank()
                                    ? att.getFileName()
                                    : att.getFileId();
                    skipped.add(name != null ? name : "attachment");
                }
            }
        }

        if (!skipped.isEmpty()) {
            body.append("\n\n---\n");
            body.append(
                    "Note: The following attachment(s) were omitted because they exceed the mail size limit or could not be loaded. ");
            body.append("Download them from the AiSETUP portal instead: ");
            body.append(String.join(", ", skipped));
            body.append(".\n");
        }

        mailService.sendText(
                request.getTo(), request.getCc(), request.getSubject(), body.toString(), resolved);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ok", true);
        result.put("delivered", true);
        result.put("attachmentCount", resolved.size());
        result.put("skippedAttachments", skipped);
        return result;
    }

    private MailAttachment resolveAttachment(String applicantId, MailAttachmentRequest att)
            throws Exception {
        if (att.getFileId() != null && !att.getFileId().isBlank()) {
            FileUpload entity = fileUploadService.requireForDownload(applicantId, att.getFileId());
            byte[] bytes = Files.readAllBytes(Path.of(entity.getStoragePath()));
            String name =
                    att.getFileName() != null && !att.getFileName().isBlank()
                            ? att.getFileName()
                            : entity.getOriginalFilename();
            String type =
                    att.getMimeType() != null && !att.getMimeType().isBlank()
                            ? att.getMimeType()
                            : entity.getContentType();
            return new MailAttachment(name, type, bytes);
        }

        String raw = att.getContentBase64();
        if (raw == null || raw.isBlank()) {
            // Filename-only placeholder — nothing to attach.
            if (att.getFileName() != null && !att.getFileName().isBlank()) {
                return null;
            }
            return null;
        }
        String b64 = raw.trim();
        int comma = b64.indexOf(',');
        if (b64.startsWith("data:") && comma > 0) {
            b64 = b64.substring(comma + 1);
        }
        byte[] bytes = Base64.getDecoder().decode(b64);
        String name =
                att.getFileName() != null && !att.getFileName().isBlank()
                        ? att.getFileName()
                        : "attachment.bin";
        return new MailAttachment(name, att.getMimeType(), bytes);
    }
}
