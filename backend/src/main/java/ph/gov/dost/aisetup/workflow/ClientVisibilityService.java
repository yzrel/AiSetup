/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import java.util.LinkedHashMap;
import java.util.List;
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

    private static final List<String> APPLICANT_TRANCHE_KEYS = List.of("first", "second", "third");

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
        // Letter to Untag is nested under procurement.untagLetter.
        Object procurement = filtered.get("procurement");
        if (procurement instanceof Map<?, ?> procMap
                && procMap.get("untagLetter") instanceof Map<?, ?> untag
                && !isPublished(untag)) {
            Map<String, Object> procFiltered = new LinkedHashMap<>();
            procMap.forEach((k, v) -> procFiltered.put(String.valueOf(k), v));
            procFiltered.remove("untagLetter");
            filtered.put("procurement", procFiltered);
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
        Object existingProcurement = existing.get("procurement");
        Object incomingProcurement = merged.get("procurement");
        if (existingProcurement instanceof Map<?, ?> exProc
                && incomingProcurement instanceof Map<?, ?> inProc
                && exProc.get("untagLetter") instanceof Map<?, ?> exUntag
                && isPublished(exUntag)) {
            Map<String, Object> procMerged = new LinkedHashMap<>();
            inProc.forEach((k, v) -> procMerged.put(String.valueOf(k), v));
            Object inUntag = procMerged.get("untagLetter");
            if (!(inUntag instanceof Map<?, ?> inMap && isPublished(inMap))) {
                Map<String, Object> restored = new LinkedHashMap<>();
                if (inUntag instanceof Map<?, ?> partial) {
                    partial.forEach((k, v) -> restored.put(String.valueOf(k), v));
                }
                restored.put("published", true);
                if (exUntag.get("publishedAt") != null) {
                    restored.put("publishedAt", exUntag.get("publishedAt"));
                }
                procMerged.put("untagLetter", restored);
            }
            merged.put("procurement", procMerged);
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
            if ("landBank".equals(key)) {
                continue;
            }
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
        if (existingLandBank instanceof Map<?, ?> exLb) {
            if (incomingLandBank instanceof Map<?, ?> inLb) {
                merged.put("landBank", mergeLandBankForApplicant(inLb, exLb));
            } else {
                merged.put("landBank", existingLandBank);
            }
        } else {
            merged.remove("landBank");
        }
        // Applicants must not invent or demote staff Letter to Untag drafts.
        Object existingProcurement = existing != null ? existing.get("procurement") : null;
        Object incomingProcurement = merged.get("procurement");
        if (existingProcurement instanceof Map<?, ?> exProc
                && incomingProcurement instanceof Map<?, ?> inProc) {
            Map<String, Object> procMerged = new LinkedHashMap<>();
            inProc.forEach((k, v) -> procMerged.put(String.valueOf(k), v));
            if (exProc.get("untagLetter") != null) {
                procMerged.put("untagLetter", exProc.get("untagLetter"));
            } else {
                procMerged.remove("untagLetter");
            }
            merged.put("procurement", procMerged);
        }
        return preservePublishedFlags(merged, existing);
    }

    /**
     * Applicants may update withdrawal tranche supplier blocks and equipment only.
     * Staff-owned LandBank fields (account snapshot, signed letters, intro letter, submit flags) stay on the stored record.
     */
    private Map<String, Object> mergeLandBankForApplicant(
            Map<?, ?> incomingLb, Map<?, ?> existingLb) {
        Map<String, Object> merged = new LinkedHashMap<>();
        existingLb.forEach((k, v) -> merged.put(String.valueOf(k), v));

        Object incomingForm = incomingLb.get("form");
        if (!(incomingForm instanceof Map<?, ?> incomingFormMap)) {
            return merged;
        }

        Map<String, Object> formMerged = new LinkedHashMap<>();
        Object existingForm = existingLb.get("form");
        if (existingForm instanceof Map<?, ?> existingFormMap) {
            existingFormMap.forEach((k, v) -> formMerged.put(String.valueOf(k), v));
        }

        Object incomingTranches = incomingFormMap.get("tranches");
        if (incomingTranches instanceof Map<?, ?> incomingTranchesMap) {
            Map<String, Object> tranchesMerged = new LinkedHashMap<>();
            Object existingTranches = formMerged.get("tranches");
            if (existingTranches instanceof Map<?, ?> existingTranchesMap) {
                existingTranchesMap.forEach((k, v) -> tranchesMerged.put(String.valueOf(k), v));
            }
            for (String trancheKey : APPLICANT_TRANCHE_KEYS) {
                Object incomingPack = incomingTranchesMap.get(trancheKey);
                if (!(incomingPack instanceof Map<?, ?> incomingPackMap)) {
                    continue;
                }
                Map<String, Object> packMerged = new LinkedHashMap<>();
                Object existingPack = tranchesMerged.get(trancheKey);
                if (existingPack instanceof Map<?, ?> existingPackMap) {
                    existingPackMap.forEach((k, v) -> packMerged.put(String.valueOf(k), v));
                }
                if (incomingPackMap.get("suppliers") != null) {
                    packMerged.put("suppliers", incomingPackMap.get("suppliers"));
                }
                if (incomingPackMap.containsKey("selectedSupplierId")) {
                    packMerged.put("selectedSupplierId", incomingPackMap.get("selectedSupplierId"));
                }
                tranchesMerged.put(trancheKey, packMerged);
            }
            formMerged.put("tranches", tranchesMerged);
        }

        merged.put("form", formMerged);
        merged.remove("signedMoa");
        merged.remove("signedMoaSnapshot");
        if (existingLb.get("introductionLetter") != null) {
            merged.put("introductionLetter", existingLb.get("introductionLetter"));
        }
        if (existingLb.containsKey("submitted")) {
            merged.put("submitted", existingLb.get("submitted"));
        }
        if (existingLb.containsKey("submittedAt")) {
            merged.put("submittedAt", existingLb.get("submittedAt"));
        }
        if (existingLb.containsKey("submittedBy")) {
            merged.put("submittedBy", existingLb.get("submittedBy"));
        }
        return merged;
    }
}
