/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import java.util.List;
import java.util.Map;
import java.util.Set;

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

    /**
     * Staff-draft keys hidden from applicants until {@code published == true}.
     * Shared by visibility filtering.
     */
    public static final List<String> PUBLISH_GATED_KEYS = List.of(
            "tna2Document",
            "tna2",
            "rtecReport",
            "conductRtec",
            "approvalLetter",
            "noticeOfApproval",
            "lbpIntroduction",
            "lbpIntroductionLetter");

    /**
     * Keys applicants may never invent or overwrite on full PUT / module PATCH.
     * (Excludes {@code tna2} form data which applicants still edit.)
     * Note: {@code signedDocuments} is client-writable — wet-ink LOI / proposal /
     * TNA / withdrawal uploads belong to the applicant (or staff acting for them).
     * Staff-only attestation remains {@code signedMoa}.
     */
    public static final List<String> STAFF_OWNED_MODULE_KEYS = List.of(
            "tna2Document",
            "rtecReport",
            "conductRtec",
            "approvalLetter",
            "noticeOfApproval",
            "lbpIntroduction",
            "lbpIntroductionLetter",
            "signedMoa",
            "requirementStaffReview");

    /** Module keys applicants must not PATCH (staff owns these documents). */
    private static final Set<String> STAFF_ONLY_MODULE_KEYS = Set.of(
            "conduct-rtec",
            "rtecReport",
            "rtec",
            "conductRtec",
            "tna2Document",
            "approvalLetter",
            "noticeOfApproval",
            "lbpIntroduction",
            "lbpIntroductionLetter",
            "signedMoa");
    private ModuleOrder() {}

    public static int indexOf(String module) {
        int idx = ORDER.indexOf(module);
        return idx < 0 ? 0 : idx;
    }

    public static boolean isKnown(String module) {
        return module != null && ORDER.contains(module);
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
