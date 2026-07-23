/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ApplicantModuleDataPersistenceTest {

    @Autowired
    private ApplicantPersistenceService persistenceService;

    @Autowired
    private ApplicantModuleDataRepository moduleDataRepository;

    @Test
    void saveDualWritesPerModuleRowsAndAssemblesOnRead() {
        String id = "mod-split-" + System.currentTimeMillis();
        Map<String, Object> loi = new LinkedHashMap<>();
        loi.put("body", "Letter of Intent text");
        loi.put("aiGenerated", false);

        Map<String, Object> tna1 = new LinkedHashMap<>();
        tna1.put("submitted", true);
        tna1.put("form", Map.of("enterpriseName", "Eborde Enterprise"));

        Map<String, Object> moduleData = new LinkedHashMap<>();
        moduleData.put("tinNumber", "123");
        moduleData.put("loiDocument", loi);
        moduleData.put("tna1", tna1);

        persistenceService.save(new ApplicantRecordDto(
                id,
                "LOI-2026-SPLIT01",
                "Eborde Enterprise",
                "tna1",
                moduleData,
                Map.of("emailAddress", "eborde@example.com"),
                null));

        assertTrue(moduleDataRepository.countByApplicantId(id) >= 3);

        ApplicantRecordDto loaded = persistenceService.findById(id).orElseThrow();
        assertEquals("tna1", loaded.currentModule());
        assertEquals("123", loaded.moduleData().get("tinNumber"));
        @SuppressWarnings("unchecked")
        Map<String, Object> loadedLoi = (Map<String, Object>) loaded.moduleData().get("loiDocument");
        assertEquals("Letter of Intent text", loadedLoi.get("body"));

        persistenceService.mergeModuleKey(
                id,
                "loiDocument",
                Map.of("body", "Updated LOI"),
                null);

        ApplicantRecordDto afterPatch = persistenceService.findById(id).orElseThrow();
        @SuppressWarnings("unchecked")
        Map<String, Object> patchedLoi =
                (Map<String, Object>) afterPatch.moduleData().get("loiDocument");
        assertEquals("Updated LOI", patchedLoi.get("body"));
        assertEquals(false, patchedLoi.get("aiGenerated"));
    }

    @Test
    void scalarFlagsLandInCaseMetaAndFlattenOnRead() {
        String id = "mod-meta-" + System.currentTimeMillis();
        Map<String, Object> moduleData = new LinkedHashMap<>();
        moduleData.put("tinNumber", "123-456");
        moduleData.put("accountStatus", "active");
        moduleData.put("documentsSubmitted", true);
        moduleData.put(
                "loiDocument",
                Map.of("body", "Intent letter", "aiGenerated", false));

        persistenceService.save(new ApplicantRecordDto(
                id,
                "LOI-2026-META01",
                "Meta Co",
                "letter-of-intent",
                moduleData,
                Map.of("emailAddress", "meta@example.com"),
                null));

        assertTrue(
                moduleDataRepository
                        .findById(new ApplicantModuleDataId(id, "caseMeta"))
                        .isPresent());
        assertTrue(
                moduleDataRepository
                        .findById(new ApplicantModuleDataId(id, "loiDocument"))
                        .isPresent());

        ApplicantRecordDto loaded = persistenceService.findById(id).orElseThrow();
        assertEquals("123-456", loaded.moduleData().get("tinNumber"));
        assertEquals("active", loaded.moduleData().get("accountStatus"));
        assertEquals(true, loaded.moduleData().get("documentsSubmitted"));
        @SuppressWarnings("unchecked")
        Map<String, Object> loi = (Map<String, Object>) loaded.moduleData().get("loiDocument");
        assertEquals("Intent letter", loi.get("body"));

        persistenceService.mergeModuleKey(
                id,
                ApplicantPersistenceService.CASE_META_KEY,
                Map.of("accountStatus", "blocked"),
                null);

        ApplicantRecordDto after = persistenceService.findById(id).orElseThrow();
        assertEquals("blocked", after.moduleData().get("accountStatus"));
        assertEquals("123-456", after.moduleData().get("tinNumber"));
    }
}
