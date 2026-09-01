/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.mail;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class MailHtmlLayoutTest {

    @Test
    void escapeEncodesHtmlSpecialCharacters() {
        assertTrue(MailHtmlLayout.escape("<script>alert(\"x\")</script>&").contains("&lt;script&gt;"));
        assertFalse(MailHtmlLayout.escape("<b>hi</b>").contains("<b>"));
    }

    @Test
    void plainTextToHtmlUsesParagraphsAndBreaks() {
        String html = MailHtmlLayout.plainTextToHtml("Hello\nthere\n\nSecond block");
        assertTrue(html.contains("<p"));
        assertTrue(html.contains("<br>"));
        assertTrue(html.contains("Hello"));
        assertTrue(html.contains("Second block"));
        assertFalse(html.contains("<script"));
    }

    @Test
    void wrapIncludesBrandingAndCidLogo() {
        String doc = MailHtmlLayout.wrap("<p>Inner content</p>");
        assertTrue(doc.contains("AiSETUP"));
        assertTrue(doc.contains("DOST SOCCSKSARGEN"));
        assertTrue(doc.contains("cid:" + MailHtmlLayout.LOGO_CID));
        assertTrue(doc.contains("Inner content"));
        assertTrue(doc.contains("records@region12.dost.gov.ph"));
        assertTrue(doc.contains("background-color:#0C2461"));
        assertTrue(doc.contains("#1B2A4E"));
        assertTrue(doc.contains("border-bottom:3px solid #00AEEF"));
    }

    @Test
    void wrapPlainTextEscapesInjectedMarkup() {
        String doc = MailHtmlLayout.wrapPlainText("Hi <img src=x onerror=alert(1)>");
        assertFalse(doc.contains("<img src=x"));
        assertTrue(doc.contains("&lt;img"));
    }

    @Test
    void wrapOtpIncludesCodeAndExpiry() {
        String doc = MailHtmlLayout.wrapOtp("123456");
        assertTrue(doc.contains("123456"));
        assertTrue(doc.contains("10 minutes"));
        assertTrue(doc.contains("verification code"));
        assertTrue(doc.contains("cid:" + MailHtmlLayout.LOGO_CID));
    }
}
