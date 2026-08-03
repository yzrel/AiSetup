/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.mail;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import ph.gov.dost.aisetup.auth.UserAccount;
import ph.gov.dost.aisetup.auth.UserPrincipal;
import ph.gov.dost.aisetup.files.FileUploadService;
import ph.gov.dost.aisetup.mail.dto.MailAttachmentRequest;
import ph.gov.dost.aisetup.mail.dto.MailSendRequest;

class MailSendServiceTest {

    private TransactionalMailService mailService;
    private FileUploadService fileUploadService;
    private MailSendService sendService;

    @BeforeEach
    void setUp() {
        mailService = mock(TransactionalMailService.class);
        fileUploadService = mock(FileUploadService.class);
        sendService = new MailSendService(mailService, fileUploadService);
        when(mailService.isConfigured()).thenReturn(true);
        doNothing()
                .when(mailService)
                .sendText(anyList(), anyList(), anyString(), anyString(), anyList());

        UserAccount account = new UserAccount();
        account.setId("u1");
        account.setEmail("staff@dost.gov.ph");
        account.setPasswordHash("hash");
        account.setRole("admin");
        account.setEnabled(true);
        account.setOfficeId("regional");
        UserPrincipal principal = new UserPrincipal(account);
        SecurityContextHolder.getContext()
                .setAuthentication(
                        new UsernamePasswordAuthenticationToken(
                                principal, null, principal.getAuthorities()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void refusesWhenSmtpNotConfigured() {
        when(mailService.isConfigured()).thenReturn(false);
        MailSendRequest req = baseRequest();
        IllegalStateException ex =
                assertThrows(IllegalStateException.class, () -> sendService.send(req));
        assertTrue(ex.getMessage().contains("SMTP"));
        verify(mailService, never()).sendText(any(), any(), any(), any(), any());
    }

    @Test
    void sendsInlineBase64Attachment() {
        MailSendRequest req = baseRequest();
        MailAttachmentRequest att = new MailAttachmentRequest();
        att.setFileName("note.txt");
        att.setMimeType("text/plain");
        att.setContentBase64(Base64.getEncoder().encodeToString("hello".getBytes()));
        req.setAttachments(List.of(att));

        Map<String, Object> result = sendService.send(req);
        assertEquals(true, result.get("delivered"));
        assertEquals(1, result.get("attachmentCount"));
        verify(mailService)
                .sendText(
                        eq(List.of("client@example.com")),
                        eq(List.of()),
                        eq("Test subject"),
                        eq("Hello body"),
                        anyList());
    }

    @Test
    void requiresApplicantIdWhenFileIdPresent() {
        MailSendRequest req = baseRequest();
        MailAttachmentRequest att = new MailAttachmentRequest();
        att.setFileId("file-1");
        att.setFileName("doc.pdf");
        req.setAttachments(List.of(att));
        req.setApplicantId(null);

        assertThrows(IllegalArgumentException.class, () -> sendService.send(req));
    }

    private static MailSendRequest baseRequest() {
        MailSendRequest req = new MailSendRequest();
        req.setTo(List.of("client@example.com"));
        req.setSubject("Test subject");
        req.setBody("Hello body");
        return req;
    }
}
