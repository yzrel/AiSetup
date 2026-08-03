/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.mail.dto;

/**
 * Attachment for {@link MailSendRequest}. Prefer {@code fileId} (loaded from upload storage).
 * Optional {@code contentBase64} is used when the file exists only in the browser.
 */
public class MailAttachmentRequest {

    private String fileName;
    private String mimeType;
    private String fileId;
    /** Base64 without data-URL prefix (or full data URL — stripped server-side). */
    private String contentBase64;

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public String getFileId() {
        return fileId;
    }

    public void setFileId(String fileId) {
        this.fileId = fileId;
    }

    public String getContentBase64() {
        return contentBase64;
    }

    public void setContentBase64(String contentBase64) {
        this.contentBase64 = contentBase64;
    }
}
