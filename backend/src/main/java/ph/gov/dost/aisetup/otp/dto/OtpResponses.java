/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.otp.dto;

import java.util.LinkedHashMap;
import java.util.Map;

public final class OtpResponses {

    private OtpResponses() {}

    public static Map<String, Object> sendResult(boolean delivered, boolean demo, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", true);
        body.put("delivered", delivered);
        body.put("demo", demo);
        if (message != null && !message.isBlank()) {
            body.put("message", message);
        }
        return body;
    }

    public static Map<String, Object> verifyResult(boolean verified) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("verified", verified);
        return body;
    }
}
