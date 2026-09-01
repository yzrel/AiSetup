/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.auth.SecurityUtils;
import ph.gov.dost.aisetup.auth.UserPrincipal;
import ph.gov.dost.aisetup.common.TextUtils;
import ph.gov.dost.aisetup.config.AisetupProperties;
import ph.gov.dost.aisetup.files.FileUploadRepository;
import ph.gov.dost.aisetup.persistence.ApplicantRecordDto;

@Service
public class WorkflowGateService {

    /** Server-side MOA attestation: staff upload under this module key. */
    public static final String SIGNED_MOA_MODULE_KEY = "signedMoa";

    private final AisetupProperties properties;
    private final FileUploadRepository fileUploadRepository;

    public WorkflowGateService(AisetupProperties properties, FileUploadRepository fileUploadRepository) {
        this.properties = properties;
        this.fileUploadRepository = fileUploadRepository;
    }

    public boolean isDemoBypassAllowed() {
        return properties.isDemoModeEnabled();
    }

    /**
     * Validates module progression on full applicant save.
     * Staff may advance freely; applicants may only move forward one step at a time
     * unless demo bypass is enabled on the server.
     * Program-referral and MPEX branch caps match FE {@code applicantProgress} locks.
     */
    public void assertSaveAllowed(ApplicantRecordDto incoming, ApplicantRecordDto existing) {
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        SecurityUtils.requireCanAccessApplicant(incoming.id());

        if (principal.isRtecStaff()) {
            assertRtecStaffSave(incoming, existing);
            return;
        }
        if (principal.isStaff()) {
            return;
        }

        if (existing == null) {
            // New registration — allow early modules only.
            String module = incoming.currentModule();
            if (module != null
                    && ModuleOrder.indexOf(module) > ModuleOrder.indexOf("registration")) {
                throw new AccessDeniedException("Applicants cannot create cases past registration");
            }
            return;
        }

        String from = ModuleOrder.normalize(existing.currentModule());
        String to = ModuleOrder.normalize(incoming.currentModule());
        if (to == null || to.equals(from)) {
            return;
        }
        if (!ModuleOrder.isKnown(to)) {
            throw new IllegalArgumentException("Unknown module: " + to);
        }
        int fromIdx = ModuleOrder.indexOf(from);
        int toIdx = ModuleOrder.indexOf(to);
        if (toIdx > fromIdx + 1
                && !isDemoBypassAllowed()
                && !isAllowedProgramReferralJump(from, to, incoming, existing)) {
            throw new AccessDeniedException(
                    "Cannot skip modules: current=" + from + ", requested=" + to);
        }
        assertBranchCaps(to, incoming, existing);
        assertPublishGates(to, existing.moduleData(), existing.currentModule());
        assertRdApprovalGate(to, existing.moduleData());
    }

    /**
     * Unqualified applicants pick a recommended program and jump from pre-screening
     * to the program LOI (skipping SETUP enterprise registration).
     */
    private boolean isAllowedProgramReferralJump(
            String from,
            String to,
            ApplicantRecordDto incoming,
            ApplicantRecordDto existing) {
        if (!"prescreening".equals(from) || !"letter-of-intent".equals(to)) {
            return false;
        }
        return isOnProgramReferralTrack(incoming, existing);
    }

    /**
     * Caps module advancement for alternate tracks (mirrors FE view locks).
     */
    private void assertBranchCaps(
            String targetModule, ApplicantRecordDto incoming, ApplicantRecordDto existing) {
        if (isDemoBypassAllowed()) {
            return;
        }
        int targetIdx = ModuleOrder.indexOf(targetModule);
        if (isOnProgramReferralTrack(incoming, existing)
                && targetIdx > ModuleOrder.indexOf("letter-of-intent")) {
            throw new AccessDeniedException(
                    "Program referral track cannot advance past letter-of-intent");
        }
        if (isRoutedToMpex(incoming, existing)
                && targetIdx > ModuleOrder.indexOf("requirements")) {
            throw new AccessDeniedException(
                    "MPEX-routed cases cannot advance into the SETUP funding pipeline");
        }
    }

