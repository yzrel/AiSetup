/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class ModuleOrderSharedJsonTest {

    @Test
    void orderAnchorsMatchSharedContract() {
        assertEquals("prescreening", ModuleOrder.ORDER.get(0));
        assertEquals("completed", ModuleOrder.ORDER.get(ModuleOrder.ORDER.size() - 1));
        assertTrue(ModuleOrder.ORDER.size() >= 10);
        assertTrue(ModuleOrder.isKnown("approval-letter"));
        assertFalse(ModuleOrder.isKnown("not-a-real-module"));
        assertTrue(ModuleOrder.PUBLISH_GATED_KEYS.contains("approvalLetter"));
        assertTrue(ModuleOrder.STAFF_OWNED_MODULE_KEYS.contains("signedMoa"));
        assertTrue(ModuleOrder.STAFF_OWNED_MODULE_KEYS.contains("landBank"));
        assertTrue(ModuleOrder.isStaffOnlyModule("approvalLetter"));
        assertTrue(ModuleOrder.isStaffOnlyModule("landBank"));
    }
}
