/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import java.util.List;
import java.util.Map;

/**
 * Server-side MODULE_ORDER mirrored from the FE applicantStore.
 */
public final class ModuleOrder {

    public static final List<String> ORDER = List.of(
            "prescreening",
            "registration",
            "letter-of-intent",
            "tna1",
            "tna2",
            "project-proposal",
            "requirements",
            "conduct-rtec",
            "approval-letter",
            "project-information-sheet",
            "landbank-withdrawal",
            "procurement-liquidation",
            "refund-delinquent",
            "project-closeout",
            "completed");

    private ModuleOrder() {}

    public static int indexOf(String module) {
        int idx = ORDER.indexOf(module);
        return idx < 0 ? 0 : idx;
    }

    public static boolean isKnown(String module) {
        return module != null && ORDER.contains(module);
    }

    /** Staff-only module keys that applicants must not mutate. */
    public static boolean isStaffOnlyModule(String moduleKey) {
        return "conduct-rtec".equals(moduleKey)
                || "rtecReport".equals(moduleKey)
                || "rtec".equals(moduleKey);
    }

    public static boolean isPublished(Map<String, Object> moduleData, String... paths) {
        if (moduleData == null) {
            return false;
        }
        Object cursor = moduleData;
        for (String path : paths) {
            if (!(cursor instanceof Map<?, ?> map)) {
                return false;
            }
            cursor = map.get(path);
        }
        if (cursor instanceof Boolean b) {
            return b;
        }
        if (cursor instanceof Map<?, ?> map) {
            Object published = map.get("published");
            return published instanceof Boolean b && b;
        }
        return false;
    }
}
