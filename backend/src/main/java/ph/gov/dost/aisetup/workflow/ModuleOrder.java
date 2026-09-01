/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Server-side MODULE_ORDER and staff/publish key lists loaded from
 * {@code shared/module-order.json} and {@code shared/module-keys.json}.
 */
public final class ModuleOrder {

    public static final List<String> ORDER;
    public static final List<String> PUBLISH_GATED_KEYS;
    public static final List<String> STAFF_OWNED_MODULE_KEYS;
    private static final Set<String> STAFF_ONLY_MODULE_KEYS;

    static {
        ORDER = SharedJson.stringList(SharedJson.readTree("shared/module-order.json"));
        JsonNode keys = SharedJson.readTree("shared/module-keys.json");
        PUBLISH_GATED_KEYS = SharedJson.stringList(keys.get("publishGatedKeys"));
        STAFF_OWNED_MODULE_KEYS = SharedJson.stringList(keys.get("staffOwnedModuleKeys"));
        STAFF_ONLY_MODULE_KEYS = Set.copyOf(new HashSet<>(SharedJson.stringList(keys.get("staffOnlyPatchKeys"))));
        if (ORDER.isEmpty()) {
            throw new IllegalStateException("shared/module-order.json produced an empty MODULE_ORDER");
        }
    }

    private ModuleOrder() {}

    /** Legacy PIS module removed from the critical path; treat as LandBank. */
    public static final String LEGACY_PIS_MODULE = "project-information-sheet";

    public static String normalize(String module) {
        if (LEGACY_PIS_MODULE.equals(module)) {
            return "landbank-withdrawal";
        }
        return module;
    }

    public static int indexOf(String module) {
        int idx = ORDER.indexOf(normalize(module));
        return idx < 0 ? 0 : idx;
    }

    /** Module keys RTEC committee members may PATCH (Form 002 only). */
    public static boolean isRtecStaffWritableModuleKey(String moduleKey) {
        if (moduleKey == null || moduleKey.isBlank()) {
            return false;
        }
        return switch (moduleKey) {
            case "rtecReport", "conduct-rtec", "conductRtec", "rtec" -> true;
            default -> false;
        };
    }

    public static boolean isKnown(String module) {
        String normalized = normalize(module);
        return normalized != null && ORDER.contains(normalized);
    }

    /** Staff-only module keys that applicants must not mutate via module PATCH. */
    public static boolean isStaffOnlyModule(String moduleKey) {
        return moduleKey != null && STAFF_ONLY_MODULE_KEYS.contains(moduleKey);
    }

    public static boolean isPublishGatedKey(String moduleKey) {
        return moduleKey != null && PUBLISH_GATED_KEYS.contains(moduleKey);
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
