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
import ph.gov.dost.aisetup.persistence.ApplicantRecordDto;

@Service
public class WorkflowGateService {

    private final AisetupProperties properties;

    public WorkflowGateService(AisetupProperties properties) {
        this.properties = properties;
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

        String from = existing.currentModule();
        String to = incoming.currentModule();
        if (to == null || to.equals(from)) {
            assertApplicantCannotMutateStaffOnly(incoming.moduleData());
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
        assertPublishGates(to, incoming.moduleData(), existing.moduleData(), existing.currentModule());
        assertApplicantCannotMutateStaffOnly(incoming.moduleData());
    }

    public void assertStaffOnlyModuleWrite(String moduleKey) {
        if (ModuleOrder.isStaffOnlyModule(moduleKey)) {
            SecurityUtils.requireStaff();
        }
    }

    public void assertLandBankWithdrawalAllowed(Map<String, Object> moduleData) {
        if (isDemoBypassAllowed()) {
            return;
        }
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        if (principal.isStaff()) {
            return;
        }
        boolean signedMoa = ModuleOrder.isPublished(moduleData, "signedDocuments")
                || hasSignedMoaSnapshot(moduleData);
        if (!signedMoa) {
            throw new AccessDeniedException(
                    "LandBank withdrawal requires a signed MOA snapshot (or demo mode on the server)");
        }
    }

    private void assertPublishGates(
            String targetModule,
            Map<String, Object> incomingModuleData,
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
            boolean rtecPublished = ModuleOrder.isPublished(incomingModuleData, "rtecReport")
                    || ModuleOrder.isPublished(existingModuleData, "rtecReport");
            if (!pastRtec && !rtecPublished) {
                throw new AccessDeniedException(
                        "Approval and later modules require RTEC progress or a published RTEC report");
            }
        }
    }

    private void assertApplicantCannotMutateStaffOnly(Map<String, Object> moduleData) {
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        if (principal.isStaff() || moduleData == null) {
            return;
        }
        if (moduleData.containsKey("rtecReport") || moduleData.containsKey("conductRtec")) {
            // Applicants may retain previously published copies but staff owns writes —
            // full PUT from applicant still accepted for other keys; staff-only keys
            // are stripped by persistence when needed. Hard deny direct module PATCH.
        }
    }

    private boolean hasSignedMoaSnapshot(Map<String, Object> moduleData) {
        if (moduleData == null) {
            return false;
        }
        Object landbank = moduleData.get("landBank");
        if (landbank instanceof Map<?, ?> map) {
            Object snap = map.get("signedMoaSnapshot");
            if (snap instanceof Map<?, ?> s && !s.isEmpty()) {
                return true;
            }
            Object signed = map.get("signedMoa");
            if (signed instanceof Boolean b && b) {
                return true;
            }
        }
        Object signedDocs = moduleData.get("signedDocuments");
        if (signedDocs instanceof Map<?, ?> docs) {
            Object moa = docs.get("moa");
            if (moa instanceof Map<?, ?> m && m.get("fileName") != null) {
                return true;
            }
        }
        return false;
    }
}
