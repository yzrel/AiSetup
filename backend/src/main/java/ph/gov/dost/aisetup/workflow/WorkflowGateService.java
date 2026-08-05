/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import java.util.Collections;
import java.util.Map;
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
}
