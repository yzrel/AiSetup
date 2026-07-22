/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.common;

/**
 * Null-safe text helpers shared by the document generation services
 * (previously copy-pasted into each service).
 */
public final class TextUtils {

    private TextUtils() {}

    /** Trimmed value, or "" when null. */
    public static String safe(String value) {
        return value == null ? "" : value.trim();
    }

    /** Trimmed string form of any value, or "" when null. */
    public static String stringVal(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    public static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    /** Object variant: Booleans are never blank (false is a real answer). */
    public static boolean isBlank(Object value) {
        if (value == null) return true;
        if (value instanceof Boolean) return false;
        return String.valueOf(value).trim().isEmpty();
    }

    /** First non-blank value (trimmed), or "" when all are blank. */
    public static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.trim().isEmpty()) return v.trim();
        }
        return "";
    }
}
