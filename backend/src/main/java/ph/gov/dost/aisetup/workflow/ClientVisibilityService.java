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

    /** Staff-draft keys hidden from applicants until {@code published == true}. */
    private static final List<String> PUBLISH_GATED_KEYS = List.of(
            "tna2Document",
            "tna2",
            "rtecReport",
            "conductRtec",
            "approvalLetter",
            "noticeOfApproval",
            "lbpIntroduction",
            "lbpIntroductionLetter");

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
        for (String key : PUBLISH_GATED_KEYS) {
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
     * Applicants hydrate a filtered blob (unpublished staff docs removed), so a
     * later whole-blob save from them must not erase those hidden staff drafts.
     * Re-injects gated keys from the stored record when missing from the incoming
     * payload. Staff saves pass through untouched.
     */
    public Map<String, Object> preserveHiddenModules(
            Map<String, Object> incoming, Map<String, Object> existing) {
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        if (principal.isStaff() || existing == null || existing.isEmpty()) {
            return incoming;
        }
        Map<String, Object> merged = new LinkedHashMap<>(incoming != null ? incoming : Map.of());
        for (String key : PUBLISH_GATED_KEYS) {
            if (!merged.containsKey(key) && existing.get(key) instanceof Map<?, ?>) {
                merged.put(key, existing.get(key));
            }
        }
        Object existingLandBank = existing.get("landBank");
        if (existingLandBank instanceof Map<?, ?> exLb
                && exLb.get("introductionLetter") instanceof Map<?, ?> letter) {
            Object incomingLandBank = merged.get("landBank");
            if (incomingLandBank instanceof Map<?, ?> inLb && !inLb.containsKey("introductionLetter")) {
                Map<String, Object> lbMerged = new LinkedHashMap<>();
                inLb.forEach((k, v) -> lbMerged.put(String.valueOf(k), v));
                lbMerged.put("introductionLetter", letter);
                merged.put("landBank", lbMerged);
            }
        }
        return merged;
    }
}
