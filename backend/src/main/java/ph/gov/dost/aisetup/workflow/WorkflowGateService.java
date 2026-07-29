/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import java.util.Map;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.auth.SecurityUtils;
import ph.gov.dost.aisetup.auth.UserPrincipal;
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
        if (toIdx > fromIdx + 1 && !isDemoBypassAllowed()) {
            throw new AccessDeniedException(
                    "Cannot skip modules: current=" + from + ", requested=" + to);
        }
        assertPublishGates(to, existing.moduleData(), existing.currentModule());
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
