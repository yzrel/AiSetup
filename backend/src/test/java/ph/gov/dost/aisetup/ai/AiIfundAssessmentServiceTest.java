/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ph.gov.dost.aisetup.ai.dto.AiIfundAssessmentRequest;
import ph.gov.dost.aisetup.ai.dto.AiIfundAssessmentResponse;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AiIfundAssessmentServiceTest {

    private AiIfundAssessmentService service;

    @BeforeEach
    void setUp() {
        AiGateway gateway = mock(AiGateway.class);
        when(gateway.generateJsonObject(any(AiTaskTier.class), anyString(), anyInt()))
                .thenThrow(new IllegalStateException("no key"));
        service = new AiIfundAssessmentService(gateway, new ObjectMapper());
    }

    @Test
    void templateFallbackUsesRequestedAmountAndMediumOrHighRisk() {
        AiIfundAssessmentRequest request = new AiIfundAssessmentRequest();
        Map<String, Object> ctx = new HashMap<>();
        ctx.put("amountRequested", "₱1,800,000");
        ctx.put("commitmentAmount", "₱1,800,000");
        ctx.put("financialAnalysis", "Adequate liquidity for refund.");
        ctx.put("financialProjection", Map.of("npv", 100000));
        request.setContext(ctx);

        AiIfundAssessmentResponse res = service.assess(request);
        assertFalse(res.isAiGenerated());
        assertEquals("₱1,800,000", res.getProposedAmount());
        assertTrue(List.of("MEDIUM", "HIGH").contains(res.getRefundRisk()));
        assertTrue(res.getAuthorityBand().contains("Regional Director"));
        assertTrue(res.getRationale().toLowerCase().contains("encoded"));
        assertFalse(res.getSourcesPresent().isEmpty());
        assertTrue(res.getSourcesPresent().stream().anyMatch(s -> s.contains("amount requested")));
    }

    @Test
    void resolveRequestedPrefersAmountRequestedOverCommitment() {
        Map<String, Object> ctx = new HashMap<>();
        ctx.put("amountRequested", "2000000");
        ctx.put("commitmentAmount", "1500000");
        assertEquals("2000000", AiIfundAssessmentService.resolveRequestedAmount(ctx));
    }

    @Test
    void clampDoesNotExceedRequestedWithoutStrongCostBasis() {
        AiIfundAssessmentService.SourceLists thin = new AiIfundAssessmentService.SourceLists(
                List.of("Form 001 amount requested"),
                List.of("Form 001 budget line items"));
        String clamped = AiIfundAssessmentService.clampToRequestedWhenUnsupported(
                "3000000", "2000000", thin);
        assertEquals("2000000", clamped);
    }

    @Test
    void authorityBandsMatchGuidelines30() {
        assertTrue(AiIfundAssessmentService.authorityBandFor(4_999_999).contains("Regional Director"));
        assertTrue(AiIfundAssessmentService.authorityBandFor(5_000_001).contains("Undersecretary"));
        assertTrue(AiIfundAssessmentService.authorityBandFor(10_000_001).contains("EXECOM"));
    }

    @Test
    void normalizeRiskAcceptsOnlyLowMediumHigh() {
        assertEquals("LOW", AiIfundAssessmentService.normalizeRisk("low"));
        assertEquals("MEDIUM", AiIfundAssessmentService.normalizeRisk("Medium"));
        assertNull(AiIfundAssessmentService.normalizeRisk("severe"));
    }
}
