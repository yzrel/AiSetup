/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ph.gov.dost.aisetup.loi.dto.LoiGenerationRequest;
import ph.gov.dost.aisetup.proposal.dto.ProjectProposalGenerationRequest;

@ExtendWith(MockitoExtension.class)
class ModuleContentValidationServiceTest {

    @Mock
    private WorkflowGateService workflowGateService;

    private ModuleContentValidationService service;

    @BeforeEach
    void setUp() {
        service = new ModuleContentValidationService(workflowGateService);
        when(workflowGateService.isDemoBypassAllowed()).thenReturn(false);
    }

    @Test
    void draftPatchIsLenient() {
        assertDoesNotThrow(
                () -> service.assertHardTransition(
                        "projectProposal", Map.of("form", Map.of()), false));
    }

    @Test
    void rejectsIncompleteProposalSubmit() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.assertHardTransition(
                        "projectProposal",
                        Map.of("form", Map.of("projectTitle", "X"), "submitted", true),
                        false));
    }

    @Test
    void acceptsCompleteProposalSubmit() {
        assertDoesNotThrow(
                () -> service.assertHardTransition(
                        "projectProposal",
                        Map.of(
                                "form",
                                Map.of(
                                        "projectTitle", "Title",
                                        "proponentName", "Ada",
                                        "amountRequested", "100000"),
                                "attachments",
                                List.of(
                                        Map.of("kind", "vicinityMap"),
                                        Map.of("kind", "plantLayout")),
                                "submitted",
                                true),
                        false));
    }

    @Test
    void demoBypassSkipsContentRules() {
        when(workflowGateService.isDemoBypassAllowed()).thenReturn(true);
        assertDoesNotThrow(
                () -> service.assertHardTransition(
                        "projectProposal",
                        Map.of("form", Map.of(), "submitted", true),
                        false));
        LoiGenerationRequest loi = new LoiGenerationRequest();
        assertDoesNotThrow(() -> service.assertLoiGeneration(loi));
    }

    @Test
    void rejectsIncompleteLoiGeneration() {
        LoiGenerationRequest loi = new LoiGenerationRequest();
        loi.setEnterpriseName("Acme");
        assertThrows(IllegalArgumentException.class, () -> service.assertLoiGeneration(loi));
    }

    @Test
    void rejectsIncompleteApprovalPublish() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.assertHardTransition(
                        "approvalLetter",
                        Map.of("form", Map.of("projectTitle", "P")),
                        true));
    }

    @Test
    void rejectsIncompleteTna1Submit() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.assertTna1Submit(Map.of("enterpriseName", "Acme"), true));
        assertDoesNotThrow(() -> service.assertTna1Submit(Map.of(), false));
    }

    @Test
    void proposalGenerationRequiresAttachments() {
        ProjectProposalGenerationRequest req = new ProjectProposalGenerationRequest();
        req.setEnterpriseName("Acme");
        req.setForm(Map.of(
                "projectTitle", "T",
                "proponentName", "P",
                "amountRequested", "1"));
        req.setAttachmentKinds(List.of("vicinityMap"));
        assertThrows(IllegalArgumentException.class, () -> service.assertProposalGeneration(req));
        req.setAttachmentKinds(List.of("vicinityMap", "plantLayout"));
        assertDoesNotThrow(() -> service.assertProposalGeneration(req));
    }
}
