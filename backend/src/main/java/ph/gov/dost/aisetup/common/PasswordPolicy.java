/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.common;

/**
 * Applicant registration password rules — mirrors FE {@code fieldValidators.passwordPolicy}.
 */
public final class PasswordPolicy {

    private PasswordPolicy() {}

    /**
     * @return first failing message, or null when the password meets policy
     */
    public static String validate(String password) {
        if (password == null || password.length() < 8) {
            return "Password must be at least 8 characters";
        }
        if (!password.chars().anyMatch(Character::isUpperCase)) {
            return "Password must contain an uppercase letter";
        }
        if (!password.chars().anyMatch(Character::isDigit)) {
            return "Password must contain a number";
        }
        return null;
    }

    public static void assertValid(String password) {
        String error = validate(password);
        if (error != null) {
            throw new IllegalArgumentException(error);
        }
    }
}
