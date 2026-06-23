/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.fundrelease;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/fund-release")
public class FundReleaseController {

    private final FundReleaseService fundReleaseService;

    public FundReleaseController(FundReleaseService fundReleaseService) {
        this.fundReleaseService = fundReleaseService;
    }

    @GetMapping("/authority-letter/{applicationId}")
    public ResponseEntity<Map<String, Object>> authorityLetter(@PathVariable String applicationId) {
        return ResponseEntity.ok(fundReleaseService.authorityLetter(applicationId, Map.of()));
    }

    @PostMapping("/authority-letter/{applicationId}")
    public ResponseEntity<Map<String, Object>> authorityLetterGenerate(
            @PathVariable String applicationId,
            @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(fundReleaseService.authorityLetter(applicationId, payload));
    }

    @GetMapping("/refund-schedule/{applicationId}")
    public ResponseEntity<Map<String, Object>> refundSchedule(@PathVariable String applicationId) {
        return ResponseEntity.ok(fundReleaseService.refundSchedule(applicationId, Map.of()));
    }

    @PostMapping("/refund-schedule/{applicationId}")
    public ResponseEntity<Map<String, Object>> refundScheduleGenerate(
            @PathVariable String applicationId,
            @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(fundReleaseService.refundSchedule(applicationId, payload));
    }

    @PostMapping("/lbp-introduction/generate")
    public ResponseEntity<Map<String, Object>> lbpIntroductionGenerate(
            @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(fundReleaseService.lbpIntroduction(payload));
    }
}
