/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.notification;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class NotificationTargetRolesTest {

    @Test
    void serializesRolesAsJsonArray() {
        assertEquals(
                "[\"regional-director\"]",
                NotificationService.serializeTargetRoles(List.of("regional-director")));
    }

    @Test
    void normalizesCaseAndDropsBlanksAndDuplicates() {
        assertEquals(
                "[\"agent\",\"provincial-director\"]",
                NotificationService.serializeTargetRoles(
                        List.of("Agent", "  ", "provincial-director", "AGENT")));
    }

    @Test
    void emptyRolesSerializeToNullSoLegacyBroadcastIsPreserved() {
        assertNull(NotificationService.serializeTargetRoles(List.of()));
        assertNull(NotificationService.serializeTargetRoles(null));
        assertNull(NotificationService.serializeTargetRoles(List.of("   ")));
    }

    @Test
    void parsesJsonArrayColumn() {
        assertEquals(
                List.of("rtec-staff"),
                NotificationService.parseTargetRoles("[\"rtec-staff\"]"));
    }

    @Test
    void nullOrBlankColumnMeansNoTargeting() {
        assertTrue(NotificationService.parseTargetRoles(null).isEmpty());
        assertTrue(NotificationService.parseTargetRoles("").isEmpty());
        assertTrue(NotificationService.parseTargetRoles("   ").isEmpty());
    }

    /** Hand-edited rows should still narrow the audience rather than broadcast. */
    @Test
    void parsesCommaSeparatedFallback() {
        assertEquals(
                List.of("agent", "provincial-director"),
                NotificationService.parseTargetRoles("agent, provincial-director"));
    }

    @Test
    void roundTripsThroughSerializeAndParse() {
        String raw = NotificationService.serializeTargetRoles(List.of("regional-director"));
        assertEquals(List.of("regional-director"), NotificationService.parseTargetRoles(raw));
    }
}
