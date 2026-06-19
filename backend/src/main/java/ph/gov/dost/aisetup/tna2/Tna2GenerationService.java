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
        boolean aiGenerated;
        Tna2DocumentResponse response;

        try {
            JsonNode aiNode = anthropicClient.generateJsonObject(buildPrompt(request));
            response = objectMapper.treeToValue(aiNode, Tna2DocumentResponse.class);
            if (response == null || isEmptyDocument(response)) {
                throw new IllegalStateException("AI returned empty document");
            }
            aiGenerated = true;
        } catch (Exception e) {
            log.info("Using template TNA Form 02 (AI unavailable): {}", e.getMessage());
            response = buildTemplateDocument(request);
            aiGenerated = false;
        }

        enrichMetadata(request, response);
        response.setGeneratedAt(Instant.now().toString());
        response.setAiGenerated(aiGenerated);
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
        return doc.getSiteValidationFindings() == null || doc.getSiteValidationFindings().isEmpty();
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
                val(r.getApplicationId()),
                val(r.getEnterpriseName()),
                val(r.getApplicantName()),
                val(r.getDesignation()),
                val(r.getAddress()),
                val(r.getProvince()),
                val(r.getMsmeSize()),
                val(r.getBusinessType()),
                val(r.getBusinessSector()),
                stringVal(form.get("commodity")),
                val(r.getProductServices()),
                val(r.getProjectDescription()),
                val(r.getExpectedOutcome()),
                val(r.getBudget()),
                val(r.getLoiBackground()),
                stringVal(form.get("productionProblemsConcerns")),
                stringVal(form.get("processFlow")),
                stringVal(form.get("enterpriseBackground")),
                stringVal(form.get("reasonsForAssistance")),
                stringVal(form.get("employeesMale")),
                stringVal(form.get("employeesFemale")),
                formatEquipmentRows(tables)
        );

        return """
                You are a DOST Region XII SETUP assessor drafting TNA Form 02 (Technology Needs Assessment Technical Report) based on TNA Form 01 and site validation data.

                Write a complete formal technical report. Do NOT invent specific costs, equipment models, or metrics not supported by the data; use conservative estimates marked as approximate where needed.
                Base findings on TNA Form 01 production problems, equipment inventory, and project description.

                Return ONLY a valid JSON object with this exact structure (no markdown):
                {
                  "enterpriseProfile": {
                    "enterpriseName": "", "address": "", "businessType": "", "sector": "", "commodity": "",
                    "mainProduct": "", "employees": "", "contactPerson": "", "contactNumber": "", "emailAddress": ""
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
                  "assessor": { "name": "", "title": "Provincial Director", "office": "" }
                }

                Applicant and TNA Form 01 data:
                %s
                """.formatted(facts);
    }

    private Tna2DocumentResponse buildTemplateDocument(Tna2GenerationRequest r) {
        Map<String, Object> form = r.getTna1Form();
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

        String project = val(r.getProjectDescription());
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
        return doc;
    }

    private List<Tna2EquipmentRowDto> buildEquipmentFromTna1(Tna2GenerationRequest r) {
        List<Tna2EquipmentRowDto> rows = new ArrayList<>();
        Tna1TablesDto tables = r.getTna1Tables();
        if (tables != null && tables.getEquipment() != null) {
            int i = 0;
            for (List<String> row : tables.getEquipment()) {
                if (row == null || row.stream().allMatch(this::isBlankString)) continue;
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
        String outcome = val(r.getExpectedOutcome());
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
        assessor.setOffice(office.getOfficeName() != null ? office.getOfficeName() : "DOST Region XII");
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

    private static String stringVal(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
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

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean isBlankString(String value) {
        return value == null || value.trim().isEmpty();
    }
}
