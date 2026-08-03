/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.mail.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.ArrayList;
import java.util.List;

public class MailSendRequest {

    @NotEmpty
    private List<String> to = new ArrayList<>();

    private List<String> cc = new ArrayList<>();

    @NotBlank
    private String subject;

    @NotBlank
    private String body;

    /** Required when any attachment uses {@code fileId}. */
    private String applicantId;

    private List<MailAttachmentRequest> attachments = new ArrayList<>();

    public List<String> getTo() {
        return to;
    }

    public void setTo(List<String> to) {
        this.to = to != null ? to : new ArrayList<>();
    }

    public List<String> getCc() {
        return cc;
    }

    public void setCc(List<String> cc) {
        this.cc = cc != null ? cc : new ArrayList<>();
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getApplicantId() {
        return applicantId;
    }

    public void setApplicantId(String applicantId) {
        this.applicantId = applicantId;
    }

    public List<MailAttachmentRequest> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<MailAttachmentRequest> attachments) {
        this.attachments = attachments != null ? attachments : new ArrayList<>();
    }
}
