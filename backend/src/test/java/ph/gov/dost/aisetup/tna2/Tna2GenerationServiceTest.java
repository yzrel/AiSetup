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
        assertNotNull(response.getFindingsByArea());
        assertFalse(response.getFindingsByArea().isEmpty());
        assertNotNull(response.getFindingsByArea().get(0).getSubsections());
        assertFalse(response.getFindingsByArea().get(0).getSubsections().isEmpty());
        assertNotNull(response.getBackground());
        assertNotNull(response.getMethodology());

        var strategic = response.getFindingsByArea().get(0);
        assertEquals("1. Strategic Direction", strategic.getTitle());
        String mission = strategic.getSubsections().stream()
                .filter(s -> "mission".equals(s.getId()))
                .findFirst()
                .orElseThrow()
                .getContent();
        String plans = strategic.getSubsections().stream()
                .filter(s -> "plans".equals(s.getId()))
                .findFirst()
                .orElseThrow()
                .getContent();
        assertTrue(mission == null || mission.isBlank(),
                "Mission Statement must not be filled from expectedOutcome/plans");
        assertTrue(plans.contains("Increase capacity by 40%"));
    }

    @Test
    void templateFindingsMapMultiTargetSourcesToPrimaryOnly() {
        AnthropicClient client = mock(AnthropicClient.class);
        when(client.generateJsonObject(anyString())).thenThrow(new IllegalStateException("no key"));

        Tna2GenerationService service = new Tna2GenerationService(client, new ObjectMapper());

        String safety = "PPE required; fire extinguishers inspected monthly.";
        String processFlow = "Receive → Sort → Dry → Pack → Ship";
        String waste = "Organic waste composted; plastics segregated.";
        String problems = "Manual packing bottlenecks at peak season.";
        String cgmp = "Basic GMP practiced; no formal HACCP.";

        Tna2GenerationRequest request = new Tna2GenerationRequest();
        request.setApplicationId("LOI-2024-000200");
        request.setEnterpriseName("Primary Map Foods");
        request.setProvince("South Cotabato");
        request.setExpectedOutcome("Improve throughput");
        Map<String, Object> form = new HashMap<>();
        form.put("enterpriseName", "Primary Map Foods");
        form.put("safetyMeasures", safety);
        form.put("processFlow", processFlow);
        form.put("wasteManagement", waste);
        form.put("productionProblemsConcerns", problems);
        form.put("cgmpHaccp", cgmp);
        form.put("hiringCriteria", "Experience preferred");
        form.put("employeeIncentives", "Attendance bonus");
        form.put("trainingDevelopment", "On-the-job training");
        form.put("employeesMale", "5");
        form.put("employeesFemale", "4");
        request.setTna1Form(form);

        Tna2DocumentResponse response = service.generate(request);
        assertFalse(response.isAiGenerated());

        Map<String, String> byId = subsectionContentById(response);

        assertEquals(safety, byId.get("ohs"));
        assertTrue(isBlank(byId.get("work-environment")));

        assertEquals(processFlow, byId.get("production-system"));
        assertTrue(isBlank(byId.get("operational")));

        assertEquals(waste, byId.get("waste-management"));
        assertTrue(isBlank(byId.get("methods-of-disposal")));

        assertEquals(problems, byId.get("production-planning"));
        assertTrue(isBlank(byId.get("work-study")));
        assertTrue(isBlank(byId.get("equipment-mgmt")));

        assertEquals(cgmp, byId.get("qa-system"));
        assertTrue(isBlank(byId.get("product-quality")));

        String hr = byId.getOrDefault("human-resources", "");
        assertTrue(hr.contains("Hiring criteria"));
        assertFalse(hr.contains("Attendance bonus"));
        assertFalse(hr.contains("On-the-job training"));
        assertEquals("Attendance bonus", byId.get("compensation"));
        assertEquals("On-the-job training", byId.get("technical-training"));
    }

    private static Map<String, String> subsectionContentById(Tna2DocumentResponse response) {
        Map<String, String> byId = new HashMap<>();
        if (response.getFindingsByArea() == null) {
            return byId;
        }
        for (var section : response.getFindingsByArea()) {
            if (section.getSubsections() == null) {
                continue;
            }
            for (var sub : section.getSubsections()) {
                byId.put(sub.getId(), sub.getContent() == null ? "" : sub.getContent());
            }
        }
        return byId;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
