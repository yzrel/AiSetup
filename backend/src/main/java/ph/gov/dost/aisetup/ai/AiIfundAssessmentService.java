/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.ai.dto.AiIfundAssessmentRequest;
import ph.gov.dost.aisetup.ai.dto.AiIfundAssessmentResponse;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Staff-only iFund amount + refund-risk assessment grounded in encoded cooperator
 * financial fields (Guidelines 3.0). Does not OCR uploaded FS PDFs.
 */
@Service
public class AiIfundAssessmentService {

    private static final Logger log = LoggerFactory.getLogger(AiIfundAssessmentService.class);
    private static final int MAX_TOKENS = 1024;

    private static final List<SourceSpec> SOURCE_SPECS = List.of(
            new SourceSpec("loiRequest", "LOI request / commitment amount", "commitmentAmount"),
            new SourceSpec("amountRequested", "Form 001 amount requested", "amountRequested"),
            new SourceSpec("budgetItems", "Form 001 budget line items", "budgetItems"),
            new SourceSpec("financialAnalysis", "Form 001 financial analysis", "financialAnalysis"),
            new SourceSpec("partialBudgetAnalysis", "Form 001 partial budget analysis", "partialBudgetAnalysis"),
            new SourceSpec("refundSchedule", "Form 001 refund schedule", "refundSchedule"),
            new SourceSpec("financialProjection", "Financial projection snapshot", "financialProjection"),
            new SourceSpec("tnaEquipment", "TNA Form 02 recommended equipment costs", "tnaEquipmentCosts"),
            new SourceSpec("fsUpload", "Historical FS upload present", "financialStatementsUploaded"),
            new SourceSpec("projectedFsUpload", "Projected FS upload present", "projectedFinancialStatementsUploaded")
    );

    private final AiGateway aiGateway;
    private final ObjectMapper objectMapper;

    public AiIfundAssessmentService(AiGateway aiGateway, ObjectMapper objectMapper) {
        this.aiGateway = aiGateway;
        this.objectMapper = objectMapper;
    }

    public AiIfundAssessmentResponse assess(AiIfundAssessmentRequest request) {
        Map<String, Object> context = request.getContext() != null ? request.getContext() : Map.of();
        SourceLists sources = classifySources(context);
        String requested = resolveRequestedAmount(context);

        try {
            JsonNode ai = aiGateway.generateJsonObject(
                    AiTaskTier.COMPLEX, buildPrompt(context, sources, requested), MAX_TOKENS);
            AiIfundAssessmentResponse parsed = parseAi(ai, requested, sources);
            if (parsed != null) {
                return parsed;
            }
        } catch (Exception e) {
            log.warn("AI iFund assessment failed: {}", e.getMessage());
        }

        return templateFallback(requested, sources);
    }

    private String buildPrompt(Map<String, Object> context, SourceLists sources, String requested) {
        String contextJson;
        try {
            contextJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(context);
        } catch (Exception e) {
            contextJson = String.valueOf(context);
        }
        contextJson = contextJson.replace("%", "%%");

        return """
                You are a DOST Region XII SETUP RTEC financial assessor under SETUP Guidelines (Revision 3.0).

                Propose a SETUP Innovation-Enabling Fund (iFund) amount and a refund-risk rating for staff review.

                Policy facts (Guidelines 3.0):
                - iFund size follows the approved proposal, projected cash flow, and capacity to refund — not fixed Micro/Small/Medium peso caps.
                - Eligible uses: S&T interventions (technology acquisition, packaging/labeling, shop-floor R&D, ICT tools, training/consultancy). Not routine working capital.
                - Approval authority bands: ≤₱5,000,000 Regional Director; >₱5M up to ₱10M Undersecretary for Regional Operations; >₱10M DOST EXECOM.
                - Refund is typically 3 or 5 years after Phase I; release requires post-dated checks covering total iFund.

                Hard rules:
                - Ground every figure in the encoded cooperator financial fields below. Do NOT invent peso amounts.
                - Do NOT claim to have read scanned FS PDFs; uploads are presence flags only.
                - proposedAmount must not exceed the requested SETUP share (amountRequested / commitmentAmount / sum of SETUP budget shares) unless equipment/budget totals in the data clearly support a higher figure — prefer recommending at or below the requested amount when refund capacity looks weak.
                - refundRisk must be exactly one of: LOW, MEDIUM, HIGH (refund point of view).
                - authorityBand must state which approving authority band the proposed amount falls into.
                - Rationale must say the proposal is based on financial document fields encoded by the cooperator.

                Resolved requested SETUP amount (peso string): %s
                Sources present: %s
                Sources missing: %s

                Encoded cooperator data (JSON):
                %s

                Return ONLY valid JSON with no markdown fences:
                {
                  "proposedAmount": "₱1,234,567.00 or plain digits",
                  "refundRisk": "LOW|MEDIUM|HIGH",
                  "authorityBand": "…",
                  "rationale": "2-5 sentences"
                }
                """.formatted(
                requested.isBlank() ? "(not provided)" : requested,
                String.join("; ", sources.present()),
                String.join("; ", sources.missing()),
                contextJson);
    }

