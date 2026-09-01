/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ph.gov.dost.aisetup.ai.dto.AiFieldSuggestionRequest;
import ph.gov.dost.aisetup.ai.dto.AiFieldSuggestionResponse;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AiFieldSuggestionServiceTest {

    private AiFieldSuggestionService service;

    @BeforeEach
    void setUp() {
        AnthropicClient client = mock(AnthropicClient.class);
        when(client.generateJsonObject(anyString(), anyInt()))
                .thenThrow(new IllegalStateException("no key"));
        service = new AiFieldSuggestionService(client, new ObjectMapper());
    }

    private static Map<String, Object> demoContext() {
        Map<String, Object> ctx = new HashMap<>();
        ctx.put("enterpriseName", "Eborde Enterprise");
        ctx.put("businessSector", "Food Processing");
        ctx.put("businessNature", "Baking and Catering Services");
        ctx.put("msmeSize", "Micro");
        ctx.put("productServices", "Baking and Catering Services");
        ctx.put("coreProducts", "Baking and Catering Services");
        ctx.put("projectDescription", "Upgrade bakery equipment");
        ctx.put("expectedOutcome", "Higher throughput and product consistency");
        ctx.put("employeesMale", "3");
        ctx.put("employeesFemale", "5");
        return ctx;
    }

    private AiFieldSuggestionRequest req(String module, String field, String instruction) {
        AiFieldSuggestionRequest request = new AiFieldSuggestionRequest();
        request.setModule(module);
        request.setField(field);
        request.setContext(demoContext());
        request.setUserInstruction(instruction);
        return request;
    }

    @Test
    void everyRegisteredFieldReturnsNonEmptyTemplateFallback() {
        Map<String, Set<String>> registry = AiFieldSuggestionService.registeredFieldKeys();
        assertFalse(registry.isEmpty());

        int count = 0;
        for (Map.Entry<String, Set<String>> moduleEntry : registry.entrySet()) {
            for (String field : moduleEntry.getValue()) {
                AiFieldSuggestionResponse res = service.suggest(req(moduleEntry.getKey(), field, null));
                assertEquals(moduleEntry.getKey(), res.getModule());
                assertEquals(field, res.getField());
                assertFalse(res.isAiGenerated(), field + " should use template when AI unavailable");
                boolean hasText = res.getText() != null && !res.getText().isBlank();
                boolean hasBullets = res.getBullets() != null && !res.getBullets().isEmpty();
                boolean hasRiskRows = res.getRiskRows() != null && !res.getRiskRows().isEmpty();
                assertTrue(
                        hasText || hasBullets || hasRiskRows,
                        "Expected text, bullets, or riskRows for " + moduleEntry.getKey() + "." + field);
                count++;
            }
        }
        assertTrue(count >= 30, "Expected full registry coverage, got " + count);
    }

    @Test
    void productServicesDoesNotNestOnRepeatedAssist() {
        AiFieldSuggestionResponse first = service.suggest(req("loi", "productServices", null));
        assertNotNull(first.getText());
        assertFalse(first.getText().toLowerCase().contains("offers offers"));

        Map<String, Object> ctx = demoContext();
        ctx.put("productServices", first.getText());
        AiFieldSuggestionRequest secondReq = new AiFieldSuggestionRequest();
        secondReq.setModule("loi");
        secondReq.setField("productServices");
        secondReq.setContext(ctx);

        AiFieldSuggestionResponse second = service.suggest(secondReq);
        assertNotNull(second.getText());
        String lower = second.getText().toLowerCase();
        assertFalse(lower.contains("offers eborde enterprise offers"), "Nested offers detected: " + second.getText());
        assertFalse(lower.contains("offers offers"));
        assertFalse(
                second.getText().contains("established quality and service standards")
                        && first.getText().contains("established quality and service standards")
                        && second.getText().length() > first.getText().length() * 1.5,
                "Second assist should not grow by nesting prior narrative");
    }

    @Test
    void productServicesBulletExtraInstructionReturnsBulletsThenStatements() {
        AiFieldSuggestionResponse res = service.suggest(
                req("loi", "productServices", "Add products offered in Bullet form"));

        assertFalse(res.isAiGenerated());
        assertNotNull(res.getText());
        assertTrue(res.getText().contains("- "), "Expected bullet lines: " + res.getText());
        assertTrue(res.getText().toLowerCase().contains("baking"));
        // productServices always appends narrative after bullets
        assertTrue(res.getText().contains("established quality and service standards"));
        int bulletIdx = res.getText().indexOf("- ");
        int narrativeIdx = res.getText().indexOf("established quality and service standards");
        assertTrue(bulletIdx >= 0 && bulletIdx < narrativeIdx, "Bullets must come before narrative");
    }

    @Test
    void productServicesParsesExtraProductsAndAddsStatementsAfterBullets() {
        AiFieldSuggestionResponse res = service.suggest(req(
                "loi",
                "productServices",
                "Dried mangoes, banana chips, fruit preserves add these products in bullet form also add statements"));

        assertFalse(res.isAiGenerated());
        String text = res.getText();
        assertNotNull(text);
        assertTrue(text.contains("- Dried mangoes") || text.contains("- dried mangoes"), text);
        assertTrue(text.toLowerCase().contains("- banana chips"), text);
        assertTrue(text.toLowerCase().contains("- fruit preserves"), text);
        assertTrue(text.contains("established quality and service standards"), text);
        assertTrue(text.toLowerCase().contains("dried mangoes, banana chips, fruit preserves"), text);

        int firstBullet = text.indexOf("- ");
        int narrative = text.indexOf("established quality and service standards");
        assertTrue(firstBullet >= 0 && firstBullet < narrative, "Bullets before statements: " + text);
        assertFalse(text.toLowerCase().startsWith("eborde enterprise offers"), "Narrative must not come first");
    }
}
