/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import ph.gov.dost.aisetup.auth.UserAccount;
import ph.gov.dost.aisetup.auth.UserPrincipal;
import ph.gov.dost.aisetup.config.AisetupProperties;
import ph.gov.dost.aisetup.files.FileUploadRepository;
import ph.gov.dost.aisetup.persistence.ApplicantRecordDto;

@ExtendWith(MockitoExtension.class)
class WorkflowGateServiceTest {

    @Mock
    private FileUploadRepository fileUploadRepository;

    private AisetupProperties properties;
    private WorkflowGateService service;

    @BeforeEach
    void setUp() {
        properties = new AisetupProperties();
        properties.setDemoModeEnabled(false);
        service = new WorkflowGateService(properties, fileUploadRepository);
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateApplicant(String applicantId) {
        UserAccount account = new UserAccount();
        account.setId("user-1");
        account.setEmail("a@example.com");
        account.setPasswordHash("x");
        account.setFirstName("A");
        account.setLastName("B");
        account.setRole("applicant");
        account.setApplicantId(applicantId);
        account.setEnabled(true);
        UserPrincipal principal = new UserPrincipal(account);
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    private static ApplicantRecordDto dto(
            String id,
            String currentModule,
            Map<String, Object> moduleData,
            Map<String, Object> profile) {
        return new ApplicantRecordDto(
                id, "LOI-2026-000001", "Test Co", currentModule, moduleData, profile, null);
    }

    @Test
    void landBankGateRejectsForgedModuleDataWithoutStaffUpload() {
        authenticateApplicant("app-1");
        when(fileUploadRepository.existsByApplicantIdAndModuleKey("app-1", "signedMoa"))
                .thenReturn(false);
        assertThrows(AccessDeniedException.class, () -> service.assertLandBankWithdrawalAllowed("app-1"));
    }

    @Test
    void landBankGateAllowsWhenStaffUploadedSignedMoa() {
        authenticateApplicant("app-1");
        when(fileUploadRepository.existsByApplicantIdAndModuleKey("app-1", "signedMoa"))
                .thenReturn(true);
        assertDoesNotThrow(() -> service.assertLandBankWithdrawalAllowed("app-1"));
    }

    @Test
    void publishRequiresStaff() {
        authenticateApplicant("app-1");
        assertThrows(AccessDeniedException.class, () -> service.assertCanPublish(true));
        assertDoesNotThrow(() -> service.assertCanPublish(false));
    }

    @Test
    void staffOnlyModuleWriteBlocksApplicant() {
        authenticateApplicant("app-1");
        assertThrows(AccessDeniedException.class, () -> service.assertStaffOnlyModuleWrite("approvalLetter"));
        assertThrows(AccessDeniedException.class, () -> service.assertStaffOnlyModuleWrite("landBank"));
        assertDoesNotThrow(() -> service.assertStaffOnlyModuleWrite("tna1"));
    }

    @Test
    void programReferralMayJumpFromPrescreeningToLoi() {
        authenticateApplicant("app-1");
        ApplicantRecordDto existing = dto(
                "app-1",
                "prescreening",
                Map.of("selectedProgramId", "mpex"),
                Map.of("qualified", false));
        ApplicantRecordDto incoming = dto(
                "app-1",
                "letter-of-intent",
                Map.of("selectedProgramId", "mpex"),
                Map.of("qualified", false));
        assertDoesNotThrow(() -> service.assertSaveAllowed(incoming, existing));
    }

    @Test
    void programReferralCannotAdvancePastLoi() {
        authenticateApplicant("app-1");
        ApplicantRecordDto existing = dto(
                "app-1",
                "letter-of-intent",
                Map.of("selectedProgramId", "mpex"),
                Map.of("qualified", false));
        ApplicantRecordDto incoming = dto(
                "app-1",
                "tna1",
                Map.of("selectedProgramId", "mpex"),
                Map.of("qualified", false));
        assertThrows(AccessDeniedException.class, () -> service.assertSaveAllowed(incoming, existing));
    }

    @Test
    void mpexRouteCannotEnterSetupFundingPipeline() {
        authenticateApplicant("app-1");
        ApplicantRecordDto existing = dto(
                "app-1",
                "requirements",
                Map.of("routingDecision", "mpex"),
                Map.of("qualified", true));
        ApplicantRecordDto incoming = dto(
                "app-1",
                "conduct-rtec",
                Map.of("routingDecision", "mpex"),
                Map.of("qualified", true));
        assertThrows(AccessDeniedException.class, () -> service.assertSaveAllowed(incoming, existing));
    }

    @Test
    void qualifiedOneStepAdvanceStillAllowed() {
        authenticateApplicant("app-1");
        ApplicantRecordDto existing = dto(
                "app-1", "registration", Map.of(), Map.of("qualified", true));
        ApplicantRecordDto incoming = dto(
                "app-1", "letter-of-intent", Map.of(), Map.of("qualified", true));
        assertDoesNotThrow(() -> service.assertSaveAllowed(incoming, existing));
    }

    @Test
    void clientCannotAdvancePastApprovalWithoutRdApprovedNotice() {
        authenticateApplicant("app-1");
        ApplicantRecordDto existing = dto(
                "app-1",
                "approval-letter",
                Map.of(
                        "rtecReport", Map.of("published", true),
                        "approvalLetter", Map.of("published", false)),
                Map.of("qualified", true));
        ApplicantRecordDto incoming = dto(
                "app-1",
                "landbank-withdrawal",
                existing.moduleData(),
                Map.of("qualified", true));
        assertThrows(AccessDeniedException.class, () -> service.assertSaveAllowed(incoming, existing));
    }

    @Test
    void clientCannotAdvancePastApprovalWhenRdDisapproved() {
        authenticateApplicant("app-1");
        ApplicantRecordDto existing = dto(
                "app-1",
                "approval-letter",
                Map.of(
                        "rtecReport", Map.of("published", true),
                        "approvalLetter",
                        Map.of("published", true, "rdDecision", "disapproved")),
                Map.of("qualified", true));
        ApplicantRecordDto incoming = dto(
                "app-1",
                "landbank-withdrawal",
                existing.moduleData(),
                Map.of("qualified", true));
        assertThrows(AccessDeniedException.class, () -> service.assertSaveAllowed(incoming, existing));
    }

    @Test
    void clientMayAdvanceToLandBankWhenRdApprovedAndPublished() {
        authenticateApplicant("app-1");
        ApplicantRecordDto existing = dto(
                "app-1",
                "approval-letter",
                Map.of(
                        "rtecReport", Map.of("published", true),
                        "approvalLetter",
                        Map.of("published", true, "rdDecision", "approved")),
                Map.of("qualified", true));
        ApplicantRecordDto incoming = dto(
                "app-1",
                "landbank-withdrawal",
                existing.moduleData(),
                Map.of("qualified", true));
        assertDoesNotThrow(() -> service.assertSaveAllowed(incoming, existing));
    }

    private void authenticateRole(String role, String applicantId) {
        UserAccount account = new UserAccount();
        account.setId("user-" + role);
        account.setEmail(role + "@dost.gov.ph");
        account.setPasswordHash("x");
        account.setFirstName("T");
        account.setLastName("User");
        account.setRole(role);
        account.setApplicantId(applicantId);
        account.setEnabled(true);
        UserPrincipal principal = new UserPrincipal(account);
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(
                        principal, null, principal.getAuthorities()));
    }

    @Test
    void rtecStaffMayAdvanceOnlyFromRtecToApprovalLetter() {
        authenticateRole("rtec-staff", null);
        ApplicantRecordDto existing = dto("app-1", "conduct-rtec", Map.of(), Map.of());
        ApplicantRecordDto incoming = dto("app-1", "approval-letter", Map.of(), Map.of());
        assertDoesNotThrow(() -> service.assertSaveAllowed(incoming, existing));

        ApplicantRecordDto bad = dto("app-1", "landbank-withdrawal", Map.of(), Map.of());
        assertThrows(AccessDeniedException.class, () -> service.assertSaveAllowed(bad, existing));
    }

    @Test
    void rtecStaffCannotPatchApprovalLetterModule() {
        authenticateRole("rtec-staff", null);
        ApplicantRecordDto existing = dto("app-1", "conduct-rtec", Map.of(), Map.of());
        assertThrows(
                AccessDeniedException.class,
                () -> service.assertRtecStaffModuleWrite(
                        "approvalLetter", Map.of("body", "x"), existing));
        assertDoesNotThrow(
                () -> service.assertRtecStaffModuleWrite(
                        "rtecReport", Map.of("recommendation", "ok"), existing));
    }
}
