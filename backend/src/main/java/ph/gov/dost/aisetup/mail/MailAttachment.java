/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.mail;

/** In-memory attachment ready for JavaMail. */
public record MailAttachment(String fileName, String contentType, byte[] content) {}
