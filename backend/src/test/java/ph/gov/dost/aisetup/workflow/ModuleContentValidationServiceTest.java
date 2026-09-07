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
    void rejectsIncompleteRequirementsSubmit() {
        assertThrows(
                IllegalArgumentException.class,
                () ->
                        service.assertRequirementsComplete(
                                Map.of(
                                        "requirementUploads",
                                        List.of(
                                                Map.of(
                                                        "id",
                                                        "permits",
                                                        "required",
                                                        true,
                                                        "uploaded",
                                                        false)))));
    }

    @Test
    void acceptsCompleteRequirementsSubmit() {
        assertDoesNotThrow(
                () ->
                        service.assertRequirementsComplete(
                                Map.of(
                                        "requirementUploads",
                                        List.of(
                                                Map.of(
                                                        "id",
                                                        "permits",
                                                        "required",
                                                        true,
                                                        "uploaded",
                                                        true),
                                                Map.of(
                                                        "id",
                                                        "projected",
                                                        "required",
                                                        true,
                                                        "uploaded",
                                                        true,
                                                        "generatedFrom",
                                                        "financialProjection")))));
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
                                        "firmName", "Acme Foods",
                                        "proponentName", "Ada",
                                        "amountRequested", "100000",
                                        "organizationType", "Corporation",
                                        "scheduleTable",
                                        List.of(List.of("Procurement", "3 months")),
                                        "equipmentTable",
                                        List.of(List.of("Vacuum sealer", "1")),
                                        "budgetItems",
                                        List.of(Map.of("item", "Equipment", "total", "100000"))),
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
    void rejectsApprovalPublishWithoutRdDecision() {
        Map<String, Object> payload = Map.of(
                "form",
                Map.of(
                        "projectTitle", "P",
                        "referenceNumber", "R",
                        "recipientName", "N",
                        "enterpriseName", "E",
                        "enterpriseAddress", "A",
                        "pstoOfficeName", "PSTO",
                        "signatoryName", "RD"),
                "rdDecision",
                "disapproved");
        assertThrows(
                IllegalArgumentException.class,
                () -> service.assertHardTransition("approvalLetter", payload, true));
    }

    @Test
    void acceptsApprovalPublishWithRdApproved() {
        Map<String, Object> payload = Map.of(
                "form",
                Map.of(
                        "projectTitle", "P",
                        "referenceNumber", "R",
                        "recipientName", "N",
                        "enterpriseName", "E",
                        "enterpriseAddress", "A",
                        "pstoOfficeName", "PSTO",
                        "signatoryName", "RD"),
                "rdDecision",
                "approved");
        assertDoesNotThrow(
                () -> service.assertHardTransition("approvalLetter", payload, true));
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

    @Test
    void closeOutSubmitRequiresForm005PtrFields() {
        Map<String, Object> incomplete = Map.of(
                "form",
                Map.of(
                        "terminalReportFileName", "tr.pdf",
                        "auditedFinancialFileName", "fs.pdf",
                        "certificateOfOwnershipIssued", true,
                        "equipmentInventory", List.of(Map.of("description", ""))),
                "submitted",
                true);
        assertThrows(
                IllegalArgumentException.class,
                () -> service.assertHardTransition("projectCloseOut", incomplete, false));

        Map<String, Object> completeForm = new java.util.HashMap<>();
        completeForm.put("terminalReportFileName", "tr.pdf");
        completeForm.put("auditedFinancialFileName", "fs.pdf");
        completeForm.put("ptrFromAccountableOfficer", "Juan Dela Cruz");
        completeForm.put("ptrToAccountableOfficer", "PSTO Cotabato");
        completeForm.put("ptrDate", "2026-09-01");
        completeForm.put("ptrTransferType", "donation");
        completeForm.put("ptrReasonForTransfer", "Project completion");
        completeForm.put("ptrApprovedByName", "Provincial Director");
        completeForm.put("ptrReceivedBy", "Enterprise owner");
        completeForm.put("propertyTransferSignedFileName", "ptr-signed.pdf");
        completeForm.put("certificateOfOwnershipIssued", true);
        completeForm.put("equipmentInventory", List.of(Map.of("description", "Vacuum sealer")));
        Map<String, Object> complete = Map.of(
                "form", completeForm,
                "submitted", true);
        assertDoesNotThrow(
                () -> service.assertHardTransition("projectCloseOut", complete, false));
    }

    @Test
    void rejectsIncompleteTna2Publish() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.assertHardTransition(
                        "tna2Document",
                        Map.of("published", true, "enterpriseProfile", Map.of()),
                        true));
    }

    @Test
    void acceptsCompleteTna2Publish() {
        assertDoesNotThrow(
                () -> service.assertHardTransition(
                        "tna2Document",
                        Map.of(
                                "enterpriseProfile", Map.of("enterpriseName", "Acme"),
                                "findingsByArea",
                                List.of(Map.of("area", "Production", "content", "Needs upgrade")),
                                "recommendedEquipment",
                                List.of(Map.of("name", "Sealer")),
                                "assessor", Map.of("name", "Engr. Reyes"),
                                "assessmentDate", "2026-09-01"),
                        true));
    }
}
