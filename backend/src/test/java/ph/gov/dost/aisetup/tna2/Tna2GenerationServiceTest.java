/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna2;

import org.junit.jupiter.api.Test;
import ph.gov.dost.aisetup.ai.AnthropicClient;
import ph.gov.dost.aisetup.tna1.dto.Tna1TablesDto;
import ph.gov.dost.aisetup.tna2.dto.Tna2DocumentResponse;
import ph.gov.dost.aisetup.tna2.dto.Tna2GenerationRequest;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class Tna2GenerationServiceTest {

    @Test
    void templateFallbackReturnsPopulatedDocument() {
        AnthropicClient client = mock(AnthropicClient.class);
        when(client.generateJsonObject(anyString())).thenThrow(new IllegalStateException("no key"));

        Tna2GenerationService service = new Tna2GenerationService(client, new ObjectMapper());

        Tna2GenerationRequest request = new Tna2GenerationRequest();
        request.setApplicationId("LOI-2024-000145");
        request.setEnterpriseName("ABC Food Processing");
        request.setApplicantName("Juan Dela Cruz");
        request.setAddress("Koronadal City, South Cotabato");
        request.setProvince("South Cotabato");
        request.setBusinessSector("Food Processing");
        request.setProductServices("Dried mangoes, banana chips");
        request.setProjectDescription("Upgrade packaging and dehydration line");
        request.setExpectedOutcome("Increase capacity by 40%");
        request.setBudget("2500000");
        request.setTna1Form(new HashMap<>(Map.of(
                "enterpriseName", "ABC Food Processing",
                "sector", "Food Processing",
                "mainProduct", "Dried mangoes",
                "productionProblemsConcerns", "Manual packing bottlenecks",
                "employeesMale", "12",
                "employeesFemale", "11"
        )));
        Tna1TablesDto tables = new Tna1TablesDto();
        tables.setEquipment(List.of(List.of("Dehydrator", "5kg capacity", "50kg/day", "2", "2018")));
        request.setTna1Tables(tables);

        Tna2DocumentResponse response = service.generate(request);

        assertFalse(response.isAiGenerated());
        assertNotNull(response.getGeneratedAt());
        assertNotNull(response.getDocumentRef());
        assertFalse(response.getSiteValidationFindings().isEmpty());
        assertFalse(response.getTechnologyGaps().isEmpty());
        assertFalse(response.getRecommendedEquipment().isEmpty());
        assertNotNull(response.getAssessor().getName());
        assertEquals("ABC Food Processing", response.getEnterpriseProfile().getEnterpriseName());
    }
}
