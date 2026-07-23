/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ApplicantPersistenceStripTest {

    @Test
    void stripHeavyPayloadsRemovesDataUrlsAndFileData() {
        String heavy = "data:application/pdf;base64," + "A".repeat(600);
        Map<String, Object> doc = new LinkedHashMap<>();
        doc.put("fileName", "plan.pdf");
        doc.put("dataUrl", heavy);
        doc.put("fileId", "f1");

        Map<String, Object> form = new LinkedHashMap<>();
        form.put("productionPlanFileName", "plan.pdf");
        form.put("productionPlanFileData", heavy);

        Map<String, Object> input = new LinkedHashMap<>();
        input.put("selfie", heavy);
        input.put("productionPlanDocument", doc);
        input.put("loiDocument", Map.of("body", "ok"));
        input.put("tna1", Map.of("form", form));

        Object stripped = ApplicantPersistenceService.stripHeavyPayloads(input);
        assertInstanceOf(Map.class, stripped);
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) stripped;

        assertTrue(Boolean.TRUE.equals(out.get("selfieUploaded")));
        assertFalse(out.containsKey("selfie"));
        assertEquals(Map.of("body", "ok"), out.get("loiDocument"));

        @SuppressWarnings("unchecked")
        Map<String, Object> plan = (Map<String, Object>) out.get("productionPlanDocument");
        assertEquals("plan.pdf", plan.get("fileName"));
        assertEquals("f1", plan.get("fileId"));
        assertTrue(Boolean.TRUE.equals(plan.get("hasFileContent")));
        assertFalse(plan.containsKey("dataUrl"));

        @SuppressWarnings("unchecked")
        Map<String, Object> tna1 = (Map<String, Object>) out.get("tna1");
        @SuppressWarnings("unchecked")
        Map<String, Object> slimForm = (Map<String, Object>) tna1.get("form");
        assertEquals("plan.pdf", slimForm.get("productionPlanFileName"));
        assertTrue(Boolean.TRUE.equals(slimForm.get("productionPlanFileUploaded")));
        assertFalse(slimForm.containsKey("productionPlanFileData"));
    }
}
