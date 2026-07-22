/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import ph.gov.dost.aisetup.persistence.dto.Tna1FormSaveRequest;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ApplicantPersistenceServiceTest {

    @Autowired
    private ApplicantPersistenceService service;

    @Autowired
    private ApplicantRecordRepository repository;

    @Test
    void saveAndFindRoundTripPreservesModuleData() {
        ApplicantRecordDto saved = service.save(new ApplicantRecordDto(
                "app-1",
                "LOI-2026-000001",
                "ABC Food",
                "tna1",
                Map.of("tna1", Map.of("submitted", false)),
                Map.of("applicantName", "Juan"),
                null));

        assertEquals("app-1", saved.id());
        assertEquals("LOI-2026-000001", saved.applicationId());
        assertTrue(service.findById("app-1").isPresent());
        assertEquals("Juan", service.findById("app-1").orElseThrow().profile().get("applicantName"));
    }

    @Test
    void payloadOverLimitIsRejected() {
        Map<String, Object> huge = new HashMap<>();
        huge.put("blob", "x".repeat(ApplicantPersistenceService.MAX_PAYLOAD_CHARS));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.save(new ApplicantRecordDto(
                        "app-huge",
                        "LOI-2026-000099",
                        "Huge Co",
                        "tna1",
                        huge,
                        Map.of(),
                        null)));
        assertTrue(ex.getMessage().contains("moduleData"));
    }

    @Test
    void saveTna1MergesWithoutWipingSiblingKeys() {
        service.save(new ApplicantRecordDto(
                "app-tna",
                "LOI-2026-000010",
                "Merge Co",
                "tna1",
                Map.of(
                        "tna1", Map.of(
                                "staffReviewed", true,
                                "form", Map.of("old", "value")),
                        "selectedProgramId", "setup"),
                Map.of(),
                null));

        Tna1FormSaveRequest request = new Tna1FormSaveRequest();
        request.setApplicantId("app-tna");
        request.setForm(Map.of("mainProduct", "Cassava chips"));
        request.setTables(Map.of(
                "rawMaterials", List.of(List.of("Cassava")),
                "production", List.of(),
                "equipment", List.of()));
        request.setSubmitted(true);

        assertTrue(service.saveTna1("app-tna", request).ok());

        Map<String, Object> moduleData = service.findById("app-tna").orElseThrow().moduleData();
        assertEquals("setup", moduleData.get("selectedProgramId"));
        @SuppressWarnings("unchecked")
        Map<String, Object> tna1 = (Map<String, Object>) moduleData.get("tna1");
        assertEquals(true, tna1.get("staffReviewed"));
        assertEquals(true, tna1.get("submitted"));
        @SuppressWarnings("unchecked")
        Map<String, Object> form = (Map<String, Object>) tna1.get("form");
        assertEquals("Cassava chips", form.get("mainProduct"));
        assertFalse(form.containsKey("old"));
    }

    @Test
    void saveTna1MissingApplicantThrows() {
        Tna1FormSaveRequest request = new Tna1FormSaveRequest();
        request.setApplicantId("missing");
        request.setForm(Map.of());
        request.setTables(Map.of());
        assertThrows(NoSuchElementException.class, () -> service.saveTna1("missing", request));
    }

    @Test
    void corruptModuleDataJsonNormalizesOnRead() {
        ApplicantRecord entity = new ApplicantRecord();
        entity.setId("corrupt");
        entity.setApplicationId("LOI-2026-000077");
        entity.setEnterpriseName("Broken");
        entity.setModuleDataJson("{not-json");
        entity.setProfileJson("{}");
        repository.save(entity);

        ApplicantRecordDto dto = service.findById("corrupt").orElseThrow();
        assertTrue(dto.moduleData().isEmpty());
    }
}
