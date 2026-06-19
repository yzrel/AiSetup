/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna1;

import org.junit.jupiter.api.Test;
import ph.gov.dost.aisetup.ai.AnthropicClient;
import ph.gov.dost.aisetup.tna1.dto.Tna1DocumentResponse;
import ph.gov.dost.aisetup.tna1.dto.Tna1GenerationRequest;
import ph.gov.dost.aisetup.tna1.dto.Tna1TablesDto;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class Tna1GenerationServiceTest {

    @Test
    void templateFallbackFillsEmptyNarrativeFields() {
        AnthropicClient client = mock(AnthropicClient.class);
        when(client.generateJsonObject(anyString())).thenThrow(new IllegalStateException("no key"));

        Tna1GenerationService service = new Tna1GenerationService(client);

        Tna1GenerationRequest request = new Tna1GenerationRequest();
        request.setEnterpriseName("ABC Food Processing");
        request.setBusinessSector("Food Processing");
        request.setProductServices("Cassava chips");
        request.setProjectDescription("Upgrade packaging line");
        request.setExpectedOutcome("Increase daily output by 30%");
        request.setForm(new HashMap<>(Map.of(
                "mainProduct", "Cassava chips",
                "sector", "Food Processing",
                "processFlowMode", "text"
        )));
        request.setTables(new Tna1TablesDto());

        Tna1DocumentResponse response = service.generate(request);

        assertFalse(response.isAiGenerated());
        assertNotNull(response.getGeneratedAt());
        assertFalse(response.getForm().isEmpty());
        assertTrue(response.getForm().containsKey("enterpriseBackground"));
        assertTrue(response.getForm().containsKey("reasonsForAssistance"));
        assertFalse(response.getTables().getRawMaterials().isEmpty());
        assertFalse(response.getTables().getProduction().isEmpty());
        assertFalse(response.getTables().getEquipment().isEmpty());
    }
}
