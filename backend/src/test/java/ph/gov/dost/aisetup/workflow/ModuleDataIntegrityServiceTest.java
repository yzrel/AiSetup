/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import org.junit.jupiter.api.Test;

class ModuleDataIntegrityServiceTest {

    private final ModuleDataIntegrityService service = new ModuleDataIntegrityService();

    @Test
    void rejectsUnknownCurrentModule() {
        assertThrows(IllegalArgumentException.class, () -> service.assertCurrentModuleAllowed("not-real"));
        assertDoesNotThrow(() -> service.assertCurrentModuleAllowed(null));
        assertDoesNotThrow(() -> service.assertCurrentModuleAllowed("approval-letter"));
        assertDoesNotThrow(() -> service.assertCurrentModuleAllowed("project-information-sheet"));
    }

    @Test
    void objectModuleKeysLoadedFromSharedCatalog() {
        assertTrue(ModuleDataIntegrityService.OBJECT_REQUIRED_KEYS.contains("projectProposal"));
        assertTrue(ModuleDataIntegrityService.OBJECT_REQUIRED_KEYS.contains("tna2Document"));
        assertTrue(ModuleDataIntegrityService.OBJECT_REQUIRED_KEYS.contains("rtecReport"));
        assertTrue(ModuleDataIntegrityService.OBJECT_REQUIRED_KEYS.contains("procurement"));
        assertTrue(ModuleDataIntegrityService.OBJECT_REQUIRED_KEYS.contains("refund"));
        assertTrue(ModuleDataIntegrityService.OBJECT_REQUIRED_KEYS.contains("projectCloseOut"));
        assertTrue(ModuleDataIntegrityService.OBJECT_REQUIRED_KEYS.contains("financialProjection"));
        assertFalse(ModuleDataIntegrityService.OBJECT_REQUIRED_KEYS.contains("coreProducts"));
    }

    @Test
    void rejectsNonObjectKnownKeys() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.assertModuleDataShapes(Map.of("approvalLetter", "bad")));
        assertThrows(
                IllegalArgumentException.class,
                () -> service.assertModuleDataShapes(Map.of("tna1", 12)));
        assertThrows(
                IllegalArgumentException.class,
                () -> service.assertModuleDataShapes(Map.of("projectProposal", "bad")));
        assertThrows(
                IllegalArgumentException.class,
                () -> service.assertModuleDataShapes(Map.of("rtecReport", 1)));
        assertDoesNotThrow(() -> service.assertModuleDataShapes(Map.of("approvalLetter", Map.of("published", true))));
        assertDoesNotThrow(() -> service.assertModuleDataShapes(Map.of("coreProducts", "ok-scalar")));
    }

    @Test
    void rejectsNonBooleanPublishedAndBadForm() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.assertModuleDataShapes(
                        Map.of("approvalLetter", Map.of("published", "yes"))));
        assertThrows(
                IllegalArgumentException.class,
                () -> service.assertModuleDataShapes(
                        Map.of("tna2Document", Map.of("published", "yes"))));
        assertThrows(
                IllegalArgumentException.class,
                () -> service.assertModuleDataShapes(
                        Map.of("approvalLetter", Map.of("form", "not-object"))));
        assertThrows(
                IllegalArgumentException.class,
                () -> service.assertModuleDataShapes(
                        Map.of("projectProposal", Map.of("form", "x", "submitted", true))));
        assertThrows(
                IllegalArgumentException.class,
                () -> service.assertModuleDataShapes(
                        Map.of("procurement", Map.of("form", Map.of(), "submitted", "yes"))));
        assertDoesNotThrow(() -> service.assertModuleDataShapes(
                Map.of("projectProposal", Map.of("form", Map.of("title", "P"), "submitted", false))));
        assertDoesNotThrow(() -> service.assertModulePatchShape(
                "rtecReport", Map.of("published", true, "form", Map.of())));
    }
}
