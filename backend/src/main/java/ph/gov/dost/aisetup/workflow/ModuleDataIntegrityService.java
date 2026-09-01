/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

/**
 * Envelope and known-key shape guards for applicant moduleData writes.
 * Unknown keys remain allowed for legacy tolerance.
 */
@Service
public class ModuleDataIntegrityService {

    /** Keys that must be JSON objects when present (from shared/module-keys.json). */
    public static final Set<String> OBJECT_REQUIRED_KEYS;

    /** Publish-document style keys that get published/form field checks. */
    private static final Set<String> PUBLISH_DOCUMENT_KEYS;

    static {
        JsonNode keys = SharedJson.readTree("shared/module-keys.json");
        List<String> objectKeys = SharedJson.stringList(keys.get("objectModuleKeys"));
        if (objectKeys.isEmpty()) {
            // Fallback union if catalog missing during partial deploys.
            Set<String> fallback = new LinkedHashSet<>();
            fallback.addAll(ModuleOrder.PUBLISH_GATED_KEYS);
            fallback.addAll(ModuleOrder.STAFF_OWNED_MODULE_KEYS);
            fallback.add("loiDocument");
            fallback.add("tna1");
            fallback.add("projectProposal");
            fallback.add("financialProjection");
            fallback.add("landBank");
            fallback.add("signedDocuments");
            fallback.add("procurement");
            fallback.add("refund");
            fallback.add("projectCloseOut");
            OBJECT_REQUIRED_KEYS = Set.copyOf(fallback);
        } else {
            OBJECT_REQUIRED_KEYS = Set.copyOf(new LinkedHashSet<>(objectKeys));
        }
        Set<String> publishDocs = new LinkedHashSet<>(ModuleOrder.PUBLISH_GATED_KEYS);
        publishDocs.add("projectProposal");
        publishDocs.add("signedMoa");
        publishDocs.add("requirementStaffReview");
        PUBLISH_DOCUMENT_KEYS = Set.copyOf(publishDocs);
    }

    /**
     * Validates currentModule when provided (null/blank allowed).
     * Legacy PIS is normalized before the known-module check.
     */
    public void assertCurrentModuleAllowed(String currentModule) {
        if (currentModule == null || currentModule.isBlank()) {
            return;
        }
        String normalized = ModuleOrder.normalize(currentModule);
        if (!ModuleOrder.isKnown(normalized)) {
            throw new IllegalArgumentException("Unknown module: " + currentModule);
        }
    }

    public void assertModuleDataShapes(Map<String, Object> moduleData) {
        if (moduleData == null || moduleData.isEmpty()) {
            return;
        }
        for (String key : OBJECT_REQUIRED_KEYS) {
            if (!moduleData.containsKey(key)) {
                continue;
            }
            Object value = moduleData.get(key);
            if (value == null) {
                continue;
            }
            if (!(value instanceof Map<?, ?>)) {
                throw new IllegalArgumentException(
                        "moduleData." + key + " must be a JSON object when present");
            }
        }
        for (String key : PUBLISH_DOCUMENT_KEYS) {
            if (moduleData.containsKey(key)) {
                assertPublishedDocumentShape(moduleData.get(key), key);
            }
        }
        // Client modules with form/submitted conventions.
        assertFormModuleShape(moduleData.get("projectProposal"), "projectProposal");
        assertFormModuleShape(moduleData.get("tna1"), "tna1");
        assertFormModuleShape(moduleData.get("procurement"), "procurement");
        assertFormModuleShape(moduleData.get("refund"), "refund");
        assertFormModuleShape(moduleData.get("projectCloseOut"), "projectCloseOut");

        Object landBank = moduleData.get("landBank");
        if (landBank instanceof Map<?, ?> lb) {
            Object intro = lb.get("introductionLetter");
            if (intro != null) {
                if (!(intro instanceof Map<?, ?>)) {
                    throw new IllegalArgumentException(
                            "moduleData.landBank.introductionLetter must be a JSON object when present");
                }
                assertPublishedDocumentShape(intro, "landBank.introductionLetter");
            }
        }
        Object procurement = moduleData.get("procurement");
        if (procurement instanceof Map<?, ?> proc) {
            Object untag = proc.get("untagLetter");
            if (untag != null) {
                if (!(untag instanceof Map<?, ?>)) {
                    throw new IllegalArgumentException(
                            "moduleData.procurement.untagLetter must be a JSON object when present");
                }
                assertPublishedDocumentShape(untag, "procurement.untagLetter");
            }
        }
    }

    public void assertModulePatchShape(String moduleKey, Map<String, Object> data) {
        if (moduleKey == null || moduleKey.isBlank() || data == null) {
            return;
        }
        if (OBJECT_REQUIRED_KEYS.contains(moduleKey)) {
            assertPublishedDocumentShape(data, moduleKey);
            assertFormModuleShape(data, moduleKey);
        }
        if ("landBank".equals(moduleKey) && data.get("introductionLetter") != null) {
            Object intro = data.get("introductionLetter");
            if (!(intro instanceof Map<?, ?>)) {
                throw new IllegalArgumentException(
                        "moduleData.landBank.introductionLetter must be a JSON object when present");
            }
            assertPublishedDocumentShape(intro, "landBank.introductionLetter");
        }
        if ("procurement".equals(moduleKey) && data.get("untagLetter") != null) {
            Object untag = data.get("untagLetter");
            if (!(untag instanceof Map<?, ?>)) {
                throw new IllegalArgumentException(
                        "moduleData.procurement.untagLetter must be a JSON object when present");
            }
            assertPublishedDocumentShape(untag, "procurement.untagLetter");
        }
    }

    private void assertFormModuleShape(Object value, String path) {
        if (!(value instanceof Map<?, ?> map)) {
            return;
        }
        if (map.containsKey("form") && map.get("form") != null
                && !(map.get("form") instanceof Map<?, ?>)) {
            throw new IllegalArgumentException(path + ".form must be a JSON object when present");
        }
        if (map.containsKey("submitted") && map.get("submitted") != null
                && !(map.get("submitted") instanceof Boolean)) {
            throw new IllegalArgumentException(path + ".submitted must be a boolean when present");
        }
    }

    private void assertPublishedDocumentShape(Object value, String path) {
        if (!(value instanceof Map<?, ?> map)) {
            return;
        }
        if (map.containsKey("published") && map.get("published") != null
                && !(map.get("published") instanceof Boolean)) {
            throw new IllegalArgumentException(path + ".published must be a boolean when present");
        }
        if (map.containsKey("form") && map.get("form") != null
                && !(map.get("form") instanceof Map<?, ?>)) {
            throw new IllegalArgumentException(path + ".form must be a JSON object when present");
        }
    }
}