    private AiIfundAssessmentResponse parseAi(JsonNode ai, String requested, SourceLists sources) {
        if (ai == null || !ai.isObject()) return null;
        String proposed = ai.path("proposedAmount").asText("").trim();
        String risk = normalizeRisk(ai.path("refundRisk").asText(""));
        String band = ai.path("authorityBand").asText("").trim();
        String rationale = ai.path("rationale").asText("").trim();
        if (proposed.isBlank() || risk == null || rationale.isBlank()) {
            return null;
        }
        proposed = clampToRequestedWhenUnsupported(proposed, requested, sources);
        if (band.isBlank()) {
            band = authorityBandFor(parseMoney(proposed));
        }
        AiIfundAssessmentResponse res = new AiIfundAssessmentResponse();
        res.setProposedAmount(proposed);
        res.setRefundRisk(risk);
        res.setAuthorityBand(band);
        res.setRationale(rationale);
        res.setSourcesPresent(sources.present());
        res.setSourcesMissing(sources.missing());
        res.setAiGenerated(true);
        return res;
    }

    AiIfundAssessmentResponse templateFallback(String requested, SourceLists sources) {
        String amount = requested.isBlank() ? "" : requested;
        double n = parseMoney(amount);
        AiIfundAssessmentResponse res = new AiIfundAssessmentResponse();
        res.setProposedAmount(amount.isBlank() ? "" : amount);
        res.setRefundRisk(sources.present().size() >= 4 ? "MEDIUM" : "HIGH");
        res.setAuthorityBand(authorityBandFor(n));
        res.setRationale(
                "Template assessment (AI unavailable): proposed amount mirrors the cooperator's encoded requested SETUP share. "
                        + "This is based on financial document fields encoded by the cooperator, not a scan of uploaded FS PDFs and not a guideline peso cap. "
                        + (sources.missing().isEmpty()
                        ? "Encoded financial sources look reasonably complete; staff should still verify refund capacity."
                        : "Some encoded financial sources are missing (" + String.join(", ", sources.missing())
                        + "); treat refund capacity as uncertain until those fields are complete."));
        res.setSourcesPresent(sources.present());
        res.setSourcesMissing(sources.missing());
        res.setAiGenerated(false);
        return res;
    }

    /** Visible for tests. */
    static String authorityBandFor(double amount) {
        if (amount <= 0) {
            return "Undetermined — amount not encoded";
        }
        if (amount <= 5_000_000d) {
            return "≤₱5,000,000 — Regional Director";
        }
        if (amount <= 10_000_000d) {
            return ">₱5,000,000 up to ₱10,000,000 — Undersecretary for Regional Operations";
        }
        return ">₱10,000,000 — DOST EXECOM";
    }

    static String normalizeRisk(String raw) {
        if (raw == null) return null;
        String u = raw.trim().toUpperCase(Locale.ROOT);
        if (u.equals("LOW") || u.equals("MEDIUM") || u.equals("HIGH")) return u;
        return null;
    }

    static double parseMoney(String raw) {
        if (raw == null || raw.isBlank()) return 0d;
        String digits = raw.replaceAll("[^0-9.]", "");
        if (digits.isBlank()) return 0d;
        try {
            return Double.parseDouble(digits);
        } catch (NumberFormatException e) {
            return 0d;
        }
    }

    static String resolveRequestedAmount(Map<String, Object> context) {
        String amountRequested = str(context.get("amountRequested"));
        if (!amountRequested.isBlank()) return amountRequested;
        String commitment = str(context.get("commitmentAmount"));
        if (!commitment.isBlank()) return commitment;
        String budget = str(context.get("budget"));
        if (!budget.isBlank()) return budget;
        Object items = context.get("budgetItems");
        if (items instanceof List<?> list && !list.isEmpty()) {
            double sum = 0d;
            for (Object row : list) {
                if (row instanceof Map<?, ?> map) {
                    sum += parseMoney(str(map.get("setupShare")));
                }
            }
            if (sum > 0) {
                return String.format(Locale.US, "%.2f", sum);
            }
        }
        return "";
    }

    static SourceLists classifySources(Map<String, Object> context) {
        List<String> present = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        for (SourceSpec spec : SOURCE_SPECS) {
            if (isPresent(context.get(spec.contextKey()))) {
                present.add(spec.label());
            } else {
                missing.add(spec.label());
            }
        }
        return new SourceLists(present, missing);
    }

    private static boolean isPresent(Object value) {
        if (value == null) return false;
        if (value instanceof Boolean b) return b;
        if (value instanceof String s) return !s.isBlank();
        if (value instanceof Number n) return n.doubleValue() != 0d;
        if (value instanceof List<?> list) return !list.isEmpty();
        if (value instanceof Map<?, ?> map) return !map.isEmpty();
        return true;
    }

    private static String str(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    /**
     * If equipment/budget totals are thin, do not allow AI to propose above the requested amount.
     */
    static String clampToRequestedWhenUnsupported(String proposed, String requested, SourceLists sources) {
        double p = parseMoney(proposed);
        double r = parseMoney(requested);
        if (r <= 0 || p <= 0 || p <= r) return proposed;
        boolean hasStrongCostBasis = sources.present().stream().anyMatch(s ->
                s.contains("budget line") || s.contains("equipment") || s.contains("Financial projection"));
        if (hasStrongCostBasis) return proposed;
        return requested;
    }

    record SourceSpec(String id, String label, String contextKey) {}

    record SourceLists(List<String> present, List<String> missing) {}
}
