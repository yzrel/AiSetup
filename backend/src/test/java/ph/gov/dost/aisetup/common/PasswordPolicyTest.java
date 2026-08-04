/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.common;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class PasswordPolicyTest {

    @Test
    void acceptsStrongPassword() {
        assertNull(PasswordPolicy.validate("GoodPass1"));
        assertDoesNotThrow(() -> PasswordPolicy.assertValid("GoodPass1"));
    }

    @Test
    void rejectsWeakPasswordsWithFeMessages() {
        assertEquals("Password must be at least 8 characters", PasswordPolicy.validate("Ab1"));
        assertEquals(
                "Password must contain an uppercase letter", PasswordPolicy.validate("goodpass1"));
        assertEquals("Password must contain a number", PasswordPolicy.validate("GoodPass"));
        assertThrows(IllegalArgumentException.class, () -> PasswordPolicy.assertValid("weak"));
    }
}
