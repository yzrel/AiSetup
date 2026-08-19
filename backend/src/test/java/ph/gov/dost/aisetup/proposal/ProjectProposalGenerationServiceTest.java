/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.proposal;

import org.junit.jupiter.api.Test;
import ph.gov.dost.aisetup.ai.AnthropicClient;
import ph.gov.dost.aisetup.proposal.dto.ProjectProposalDocumentResponse;
import ph.gov.dost.aisetup.proposal.dto.ProjectProposalGenerationRequest;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProjectProposalGenerationServiceTest {

    @Test
    void templateFallbackReturnsPopulatedDocument() {
        AnthropicClient client = mock(AnthropicClient.class);
        when(client.generateJsonObject(anyString())).thenThrow(new IllegalStateException("no key"));

        ProjectProposalGenerationService service =
                new ProjectProposalGenerationService(client, new ObjectMapper());

        ProjectProposalGenerationRequest request = new ProjectProposalGenerationRequest();
        request.setApplicationId("LOI-2024-000145");
        request.setEnterpriseName("ABC Food Processing");
        request.setApplicantName("Juan Dela Cruz");
        request.setProvince("South Cotabato");
        request.setBusinessSector("Food Processing");
        request.setProductServices("Dried mangoes, banana chips");
        request.setProjectDescription("Upgrade packaging and dehydration line");
        request.setExpectedOutcome("Increase capacity by 40%");
        request.setBudget("2500000");
        Map<String, Object> form = new HashMap<>();
        form.put("projectTitle", "Technology upgrading for ABC Food Processing");
        form.put("proponentName", "ABC Food Processing");
        form.put("interventionProblem", "Manual packing bottlenecks");
        form.put("interventionProposed", "Automated packaging line");
        form.put("productionProcess", "Receiving → processing → packaging → delivery");
        form.put("equipmentTable", List.of(
                List.of("Dryer", "2018", "100000", "2", "", "10", "", "7", "")
        ));
        request.setForm(form);
        request.setAttachmentKinds(List.of("vicinityMap", "plantLayout"));

        ProjectProposalDocumentResponse response = service.generate(request);

        assertFalse(response.isAiGenerated());
        assertNotNull(response.getGeneratedAt());
        assertFalse(response.getGeneralObjective().isBlank());
        assertFalse(response.getSpecificObjectives().isEmpty());
        assertFalse(response.getEnterpriseBackground().isBlank());
        assertFalse(response.getRiskRows().isEmpty());
        assertEquals("Technology upgrading for ABC Food Processing", response.getFormTitle());
        assertFalse(response.getExistingMarketingProblems().isBlank());
        assertFalse(response.getMaterialBalance().isBlank());
        assertFalse(response.getWasteVolumeMonthly().isBlank());
        assertFalse(response.getPartialBudgetAnalysis().isBlank());
        assertEquals(1, response.getEquipmentTable().size());
        assertEquals("Dryer", response.getEquipmentTable().get(0).get(0));
        assertEquals("2018", response.getEquipmentTable().get(0).get(1));
    }

    @Test
    void aiGeneratedDocumentKeepsFormEquipmentTable() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        AnthropicClient client = mock(AnthropicClient.class);
        when(client.generateJsonObject(anyString())).thenReturn(mapper.readTree("""
                {
                  "generalObjective": "AI objective",
                  "enterpriseBackground": "AI background",
                  "equipmentTable": [["Invented by model"]]
                }
                """));

        ProjectProposalGenerationService service =
                new ProjectProposalGenerationService(client, mapper);

        ProjectProposalGenerationRequest request = new ProjectProposalGenerationRequest();
        request.setEnterpriseName("ABC Food Processing");
        Map<String, Object> form = new HashMap<>();
        form.put("equipmentTable", List.of(
                List.of("Staff dryer", "2018", "100000", "2", "", "10", "", "7", "")
        ));
        request.setForm(form);

        ProjectProposalDocumentResponse response = service.generate(request);

        assertTrue(response.isAiGenerated());
        assertEquals("Staff dryer", response.getEquipmentTable().get(0).get(0));
        assertEquals(9, response.getEquipmentTable().get(0).size());
    }
}
