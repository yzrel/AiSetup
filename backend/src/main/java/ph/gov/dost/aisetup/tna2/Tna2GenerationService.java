/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna2;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.ai.AnthropicClient;
import ph.gov.dost.aisetup.common.AiTemplateFallback;
import ph.gov.dost.aisetup.common.GadLanguagePolicy;
import ph.gov.dost.aisetup.loi.ProvincialOfficeResolver;
import ph.gov.dost.aisetup.loi.dto.AddresseeDto;
import ph.gov.dost.aisetup.tna1.dto.Tna1TablesDto;
import ph.gov.dost.aisetup.tna2.dto.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static ph.gov.dost.aisetup.common.TextUtils.firstNonBlank;
import static ph.gov.dost.aisetup.common.TextUtils.isBlank;
import static ph.gov.dost.aisetup.common.TextUtils.safe;
import static ph.gov.dost.aisetup.common.TextUtils.stringVal;

@Service
public class Tna2GenerationService {

    private static final Logger log = LoggerFactory.getLogger(Tna2GenerationService.class);
    private static final DateTimeFormatter DISPLAY_DATE =
            DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.ENGLISH);

    private final AnthropicClient anthropicClient;
    private final ObjectMapper objectMapper;

    public Tna2GenerationService(AnthropicClient anthropicClient, ObjectMapper objectMapper) {
        this.anthropicClient = anthropicClient;
        this.objectMapper = objectMapper;
    }

    public Tna2DocumentResponse generate(Tna2GenerationRequest request) {
        AiTemplateFallback.Result<Tna2DocumentResponse> result = AiTemplateFallback.generate(
                log,
                "TNA Form 02",
                () -> {
                    JsonNode aiNode = anthropicClient.generateJsonObject(buildPrompt(request));
                    Tna2DocumentResponse doc = objectMapper.treeToValue(aiNode, Tna2DocumentResponse.class);
                    if (doc == null || isEmptyDocument(doc)) {
                        throw new IllegalStateException("AI returned empty document");
                    }
                    return doc;
                },
                () -> buildTemplateDocument(request));

        Tna2DocumentResponse response = result.value();
        enrichMetadata(request, response);
        response.setGeneratedAt(Instant.now().toString());
        response.setAiGenerated(result.aiGenerated());
        return response;
    }

    private void enrichMetadata(Tna2GenerationRequest request, Tna2DocumentResponse response) {
        if (response.getApplicationId() == null || response.getApplicationId().isBlank()) {
            response.setApplicationId(safe(request.getApplicationId()));
        }
        if (response.getDocumentRef() == null || response.getDocumentRef().isBlank()) {
            response.setDocumentRef(buildDocumentRef(request.getApplicationId()));
        }
        if (response.getAssessmentDate() == null || response.getAssessmentDate().isBlank()) {
            response.setAssessmentDate(DISPLAY_DATE.format(LocalDate.now()));
        }
        if (response.getAssessor() == null || response.getAssessor().getName() == null
                || response.getAssessor().getName().isBlank()) {
            response.setAssessor(buildDefaultAssessor(request.getProvince()));
        }
    }

    private boolean isEmptyDocument(Tna2DocumentResponse doc) {
        boolean noSite = doc.getSiteValidationFindings() == null || doc.getSiteValidationFindings().isEmpty();
        boolean noBackground = doc.getBackground() == null || doc.getBackground().isBlank();
        boolean noFindings = doc.getFindingsByArea() == null || doc.getFindingsByArea().isEmpty();
        return noSite && noBackground && noFindings;
    }

    private String buildPrompt(Tna2GenerationRequest r) {
        Map<String, Object> form = r.getTna1Form();
        Tna1TablesDto tables = r.getTna1Tables();

        String facts = """
                Application ID: %s
                Enterprise: %s
                Applicant: %s (%s)
                Address: %s, %s
                MSME: %s | Type: %s | Sector: %s | Commodity: %s
                Products/Services: %s
                Project: %s
                Expected outcome: %s
                Budget: %s
                LOI background: %s
                TNA1 production problems: %s
                TNA1 process flow: %s
                TNA1 enterprise background: %s
                TNA1 reasons for assistance: %s
                TNA1 employees M/F: %s / %s
                TNA1 equipment table rows: %s
                """.formatted(
                safe(r.getApplicationId()),
                safe(r.getEnterpriseName()),
                safe(r.getApplicantName()),
                safe(r.getDesignation()),
                safe(r.getAddress()),
                safe(r.getProvince()),
                safe(r.getMsmeSize()),
                safe(r.getBusinessType()),
                safe(r.getBusinessSector()),
                stringVal(form.get("commodity")),
                safe(r.getProductServices()),
                safe(r.getProjectDescription()),
                safe(r.getExpectedOutcome()),
                safe(r.getBudget()),
                safe(r.getLoiBackground()),
                stringVal(form.get("productionProblemsConcerns")),
                stringVal(form.get("processFlow")),
                stringVal(form.get("enterpriseBackground")),
                stringVal(form.get("reasonsForAssistance")),
                stringVal(form.get("employeesMale")),
                stringVal(form.get("employeesFemale")),
                formatEquipmentRows(tables)
        );

        return """
                You are a DOST SOCCSKSARGEN SETUP assessor drafting TNA Form 02 (Technology Needs Assessment Report) based on TNA Form 01 and site validation data.

                Write a complete formal report matching the official SUMMARY OF ASSESSMENT structure. Do NOT invent specific costs, equipment models, or metrics not supported by the data.
                Base findings on TNA Form 01 production problems, equipment inventory, and project description.

                TNA Form 01 fields are SOURCES OF TRUTH for findings — do not paste the same source text into multiple subsections.
                For each source group below, write DISTINCT assessor notes for the primary and related subsections, each from a different angle, all grounded on that source (plus other TNA1/LOI facts). Never leave two subsections with identical content strings.
                Source expansion groups:
                - safetyMeasures → primary ohs (hazards/controls); related work-environment (facilities/conditions)
                - processFlow → primary production-system (how production is organized); related operational (outsourcing/ops practices)
                - wasteManagement → primary waste-management (overall waste handling); related methods-of-disposal (disposal methods)
                - productionProblemsConcerns → primary production-planning; related work-study, equipment-mgmt (distinct angles)
                - cgmpHaccp → primary qa-system; related product-quality (standards vs QA practices)
                One-to-one sources (paraphrase once): purchasingSystem→purchasing, employeeIncentives→compensation, trainingDevelopment→technical-training, promotionalStrategies/marketingPlan→product-promotion, productionPlan→pm-process and product-process-performance (different angles if both filled), agreements→business-ethics.
                For human-resources: summarize headcount and hiringCriteria only — do not paste full trainingDevelopment or employeeIncentives text (those belong in technical-training and compensation).
                Put plan5Years, plan10Years, reasonsForAssistance, and expectedOutcome under Plans only — never under Mission Statement or Vision Statement. Leave Mission/Vision blank unless the enterprise stated an explicit mission or vision.
                %s

                Return ONLY a valid JSON object with this exact structure (no markdown):
                {
                  "enterpriseProfile": {
                    "enterpriseName": "", "address": "", "businessType": "", "sector": "", "commodity": "",
                    "mainProduct": "", "employees": "", "contactPerson": "", "contactNumber": "", "emailAddress": ""
                  },
                  "background": "",
                  "methodology": "",
                  "findingsByArea": [
                    {
                      "title": "1. Strategic Direction",
                      "subsections": [
                        { "id": "mission", "label": "Mission Statement", "content": "" },
                        { "id": "vision", "label": "Vision Statement", "content": "" },
                        { "id": "plans", "label": "Plans", "content": "" },
                        { "id": "alliances", "label": "Strategic alliances and current agreement", "content": "" }
                      ]
                    },
                    {
                      "title": "2. Management Aspect",
                      "subsections": [
                        { "id": "human-resources", "label": "Human Resources", "content": "" },
                        { "id": "purchasing", "label": "Purchasing", "content": "" },
                        { "id": "work-environment", "label": "Work Environment", "content": "" },
                        { "id": "compensation", "label": "Compensation", "content": "" },
                        { "id": "ohs", "label": "Occupational Health and Safety", "content": "" },
                        { "id": "business-ethics", "label": "Business ethics and social responsibilities", "content": "" },
                        { "id": "technical-training", "label": "Technical Training", "content": "" },
                        { "id": "product-promotion", "label": "Product Promotion", "content": "" },
                        { "id": "product-process-performance", "label": "Product and Process Performance and Improvement", "content": "" }
                      ]
                    },
                    {
                      "title": "3. Technical Aspect",
                      "subsections": [
                        { "id": "operational", "label": "Operational and Outsourcing Practices", "content": "" },
                        { "id": "production-system", "label": "Production System", "content": "" },
                        { "id": "production-planning", "label": "Production and Planning Control", "content": "" },
                        { "id": "production-layout", "label": "Production Layout", "content": "" },
                        { "id": "work-study", "label": "Work Study/improvement", "content": "" },
                        { "id": "equipment-mgmt", "label": "Equipment Management and Maintenance", "content": "" },
                        { "id": "qa-system", "label": "Quality Assurance System", "content": "" }
                      ]
                    },
                    {
                      "title": "4. Product and Process Performance and Improvement",
                      "subsections": [
                        { "id": "reengineering", "label": "Re-engineering and Research and Development", "content": "" },
                        { "id": "pm-process", "label": "Performance Measures and Results - Process", "content": "" },
                        { "id": "pm-product", "label": "Performance Measures and Results - Product", "content": "" },
                        { "id": "continuous-improvement", "label": "Procedures for Continuous Improvement", "content": "" },
                        { "id": "product-quality", "label": "Product Quality Standards", "content": "" }
                      ]
                    },
                    {
                      "title": "5. Environmental Management System",
                      "subsections": [
                        { "id": "waste-management", "label": "Waste Management", "content": "" },
                        { "id": "methods-of-disposal", "label": "Methods of disposal", "content": "" }
                      ]
                    }
                  ],
                  "otherObservations": "",
                  "conclusions": "",
                  "recommendations": ["", ""],
                  "interventionRows": [
                    { "problem": "", "intervention": "", "equipment": "", "impact": "" }
                  ],
                  "tnaTeam": {
                    "leader": { "name": "", "title": "TNA Team Leader" },
                    "members": [{ "name": "", "title": "" }]
                  },
                  "siteValidationFindings": ["finding1", "finding2"],
                  "productionProcessAnalysis": { "summary": "", "findings": ["", ""] },
                  "technologyGaps": ["", ""],
                  "proposedInterventions": ["", ""],
                  "recommendedEquipment": [
                    { "name": "", "specifications": "", "quantity": "1", "estimatedCost": "", "priority": "High" }
                  ],
                  "productivityImprovement": {
                    "kpis": [
                      { "label": "Production Volume", "before": "", "after": "", "change": "" }
                    ],
                    "outcomes": ["", ""]
                  },
                  "assessor": { "name": "", "title": "TNA Team Leader", "office": "" },
                  "attestedBy": { "name": "", "title": "Assistant Regional Director", "office": "DOST SOCCSKSARGEN" }
                }

                Applicant and TNA Form 01 data:
                %s
                """.formatted(GadLanguagePolicy.WRITING_RULES, facts);
    }

    private Tna2DocumentResponse buildTemplateDocument(Tna2GenerationRequest r) {
        Map<String, Object> form = r.getTna1Form() != null ? r.getTna1Form() : Map.of();
        Tna2DocumentResponse doc = new Tna2DocumentResponse();

        Tna2EnterpriseProfileDto profile = new Tna2EnterpriseProfileDto();
        profile.setEnterpriseName(firstNonBlank(stringVal(form.get("enterpriseName")), r.getEnterpriseName()));
        profile.setAddress(firstNonBlank(stringVal(form.get("officeAddress")), r.getAddress()));
        profile.setBusinessType(firstNonBlank(stringVal(form.get("organizationType")), r.getBusinessType()));
        profile.setSector(firstNonBlank(stringVal(form.get("sector")), r.getBusinessSector()));
        profile.setCommodity(firstNonBlank(stringVal(form.get("commodity")), r.getBusinessNature()));
        profile.setMainProduct(firstNonBlank(stringVal(form.get("mainProduct")), r.getProductServices()));
        String male = stringVal(form.get("employeesMale"));
        String female = stringVal(form.get("employeesFemale"));
        profile.setEmployees(
                (!male.isBlank() || !female.isBlank())
                        ? male + " male / " + female + " female"
                        : "As reported in TNA Form 01"
        );
        profile.setContactPerson(firstNonBlank(stringVal(form.get("contactPerson")), r.getApplicantName()));
        profile.setContactNumber(firstNonBlank(stringVal(form.get("officeTel")), r.getContactNumber()));
        profile.setEmailAddress(firstNonBlank(stringVal(form.get("officeEmail")), r.getEmailAddress()));
        doc.setEnterpriseProfile(profile);

        String problems = stringVal(form.get("productionProblemsConcerns"));
        doc.setSiteValidationFindings(List.of(
                "Site validation confirmed enterprise operations at the registered production location.",
                problems.isBlank()
                        ? "Production layout and workflow were observed during the assessment visit."
                        : "Key observation: " + problems
        ));

        Tna2ProductionProcessDto process = new Tna2ProductionProcessDto();
        process.setSummary(firstNonBlank(
                stringVal(form.get("processFlow")),
                "Current production follows a semi-manual workflow with opportunities for mechanization and quality control improvements."
        ));
        process.setFindings(List.of(
                problems.isBlank()
                        ? "Manual handling steps create bottlenecks during peak production."
                        : problems,
                "Existing equipment capacity limits throughput relative to market demand.",
                "Quality consistency can be improved through upgraded processing and packaging technology."
        ));
        doc.setProductionProcessAnalysis(process);

        doc.setTechnologyGaps(List.of(
                "Outdated or limited-capacity production equipment",
                "Manual packaging and sealing operations causing bottlenecks",
                "Insufficient process controls for consistent product quality and shelf life"
        ));

        String project = safe(r.getProjectDescription());
        doc.setProposedInterventions(List.of(
                project.isBlank()
                        ? "Upgrade core production equipment aligned with SETUP program objectives."
                        : project,
                "Introduce automated or semi-automated processing and packaging systems.",
                "Strengthen food safety and GMP practices through technology intervention and staff training."
        ));

        doc.setRecommendedEquipment(buildEquipmentFromTna1(r));
        doc.setProductivityImprovement(buildDefaultProductivity(r));
        doc.setAssessor(buildDefaultAssessor(r.getProvince()));

        String enterprise = profile.getEnterpriseName();
        doc.setBackground(firstNonBlank(
                stringVal(form.get("enterpriseBackground")),
                enterprise + " was assessed under DOST SETUP TNA. "
                        + (problems.isBlank() ? "" : "Key concerns: " + problems)
        ));
        doc.setMethodology(
                "The assessment was conducted through on-site plant visits, direct observation of the workflow and facilities, "
                        + "interviews with the owner and key production staff, and a thorough review of operational documents submitted with TNA Form 01."
        );
        doc.setFindingsByArea(buildFindingsFromTna1(form, profile, safe(r.getExpectedOutcome())));
        doc.setOtherObservations(problems.isBlank()
                ? "No additional observations beyond the findings above."
                : problems);
        doc.setConclusions(
                "The enterprise demonstrates operational capacity with documented technology needs. "
                        + "Technology intervention under SETUP is recommended to address identified gaps."
        );
        doc.setRecommendations(doc.getProposedInterventions());
        List<Tna2InterventionRowDto> interventions = new ArrayList<>();
        List<String> gaps = doc.getTechnologyGaps();
        List<String> proposed = doc.getProposedInterventions();
        List<Tna2EquipmentRowDto> equipment = doc.getRecommendedEquipment();
        for (int i = 0; i < Math.max(gaps.size(), 1); i++) {
            Tna2InterventionRowDto row = new Tna2InterventionRowDto();
            row.setProblem(i < gaps.size() ? gaps.get(i) : "");
            row.setIntervention(i < proposed.size() ? proposed.get(i) : (proposed.isEmpty() ? "" : proposed.get(0)));
            if (i < equipment.size()) {
                Tna2EquipmentRowDto eq = equipment.get(i);
                row.setEquipment(eq.getName() + (eq.getSpecifications() != null && !eq.getSpecifications().isBlank()
                        ? " — " + eq.getSpecifications() : ""));
            } else if (!equipment.isEmpty()) {
                row.setEquipment(equipment.get(0).getName());
            }
            List<String> outcomes = doc.getProductivityImprovement().getOutcomes();
            row.setImpact(i < outcomes.size() ? outcomes.get(i) : (outcomes.isEmpty() ? "" : outcomes.get(0)));
            interventions.add(row);
        }
        doc.setInterventionRows(interventions);

        Tna2TeamDto team = new Tna2TeamDto();
        Tna2TeamMemberDto leader = new Tna2TeamMemberDto();
        leader.setName(doc.getAssessor().getName());
        leader.setTitle(doc.getAssessor().getTitle());
        team.setLeader(leader);
        doc.setTnaTeam(team);

        Tna2AssessorDto attested = new Tna2AssessorDto();
        attested.setName("");
        attested.setTitle("Assistant Regional Director");
        attested.setOffice("DOST SOCCSKSARGEN");
        doc.setAttestedBy(attested);

        return doc;
    }

    private static Tna2FindingSubsectionDto sub(String id, String label, String content) {
        return new Tna2FindingSubsectionDto(id, label, content == null ? "" : content.trim());
    }

    private static Tna2FindingSectionDto section(String title, List<Tna2FindingSubsectionDto> subsections) {
        Tna2FindingSectionDto section = new Tna2FindingSectionDto();
        section.setTitle(title);
        section.setSubsections(subsections);
        return section;
    }

    private static List<Tna2FindingSectionDto> buildFindingsFromTna1(
            Map<String, Object> form,
            Tna2EnterpriseProfileDto profile,
            String expectedOutcome
    ) {
        String employees = profile.getEmployees() != null ? profile.getEmployees() : "";
        // Headcount + hiring only — incentives/training have their own primary subsections.
        String hr = joinNonBlank(
                employees.isBlank() ? "" : "Total personnel: " + employees + ".",
                blankToEmpty(form.get("hiringCriteria"), "Hiring criteria: %s.")
        );
        String waste = stringVal(form.get("wasteManagement"));
        // Prefer Form 01 processFlow for the primary mapping; do not fall back to process
        // summary for related siblings (template leaves related empty).
        String processFlow = stringVal(form.get("processFlow"));
        String problems = stringVal(form.get("productionProblemsConcerns"));
        String productionPlan = stringVal(form.get("productionPlan"));
        String plan5 = stringVal(form.get("plan5Years"));
        String plan10 = stringVal(form.get("plan10Years"));
        String outcome = firstNonBlank(stringVal(form.get("expectedOutcome")), expectedOutcome);
        String plans = joinNonBlank(
                plan5.isBlank() ? "" : "5-year plan: " + plan5,
                plan10.isBlank() ? "" : "10-year plan: " + plan10,
                stringVal(form.get("reasonsForAssistance")),
                outcome
        );

        return List.of(
                section("1. Strategic Direction", List.of(
                        // Mission/Vision stay blank unless staff enter enterprise statements —
                        // do not map Form 01 plans or LOI expectedOutcome here.
                        sub("mission", "Mission Statement", ""),
                        sub("vision", "Vision Statement", ""),
                        sub("plans", "Plans", plans.isBlank()
                                ? "Plans focus on technology upgrading aligned with SETUP objectives."
                                : plans),
                        sub("alliances", "Strategic alliances and current agreement", "")
                )),
                section("2. Management Aspect", List.of(
                        sub("human-resources", "Human Resources", hr),
                        sub("purchasing", "Purchasing", stringVal(form.get("purchasingSystem"))),
                        // Related to safetyMeasures — template leaves empty for staff/AI.
                        sub("work-environment", "Work Environment", ""),
                        sub("compensation", "Compensation", stringVal(form.get("employeeIncentives"))),
                        // Primary for safetyMeasures.
                        sub("ohs", "Occupational Health and Safety", stringVal(form.get("safetyMeasures"))),
                        sub("business-ethics", "Business ethics and social responsibilities",
                                stringVal(form.get("agreements"))),
                        sub("technical-training", "Technical Training",
                                stringVal(form.get("trainingDevelopment"))),
                        sub("product-promotion", "Product Promotion", joinNonBlank(
                                stringVal(form.get("promotionalStrategies")),
                                stringVal(form.get("marketingPlan")))),
                        // productionPlan only — do not paste problems/cgmp (their primaries elsewhere).
                        sub("product-process-performance",
                                "Product and Process Performance and Improvement",
                                productionPlan)
                )),
                section("3. Technical Aspect", List.of(
                        // Related to processFlow — template leaves empty.
                        sub("operational", "Operational and Outsourcing Practices", ""),
                        // Primary for processFlow.
                        sub("production-system", "Production System", processFlow),
                        // Primary for productionProblemsConcerns.
                        sub("production-planning", "Production and Planning Control", problems),
                        sub("production-layout", "Production Layout",
                                stringVal(form.get("plantLayoutFileName")).isBlank()
                                        ? ""
                                        : "Plant layout on file: " + stringVal(form.get("plantLayoutFileName"))),
                        // Related to problems — template leaves empty.
                        sub("work-study", "Work Study/improvement", ""),
                        sub("equipment-mgmt", "Equipment Management and Maintenance", ""),
                        // Primary for cgmpHaccp.
                        sub("qa-system", "Quality Assurance System", stringVal(form.get("cgmpHaccp")))
                )),
                section("4. Product and Process Performance and Improvement", List.of(
                        sub("reengineering", "Re-engineering and Research and Development",
                                stringVal(form.get("reasonsForAssistance"))),
                        sub("pm-process", "Performance Measures and Results - Process", productionPlan),
                        sub("pm-product", "Performance Measures and Results - Product",
                                stringVal(form.get("mainProduct"))),
                        sub("continuous-improvement", "Procedures for Continuous Improvement",
                                stringVal(form.get("expectedOutcome"))),
                        // Related to cgmpHaccp — template leaves empty.
                        sub("product-quality", "Product Quality Standards", "")
                )),
                section("5. Environmental Management System", List.of(
                        // Primary for wasteManagement.
                        sub("waste-management", "Waste Management",
                                waste.isBlank()
                                        ? "Waste management and environmental controls were reviewed during the assessment."
                                        : waste),
                        // Related to wasteManagement — template leaves empty.
                        sub("methods-of-disposal", "Methods of disposal", "")
                ))
        );
    }

    private static String blankToEmpty(Object value, String template) {
        String s = stringVal(value);
        return s.isBlank() ? "" : template.formatted(s);
    }

    private static String joinNonBlank(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part == null || part.isBlank()) continue;
            if (sb.length() > 0) sb.append(' ');
            sb.append(part.trim());
        }
        return sb.toString();
    }

    private List<Tna2EquipmentRowDto> buildEquipmentFromTna1(Tna2GenerationRequest r) {
        List<Tna2EquipmentRowDto> rows = new ArrayList<>();
        Tna1TablesDto tables = r.getTna1Tables();
        if (tables != null && tables.getEquipment() != null) {
            int i = 0;
            for (List<String> row : tables.getEquipment()) {
                if (row == null || row.stream().allMatch(cell -> isBlank(cell))) continue;
                Tna2EquipmentRowDto eq = new Tna2EquipmentRowDto();
                eq.setName(row.size() > 0 ? row.get(0) : "Recommended equipment");
                eq.setSpecifications(row.size() > 1 ? row.get(1) : "Per TNA assessment");
                eq.setQuantity(row.size() > 3 ? row.get(3) : "1");
                eq.setEstimatedCost("To be verified");
                eq.setPriority(i == 0 ? "High" : "Medium");
                rows.add(eq);
                i++;
            }
        }
        if (rows.isEmpty()) {
            Tna2EquipmentRowDto eq = new Tna2EquipmentRowDto();
            eq.setName("Technology upgrading package per project proposal");
            eq.setSpecifications("Based on TNA Form 01 assessment");
            eq.setQuantity("1");
            eq.setEstimatedCost(r.getBudget() != null && !r.getBudget().isBlank() ? "₱" + r.getBudget() : "Per approved proposal");
            eq.setPriority("High");
            rows.add(eq);
        }
        return rows;
    }

    private Tna2ProductivityImprovementDto buildDefaultProductivity(Tna2GenerationRequest r) {
        Tna2ProductivityImprovementDto pi = new Tna2ProductivityImprovementDto();

        Tna2KpiDto volume = new Tna2KpiDto();
        volume.setLabel("Production Volume");
        volume.setBefore("Baseline per TNA Form 01");
        volume.setAfter("Projected increase post-intervention");
        volume.setChange("To be measured");

        Tna2KpiDto quality = new Tna2KpiDto();
        quality.setLabel("Product Quality / Reject Rate");
        quality.setBefore("Current reject/spoilage levels");
        quality.setAfter("Reduced through upgraded equipment");
        quality.setChange("Improvement expected");

        pi.setKpis(List.of(volume, quality));
        String outcome = safe(r.getExpectedOutcome());
        pi.setOutcomes(List.of(
                outcome.isBlank()
                        ? "Improved productivity and product quality through appropriate technology interventions."
                        : outcome,
                "Enhanced compliance with industry standards and SETUP program requirements.",
                "Sustainable enterprise growth within 24–36 months post-implementation."
        ));
        return pi;
    }

    private Tna2AssessorDto buildDefaultAssessor(String province) {
        var resolved = ProvincialOfficeResolver.resolveProvincialOffice(province);
        AddresseeDto office = resolved.addressee();
        Tna2AssessorDto assessor = new Tna2AssessorDto();
        assessor.setName(office.getName() != null ? office.getName() : "PROVINCIAL DIRECTOR");
        assessor.setTitle(office.getTitle() != null ? office.getTitle() : "Provincial Director");
        assessor.setOffice(office.getOfficeName() != null ? office.getOfficeName() : "DOST SOCCSKSARGEN");
        return assessor;
    }

    private String buildDocumentRef(String applicationId) {
        String year = String.valueOf(LocalDate.now().getYear());
        if (applicationId != null && applicationId.contains("-")) {
            String[] parts = applicationId.split("-");
            if (parts.length >= 3) {
                return "TNA2-" + parts[parts.length - 2] + "-" + parts[parts.length - 1];
            }
        }
        return "TNA2-" + year + "-000001";
    }

    private String formatEquipmentRows(Tna1TablesDto tables) {
        if (tables == null || tables.getEquipment() == null) return "(none)";
        StringBuilder sb = new StringBuilder();
        for (List<String> row : tables.getEquipment()) {
            sb.append(String.join(" | ", row)).append("; ");
        }
        return sb.toString();
    }

}
