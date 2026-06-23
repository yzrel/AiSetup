/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.fundrelease;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Stub endpoints for fund release document generation (Modules 11–17).
 * Full PDF generation can be wired when backend persistence is added.
 */
@RestController
@RequestMapping("/fund-release")
public class FundReleaseController {

    @GetMapping("/authority-letter/{applicationId}")
    public ResponseEntity<Map<String, Object>> authorityLetter(@PathVariable String applicationId) {
        return ResponseEntity.ok(Map.of(
                "applicationId", applicationId,
                "documentType", "authority-letter",
                "generatedAt", Instant.now().toString(),
                "status", "ready",
                "message", "Authority letter generation stub — integrate PDF service when backend persistence is available."
        ));
    }

    @GetMapping("/refund-schedule/{applicationId}")
    public ResponseEntity<Map<String, Object>> refundSchedule(@PathVariable String applicationId) {
        return ResponseEntity.ok(Map.of(
                "applicationId", applicationId,
                "documentType", "refund-schedule",
                "generatedAt", Instant.now().toString(),
                "status", "ready",
                "message", "Refund schedule generation stub — integrate PDF service when backend persistence is available."
        ));
    }

    @PostMapping("/lbp-introduction/generate")
    public ResponseEntity<Map<String, Object>> lbpIntroductionGenerate(
            @RequestBody Map<String, Object> payload) {
        Object applicationId = payload.getOrDefault("applicationId", "unknown");
        return ResponseEntity.ok(Map.of(
                "applicationId", applicationId,
                "documentType", "lbp-introduction",
                "generatedAt", Instant.now().toString(),
                "status", "ready",
                "message", "LBP introduction letter generation stub — client-side print is used in the short term."
        ));
    }
}
