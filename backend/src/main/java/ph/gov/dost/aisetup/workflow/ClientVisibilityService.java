/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.auth.SecurityUtils;
import ph.gov.dost.aisetup.auth.UserPrincipal;
import ph.gov.dost.aisetup.persistence.ApplicantRecordDto;

/**
 * Ensures applicants only see staff-authored documents after publish.
 * Staff always receive the full moduleData blob.
 */
@Service
public class ClientVisibilityService {

    public ApplicantRecordDto forViewer(ApplicantRecordDto dto) {
        if (dto == null) {
            return null;
        }
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        if (principal.isStaff()) {
            return dto;
        }
        return new ApplicantRecordDto(
                dto.id(),
                dto.applicationId(),
                dto.enterpriseName(),
                dto.currentModule(),
                filterModuleData(dto.moduleData()),
                dto.profile(),
                dto.updatedAt());
    }

    private Map<String, Object> filterModuleData(Map<String, Object> moduleData) {
        if (moduleData == null || moduleData.isEmpty()) {
            return moduleData != null ? moduleData : Map.of();
        }
        Map<String, Object> filtered = new LinkedHashMap<>(moduleData);
        for (String key : ModuleOrder.PUBLISH_GATED_KEYS) {
            Object value = filtered.get(key);
            if (value instanceof Map<?, ?> map && !isPublished(map)) {
                filtered.remove(key);
            }
        }
        // LBP introduction letter is nested under landBank.introductionLetter.
        Object landBank = filtered.get("landBank");
        if (landBank instanceof Map<?, ?> lbMap
                && lbMap.get("introductionLetter") instanceof Map<?, ?> letter
                && !isPublished(letter)) {
            Map<String, Object> lbFiltered = new LinkedHashMap<>();
            lbMap.forEach((k, v) -> lbFiltered.put(String.valueOf(k), v));
            lbFiltered.remove("introductionLetter");
            filtered.put("landBank", lbFiltered);
        }
        return filtered;
    }

    private boolean isPublished(Map<?, ?> map) {
        return map.get("published") instanceof Boolean b && b;
    }

    /**
     * Once a publish-gated document is published, stale client payloads must not
     * demote {@code published} back to false. There is no unpublish API.
     */
    public Map<String, Object> preservePublishedFlags(
            Map<String, Object> incoming, Map<String, Object> existing) {
        if (incoming == null || existing == null || existing.isEmpty()) {
            return incoming;
        }
        Map<String, Object> merged = new LinkedHashMap<>(incoming);
        for (String key : ModuleOrder.PUBLISH_GATED_KEYS) {
            restorePublishedMap(merged, existing, key);
        }
        Object existingLandBank = existing.get("landBank");
        Object incomingLandBank = merged.get("landBank");
        if (existingLandBank instanceof Map<?, ?> exLb
                && incomingLandBank instanceof Map<?, ?> inLb
                && exLb.get("introductionLetter") instanceof Map<?, ?> exLetter
                && isPublished(exLetter)) {
            Map<String, Object> lbMerged = new LinkedHashMap<>();
            inLb.forEach((k, v) -> lbMerged.put(String.valueOf(k), v));
            Object inLetter = lbMerged.get("introductionLetter");
            if (!(inLetter instanceof Map<?, ?> inMap && isPublished(inMap))) {
                Map<String, Object> restored = new LinkedHashMap<>();
                if (inLetter instanceof Map<?, ?> partial) {
                    partial.forEach((k, v) -> restored.put(String.valueOf(k), v));
                }
                restored.put("published", true);
                if (exLetter.get("publishedAt") != null) {
                    restored.put("publishedAt", exLetter.get("publishedAt"));
                }
                lbMerged.put("introductionLetter", restored);
            }
            merged.put("landBank", lbMerged);
        }
        return merged;
    }

    private void restorePublishedMap(
            Map<String, Object> merged, Map<String, Object> existing, String key) {
        Object existingValue = existing.get(key);
        if (!(existingValue instanceof Map<?, ?> exMap) || !isPublished(exMap)) {
            return;
        }
        Object incomingValue = merged.get(key);
        if (incomingValue instanceof Map<?, ?> inMap && isPublished(inMap)) {
            return;
        }
        Map<String, Object> restored = new LinkedHashMap<>();
        if (incomingValue instanceof Map<?, ?> partial) {
            partial.forEach((k, v) -> restored.put(String.valueOf(k), v));
        } else if (existingValue instanceof Map<?, ?> full) {
            full.forEach((k, v) -> restored.put(String.valueOf(k), v));
            merged.put(key, restored);
            return;
        }
        restored.put("published", true);
        if (exMap.get("publishedAt") != null) {
            restored.put("publishedAt", exMap.get("publishedAt"));
        } else if (!restored.containsKey("publishedAt")) {
            // keep any publishedAt already in partial; otherwise leave unset
        }
        merged.put(key, restored);
    }

    /**
     * Applicants hydrate a filtered blob (unpublished staff docs removed), so a
     * later whole-blob save from them must not erase or overwrite those drafts.
     * Staff-owned keys always come from the stored record when present; applicants
     * cannot invent them. Nested LandBank staff fields are similarly protected.
     */
    public Map<String, Object> preserveHiddenModules(
            Map<String, Object> incoming, Map<String, Object> existing) {
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        if (principal.isStaff()) {
            return preservePublishedFlags(incoming, existing);
        }
        Map<String, Object> merged = new LinkedHashMap<>(incoming != null ? incoming : Map.of());
        // Always strip applicant-forged MOA attestation; restore from stored only.
        for (String key : ModuleOrder.STAFF_OWNED_MODULE_KEYS) {
            if (existing != null && existing.get(key) instanceof Map<?, ?>) {
                merged.put(key, existing.get(key));
            } else {
                merged.remove(key);
            }
        }
        // Publish-gated keys that are not staff-owned (e.g. tna2) are filtered from
        // applicant hydration while unpublished — a missing key on their whole-blob
        // save means "never seen", not "deleted", so restore the staff draft.
        for (String key : ModuleOrder.PUBLISH_GATED_KEYS) {
            if (!merged.containsKey(key)
                    && existing != null
                    && existing.get(key) instanceof Map<?, ?>) {
                merged.put(key, existing.get(key));
            }
        }
        Object existingLandBank = existing != null ? existing.get("landBank") : null;
        Object incomingLandBank = merged.get("landBank");
        if (incomingLandBank instanceof Map<?, ?> inLb) {
            Map<String, Object> lbMerged = new LinkedHashMap<>();
            inLb.forEach((k, v) -> lbMerged.put(String.valueOf(k), v));
            lbMerged.remove("signedMoa");
            lbMerged.remove("signedMoaSnapshot");
            lbMerged.remove("introductionLetter");
            if (existingLandBank instanceof Map<?, ?> exLb) {
                if (exLb.get("introductionLetter") instanceof Map<?, ?> letter) {
                    lbMerged.put("introductionLetter", letter);
                }
                if (exLb.containsKey("signedMoa")) {
                    lbMerged.put("signedMoa", exLb.get("signedMoa"));
                }
                if (exLb.containsKey("signedMoaSnapshot")) {
                    lbMerged.put("signedMoaSnapshot", exLb.get("signedMoaSnapshot"));
                }
            }
            merged.put("landBank", lbMerged);
        } else if (existingLandBank instanceof Map<?, ?>) {
            merged.put("landBank", existingLandBank);
        }
        return preservePublishedFlags(merged, existing);
    }
}