    private static boolean isOnProgramReferralTrack(
            ApplicantRecordDto incoming, ApplicantRecordDto existing) {
        if (isQualified(incoming, existing)) {
            return false;
        }
        String programId = firstNonBlank(
                stringField(moduleDataOf(incoming), "selectedProgramId"),
                stringField(moduleDataOf(existing), "selectedProgramId"));
        return !TextUtils.isBlank(programId);
    }

    private static boolean isRoutedToMpex(
            ApplicantRecordDto incoming, ApplicantRecordDto existing) {
        String routing = firstNonBlank(
                stringField(moduleDataOf(incoming), "routingDecision"),
                stringField(moduleDataOf(existing), "routingDecision"));
        return "mpex".equalsIgnoreCase(routing);
    }

    private static boolean isQualified(
            ApplicantRecordDto incoming, ApplicantRecordDto existing) {
        Boolean fromIncoming = asBoolean(profileOf(incoming).get("qualified"));
        if (fromIncoming != null) {
            return fromIncoming;
        }
        return Boolean.TRUE.equals(asBoolean(profileOf(existing).get("qualified")));
    }

    private static Map<String, Object> moduleDataOf(ApplicantRecordDto dto) {
        if (dto == null || dto.moduleData() == null) {
            return Collections.emptyMap();
        }
        return dto.moduleData();
    }

    private static Map<String, Object> profileOf(ApplicantRecordDto dto) {
        if (dto == null || dto.profile() == null) {
            return Collections.emptyMap();
        }
        return dto.profile();
    }

    private static String stringField(Map<String, Object> map, String key) {
        if (map == null) {
            return "";
        }
        return TextUtils.stringVal(map.get(key));
    }

    private static String firstNonBlank(String... values) {
        return TextUtils.firstNonBlank(values);
    }

    private static Boolean asBoolean(Object value) {
        if (value instanceof Boolean b) {
            return b;
        }
        return null;
    }

    public void assertStaffOnlyModuleWrite(String moduleKey) {
        if (ModuleOrder.isStaffOnlyModule(moduleKey)) {
            SecurityUtils.requireStaff();
        }
    }

    /**
     * RTEC staff may only write Form 002 keys, assessments (Mark Complete),
     * or caseMeta when only {@code assessments} changed.
     */
    public void assertRtecStaffModuleWrite(
            String moduleKey, Map<String, Object> data, ApplicantRecordDto existing) {
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        if (!principal.isRtecStaff()) {
            return;
        }
        if (ModuleOrder.isRtecStaffWritableModuleKey(moduleKey)) {
            return;
        }
        if ("assessments".equals(moduleKey)) {
            return;
        }
        if (ph.gov.dost.aisetup.persistence.ApplicantPersistenceService.CASE_META_KEY.equals(
                moduleKey)) {
            assertRtecStaffCaseMetaOnlyAssessments(data, existing);
            return;
        }
        throw new AccessDeniedException(
                "RTEC staff can only update the RTEC report (SETUP Form 002)");
    }

    public void assertRtecStaffNotTna1Write() {
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        if (principal.isRtecStaff()) {
            throw new AccessDeniedException("RTEC staff cannot edit TNA Form 01");
        }
    }

    public void assertRtecStaffNotFileUpload() {
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        if (principal.isRtecStaff()) {
            throw new AccessDeniedException("RTEC staff cannot upload files");
        }
    }

    private void assertRtecStaffSave(ApplicantRecordDto incoming, ApplicantRecordDto existing) {
        if (existing == null) {
            throw new AccessDeniedException("RTEC staff cannot create applicant cases");
        }
        if (incoming.enterpriseName() != null
                && !incoming.enterpriseName().equals(existing.enterpriseName())) {
            throw new AccessDeniedException("RTEC staff cannot change enterprise profile");
        }
        String from = ModuleOrder.normalize(existing.currentModule());
        String to = ModuleOrder.normalize(incoming.currentModule());
        if (to != null && !to.equals(from)) {
            boolean allowedJump =
                    "conduct-rtec".equals(from) && "approval-letter".equals(to);
            if (!allowedJump) {
                throw new AccessDeniedException(
                        "RTEC staff can only advance cases from Conduct of RTEC to Approval Letter");
            }
        }
        Map<String, Object> incomingMd =
                incoming.moduleData() != null ? incoming.moduleData() : Map.of();
        Map<String, Object> existingMd =
                existing.moduleData() != null ? existing.moduleData() : Map.of();
        Set<String> keys = new HashSet<>();
        keys.addAll(incomingMd.keySet());
        keys.addAll(existingMd.keySet());
        for (String key : keys) {
            if (ModuleOrder.isRtecStaffWritableModuleKey(key) || "assessments".equals(key)) {
                continue;
            }
            if (!Objects.equals(incomingMd.get(key), existingMd.get(key))) {
                throw new AccessDeniedException("RTEC staff cannot modify module: " + key);
            }
        }
    }

