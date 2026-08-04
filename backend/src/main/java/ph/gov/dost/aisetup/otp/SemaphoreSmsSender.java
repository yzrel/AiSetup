/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.otp;

import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import ph.gov.dost.aisetup.config.AisetupProperties;

@Service
public class SemaphoreSmsSender {

    private static final Logger log = LoggerFactory.getLogger(SemaphoreSmsSender.class);
    private static final String SEMAPHORE_URL = "https://api.semaphore.co/api/v4/messages";

    private final AisetupProperties properties;
    private final RestClient restClient;

    public SemaphoreSmsSender(AisetupProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(java.time.Duration.ofSeconds(5));
        requestFactory.setReadTimeout(java.time.Duration.ofSeconds(30));
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    public boolean isConfigured() {
        return properties.getSms().isConfigured();
    }

    /**
     * Normalizes Philippine mobiles to 09XXXXXXXXX (11 digits). Accepts 09xx, +639xx, 639xx.
     */
    public static String normalizePhMobile(String raw) {
        if (raw == null) {
            return "";
        }
        String digits = raw.replaceAll("[^0-9+]", "");
        if (digits.startsWith("+")) {
            digits = digits.substring(1);
        }
        if (digits.startsWith("63") && digits.length() == 12) {
            digits = "0" + digits.substring(2);
        }
        return digits;
    }

    public static boolean isValidPhMobile(String normalized) {
        return normalized != null && normalized.matches("^09\\d{9}$");
    }

    public void send(String phone, String code) {
        if (!isConfigured()) {
            throw new IllegalStateException("SMS OTP is not configured (set SEMAPHORE_API_KEY)");
        }
        String number = normalizePhMobile(phone);
        if (!isValidPhMobile(number)) {
            throw new IllegalArgumentException(
                    "Enter a valid Philippine mobile number (e.g. 09171234567)");
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("apikey", properties.getSms().getApiKey());
        body.put("number", number);
        body.put(
                "message",
                "Your DOST SOCCSKSARGEN aiSETUP verification code is " + code
                        + ". Valid for 10 minutes.");
        String sender = properties.getSms().getSenderName();
        if (sender != null && !sender.isBlank()) {
            body.put("sendername", sender);
        }
        try {
            restClient
                    .post()
                    .uri(SEMAPHORE_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Semaphore SMS failed for {}: {}", number, e.getMessage());
            throw new IllegalStateException("Failed to send verification SMS. Please try again.", e);
        }
    }
}
