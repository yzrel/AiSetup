/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.mail;

/**
 * Shared DOST SOCCSKSARGEN branded HTML shell for outbound transactional mail.
 * Table-based + inline CSS for email-client compatibility.
 */
public final class MailHtmlLayout {

    public static final String LOGO_CID = "dost-logo";
    public static final String LOGO_CLASSPATH = "classpath:mail/dost-logo-horizontal-light.png";

    /** Accent / footer text — dark navy for contrast on light surfaces. */
    private static final String DOST_BLUE = "#1B2A4E";
    /**
     * Header band — matches the baked-in blue of {@code dost-logo-horizontal-light.png}
     * (sampled ~#3F5282) so the logo does not sit in a darker “box”.
     */
    private static final String HEADER_BG = "#3F5282";
    private static final String DOST_LIGHT = "#00AEEF";
    private static final String BODY_TEXT = "#1f2937";
    private static final String MUTED = "#6b7280";

    private static final String OFFICE =
            "DOST Regional Office No. XII";
    private static final String ADDRESS =
            "PNHLSG BLDG., Brgy. Paraiso, Koronadal City, South Cotabato";
    private static final String PHONE = "(083) 826-0114";
    private static final String EMAIL = "records@region12.dost.gov.ph";
    private static final String WEBSITE = "https://www.region12.dost.gov.ph";

    private MailHtmlLayout() {}

    /** Escape HTML special characters. */
    public static String escape(String raw) {
        if (raw == null || raw.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder(raw.length() + 16);
        for (int i = 0; i < raw.length(); i++) {
            char c = raw.charAt(i);
            switch (c) {
                case '&' -> sb.append("&amp;");
                case '<' -> sb.append("&lt;");
                case '>' -> sb.append("&gt;");
                case '"' -> sb.append("&quot;");
                case '\'' -> sb.append("&#39;");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }

    /**
     * Convert plain text to simple HTML paragraphs. Escapes markup; blank-line
     * separated blocks become {@code <p>}; single newlines become {@code <br>}.
     */
    public static String plainTextToHtml(String plain) {
        if (plain == null || plain.isBlank()) {
            return "<p style=\"margin:0 0 16px;color:" + BODY_TEXT + ";font-size:15px;line-height:1.55;\">&nbsp;</p>";
        }
        String normalized = plain.replace("\r\n", "\n").replace('\r', '\n').trim();
        String[] blocks = normalized.split("\n{2,}");
        StringBuilder html = new StringBuilder();
        for (String block : blocks) {
            String escaped = escape(block.trim()).replace("\n", "<br>\n");
            html.append("<p style=\"margin:0 0 16px;color:")
                    .append(BODY_TEXT)
                    .append(";font-size:15px;line-height:1.55;font-family:Arial,Helvetica,sans-serif;\">")
                    .append(escaped)
                    .append("</p>\n");
        }
        return html.toString();
    }

    /** OTP verification content: large code callout + expiry note. */
    public static String otpInnerHtml(String code) {
        String safeCode = escape(code == null ? "" : code.trim());
        return """
                <p style="margin:0 0 20px;color:%s;font-size:15px;line-height:1.55;font-family:Arial,Helvetica,sans-serif;">
                  Your DOST SOCCSKSARGEN aiSETUP verification code is:
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%" style="margin:0 0 20px;">
                  <tr>
                    <td align="center" style="background:#f0f9ff;border:1px solid %s;border-radius:8px;padding:20px 16px;">
                      <span style="font-family:Consolas,'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:0.28em;color:%s;">%s</span>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 12px;color:%s;font-size:14px;line-height:1.55;font-family:Arial,Helvetica,sans-serif;">
                  This code expires in <strong>10 minutes</strong>.
                </p>
                <p style="margin:0;color:%s;font-size:13px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
                  If you did not request this, you can ignore this email.
                </p>
                """
                .formatted(BODY_TEXT, DOST_LIGHT, DOST_BLUE, safeCode, BODY_TEXT, MUTED);
    }

    /** Wrap inner HTML (already safe/escaped as needed) in the branded shell. */
    public static String wrap(String htmlInner) {
        String inner =
                htmlInner == null || htmlInner.isBlank()
                        ? "<p style=\"margin:0;color:" + MUTED + ";\">&nbsp;</p>"
                        : htmlInner;
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>aiSETUP — DOST SOCCSKSARGEN</title>
                </head>
                <body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%" style="background:#eef2f7;padding:24px 12px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
                          <tr>
                            <td style="background-color:%s;padding:20px 24px 18px;text-align:center;border-bottom:3px solid %s;">
                              <img src="cid:%s" alt="Department of Science and Technology" width="420" style="display:block;margin:0 auto 14px;max-width:100%%;height:auto;border:0;">
                              <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.02em;font-family:Arial,Helvetica,sans-serif;">aiSETUP</div>
                              <div style="font-size:12px;color:#ffffff;margin-top:4px;font-weight:600;opacity:0.9;font-family:Arial,Helvetica,sans-serif;">DOST SOCCSKSARGEN</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:28px 24px 20px;background-color:#ffffff;">
                              %s
                            </td>
                          </tr>
                          <tr>
                            <td style="background:#f3f4f6;padding:18px 24px;border-top:1px solid #e5e7eb;">
                              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:%s;font-family:Arial,Helvetica,sans-serif;">%s</p>
                              <p style="margin:0 0 4px;font-size:11px;color:%s;line-height:1.45;font-family:Arial,Helvetica,sans-serif;">%s</p>
                              <p style="margin:0 0 4px;font-size:11px;color:%s;font-family:Arial,Helvetica,sans-serif;">Tel: %s &middot; %s</p>
                              <p style="margin:0;font-size:11px;font-family:Arial,Helvetica,sans-serif;">
                                <a href="%s" style="color:%s;text-decoration:none;">%s</a>
                              </p>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:16px 0 0;font-size:10px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;">
                          This message was sent by aiSETUP — DOST SOCCSKSARGEN (SOCCSKSARGEN).
                        </p>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """
                .formatted(
                        HEADER_BG,
                        DOST_LIGHT,
                        LOGO_CID,
                        inner,
                        DOST_BLUE,
                        OFFICE,
                        MUTED,
                        ADDRESS,
                        MUTED,
                        PHONE,
                        EMAIL,
                        WEBSITE,
                        DOST_LIGHT,
                        WEBSITE.replace("https://", ""));
    }

    /** Full HTML document from a plain-text body. */
    public static String wrapPlainText(String plainBody) {
        return wrap(plainTextToHtml(plainBody));
    }

    /** Full HTML document for an OTP email. */
    public static String wrapOtp(String code) {
        return wrap(otpInnerHtml(code));
    }
}
