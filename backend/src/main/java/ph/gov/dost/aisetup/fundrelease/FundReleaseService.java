/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.fundrelease;

import java.time.Instant;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class FundReleaseService {

    public Map<String, Object> authorityLetter(String applicationId, Map<String, Object> payload) {
        String holder = String.valueOf(payload.getOrDefault("accountHolder", "Account Holder"));
        String enterprise = String.valueOf(payload.getOrDefault("enterpriseName", "Enterprise"));
        String project = String.valueOf(payload.getOrDefault("projectTitle", "SETUP Project"));
        String amount = String.valueOf(payload.getOrDefault("approvedAmount", "₱0"));
        String html = """
                <html><body style='font-family:Georgia,serif;font-size:12px;line-height:1.6'>
                <h2 style='text-align:center'>AUTHORITY TO WITHDRAW — SETUP FUND</h2>
                <p><strong>Application:</strong> %s</p>
                <p>This authorizes <strong>%s</strong> of <strong>%s</strong> to withdraw SETUP funds for
                project <strong>%s</strong> in the amount of <strong>%s</strong>.</p>
                </body></html>
                """.formatted(applicationId, holder, enterprise, project, amount);
        return Map.of(
                "applicationId", applicationId,
                "documentType", "authority-letter",
                "generatedAt", Instant.now().toString(),
                "status", "ready",
                "html", html);
    }

    public Map<String, Object> refundSchedule(String applicationId, Map<String, Object> payload) {
        return Map.of(
                "applicationId", applicationId,
                "documentType", "refund-schedule",
                "generatedAt", Instant.now().toString(),
                "status", "ready",
                "termYears", payload.getOrDefault("termYears", 5),
                "pdcCount", payload.getOrDefault("pdcCount", 0),
                "technologyTransferFee", payload.getOrDefault("technologyTransferFee", "0"),
                "graceMonths", 12);
    }

    public Map<String, Object> lbpIntroduction(Map<String, Object> payload) {
        Object applicationId = payload.getOrDefault("applicationId", "unknown");
        return Map.of(
                "applicationId", applicationId,
                "documentType", "lbp-introduction",
                "generatedAt", Instant.now().toString(),
                "status", "ready",
                "recipient", payload.getOrDefault("branchManager", "Land Bank Branch Manager"),
                "enterpriseName", payload.getOrDefault("enterpriseName", ""));
    }
}
