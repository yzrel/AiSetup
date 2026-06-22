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
        request.setForm(new HashMap<>(Map.of(
                "projectTitle", "Technology upgrading for ABC Food Processing",
                "proponentName", "ABC Food Processing",
                "interventionProblem", "Manual packing bottlenecks",
                "interventionProposed", "Automated packaging line",
                "productionProcess", "Receiving → processing → packaging → delivery"
        )));
        request.setAttachmentKinds(List.of("vicinityMap", "plantLayout"));

        ProjectProposalDocumentResponse response = service.generate(request);

        assertFalse(response.isAiGenerated());
        assertNotNull(response.getGeneratedAt());
        assertFalse(response.getGeneralObjective().isBlank());
        assertFalse(response.getSpecificObjectives().isEmpty());
        assertFalse(response.getEnterpriseBackground().isBlank());
        assertFalse(response.getRiskRows().isEmpty());
        assertEquals("Technology upgrading for ABC Food Processing", response.getFormTitle());
    }
}
