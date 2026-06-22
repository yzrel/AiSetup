/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.proposal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.ai.AnthropicClient;
import ph.gov.dost.aisetup.proposal.dto.ProjectProposalDocumentResponse;
import ph.gov.dost.aisetup.proposal.dto.ProjectProposalGenerationRequest;
import ph.gov.dost.aisetup.proposal.dto.ProjectProposalRiskRowDto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ProjectProposalGenerationService {

    private static final Logger log = LoggerFactory.getLogger(ProjectProposalGenerationService.class);

    private final AnthropicClient anthropicClient;
    private final ObjectMapper objectMapper;

    public ProjectProposalGenerationService(AnthropicClient anthropicClient, ObjectMapper objectMapper) {
        this.anthropicClient = anthropicClient;
        this.objectMapper = objectMapper;
    }

    public ProjectProposalDocumentResponse generate(ProjectProposalGenerationRequest request) {
        boolean aiGenerated;
        ProjectProposalDocumentResponse response;

        try {
            JsonNode aiNode = anthropicClient.generateJsonObject(buildPrompt(request));
            response = objectMapper.treeToValue(aiNode, ProjectProposalDocumentResponse.class);
            if (response == null || isEmptyDocument(response)) {
                throw new IllegalStateException("AI returned empty document");
            }
            aiGenerated = true;
        } catch (Exception e) {
            log.info("Using template Project Proposal (AI unavailable): {}", e.getMessage());
            response = buildTemplateDocument(request);
            aiGenerated = false;
        }

        enrichMetadata(request, response);
        response.setGeneratedAt(Instant.now().toString());
        response.setAiGenerated(aiGenerated);
        return response;
    }

    private void enrichMetadata(ProjectProposalGenerationRequest request, ProjectProposalDocumentResponse response) {
        Map<String, Object> form = request.getForm();
        if (response.getApplicationId() == null || response.getApplicationId().isBlank()) {
            response.setApplicationId(safe(request.getApplicationId()));
        }
        if (response.getFormTitle() == null || response.getFormTitle().isBlank()) {
            response.setFormTitle(firstNonBlank(
                    stringVal(form.get("projectTitle")),
                    request.getProjectDescription(),
                    request.getEnterpriseName()
            ));
        }
    }

    private boolean isEmptyDocument(ProjectProposalDocumentResponse doc) {
        return (doc.getGeneralObjective() == null || doc.getGeneralObjective().isBlank())
                && (doc.getEnterpriseBackground() == null || doc.getEnterpriseBackground().isBlank());
    }

    private String buildPrompt(ProjectProposalGenerationRequest r) {
        Map<String, Object> form = r.getForm();
        String facts = """
                Application ID: %s
                Enterprise: %s
                Applicant: %s
                Province: %s
                Sector: %s
                Products/Services: %s
                Project: %s
                Expected outcome: %s
                Budget: %s
                Project title: %s
                Proponent: %s
                Amount requested: %s
                Production problems: %s
                Proposed intervention: %s
                Intervention equipment: %s
                Production process (draft): %s
                Enterprise background (draft): %s
                Attachments provided: %s
                """.formatted(
                val(r.getApplicationId()),
                val(r.getEnterpriseName()),
                val(r.getApplicantName()),
                val(r.getProvince()),
                val(r.getBusinessSector()),
                val(r.getProductServices()),
                val(r.getProjectDescription()),
                val(r.getExpectedOutcome()),
                val(r.getBudget()),
                stringVal(form.get("projectTitle")),
                stringVal(form.get("proponentName")),
                stringVal(form.get("amountRequested")),
                stringVal(form.get("interventionProblem")),
                stringVal(form.get("interventionProposed")),
                stringVal(form.get("interventionEquipment")),
                stringVal(form.get("productionProcess")),
                stringVal(form.get("enterpriseBackground")),
                r.getAttachmentKinds() != null ? String.join(", ", r.getAttachmentKinds()) : "(none)"
        );

        return """
                You are a DOST SETUP program officer drafting SETUP Form 001 (Project Proposal) narratives for an MSME applicant.

                Write formal, professional content aligned with DOST SETUP Form 001 section headings. Do NOT invent specific peso amounts or equipment models not supported by the data; use conservative language where estimates are needed.

                Return ONLY a valid JSON object (no markdown) with this structure:
                {
                  "generalObjective": "",
                  "specificObjectives": ["", ""],
                  "enterpriseBackground": "",
                  "skillsExpertise": "",
                  "plantSiteNarrative": "",
                  "capacityVolumeNarrative": "",
                  "rawMaterialsNarrative": "",
                  "marketSituation": "",
                  "productDemandSupply": "",
                  "distributionChannel": "",
                  "competitors": "",
                  "marketStrategies": ["", ""],
                  "productionProcess": "",
                  "equipmentNarrative": "",
                  "interventionProblem": "",
                  "interventionProposed": "",
                  "interventionEquipment": "",
                  "interventionImpact": "",
                  "expectedOutputBullets": ["", ""],
                  "wasteManagement": "",
                  "financialAnalysis": "",
                  "riskRows": [
                    { "id": "1", "risk": "", "assumption": "", "plan": "" }
                  ]
                }

                Applicant data:
                %s
                """.formatted(facts);
    }

    private ProjectProposalDocumentResponse buildTemplateDocument(ProjectProposalGenerationRequest r) {
        Map<String, Object> form = r.getForm();
        String ent = val(r.getEnterpriseName());
        ProjectProposalDocumentResponse doc = new ProjectProposalDocumentResponse();

        doc.setGeneralObjective(firstNonBlank(
                stringVal(form.get("generalObjective")),
                val(r.getExpectedOutcome()),
                "To upgrade the technology and productivity of " + ent + " through DOST-SETUP assistance."
        ));

        List<String> specific = stringList(form.get("specificObjectives"));
        if (specific.isEmpty()) {
            specific = List.of(
                    "Acquire appropriate technology to improve production capacity of " + ent + ".",
                    "Expand ability to serve more clients without compromising product quality."
            );
        }
        doc.setSpecificObjectives(specific);

        doc.setEnterpriseBackground(firstNonBlank(
                stringVal(form.get("enterpriseBackground")),
                ent + " operates in " + val(r.getBusinessSector()) + " and seeks SETUP support for technology upgrading."
        ));

        doc.setSkillsExpertise(firstNonBlank(
                stringVal(form.get("skillsExpertise")),
                val(r.getApplicantName()) + " leads enterprise operations with experience in production and client service."
        ));

        doc.setPlantSiteNarrative(firstNonBlank(
                stringVal(form.get("plantSiteNarrative")),
                "The enterprise is located at " + firstNonBlank(
                        stringVal(form.get("firmAddress")),
                        stringVal(form.get("proponentAddress")),
                        val(r.getProvince())
                ) + "."
        ));

        doc.setCapacityVolumeNarrative(firstNonBlank(
                stringVal(form.get("capacityVolumeNarrative")),
                "Current production volume is limited by existing equipment capacity and manual processing steps."
        ));

        doc.setRawMaterialsNarrative(firstNonBlank(
                stringVal(form.get("rawMaterialsNarrative")),
                "Raw materials are sourced from established suppliers supporting regular production requirements."
        ));

        doc.setMarketSituation(firstNonBlank(
                stringVal(form.get("marketSituation")),
                "Market demand in " + val(r.getProvince()) + " supports expansion of " + ent + "'s products and services."
        ));

        doc.setProductDemandSupply(firstNonBlank(
                stringVal(form.get("productDemandSupply")),
                "Demand for quality products and services continues to grow in the service area."
        ));

        doc.setDistributionChannel(firstNonBlank(
                stringVal(form.get("distributionChannel")),
                "Distribution is primarily local with potential for regional expansion."
        ));

        doc.setCompetitors(firstNonBlank(
                stringVal(form.get("competitors")),
                "Local competitors exist; differentiation is through service quality and turnaround time."
        ));

        List<String> strategies = stringList(form.get("marketStrategies"));
        if (strategies.isEmpty()) {
            strategies = List.of(
                    "Improve production capacity with new equipment",
                    "Maintain quality control and customer service standards"
            );
        }
        doc.setMarketStrategies(strategies);

        doc.setProductionProcess(firstNonBlank(
                stringVal(form.get("productionProcess")),
                "Order reception → preparation → production → quality check → packaging → delivery."
        ));

        doc.setEquipmentNarrative(firstNonBlank(
                stringVal(form.get("equipmentNarrative")),
                "Existing equipment supports current output levels with room for upgrading through SETUP intervention."
        ));

        doc.setInterventionProblem(stringVal(form.get("interventionProblem")));
        doc.setInterventionProposed(firstNonBlank(
                stringVal(form.get("interventionProposed")),
                val(r.getProjectDescription())
        ));
        doc.setInterventionEquipment(stringVal(form.get("interventionEquipment")));
        doc.setInterventionImpact(firstNonBlank(
                stringVal(form.get("interventionImpact")),
                "Improved productivity, faster turnaround, and expanded client base."
        ));

        List<String> outputs = stringList(form.get("expectedOutputBullets"));
        if (outputs.isEmpty()) {
            outputs = List.of(
                    "Increase in productivity",
                    "Improved product quality",
                    "Additional clients served"
            );
        }
        doc.setExpectedOutputBullets(outputs);

        doc.setWasteManagement(firstNonBlank(
                stringVal(form.get("wasteManagement")),
                "Waste segregation, recycling of paper and packaging materials, and proper disposal of process waste per local guidelines."
        ));

        doc.setFinancialAnalysis(firstNonBlank(
                stringVal(form.get("financialAnalysis")),
                "Financial capacity will be supported by attached statements and projected cash flows from improved operations."
        ));

        doc.setRiskRows(buildDefaultRiskRows(form));
        return doc;
    }

    @SuppressWarnings("unchecked")
    private List<ProjectProposalRiskRowDto> buildDefaultRiskRows(Map<String, Object> form) {
        Object rows = form.get("riskRows");
        if (rows instanceof List<?> list && !list.isEmpty()) {
            List<ProjectProposalRiskRowDto> result = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    ProjectProposalRiskRowDto row = new ProjectProposalRiskRowDto();
                    row.setId(stringVal(map.get("id")));
                    row.setRisk(stringVal(map.get("risk")));
                    row.setAssumption(stringVal(map.get("assumption")));
                    row.setPlan(stringVal(map.get("plan")));
                    if (!row.getRisk().isBlank()) {
                        result.add(row);
                    }
                }
            }
            if (!result.isEmpty()) return result;
        }

        return List.of(
                riskRow("Equipment malfunction causing production delays",
                        "Equipment will operate efficiently with regular maintenance",
                        "Schedule regular maintenance and maintain service contracts"),
                riskRow("Supplier delays for raw materials",
                        "Suppliers will deliver on time",
                        "Maintain multiple suppliers and buffer stock"),
                riskRow("Market competition",
                        "Enterprise will retain and attract clients",
                        "Competitive pricing and quality improvement initiatives")
        );
    }

    private static ProjectProposalRiskRowDto riskRow(String risk, String assumption, String plan) {
        ProjectProposalRiskRowDto row = new ProjectProposalRiskRowDto();
        row.setId(String.valueOf(risk.hashCode()));
        row.setRisk(risk);
        row.setAssumption(assumption);
        row.setPlan(plan);
        return row;
    }

    @SuppressWarnings("unchecked")
    private static List<String> stringList(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        List<String> out = new ArrayList<>();
        for (Object item : list) {
            if (item != null) {
                String s = String.valueOf(item).trim();
                if (!s.isEmpty()) out.add(s);
            }
        }
        return out;
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
}
