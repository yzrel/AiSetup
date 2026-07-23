/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

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
        assertDoesNotThrow(() -> service.assertStaffOnlyModuleWrite("tna1"));
    }
}