    private void assertRtecStaffCaseMetaOnlyAssessments(
            Map<String, Object> data, ApplicantRecordDto existing) {
        if (data == null || data.isEmpty()) {
            return;
        }
        Map<String, Object> existingMd =
                existing != null && existing.moduleData() != null
                        ? existing.moduleData()
                        : Map.of();
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            if ("assessments".equals(entry.getKey())) {
                continue;
            }
            if (!Objects.equals(entry.getValue(), existingMd.get(entry.getKey()))) {
                throw new AccessDeniedException(
                        "RTEC staff cannot modify case metadata except assessments");
            }
        }
    }

    /** Publishing any module document requires a staff principal. */
    public void assertCanPublish(Boolean published) {
        if (Boolean.TRUE.equals(published)) {
            SecurityUtils.requireStaff();
        }
    }

    /**
     * LandBank withdrawal requires a staff-uploaded signed MOA file in the store
     * (not client-writable moduleData flags). Demo mode and staff bypass remain.
     */
    public void assertLandBankWithdrawalAllowed(String applicantId) {
        if (isDemoBypassAllowed()) {
            return;
        }
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        if (principal.isStaff()) {
            return;
        }
        if (!fileUploadRepository.existsByApplicantIdAndModuleKey(applicantId, SIGNED_MOA_MODULE_KEY)) {
            throw new AccessDeniedException(
                    "LandBank withdrawal requires a staff-uploaded signed MOA (or demo mode on the server)");
        }
    }

    private void assertPublishGates(
            String targetModule,
            Map<String, Object> existingModuleData,
            String existingCurrentModule) {
        if (isDemoBypassAllowed()) {
            return;
        }
        // Soft publish gate for late modules — applicants should not jump past RTEC
        // unless staff already advanced currentModule or a published RTEC report exists.
        if (ModuleOrder.indexOf(targetModule) >= ModuleOrder.indexOf("approval-letter")) {
            boolean pastRtec =
                    ModuleOrder.indexOf(existingCurrentModule) >= ModuleOrder.indexOf("conduct-rtec");
            boolean rtecPublished = ModuleOrder.isPublished(existingModuleData, "rtecReport");
            if (!pastRtec && !rtecPublished) {
                throw new AccessDeniedException(
                        "Approval and later modules require RTEC progress or a published RTEC report");
            }
        }
    }

    /**
     * Clients cannot advance past Approval Letter until the Regional Director
     * has approved and staff have published the Notice of Approval.
     */
    private void assertRdApprovalGate(String targetModule, Map<String, Object> existingModuleData) {
        if (isDemoBypassAllowed()) {
            return;
        }
        if (ModuleOrder.indexOf(targetModule) <= ModuleOrder.indexOf("approval-letter")) {
            return;
        }
        if (!hasRdApprovedPublishedNotice(existingModuleData)) {
            throw new AccessDeniedException(
                    "LandBank and later modules require a Regional Director-approved, published Notice of Approval");
        }
    }

    private static boolean hasRdApprovedPublishedNotice(Map<String, Object> moduleData) {
        if (moduleData == null) {
            return false;
        }
        Object raw = moduleData.get("approvalLetter");
        if (!(raw instanceof Map<?, ?> letter)) {
            return false;
        }
        Object published = letter.get("published");
        if (!(published instanceof Boolean pub) || !pub) {
            return false;
        }
        Object decision = letter.get("rdDecision");
        return decision instanceof String s && "approved".equalsIgnoreCase(s.trim());
    }
}
