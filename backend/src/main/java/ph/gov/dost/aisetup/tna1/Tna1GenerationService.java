/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna1;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.ai.AnthropicClient;
import ph.gov.dost.aisetup.common.AiTemplateFallback;
import ph.gov.dost.aisetup.common.GadLanguagePolicy;
import ph.gov.dost.aisetup.tna1.dto.Tna1DocumentResponse;
import ph.gov.dost.aisetup.tna1.dto.Tna1GenerationRequest;
import ph.gov.dost.aisetup.tna1.dto.Tna1TablesDto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static ph.gov.dost.aisetup.common.TextUtils.firstNonBlank;
import static ph.gov.dost.aisetup.common.TextUtils.isBlank;
import static ph.gov.dost.aisetup.common.TextUtils.safe;
import static ph.gov.dost.aisetup.common.TextUtils.stringVal;

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
            "genderInvolvement",
            "packNutritionRemarks",
            "packBarcodeRemarks",
            "packLabelRemarks",
            "packExpiryRemarks"
    );

    private final AnthropicClient anthropicClient;

    public Tna1GenerationService(AnthropicClient anthropicClient) {
        this.anthropicClient = anthropicClient;
    }

    private record Suggestions(Map<String, Object> form, Tna1TablesDto tables) {}

    public Tna1DocumentResponse generate(Tna1GenerationRequest request) {
        AiTemplateFallback.Result<Suggestions> result = AiTemplateFallback.generate(
                log,
                "TNA Form 01 suggestions",
                () -> {
                    Map<String, Object> form = new LinkedHashMap<>();
                    Tna1TablesDto tables = new Tna1TablesDto();
                    JsonNode aiNode = anthropicClient.generateJsonObject(buildPrompt(request));
                    extractFormSuggestions(aiNode.path("form"), request.getForm(), form);
                    extractTableSuggestions(aiNode.path("tables"), request.getTables(), tables);
                    if (form.isEmpty() && !hasTableData(tables)) {
                        throw new IllegalStateException("AI returned no suggestions");
                    }
                    return new Suggestions(form, tables);
                },
                () -> {
                    Map<String, Object> form = new LinkedHashMap<>();
                    Tna1TablesDto tables = new Tna1TablesDto();
                    buildTemplateSuggestions(request, form, tables);
                    return new Suggestions(form, tables);
                });

        Tna1DocumentResponse response = new Tna1DocumentResponse();
        response.setForm(result.value().form());
        response.setTables(result.value().tables());
        response.setGeneratedAt(Instant.now().toString());
        response.setAiGenerated(result.aiGenerated());
        return response;
    }

    private void extractFormSuggestions(JsonNode formNode, Map<String, Object> current, Map<String, Object> out) {
        if (!formNode.isObject()) return;
        formNode.fields().forEachRemaining(entry -> {
            String key = entry.getKey();
            if (!NARRATIVE_FIELDS.contains(key)) return;
            if (!isBlank(current.get(key))) return;
            if ("productionPlan".equals(key) && !stringVal(current.get("productionPlanFileName")).isBlank()) {
                return;
            }
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

        if (!stringVal(r.getForm().get("productionPlanFileName")).isBlank()) {
            emptyFields.remove("productionPlan");
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
                safe(r.getApplicationId()),
                safe(r.getEnterpriseName()),
                safe(r.getApplicantName()),
                safe(r.getDesignation()),
                safe(r.getAddress()),
                safe(r.getProvince()),
                safe(r.getEmailAddress()),
                safe(r.getContactNumber()),
                safe(r.getMsmeSize()),
                safe(r.getBusinessType()),
                safe(r.getBusinessSector()),
                safe(r.getBusinessNature()),
                safe(r.getYearsOfOperation()),
                safe(r.getAssetSize()),
                safe(r.getProductServices()),
                safe(r.getProjectDescription()),
                safe(r.getExpectedOutcome()),
                safe(r.getCompanyDescription()),
                safe(r.getLoiBackground()),
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
                %s

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
                GadLanguagePolicy.WRITING_RULES,
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
        String enterprise = safe(r.getEnterpriseName());
        String product = firstNonBlank(
                stringVal(r.getForm().get("mainProduct")),
                safe(r.getProductServices()),
                safe(r.getBusinessNature())
        );
        String sector = firstNonBlank(stringVal(r.getForm().get("sector")), safe(r.getBusinessSector()));
        String background = firstNonBlank(
                safe(r.getLoiBackground()),
                safe(r.getCompanyDescription()),
                safe(r.getProjectDescription())
        );
        String project = safe(r.getProjectDescription());

        putIfEmpty(r.getForm(), suggestions, "enterpriseBackground",
                background.isBlank()
                        ? enterprise + " is a " + safe(r.getMsmeSize()) + " enterprise in the " + sector + " sector engaged in " + product + "."
                        : background);
        putIfEmpty(r.getForm(), suggestions, "reasonsForAssistance",
                project.isBlank()
                        ? "The enterprise seeks DOST SETUP assistance to upgrade production technology and improve productivity."
                        : project);
        putIfEmpty(r.getForm(), suggestions, "plan5Years",
                "Within five years, the enterprise aims to increase production capacity, improve product quality, and expand market reach.");
        putIfEmpty(r.getForm(), suggestions, "plan10Years",
                "Within ten years, the enterprise plans to scale operations sustainably and explore new markets while maintaining compliance with industry standards.");
        putIfEmpty(r.getForm(), suggestions, "productionProblemsConcerns",
                "Key concerns include manual or semi-automated processes, capacity constraints, and the need for technology upgrading to meet quality and volume targets.");
        putIfEmpty(r.getForm(), suggestions, "wasteManagement",
                "Waste is segregated at source; disposal follows local environmental regulations. Improvements are planned as part of technology upgrading.");
        if (stringVal(r.getForm().get("productionPlanFileName")).isBlank()) {
            putIfEmpty(r.getForm(), suggestions, "productionPlan",
                    "Production will be optimized through upgraded equipment and improved process controls.");
        }
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
        putIfEmpty(r.getForm(), suggestions, "genderInvolvement",
                GadLanguagePolicy.involvementTemplate(
                        enterprise,
                        stringVal(r.getForm().get("employeesMale")),
                        stringVal(r.getForm().get("employeesFemale"))));

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
        return rows.stream().allMatch(row -> row == null || row.stream().allMatch(cell -> isBlank(cell)));
    }

    private boolean hasTableData(Tna1TablesDto tables) {
        return !isTableEmpty(tables.getRawMaterials())
                || !isTableEmpty(tables.getProduction())
                || !isTableEmpty(tables.getEquipment());
    }

}
