/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "notifications")
public class NotificationEntity {

    @Id
    private String id;

    @Column(nullable = false, length = 32)
    private String audience;

    @Column(name = "applicant_id")
    private String applicantId;

    @Column(name = "office_id", length = 128)
    private String officeId;

    @Column(nullable = false, length = 32)
    private String kind;

    @Column(nullable = false, length = 512)
    private String title;

    /** Integer.MAX_VALUE → LONGTEXT (MySQL) / CLOB (H2), matching Flyway vendor scripts. */
    @Column(nullable = false, length = Integer.MAX_VALUE)
    private String message;

    @Column(name = "view_key", length = 128)
    private String viewKey;

    @Column(name = "read_flag", nullable = false)
    private boolean readFlag;

    @Column(nullable = false)
    private boolean urgent;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAudience() {
        return audience;
    }

    public void setAudience(String audience) {
        this.audience = audience;
    }

    public String getApplicantId() {
        return applicantId;
    }

    public void setApplicantId(String applicantId) {
        this.applicantId = applicantId;
    }

    public String getOfficeId() {
        return officeId;
    }

    public void setOfficeId(String officeId) {
        this.officeId = officeId;
    }

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getViewKey() {
        return viewKey;
    }

    public void setViewKey(String viewKey) {
        this.viewKey = viewKey;
    }

    public boolean isReadFlag() {
        return readFlag;
    }

    public void setReadFlag(boolean readFlag) {
        this.readFlag = readFlag;
    }

    public boolean isUrgent() {
        return urgent;
    }

    public void setUrgent(boolean urgent) {
        this.urgent = urgent;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
