/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.ai.dto.AiFieldSuggestionRequest;
import ph.gov.dost.aisetup.ai.dto.AiFieldSuggestionResponse;
import ph.gov.dost.aisetup.common.GadLanguagePolicy;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AiFieldSuggestionService {

    private static final Logger log = LoggerFactory.getLogger(AiFieldSuggestionService.class);
    private static final int SUGGEST_MAX_TOKENS = 2048;

    private final AnthropicClient anthropicClient;
    private final ObjectMapper objectMapper;

    public AiFieldSuggestionService(AnthropicClient anthropicClient, ObjectMapper objectMapper) {
        this.anthropicClient = anthropicClient;
        this.objectMapper = objectMapper;
    }

    private record FieldSpec(String label, String formSection, boolean bullets, String styleNote) {}

    private static final Map<String, Map<String, FieldSpec>> REGISTRY = buildRegistry();

    public AiFieldSuggestionResponse suggest(AiFieldSuggestionRequest request) {
        String module = request.getModule().trim().toLowerCase();
        String field = request.getField().trim();
        Map<String, Object> context = request.getContext() != null ? request.getContext() : Map.of();

        FieldSpec spec = Optional.ofNullable(REGISTRY.get(module))
                .map(m -> m.get(field))
                .orElseThrow(() -> new IllegalArgumentException(
                        "Unknown field: " + module + "." + field));

        AiFieldSuggestionResponse response = new AiFieldSuggestionResponse();
        response.setModule(module);
        response.setField(field);

        String userInstruction = request.getUserInstruction() != null
                ? request.getUserInstruction().trim()
                : "";

        try {
            JsonNode ai = anthropicClient.generateJsonObject(
                    buildPrompt(spec, context, userInstruction), SUGGEST_MAX_TOKENS);
            if (spec.bullets()) {
                List<String> bullets = readBullets(ai);
                if (!bullets.isEmpty()) {
                    response.setBullets(bullets);
                    response.setAiGenerated(true);
                    return response;
                }
            } else {
                String text = readText(ai);
                if (!text.isBlank()) {
                    response.setText(text);
                    response.setAiGenerated(true);
                    return response;
                }
            }
        } catch (Exception e) {
            log.warn("AI field suggestion failed for {}.{}: {}", module, field, e.getMessage());
        }

        applyTemplateFallback(response, spec, context, userInstruction);
        response.setAiGenerated(false);
        return response;
    }

    /** Visible for tests: module → registered field keys. */
    static Map<String, java.util.Set<String>> registeredFieldKeys() {
        Map<String, java.util.Set<String>> out = new LinkedHashMap<>();
        REGISTRY.forEach((module, fields) -> out.put(module, java.util.Set.copyOf(fields.keySet())));
        return out;
    }

    private String buildPrompt(FieldSpec spec, Map<String, Object> context, String userInstruction) {
        String contextJson;
        try {
            contextJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(context);
        } catch (Exception e) {
            contextJson = context.toString();
        }

        String outputShape = spec.bullets()
                ? "{ \"bullets\": [\"...\", \"...\"] }"
                : "{ \"text\": \"...\" }";

        String instructionBlock = "";
        if (userInstruction != null && !userInstruction.isBlank()) {
            // Escape % so String.formatted does not treat user text as format specifiers.
            instructionBlock = ("""

                Additional user instructions (ADDITIVE — do not replace the writing standards, field requirements, or applicant data above):
                - Keep satisfying all SETUP writing standards and the field style note for this section
                - Incorporate the following guidance where it is compatible with applicant data
                - Do not invent unsupported facts, figures, dates, or certifications to satisfy these instructions
                - If any instruction conflicts with SETUP standards or applicant data, follow SETUP standards and applicant data
                """ + userInstruction + "\n").replace("%", "%%");
        }

        // Escape % in context JSON for the same String.formatted safety reason.
        contextJson = contextJson.replace("%", "%%");

        return """
                You are a senior technical writer for the DOST SOCCSKSARGEN SETUP (Small Enterprise Technology Upgrading Program) application process.

                Draft the "%s" content for the "%s" section of an official SETUP application document.

                Writing standards:
                - Professional, direct, and informative tone suitable for government review
                - Ground every statement in the applicant data provided; do not invent financial figures, dates, or certifications
                - Use complete sentences with clear subject-verb structure
                - %s
                - Reference the enterprise name and business sector where appropriate
                - Avoid marketing hype, vague claims, or filler phrases
                - Return a single clean draft only: do not repeat sentences, phrases, or paragraphs
                %s
                %s
                Applicant and module data (JSON):
                %s

                Return ONLY valid JSON with no markdown fences or commentary:
                %s
                """.formatted(
                spec.label(),
                spec.formSection(),
                spec.styleNote(),
                GadLanguagePolicy.WRITING_RULES,
                instructionBlock,
                contextJson,
                outputShape);
    }

    private List<String> readBullets(JsonNode node) {
        List<String> out = new ArrayList<>();
        JsonNode arr = node.path("bullets");
        if (!arr.isArray()) return out;
        for (JsonNode item : arr) {
            String s = item.asText("").trim();
            if (!s.isEmpty()) out.add(s);
        }
        return out;
    }

    private String readText(JsonNode node) {
        return node.path("text").asText("").trim();
    }

    private void applyTemplateFallback(
            AiFieldSuggestionResponse response,
            FieldSpec spec,
            Map<String, Object> ctx,
            String userInstruction) {
        String field = response.getField();
        String enterprise = str(ctx, "enterpriseName", "the enterprise");
        String sector = str(ctx, "businessSector", "manufacturing");
        String nature = str(ctx, "businessNature", "production");
        String msme = str(ctx, "msmeSize", "MSME");
        List<String> instructionProducts = extractProductsFromInstruction(userInstruction);
        String products = mergeProductSeed(ctx, field, instructionProducts);
        String project = projectSeed(ctx, field);
        String outcome = outcomeSeed(ctx, field);

        if ("genderInvolvement".equals(field)) {
            if (wantsBulletList(userInstruction)) {
                response.setText(composeBulletAndStatements(
                        field, userInstruction, enterprise, sector, nature, msme, products, project, outcome));
            } else {
                response.setText(GadLanguagePolicy.involvementTemplate(
                        enterprise,
                        empCount(ctx, "employeesMale"),
                        empCount(ctx, "employeesFemale")));
            }
            return;
        }

        if (spec.bullets()) {
            // Registry bullet fields are already list-shaped; Extra format intents need no change.
            response.setBullets(templateBullets(field, enterprise, sector, nature, products, project, outcome));
        } else if (wantsBulletList(userInstruction)) {
            response.setText(composeBulletAndStatements(
                    field, userInstruction, enterprise, sector, nature, msme, products, project, outcome));
        } else {
            response.setText(templateText(field, enterprise, sector, nature, msme, products, project, outcome));
        }
    }

    private static boolean wantsBulletList(String instruction) {
        if (instruction == null || instruction.isBlank()) return false;
        String s = instruction.toLowerCase();
        return s.contains("bullet")
                || s.contains("list form")
                || s.contains("as a list")
                || s.contains("in list")
                || s.contains("bullet form");
    }

    private static boolean wantsStatements(String instruction) {
        if (instruction == null || instruction.isBlank()) return false;
        String s = instruction.toLowerCase();
        return s.contains("statement")
                || s.contains("narrative")
                || s.contains("paragraph")
                || s.contains("also add");
    }

    /**
     * Bullets first, then optional narrative statements after (never narrative-first when bullets requested).
     */
    private String composeBulletAndStatements(
            String field,
            String userInstruction,
            String enterprise,
            String sector,
            String nature,
            String msme,
            String products,
            String project,
            String outcome) {
        String bullets = bulletFallbackText(field, enterprise, sector, nature, products, project, outcome);
        boolean appendNarrative = "productServices".equals(field) || wantsStatements(userInstruction);
        if (!appendNarrative) {
            return bullets;
        }
        String narrative = templateText(field, enterprise, sector, nature, msme, products, project, outcome);
        if (narrative == null || narrative.isBlank()) {
            return bullets;
        }
        return bullets + "\n\n" + narrative.trim();
    }

    private static String bulletFallbackText(
            String field,
            String enterprise,
            String sector,
            String nature,
            String products,
            String project,
            String outcome) {
        return switch (field) {
            case "productServices" -> toBulletLines(splitListItems(products));
            case "projectDescription" -> toBulletLines(List.of(
                    enterprise + " proposes " + project,
                    "Sector focus: " + sector,
                    "Nature of operations: " + nature,
                    "Target outcome: " + outcome));
            case "expectedOutcome" -> toBulletLines(List.of(
                    outcome,
                    "Improved delivery and quality for " + products,
                    "Stronger competitiveness in the " + sector + " sector"));
            case "productionPlanNotes" -> toBulletLines(List.of(
                    "Phased installation and commissioning of " + project,
                    "Operator training and SOP updates before acceptance testing",
                    "PSTO Region XII monitoring of key milestones"));
            default -> toBulletLines(List.of(
                    enterprise + " (" + sector + ")",
                    products,
                    project,
                    outcome));
        };
    }

    /** Pull product names from Extra instructions by stripping format phrases, then splitting. */
    static List<String> extractProductsFromInstruction(String instruction) {
        if (instruction == null || instruction.isBlank()) return List.of();
        String cleaned = instruction;
        String[] phrases = {
                "add these products in bullet form",
                "add these products",
                "products offered",
                "also add statements",
                "add statements",
                "in bullet form",
                "bullet form",
                "as a list",
                "list form",
                "in list form",
                "in list",
                "please",
                "bullets",
                "bullet",
                "statements",
                "narrative",
                "paragraph",
                "offered",
        };
        // Longer phrases first (array already ordered).
        for (String phrase : phrases) {
            cleaned = cleaned.replaceAll("(?i)" + java.util.regex.Pattern.quote(phrase), " ");
        }
        cleaned = cleaned.replaceAll("(?i)\\b(add|these|products|form|also)\\b", " ");
        cleaned = cleaned.replaceAll("\\s+", " ").trim();
        if (cleaned.isBlank()) return List.of();
        List<String> items = splitListItems(cleaned).stream()
                .filter(item -> !isInstructionNoise(item))
                .toList();
        // Require at least one concrete item; otherwise fall back to context seed.
        return items;
    }

    private static boolean isInstructionNoise(String item) {
        String s = item.toLowerCase().trim();
        if (s.isEmpty() || s.length() < 2) return true;
        if (s.equals("these") || s.equals("products") || s.equals("form") || s.equals("also") || s.equals("in")) {
            return true;
        }
        return s.contains("offer")
                || s.contains("bullet")
                || s.contains("statement")
                || s.contains("narrative")
                || s.contains("paragraph")
                || s.matches(".*\\b(add|please|list)\\b.*");
    }

    private static List<String> splitListItems(String raw) {
        if (raw == null || raw.isBlank()) return List.of("core products");
        String[] parts = raw.split("[,;\\n]+");
        List<String> items = new ArrayList<>();
        for (String part : parts) {
            String item = part.trim();
            if (!item.isEmpty()) items.add(item);
        }
        return items.isEmpty() ? List.of(raw.trim()) : items;
    }

    private static String toBulletLines(List<String> items) {
        StringBuilder sb = new StringBuilder();
        for (String item : items) {
            String line = item == null ? "" : item.trim();
            if (line.isEmpty()) continue;
            if (line.startsWith("- ")) {
                sb.append(line);
            } else {
                sb.append("- ").append(line);
            }
            sb.append('\n');
        }
        return sb.toString().trim();
    }

    /** Prefer products listed in Extra instructions; else short context seed. */
    private static String mergeProductSeed(Map<String, Object> ctx, String field, List<String> instructionProducts) {
        if (instructionProducts != null && !instructionProducts.isEmpty()) {
            return String.join(", ", instructionProducts);
        }
        return productSeed(ctx, field);
    }

    /** Short product/service seed; never reuse a full productServices narrative when generating that field. */
    private static String productSeed(Map<String, Object> ctx, String field) {
        if ("productServices".equals(field)) {
            String core = str(ctx, "coreProducts", "");
            if (isShortSeed(core)) return core;
            String current = str(ctx, "productServices", "");
            if (isShortSeed(current)) return current;
            return "core products";
        }
        String products = str(ctx, "productServices", str(ctx, "coreProducts", "core products"));
        return sanitizeSeed(products, "core products");
    }

    /** Project seed; never reuse projectDescription narrative when generating that field. */
    private static String projectSeed(Map<String, Object> ctx, String field) {
        if ("projectDescription".equals(field)) {
            return "technology upgrading";
        }
        return sanitizeSeed(str(ctx, "projectDescription", "technology upgrading"), "technology upgrading");
    }

    /** Outcome seed; never reuse expectedOutcome narrative when generating that field. */
    private static String outcomeSeed(Map<String, Object> ctx, String field) {
        if ("expectedOutcome".equals(field)) {
            return "improved productivity and product quality";
        }
        return sanitizeSeed(
                str(ctx, "expectedOutcome", "improved productivity and product quality"),
                "improved productivity and product quality");
    }

    private static final int SEED_MAX_LEN = 120;

    private static boolean isShortSeed(String value) {
        return value != null && !value.isBlank() && !looksLikeAssistNarrative(value) && value.length() <= SEED_MAX_LEN;
    }

    private static String sanitizeSeed(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        if (looksLikeAssistNarrative(value) || value.length() > SEED_MAX_LEN) {
            String clipped = firstPhrase(value, SEED_MAX_LEN);
            if (clipped.isBlank() || looksLikeAssistNarrative(clipped)) return fallback;
            return clipped;
        }
        return value;
    }

    private static boolean looksLikeAssistNarrative(String value) {
        String lower = value.toLowerCase();
        return lower.contains("established quality and service standards")
                || lower.contains("technology upgrading will support")
                || lower.contains("the product or service portfolio reflects")
                || lower.contains("detailed technical specifications and production parameters")
                || lower.contains("through the setup program")
                || lower.contains("upon successful implementation");
    }

    private static String firstPhrase(String value, int max) {
        String trimmed = value.trim();
        int cut = trimmed.length();
        for (String sep : List.of(". ", "; ", ", ")) {
            int i = trimmed.indexOf(sep);
            if (i > 0 && i < cut) cut = i;
        }
        if (cut > max) cut = max;
        String out = trimmed.substring(0, cut).trim();
        // Avoid returning a nested "Enterprise offers Enterprise offers…" opener alone.
        if (out.toLowerCase().contains(" offers ") && out.length() > 60) {
            return fallbackProductFromOffers(out);
        }
        return out;
    }

    private static String fallbackProductFromOffers(String offersClause) {
        String marker = " offers ";
        int idx = offersClause.toLowerCase().indexOf(marker);
        if (idx < 0) return "";
        String after = offersClause.substring(idx + marker.length()).trim();
        int end = after.length();
        for (String sep : List.of(" to customers", " in the ", ". ", "; ")) {
            int i = after.toLowerCase().indexOf(sep.toLowerCase());
            if (i > 0 && i < end) end = i;
        }
        String product = after.substring(0, end).trim();
        return product.length() <= SEED_MAX_LEN ? product : "";
    }

    private static String empCount(Map<String, Object> ctx, String key) {
        String top = str(ctx, key, "");
        if (!top.isBlank()) return top;
        Object form = ctx.get("form");
        if (form instanceof Map<?, ?> map) {
            Object v = map.get(key);
            if (v != null) {
                String s = String.valueOf(v).trim();
                if (!s.isBlank()) return s;
            }
        }
        return "";
    }

    private String templateText(String field, String enterprise, String sector, String nature,
                              String msme, String products, String project, String outcome) {
        return switch (field) {
            case "generalObjective" -> """
                    The general objective of this SETUP project for %s is to acquire and implement appropriate technology that strengthens %s operations in the %s sector, resulting in sustainable productivity gains and improved product quality. The intervention will be implemented in phases with clear milestones, training, and documentation to ensure lasting capability within the enterprise. Success will be measured against agreed baseline indicators and program reporting requirements of PSTO Region XII.""".formatted(
                    enterprise, nature, sector);

            case "skillsExpertise" -> """
                    Management and key staff at %s possess practical experience in %s operations, customer relations, and day-to-day production coordination. Technical skills exist for routine equipment operation, quality checks, and material handling, though advanced process optimization requires further development. The SETUP project includes structured training to upgrade operator and supervisor competency in the new technology. Skills transfer will be documented through updated standard operating procedures and on-the-job coaching during commissioning.""".formatted(
                    enterprise, nature);

            case "compensation" -> """
                    %s provides compensation aligned with prevailing rates for MSME enterprises in its locality, covering wages, statutory benefits, and productivity-linked incentives for production staff. Compensation practices support workforce retention and morale during technology transition. No displacement of workers is contemplated; instead, training will expand employable skills. Payroll records are maintained in accordance with applicable labor regulations.""".formatted(
                    enterprise);

            case "plantSiteNarrative" -> """
                    The plant site of %s is situated to support %s activities with access to utilities, transport, and workforce required for daily operations. Floor layout accommodates material flow from receiving through processing to finished goods storage, with identified space for equipment installation subject to SETUP technical review. Utilities capacity and safety clearances will be verified prior to procurement. The site is suitable for phased implementation without prolonged disruption of essential deliveries.""".formatted(
                    enterprise, nature);

            case "capacityVolumeNarrative" -> """
                    %s currently operates at a production volume consistent with its market share in the %s segment, with capacity constrained by equipment condition and manual bottlenecks. Target volume following technology upgrading will be documented using baseline throughput data collected before installation. Additional capacity is intended to meet documented customer demand without compromising quality. Seasonal or peak-demand scenarios have been considered in sizing the proposed intervention.""".formatted(
                    enterprise, sector);

            case "rawMaterialsNarrative" -> """
                    Key raw materials and inputs for %s are sourced from qualified suppliers with established delivery arrangements and incoming inspection practices. Material specifications are defined to support consistent output quality for %s. Inventory levels balance cost control with protection against supply interruptions. The proposed technology may reduce material waste through improved process control and yield.""".formatted(
                    enterprise, products);

            case "marketSituation" -> """
                    The market for %s in the %s sector reflects steady demand from domestic buyers, with opportunities and pressures shaped by competition and buyer quality expectations. %s positions its offerings on reliability, service, and conformance to specifications. Technology upgrading will support the enterprise's ability to respond to market requirements for consistency and timely delivery. Market trends favor enterprises that can demonstrate process capability and traceability.""".formatted(
                    products, sector, enterprise);

            case "productDemandSupply" -> """
                    Demand for %s remains supported by existing customer contracts and inquiry levels documented by %s. Current supply capability is limited by production bottlenecks and variable process yields that the SETUP project addresses. Post-project supply is projected to align more closely with unmet demand without overextending financial or workforce capacity. Demand and supply assumptions will be revisited during PSTO monitoring visits.""".formatted(
                    products, enterprise);

            case "distributionChannel" -> """
                    %s distributes %s through direct sales, repeat business accounts, and channel partners appropriate to its scale and sector. Logistics and handling practices preserve product integrity through delivery. Strengthened production capability will support more reliable fulfillment across existing channels. Additional market reach will be pursued selectively once quality improvements are demonstrated.""".formatted(
                    enterprise, products);

            case "competitors" -> """
                    Competitors in the %s space include established firms and imports that set price and quality benchmarks for %s. %s differentiates through service responsiveness and relationship with key accounts rather than scale alone. Process upgrading through SETUP is intended to narrow quality and cost gaps relative to stronger competitors. Competitive positioning will be supported by measurable performance improvements.""".formatted(
                    sector, products, enterprise);

            case "productionProcess" -> """
                    Production at %s follows a defined sequence from input preparation through processing, in-process verification, finishing, and release for distribution. Critical control points are identified though some rely on manual judgment where instrumentation is limited. The SETUP intervention targets stages with highest impact on cycle time, yield, and rework. Updated process documentation will reflect revised flows after equipment commissioning.""".formatted(
                    enterprise);

            case "equipmentNarrative" -> """
                    Existing equipment at %s supports current output but includes units that are aging, under-instrumented, or prone to downtime affecting schedule reliability. Maintenance is performed on a preventive and corrective basis within resource constraints. The proposed SETUP package specifies equipment suited to %s requirements with supplier support for installation and training. Legacy equipment will be integrated or phased out as appropriate to the implementation plan.""".formatted(
                    enterprise, nature);

            case "interventionProblem" -> """
                    The primary constraint facing %s is inconsistent process performance that limits throughput, increases rework, and raises unit cost for %s. Manual or obsolete methods at key workstations prevent stable achievement of quality specifications under peak load. These problems directly affect customer satisfaction and the enterprise's ability to pursue growth opportunities. Addressing this constraint is the focus of the proposed SETUP intervention.""".formatted(
                    enterprise, products);

            case "interventionProposed" -> """
                    %s proposes a structured technology intervention comprising equipment acquisition, installation, commissioning, and operator training aligned with SETUP guidelines. Scope includes supplier qualification, acceptance testing, and documentation of standard operating procedures. Implementation will be sequenced to minimize disruption to committed customer deliveries. PSTO Region XII will monitor milestones from procurement through post-project review.""".formatted(
                    enterprise);

            case "interventionImpact" -> """
                    Upon completion, %s expects measurable improvements in productivity, defect rates, and delivery reliability for its %s operations. Financial impact will be tracked through cost-per-unit and capacity utilization compared to pre-project baselines. Workforce skills will be upgraded to sustain benefits beyond the assistance period. These impacts support the enterprise objective: %s.""".formatted(
                    enterprise, nature, outcome);

            case "wasteManagement" -> """
                    %s segregates process waste, recyclables, and general refuse in accordance with local environmental requirements applicable to %s operations. Hazardous or regulated waste streams, if any, are handled per supplier and regulatory guidance. The upgraded process is expected to reduce material waste through improved yield and process control. Waste management practices will be reviewed during site validation and implementation monitoring.""".formatted(
                    enterprise, nature);

            case "financialAnalysis" -> """
                    Financial statements and projections for %s indicate capacity to provide the enterprise counterpart contribution and service SETUP repayment obligations under agreed terms. Liquidity and profitability metrics will be supported by attached documentation in this proposal. Improved operations following technology upgrading are expected to strengthen cash generation over the repayment period. Financial assumptions are conservative and subject to PSTO evaluation.""".formatted(
                    enterprise);

            case "enterpriseBackground" -> """
                    %s is a %s enterprise engaged in %s within the %s sector. The firm has established operations serving domestic and regional markets with %s as its principal product or service line. Management maintains documented production, quality, and administrative processes aligned with industry practice. The enterprise seeks SETUP assistance to strengthen technical capability, improve operational efficiency, and sustain competitiveness through structured technology upgrading.""".formatted(
                    enterprise, msme.toLowerCase(), nature, sector, products);

            case "reasonsForAssistance" -> """
                    %s is requesting DOST SETUP assistance to address documented gaps in production technology, process control, and workforce technical skills that limit capacity and product consistency. Current operations rely on partially manual or aging equipment, resulting in variable output quality and higher rework rates. Upgrading through %s will directly support the enterprise's stated objective: %s. SETUP co-funding will enable acquisition of appropriate technology, structured skills transfer, and measurable productivity gains without compromising financial sustainability.""".formatted(
                    enterprise, project, outcome);

            case "processFlow" -> """
                    The production process at %s begins with receipt and inspection of inputs, followed by preparation and processing stages aligned with %s operations. In-process checks are performed at critical control points before finishing, packaging, and release for distribution. Finished goods are stored under conditions that preserve product integrity prior to delivery to customers. The proposed technology intervention will be integrated at the identified bottleneck stages to shorten cycle time, reduce waste, and improve traceability across the process flow.""".formatted(
                    enterprise, nature);

            case "productionProblemsConcerns" -> """
                    %s has identified recurring production concerns including equipment downtime, inconsistent process parameters, and limited real-time monitoring of critical operations. Material losses and rework stem partly from manual handling and insufficient standard operating procedures for key workstations. Workforce skills gaps affect the enterprise's ability to maintain stable output during peak demand. These constraints directly impact delivery performance, unit cost, and the enterprise's capacity to meet quality expectations in the %s market.""".formatted(
                    enterprise, sector);

            case "marketingProblemsConcerns" -> """
                    %s faces marketing challenges related to product differentiation, limited promotional reach, and dependence on a narrow customer base within the %s value chain. Brand visibility and technical product documentation require strengthening to support business-to-business and institutional buyers. Pricing pressure and import competition necessitate demonstrable quality improvements backed by process upgrades. Addressing production and quality gaps through SETUP will provide a credible basis for expanded market positioning and customer retention.""".formatted(
                    enterprise, sector);

            case "otherConcerns" -> """
                    Beyond production and marketing, %s must align technology investments with regulatory compliance, workplace safety, and environmental responsibilities applicable to its operations. Management requires clear documentation of project implementation, training outcomes, and post-project monitoring to satisfy lender and program reporting requirements. Coordination with PSTO Region XII and the Regional Office will ensure that assistance is phased appropriately relative to enterprise readiness and cash-flow capacity.""".formatted(
                    enterprise);

            case "projectDescription" -> """
                    Through the SETUP Program, %s proposes %s to modernize priority areas of its %s operations. The intervention targets measurable improvements in throughput, product quality, and operational control while preserving employment and local value addition. Implementation will follow a structured work plan with defined milestones, supplier qualification, installation, commissioning, and operator training. Upon completion, the enterprise expects %s, contributing to sustainable growth and enhanced competitiveness.""".formatted(
                    enterprise, project, nature, outcome);

            case "expectedOutcome" -> """
                    Upon successful implementation, %s anticipates improved production efficiency, reduced defect rates, and more reliable delivery performance across its %s line. The enterprise will document baseline and post-project indicators to verify productivity gains and return on technology investment. Enhanced technical capability among production staff will support continuous improvement beyond the project period. These outcomes align with SETUP objectives of strengthening MSME technological readiness and regional economic development.""".formatted(
                    enterprise, products);

            case "productServices" -> """
                    %s offers %s to customers in the %s sector, produced or delivered under established quality and service standards. The product or service portfolio reflects the enterprise's core competencies and market positioning developed over years of operation. Technology upgrading will support consistency of specifications, capacity expansion, and compliance with buyer requirements. Detailed technical specifications and production parameters will be maintained as part of standard quality documentation.""".formatted(
                    enterprise, products, sector);

            case "productionPlanNotes" -> """
                    The production plan for %s schedules phased implementation of equipment installation, trial runs, and full commercial operation in coordination with SETUP monitoring requirements. Raw material sourcing, utilities, and floor layout have been reviewed to accommodate the proposed technology without disrupting essential deliveries during transition. Training and standard operating procedure updates will precede acceptance testing and turnover to production staff. PSTO Region XII will be informed of key milestones per program guidelines.""".formatted(
                    enterprise);

            case "processSummary" -> """
                    Operations at %s follow a defined sequence from input preparation through processing, quality verification, and finished goods handling for the %s sector. Current process documentation identifies stages where cycle time, yield, and rework are most sensitive to equipment condition and operator technique. The recommended technology intervention addresses these stages to stabilize output and reduce non-value-added activity. Post-installation monitoring will compare actual performance against agreed baseline metrics.""".formatted(
                    enterprise, sector);

            case "background" -> """
                    %s is a %s enterprise engaged in %s within the %s sector, with %s as its principal product or service line. The firm maintains active operations and seeks SETUP assistance to address documented technology and productivity gaps. Enterprise background, employment, and assistance rationale are based on TNA Form 01 and supporting registration records. Site validation confirmed operations at the registered production location.""".formatted(
                    enterprise, msme.toLowerCase(), nature, sector, products);

            case "methodology" -> """
                    The assessment of %s was conducted through on-site plant visits, direct observation of workflow and facilities, interviews with the owner and key production staff, and a thorough review of financial, marketing, and operational documents submitted with TNA Form 01. Findings were validated against the Technology Assessment Plan scope covering strategic direction, management, technical, performance, and environmental aspects. Observations and recommendations reflect conditions documented during the assessment period.""".formatted(
                    enterprise);

            default -> """
                    %s is preparing this section as part of its SETUP application for technology upgrading in the %s sector. Content should be read together with supporting forms, financial projections, and PSTO validation records. The enterprise commits to accurate reporting and compliance with program requirements throughout implementation.""".formatted(
                    enterprise, sector);
        };
    }

    private List<String> templateBullets(String field, String enterprise, String sector, String nature,
                                         String products, String project, String outcome) {
        return switch (field) {
            case "expectedOutputBullets", "expectedOutput" -> List.of(
                    "Commissioned technology operating at agreed capacity with documented acceptance test results",
                    "Reduction in process cycle time and material waste compared to pre-project baseline measurements",
                    "Improved product quality consistency verified through sampling or customer acceptance criteria",
                    "Production staff trained and certified on operation, safety, and basic preventive maintenance",
                    "Updated standard operating procedures and production records aligned with upgraded process",
                    "Measurable progress toward: " + truncate(outcome, 120)
            );
            case "specificObjectives" -> List.of(
                    "Acquire and install technology appropriate to " + nature + " operations at " + enterprise,
                    "Achieve measurable productivity and quality improvements within the project implementation period",
                    "Build in-house technical capability through structured training and documentation",
                    "Support enterprise objective: " + truncate(outcome, 100),
                    "Ensure compliance with SETUP reporting, environmental, and safety requirements"
            );
            case "marketStrategies" -> List.of(
                    "Strengthen product positioning for " + truncate(products, 80) + " in target domestic and regional markets",
                    "Develop technical product sheets and quality documentation for B2B and institutional buyers",
                    "Expand customer base beyond current accounts while maintaining service levels",
                    "Align pricing strategy with demonstrated quality improvements post-technology installation",
                    "Participate in trade fairs, PSTO-facilitated linkages, or sector networks as appropriate"
            );
            case "siteValidationFindings" -> List.of(
                    "Enterprise operations confirmed active with management available during site visit",
                    "Production floor layout reviewed for equipment placement and material flow at " + enterprise,
                    "Utilities (power, water, ventilation) assessed as adequate pending final equipment specification",
                    "Occupational safety and housekeeping practices observed with recommendations noted",
                    "Baseline production data collection initiated for post-project comparison",
                    "Management committed to staff training and PSTO monitoring schedule"
            );
            default -> List.of(
                    "Documented improvement aligned with SETUP program objectives for " + enterprise,
                    "Measurable indicator tied to production or quality performance",
                    "Training and procedure updates to sustain technology benefits",
                    "Reporting milestone for PSTO Region XII review"
            );
        };
    }

    private static String str(Map<String, Object> ctx, String key, String fallback) {
        Object v = ctx.get(key);
        if (v == null) return fallback;
        String s = String.valueOf(v).trim();
        return s.isEmpty() ? fallback : s;
    }

    private static String truncate(String s, int max) {
        if (s.length() <= max) return s;
        return s.substring(0, max - 3) + "...";
    }

    private static Map<String, Map<String, FieldSpec>> buildRegistry() {
        Map<String, Map<String, FieldSpec>> reg = new LinkedHashMap<>();

        reg.put("project-proposal", Map.ofEntries(
                entry("generalObjective", "General Objective", "Objectives", false,
                        "Write one clear paragraph (3-4 sentences) stating the overall SETUP project goal."),
                entry("specificObjectives", "Specific Objectives", "Objectives", true,
                        "Provide 5-6 SMART specific objective bullet points."),
                entry("enterpriseBackground", "Brief Enterprise Background", "Company Profile", false,
                        "Write 4-6 complete sentences (minimum 100 words) covering history, operations, products, market, and SETUP readiness."),
                entry("skillsExpertise", "Skills and Expertise", "Management", false,
                        "Write 4-5 sentences on management and workforce skills, training, and technical capability."),
                entry("compensation", "Compensation and Benefits", "Management", false,
                        "Write 3-4 sentences on wage levels, benefits, and incentives aligned with MSME practice."),
                entry("plantSiteNarrative", "Plant Site Description", "Plant & Facilities", false,
                        "Write 4-5 sentences describing plant location, layout, utilities, and suitability for upgrading."),
                entry("capacityVolumeNarrative", "Capacity and Production Volume", "Production Capacity", false,
                        "Write 4-5 sentences on current and target capacity, shifts, and volume trends."),
                entry("rawMaterialsNarrative", "Raw Materials", "Materials", false,
                        "Write 4-5 sentences on key inputs, sourcing, quality control, and supply reliability."),
                entry("marketSituation", "Market Situation", "Market", false,
                        "Write 4-5 sentences on market conditions, demand drivers, and sector trends."),
                entry("productDemandSupply", "Product Demand and Supply", "Market", false,
                        "Write 4-5 sentences balancing demand outlook with current supply capability."),
                entry("distributionChannel", "Distribution Channel", "Market", false,
                        "Write 3-4 sentences on how products reach customers and channel partners."),
                entry("competitors", "Competitors", "Market", false,
                        "Write 3-4 sentences on competitive landscape without unsupported claims."),
                entry("marketStrategies", "Marketing Strategies", "Marketing", true,
                        "Provide 5-6 actionable marketing strategy bullet points."),
                entry("productionProcess", "Production Process", "Technology", false,
                        "Write 4-5 sentences describing end-to-end production process and control points."),
                entry("equipmentNarrative", "Equipment Narrative", "Technology", false,
                        "Write 4-5 sentences on existing equipment, condition, and upgrade needs."),
                entry("interventionProblem", "Problem or Constraint", "Intervention", false,
                        "Write 3-4 sentences identifying the specific problem the intervention addresses."),
                entry("interventionProposed", "Proposed Intervention", "Intervention", false,
                        "Write 4-5 sentences describing the proposed technology intervention and scope."),
                entry("interventionImpact", "Expected Impact", "Intervention", false,
                        "Write 4-5 sentences on measurable impact on productivity, quality, and cost."),
                entry("expectedOutputBullets", "Expected Output and Measured Results", "Expected Output", true,
                        "Provide 5-7 specific, measurable bullet points for deliverables and results."),
                entry("wasteManagement", "Waste Management", "Environment", false,
                        "Write 4-5 sentences on waste types, segregation, disposal, and compliance."),
                entry("financialAnalysis", "Financial Analysis", "Financial", false,
                        "Write 4-5 sentences on financial capacity, ratios, and ability to co-fund and repay."),
                entry("genderInvolvement", "Gender and Development (GAD) — Participation and Involvement", "Management / GAD", false,
                        "Write one short paragraph (3-5 sentences) describing how women and men participate in the enterprise and how the SETUP intervention benefits them equitably. Use ONLY the provided Male/Female employee counts; do not invent roles, ratios, or headcounts. Use gender-fair language per DOST GAD guidelines.")
        ));

        reg.put("loi", Map.ofEntries(
                entry("projectDescription", "Project Description", "Letter of Intent Body", false,
                        "Write 4-6 formal sentences for a Letter of Intent to DOST describing the proposed SETUP project."),
                entry("expectedOutcome", "Expected Outcome", "Letter of Intent Body", false,
                        "Write 4-5 sentences on expected business and technical outcomes after SETUP assistance."),
                entry("productServices", "Product or Service Description", "Letter of Intent Body", false,
                        "Write 3-4 sentences describing products/services offered by the enterprise."),
                entry("productionPlanNotes", "Production Plan Notes", "Letter of Intent Attachments", false,
                        "Write 4-5 sentences summarizing production planning and implementation sequencing.")
        ));

        reg.put("tna1", Map.ofEntries(
                entry("enterpriseBackground", "Brief Enterprise Background", "TNA Form 01", false,
                        "Write 4-6 sentences on enterprise history, operations, and products."),
                entry("reasonsForAssistance", "Reasons for Assistance", "TNA Form 01", false,
                        "Write 4-5 sentences on why SETUP assistance is needed."),
                entry("processFlow", "Process Flow Description", "TNA Form 01", false,
                        "Write 4-5 sentences describing production process flow."),
                entry("productionProblemsConcerns", "Production Problems and Concerns", "TNA Form 01", false,
                        "Write 4-5 sentences on production problems."),
                entry("marketingProblemsConcerns", "Marketing Problems and Concerns", "TNA Form 01", false,
                        "Write 4-5 sentences on marketing challenges."),
                entry("otherConcerns", "Other Concerns", "TNA Form 01", false,
                        "Write 3-4 sentences on other relevant concerns."),
                entry("genderInvolvement", "Gender and Development (GAD) — Participation and Involvement", "TNA Form 01", false,
                        "Write one short paragraph (3-5 sentences) describing how women and men participate in the enterprise and how SETUP assistance will benefit them equitably. Use ONLY the provided Male/Female employee counts; do not invent roles, ratios, or headcounts. Use gender-fair language per DOST GAD guidelines.")
        ));

        reg.put("tna2", Map.ofEntries(
                entry("background", "Background", "TNA Form 02 Summary of Assessment", false,
                        "Write 1-2 formal paragraphs on enterprise background using TNA Form 01 data (establishment, products, capitalization, reasons for assistance). Do not invent unsupported facts."),
                entry("methodology", "Methodology", "TNA Form 02 Summary of Assessment", false,
                        "Write 1 formal paragraph describing TNA methodology: on-site plant visits, observation of workflow and facilities, interviews with owner and staff, and review of TNA Form 01 documents."),
                entry("siteValidationFindings", "Site Validation Findings", "TNA Form 02", true,
                        "Provide 5-7 professional bullet points summarizing site validation observations."),
                entry("processSummary", "Process Summary", "TNA Form 02", false,
                        "Write 4-6 sentences summarizing observed production process and bottlenecks."),
                entry("expectedOutput", "Expected Output and Measured Results", "TNA Form 02", true,
                        "Provide 5-6 measurable expected outcome bullet points.")
        ));

        return reg;
    }

    private static Map.Entry<String, FieldSpec> entry(String field, String label, String section, boolean bullets, String style) {
        return Map.entry(field, new FieldSpec(label, section, bullets, style));
    }
}
