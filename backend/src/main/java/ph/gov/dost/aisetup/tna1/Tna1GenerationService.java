package ph.gov.dost.aisetup.tna1;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.ai.AnthropicClient;
import ph.gov.dost.aisetup.tna1.dto.Tna1DocumentResponse;
import ph.gov.dost.aisetup.tna1.dto.Tna1GenerationRequest;
import ph.gov.dost.aisetup.tna1.dto.Tna1TablesDto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class Tna1GenerationService {

    private static final Logger log = LoggerFactory.getLogger(Tna1GenerationService.class);

    private static final Set<String> NARRATIVE_FIELDS = Set.of(
            "enterpriseBackground",
            "reasonsForAssistance",
            "plan5Years",
            "plan10Years",
            "productionProblemsConcerns",
            "wasteManagement",
            "productionPlan",
            "inventorySystem",
            "maintenanceProgram",
            "cgmpHaccp",
            "purchasingSystem",
            "processFlow",
            "marketingPlan",
            "marketOutlets",
            "promotionalStrategies",
            "marketCompetitors",
            "cashFlow",
            "capitalSource",
            "accountingSystem",
            "hiringCriteria",
            "employeeIncentives",
            "trainingDevelopment",
            "safetyMeasures",
            "employeeWelfare",
            "otherConcerns",
            "packNutritionRemarks",
            "packBarcodeRemarks",
            "packLabelRemarks",
            "packExpiryRemarks"
    );

    private final AnthropicClient anthropicClient;

    public Tna1GenerationService(AnthropicClient anthropicClient) {
        this.anthropicClient = anthropicClient;
    }

    public Tna1DocumentResponse generate(Tna1GenerationRequest request) {
        Map<String, Object> suggestions = new LinkedHashMap<>();
        Tna1TablesDto tableSuggestions = new Tna1TablesDto();
        boolean aiGenerated;

        try {
            JsonNode aiNode = anthropicClient.generateJsonObject(buildPrompt(request));
            extractFormSuggestions(aiNode.path("form"), request.getForm(), suggestions);
            extractTableSuggestions(aiNode.path("tables"), request.getTables(), tableSuggestions);
            aiGenerated = !suggestions.isEmpty() || hasTableData(tableSuggestions);
            if (!aiGenerated) {
                throw new IllegalStateException("AI returned no suggestions");
            }
        } catch (Exception e) {
            log.info("Using template TNA Form 01 suggestions (AI unavailable): {}", e.getMessage());
            buildTemplateSuggestions(request, suggestions, tableSuggestions);
            aiGenerated = false;
        }

        Tna1DocumentResponse response = new Tna1DocumentResponse();
        response.setForm(suggestions);
        response.setTables(tableSuggestions);
        response.setGeneratedAt(Instant.now().toString());
        response.setAiGenerated(aiGenerated);
        return response;
    }

    private void extractFormSuggestions(JsonNode formNode, Map<String, Object> current, Map<String, Object> out) {
        if (!formNode.isObject()) return;
        formNode.fields().forEachRemaining(entry -> {
            String key = entry.getKey();
            if (!NARRATIVE_FIELDS.contains(key)) return;
            if (!isBlank(current.get(key))) return;
            String value = entry.getValue().asText("").trim();
            if (!value.isEmpty()) {
                out.put(key, value);
            }
        });
    }

    private void extractTableSuggestions(JsonNode tablesNode, Tna1TablesDto current, Tna1TablesDto out) {
        if (!tablesNode.isObject()) return;
        if (isTableEmpty(current.getRawMaterials())) {
            out.setRawMaterials(parseTableRows(tablesNode.path("rawMaterials")));
        }
        if (isTableEmpty(current.getProduction())) {
            out.setProduction(parseTableRows(tablesNode.path("production")));
        }
        if (isTableEmpty(current.getEquipment())) {
            out.setEquipment(parseTableRows(tablesNode.path("equipment")));
        }
    }

    private List<List<String>> parseTableRows(JsonNode arrayNode) {
        List<List<String>> rows = new ArrayList<>();
        if (!arrayNode.isArray()) return rows;
        for (JsonNode rowNode : arrayNode) {
            if (!rowNode.isArray()) continue;
            List<String> row = new ArrayList<>();
            rowNode.forEach(cell -> row.add(cell.asText("")));
            if (row.stream().anyMatch(s -> !s.isBlank())) {
                rows.add(row);
            }
        }
        return rows;
    }

    private String buildPrompt(Tna1GenerationRequest r) {
        List<String> emptyFields = new ArrayList<>();
        for (String field : NARRATIVE_FIELDS) {
            if (isBlank(r.getForm().get(field))) {
                emptyFields.add(field);
            }
        }

        boolean needRawMaterials = isTableEmpty(r.getTables().getRawMaterials());
        boolean needProduction = isTableEmpty(r.getTables().getProduction());
        boolean needEquipment = isTableEmpty(r.getTables().getEquipment());

        String processFlowMode = stringVal(r.getForm().get("processFlowMode"));
        if (!"attachment".equalsIgnoreCase(processFlowMode) && isBlank(r.getForm().get("processFlow"))) {
            if (!emptyFields.contains("processFlow")) {
                emptyFields.add("processFlow");
            }
        } else {
            emptyFields.remove("processFlow");
        }

        String facts = """
                Application ID: %s
                Enterprise: %s
                Applicant: %s (%s)
                Address: %s, %s
                Email: %s | Mobile: %s
                MSME size: %s | Business type: %s | Sector: %s
                Business nature: %s | Years of operation: %s | Asset size: %s
                Products/Services: %s
                Project description: %s
                Expected outcome: %s
                Company description: %s
                LOI background: %s
                Main product (form): %s
                Sector (form): %s
                Commodity (form): %s
                """.formatted(
                val(r.getApplicationId()),
                val(r.getEnterpriseName()),
                val(r.getApplicantName()),
                val(r.getDesignation()),
                val(r.getAddress()),
                val(r.getProvince()),
                val(r.getEmailAddress()),
                val(r.getContactNumber()),
                val(r.getMsmeSize()),
                val(r.getBusinessType()),
                val(r.getBusinessSector()),
                val(r.getBusinessNature()),
                val(r.getYearsOfOperation()),
                val(r.getAssetSize()),
                val(r.getProductServices()),
                val(r.getProjectDescription()),
                val(r.getExpectedOutcome()),
                val(r.getCompanyDescription()),
                val(r.getLoiBackground()),
                stringVal(r.getForm().get("mainProduct")),
                stringVal(r.getForm().get("sector")),
                stringVal(r.getForm().get("commodity"))
        );

        StringBuilder tablesNeeded = new StringBuilder();
        if (needRawMaterials) tablesNeeded.append("- rawMaterials: array of [material, source, unitCost, volumePerYear]\n");
        if (needProduction) tablesNeeded.append("- production: array of [product, volumePerYear, unitCost, annualCost]\n");
        if (needEquipment) tablesNeeded.append("- equipment: array of [equipment, specs, capacity, units, yearAcquired]\n");

        return """
                You are completing empty narrative fields for DOST SETUP TNA Form 01 (Technology Needs Assessment) for a Philippine MSME in Region XII.

                Fill ONLY the empty fields listed below. Use professional English appropriate for a government application.
                Do NOT invent specific numbers, permits, or certifications not supported by the data. Use neutral phrasing when data is missing.
                For table suggestions, provide 1-3 realistic placeholder rows based on the enterprise sector and product — use "To be verified" where exact figures are unknown.

                Return ONLY a valid JSON object with this shape:
                {
                  "form": { "<fieldName>": "<text>" },
                  "tables": {
                    "rawMaterials": [["",""]],
                    "production": [["",""]],
                    "equipment": [["","",""]]
                  }
                }
                Include only keys for empty fields and empty tables. No markdown, no code fences.

                Empty form fields to fill: %s

                Tables needing rows:
                %s

                Applicant data:
                %s
                """.formatted(
                emptyFields.isEmpty() ? "(none)" : String.join(", ", emptyFields),
                tablesNeeded.length() == 0 ? "(none)" : tablesNeeded,
                facts
        );
    }

    private void buildTemplateSuggestions(
            Tna1GenerationRequest r,
            Map<String, Object> suggestions,
            Tna1TablesDto tables
    ) {
        String enterprise = val(r.getEnterpriseName());
        String product = firstNonBlank(
                stringVal(r.getForm().get("mainProduct")),
                val(r.getProductServices()),
                val(r.getBusinessNature())
        );
        String sector = firstNonBlank(stringVal(r.getForm().get("sector")), val(r.getBusinessSector()));
        String background = firstNonBlank(
                val(r.getLoiBackground()),
                val(r.getCompanyDescription()),
                val(r.getProjectDescription())
        );
        String project = val(r.getProjectDescription());
        String outcome = val(r.getExpectedOutcome());

        putIfEmpty(r.getForm(), suggestions, "enterpriseBackground",
                background.isBlank()
                        ? enterprise + " is a " + val(r.getMsmeSize()) + " enterprise in the " + sector + " sector engaged in " + product + "."
                        : background);
        putIfEmpty(r.getForm(), suggestions, "reasonsForAssistance",
                project.isBlank()
                        ? "The enterprise seeks DOST SETUP assistance to upgrade production technology and improve productivity."
                        : project);
        putIfEmpty(r.getForm(), suggestions, "plan5Years",
                outcome.isBlank()
                        ? "Within five years, the enterprise aims to increase production capacity, improve product quality, and expand market reach."
                        : outcome);
        putIfEmpty(r.getForm(), suggestions, "plan10Years",
                "Within ten years, the enterprise plans to scale operations sustainably and explore new markets while maintaining compliance with industry standards.");
        putIfEmpty(r.getForm(), suggestions, "productionProblemsConcerns",
                "Key concerns include manual or semi-automated processes, capacity constraints, and the need for technology upgrading to meet quality and volume targets.");
        putIfEmpty(r.getForm(), suggestions, "wasteManagement",
                "Waste is segregated at source; disposal follows local environmental regulations. Improvements are planned as part of technology upgrading.");
        putIfEmpty(r.getForm(), suggestions, "productionPlan",
                project.isBlank() ? "Production will be optimized through upgraded equipment and improved process controls." : project);
        putIfEmpty(r.getForm(), suggestions, "inventorySystem",
                "Raw materials and finished goods are tracked through manual ledgers with periodic physical counts.");
        putIfEmpty(r.getForm(), suggestions, "maintenanceProgram",
                "Equipment is maintained on a preventive schedule; repairs are documented and performed by qualified technicians.");
        putIfEmpty(r.getForm(), suggestions, "cgmpHaccp",
                "The enterprise follows basic good manufacturing practices appropriate to its product line; formal HACCP certification is being pursued where applicable.");
        putIfEmpty(r.getForm(), suggestions, "purchasingSystem",
                "Suppliers are evaluated for quality and reliability; purchase orders are issued for major raw material acquisitions.");
        if (!"attachment".equalsIgnoreCase(stringVal(r.getForm().get("processFlowMode")))) {
            putIfEmpty(r.getForm(), suggestions, "processFlow",
                    "Receiving → preparation → processing → packaging → storage → distribution.");
        }
        putIfEmpty(r.getForm(), suggestions, "marketingPlan",
                "Products are marketed through local retailers, institutional buyers, and direct sales channels with planned expansion after capacity upgrades.");
        putIfEmpty(r.getForm(), suggestions, "marketOutlets",
                "Local markets, supermarkets, and institutional clients within Region XII.");
        putIfEmpty(r.getForm(), suggestions, "promotionalStrategies",
                "Product sampling, trade fairs, social media presence, and distributor partnerships.");
        putIfEmpty(r.getForm(), suggestions, "marketCompetitors",
                "Competing enterprises in the same commodity segment; differentiation through quality and consistent supply.");
        putIfEmpty(r.getForm(), suggestions, "cashFlow",
                "Revenue is generated from product sales; operating expenses cover raw materials, labor, utilities, and maintenance.");
        putIfEmpty(r.getForm(), suggestions, "capitalSource",
                "Owner equity and reinvested earnings; SETUP assistance sought for technology acquisition.");
        putIfEmpty(r.getForm(), suggestions, "accountingSystem",
                "Manual or spreadsheet-based bookkeeping with periodic financial review.");
        putIfEmpty(r.getForm(), suggestions, "hiringCriteria",
                "Workers are hired based on skills, experience, and reliability; training provided for production roles.");
        putIfEmpty(r.getForm(), suggestions, "employeeIncentives",
                "Performance-based incentives and statutory benefits as applicable.");
        putIfEmpty(r.getForm(), suggestions, "trainingDevelopment",
                "On-the-job training and skills upgrading aligned with new technology adoption.");
        putIfEmpty(r.getForm(), suggestions, "safetyMeasures",
                "Workplace safety orientation, PPE use, and compliance with occupational health standards.");
        putIfEmpty(r.getForm(), suggestions, "employeeWelfare",
                "Statutory benefits and safe working conditions are provided to all employees.");
        putIfEmpty(r.getForm(), suggestions, "otherConcerns",
                "None reported at this time.");

        if (isTableEmpty(r.getTables().getRawMaterials())) {
            tables.setRawMaterials(List.of(
                    List.of("Primary raw material", "Local suppliers", "To be verified", "To be verified")
            ));
        }
        if (isTableEmpty(r.getTables().getProduction())) {
            tables.setProduction(List.of(
                    List.of(product, "To be verified", "To be verified", "To be verified")
            ));
        }
        if (isTableEmpty(r.getTables().getEquipment())) {
            tables.setEquipment(List.of(
                    List.of("Existing production equipment", "As installed", "Current capacity", "1", "To be verified")
            ));
        }
    }

    private void putIfEmpty(Map<String, Object> current, Map<String, Object> out, String key, String value) {
        if (isBlank(current.get(key)) && value != null && !value.isBlank()) {
            out.put(key, value.trim());
        }
    }

    private boolean isTableEmpty(List<List<String>> rows) {
        if (rows == null || rows.isEmpty()) return true;
        return rows.stream().allMatch(row -> row == null || row.stream().allMatch(this::isBlankString));
    }

    private boolean hasTableData(Tna1TablesDto tables) {
        return !isTableEmpty(tables.getRawMaterials())
                || !isTableEmpty(tables.getProduction())
                || !isTableEmpty(tables.getEquipment());
    }

    private static String stringVal(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private static boolean isBlank(Object value) {
        if (value == null) return true;
        if (value instanceof Boolean) return false;
        return String.valueOf(value).trim().isEmpty();
    }

    private boolean isBlankString(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static String val(String value) {
        return value == null || value.trim().isEmpty() ? "" : value.trim();
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.trim().isEmpty()) return v.trim();
        }
        return "";
    }
}
