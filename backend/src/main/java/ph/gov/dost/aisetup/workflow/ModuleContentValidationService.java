/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.common.TextUtils;
import ph.gov.dost.aisetup.loi.dto.LoiGenerationRequest;
import ph.gov.dost.aisetup.proposal.dto.ProjectProposalGenerationRequest;

/**
 * Business-field completeness on hard transitions (submit / publish / generate).
 * Draft PATCH remains lenient via {@link ModuleDataIntegrityService} shape checks only.
 * Skips blocking rules when server demo mode is enabled.
 */
@Service
public class ModuleContentValidationService {

    private final WorkflowGateService workflowGateService;

    public ModuleContentValidationService(WorkflowGateService workflowGateService) {
        this.workflowGateService = workflowGateService;
    }

    /**
     * Called from module PATCH when {@code published=true} or payload {@code submitted=true}.
     */
    public void assertHardTransition(String moduleKey, Map<String, Object> data, Boolean published) {
        if (workflowGateService.isDemoBypassAllowed()) {
            return;
        }
        if (data == null) {
            return;
        }
        // Explicit publish flag on the PATCH request, or submitted:true in payload.
        // Do not treat a re-saved document that already has published:true as a new hard transition.
        boolean hardPublish = Boolean.TRUE.equals(published);
        boolean hardSubmit = Boolean.TRUE.equals(asBoolean(data.get("submitted")));
        if (!hardPublish && !hardSubmit) {
            return;
        }

        String key = moduleKey == null ? "" : moduleKey.trim();
        List<String> errors = new ArrayList<>();
        switch (key) {
            case "loiDocument" -> errors.addAll(validateLoiStored(data));
            case "tna1" -> errors.addAll(validateTna1(data));
            case "projectProposal" -> errors.addAll(validateProjectProposal(data));
            case "rtecReport", "conductRtec" -> errors.addAll(validateRtecReport(data));
            case "approvalLetter", "noticeOfApproval" -> errors.addAll(validateApprovalLetter(data));
            case "landBank" -> errors.addAll(validateLandBank(data));
            case "projectCloseOut" -> errors.addAll(validateCloseOut(data));
            case "refund" -> errors.addAll(validateRefund(data));
            default -> {
                // No content rules for this key yet.
            }
        }
        throwIfAny(errors);
    }

    public void assertLoiGeneration(LoiGenerationRequest request) {
        if (workflowGateService.isDemoBypassAllowed()) {
            return;
        }
        List<String> errors = new ArrayList<>();
        require(errors, request.getApplicantName(), "Applicant name is required.");
        require(errors, request.getDesignation(), "Designation / Position is required.");
        require(errors, request.getEnterpriseName(), "Enterprise name is required.");
        require(errors, request.getContactNumber(), "Contact number is required.");
        require(errors, request.getEmailAddress(), "Email address is required.");
        require(errors, firstNonBlank(request.getProvince()), "Province / region is required.");
        require(errors, request.getBusinessType(), "Business type is required.");
        require(errors, request.getMsmeSize(), "MSME size is required.");
        require(errors, request.getTinNumber(), "TIN number is required.");
        require(errors, request.getDateEstablished(), "Date established is required.");
        require(errors, request.getRegistrationType(), "Registration type is required.");
        require(errors, request.getRegistrationNumber(), "Registration number is required.");
        require(errors, request.getProductServices(), "Products / services are required.");
        require(errors, request.getProjectDescription(), "Project description is required.");
        require(errors, request.getExpectedOutcome(), "Expected outcome is required.");
        boolean programLoi = !TextUtils.isBlank(request.getProgramId())
                || !TextUtils.isBlank(request.getProgramName());
        if (!programLoi) {
            require(errors, request.getBudget(), "Estimated budget is required.");
            require(errors, request.getTimeline(), "Project timeline is required.");
        }
        throwIfAny(errors);
    }

    public void assertProposalGeneration(ProjectProposalGenerationRequest request) {
        if (workflowGateService.isDemoBypassAllowed()) {
            return;
        }
        List<String> errors = new ArrayList<>();
        require(errors, request.getEnterpriseName(), "Enterprise name is required.");
        Map<String, Object> form = request.getForm();
        if (form == null || form.isEmpty()) {
            errors.add("Project proposal form is required.");
        } else {
            require(errors, stringField(form, "projectTitle"), "Project title is required.");
            require(
                    errors,
                    firstNonBlank(stringField(form, "proponentName"), request.getApplicantName()),
                    "Proponent name is required.");
            require(
                    errors,
                    stringField(form, "amountRequested"),
                    "Amount requested from SETUP is required.");
        }
        List<String> kinds = request.getAttachmentKinds();
        if (kinds == null || kinds.stream().noneMatch("vicinityMap"::equals)) {
            errors.add("Vicinity map / site location screenshot is required.");
        }
        if (kinds == null || kinds.stream().noneMatch("plantLayout"::equals)) {
            errors.add("Proposed plant layout is required.");
        }
        throwIfAny(errors);
    }

    public void assertTna1Submit(Map<String, Object> form, boolean submitted) {
        if (!submitted || workflowGateService.isDemoBypassAllowed()) {
            return;
        }
        throwIfAny(tna1FormErrors(form));
    }

    private List<String> tna1FormErrors(Map<String, Object> form) {
        List<String> errors = new ArrayList<>();
        if (form == null) {
            errors.add("TNA Form 01 fields are required.");
            return errors;
        }
        require(errors, stringField(form, "enterpriseName"), "Enterprise name is required.");
        require(errors, stringField(form, "contactPerson"), "Contact person is required.");
        require(errors, stringField(form, "officeAddress"), "Office address is required.");
        require(errors, stringField(form, "sector"), "Sector is required.");
        require(errors, stringField(form, "commodity"), "Commodity is required.");
        require(errors, stringField(form, "mainProduct"), "Main product / service is required.");
        require(
                errors,
                stringField(form, "reasonsForAssistance"),
                "Reasons for assistance are required.");
        require(errors, stringField(form, "yearEstablished"), "Year established is required.");
        require(errors, stringField(form, "organizationType"), "Type of organization is required.");
        require(
                errors,
                stringField(form, "capitalClassification"),
                "Classification by capital is required.");
        require(errors, stringField(form, "employeesMale"), "Male employee count is required.");
        require(errors, stringField(form, "employeesFemale"), "Female employee count is required.");
        require(
                errors,
                stringField(form, "employmentClass"),
                "Employment classification is required.");
        require(errors, stringField(form, "undertakingName"), "Undertaking signature is required.");
        require(
                errors,
                stringField(form, "productionProblemsConcerns"),
                "Production problems are required.");
        boolean hasPlan = !TextUtils.isBlank(stringField(form, "productionPlanFileName"))
                || !TextUtils.isBlank(stringField(form, "productionPlan"));
        if (!hasPlan) {
            errors.add("Production plan is required.");
        }
        require(errors, stringField(form, "plantLayoutFileName"), "Plant lay-out upload is required.");
        String processMode = stringField(form, "processFlowMode");
        if ("attachment".equals(processMode)) {
            require(
                    errors,
                    stringField(form, "processFlowFileName"),
                    "Process flow attachment is required.");
        } else {
            require(errors, stringField(form, "processFlow"), "Process flow is required.");
        }
        require(errors, stringField(form, "preparedDate"), "Prepared date is required.");
        return errors;
    }

    public void assertApprovalAcknowledge(String conformeSignedName) {
        if (workflowGateService.isDemoBypassAllowed()) {
            return;
        }
        if (TextUtils.isBlank(conformeSignedName)) {
            throw new IllegalArgumentException(
                    "Please type your full name to acknowledge the Notice of Approval.");
        }
    }

    private List<String> validateLoiStored(Map<String, Object> data) {
        List<String> errors = new ArrayList<>();
        Map<String, Object> form = asMap(data.get("form"));
        if (form == null) {
            form = data;
        }
        require(errors, stringField(form, "applicantName"), "Applicant name is required.");
        require(errors, stringField(form, "enterpriseName"), "Enterprise name is required.");
        require(errors, stringField(form, "projectDescription"), "Project description is required.");
        return errors;
    }

    private List<String> validateTna1(Map<String, Object> data) {
        Map<String, Object> form = asMap(data.get("form"));
        if (form == null) {
            form = data;
        }
        return tna1FormErrors(form);
    }

    private List<String> validateProjectProposal(Map<String, Object> data) {
        List<String> errors = new ArrayList<>();
        Map<String, Object> form = asMap(data.get("form"));
        if (form == null) {
            errors.add("Project proposal form is required.");
            return errors;
        }
        require(errors, stringField(form, "projectTitle"), "Project title is required.");
        require(errors, stringField(form, "proponentName"), "Proponent name is required.");
        require(
                errors,
                stringField(form, "amountRequested"),
                "Amount requested from SETUP is required.");
        Object attachments = data.get("attachments");
        Object kinds = data.get("attachmentKinds");
        boolean hasVicinity = hasAttachmentKind(attachments, "vicinityMap")
                || hasAttachmentKind(kinds, "vicinityMap");
        boolean hasLayout = hasAttachmentKind(attachments, "plantLayout")
                || hasAttachmentKind(kinds, "plantLayout");
        if (!hasVicinity) {
            errors.add("Vicinity map / site location screenshot is required.");
        }
        if (!hasLayout) {
            errors.add("Proposed plant layout is required.");
        }
        return errors;
    }

    private List<String> validateRtecReport(Map<String, Object> data) {
        List<String> errors = new ArrayList<>();
        Map<String, Object> form = asMap(data.get("form"));
        if (form == null) {
            errors.add("RTEC report form is required.");
            return errors;
        }
        Map<String, Object> snapshot = asMap(form.get("proposalSnapshot"));
        if (snapshot == null || TextUtils.isBlank(stringField(snapshot, "projectTitle"))) {
            errors.add("Project Proposal data is required before completing RTEC.");
        }
        Object items = form.get("complianceItems");
        if (items instanceof Collection<?> col) {
            long pending = 0;
            for (Object item : col) {
                if (item instanceof Map<?, ?> m
                        && TextUtils.isBlank(stringField(castMap(m), "status"))) {
                    pending++;
                }
            }
            if (pending > 0) {
                errors.add(
                        "Mark all "
                                + pending
                                + " compliance requirement(s) as Complied, Not Complied, or N/A.");
            }
        }
        require(errors, stringField(form, "recommendation"), "Section IV Recommendation is required.");
        Map<String, Object> signatures = asMap(form.get("signatures"));
        if (signatures == null || TextUtils.isBlank(stringField(signatures, "chairperson"))) {
            errors.add("RTEC Chairperson name is required.");
        }
        return errors;
    }

    private List<String> validateApprovalLetter(Map<String, Object> data) {
        List<String> errors = new ArrayList<>();
        Map<String, Object> form = asMap(data.get("form"));
        if (form == null) {
            form = data;
        }
        require(errors, stringField(form, "projectTitle"), "Project title is required.");
        require(errors, stringField(form, "referenceNumber"), "Reference number is required.");
        require(errors, stringField(form, "recipientName"), "Recipient name is required.");
        require(errors, stringField(form, "enterpriseName"), "Enterprise name is required.");
        require(errors, stringField(form, "enterpriseAddress"), "Enterprise address is required.");
        require(errors, stringField(form, "pstoOfficeName"), "PSTO office name is required.");
        require(errors, stringField(form, "signatoryName"), "Signatory name is required.");
        return errors;
    }

    private List<String> validateLandBank(Map<String, Object> data) {
        List<String> errors = new ArrayList<>();
        Map<String, Object> form = asMap(data.get("form"));
        if (form == null) {
            form = data;
        }
        Object snap = form.get("accountSnapshot");
        if (snap == null || (snap instanceof String s && s.isBlank())) {
            errors.add("Upload LandBank account snapshot.");
        }
        Map<String, Object> tranches = asMap(form.get("tranches"));
        Map<String, Object> first = tranches != null ? asMap(tranches.get("first")) : null;
        if (first == null) {
            errors.add(
                    "Complete 1st tranche: signed letter request, at least one quotation, and equipment photo(s).");
        }
        return errors;
    }

    private List<String> validateCloseOut(Map<String, Object> data) {
        List<String> errors = new ArrayList<>();
        Map<String, Object> form = asMap(data.get("form"));
        if (form == null) {
            form = data;
        }
        require(
                errors,
                stringField(form, "terminalReportFileName"),
                "Upload SETUP Form 010 / terminal report.");
        require(
                errors,
                stringField(form, "auditedFinancialFileName"),
                "Upload audited financial report.");
        require(
                errors,
                stringField(form, "equipmentAcknowledgementFileName"),
                "Upload equipment acknowledgement receipt.");
        if (!hasEquipmentInventoryRow(form.get("equipmentInventory"))) {
            errors.add("Complete at least one equipment inventory row.");
        }
        if (!Boolean.TRUE.equals(asBoolean(form.get("certificateOfOwnershipIssued")))) {
            errors.add("Confirm Certificate of Ownership and IRP issuance.");
        }
        return errors;
    }

    private static boolean hasEquipmentInventoryRow(Object inventory) {
        if (!(inventory instanceof Collection<?> col) || col.isEmpty()) {
            return false;
        }
        for (Object row : col) {
            if (row instanceof Map<?, ?> m
                    && !TextUtils.isBlank(stringField(castMap(m), "description"))) {
                return true;
            }
        }
        return false;
    }

    private List<String> validateRefund(Map<String, Object> data) {
        List<String> errors = new ArrayList<>();
        Map<String, Object> form = asMap(data.get("form"));
        if (form == null) {
            form = data;
        }
        if (!Boolean.TRUE.equals(asBoolean(form.get("pdcsRecorded")))) {
            errors.add("Post-dated checks must be recorded before completing monitoring setup.");
        }
        Object pdcs = form.get("pdcs");
        if (!(pdcs instanceof Collection<?> col) || col.isEmpty()) {
            errors.add("Refund schedule must include at least one PDC entry.");
        }
        return errors;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> castMap(Map<?, ?> m) {
        return (Map<String, Object>) m;
    }

    private static boolean hasAttachmentKind(Object attachments, String kind) {
        if (!(attachments instanceof Collection<?> col)) {
            return false;
        }
        for (Object item : col) {
            if (item instanceof Map<?, ?> m) {
                Object k = m.get("kind");
                if (kind.equals(String.valueOf(k))) {
                    return true;
                }
            } else if (kind.equals(String.valueOf(item))) {
                return true;
            }
        }
        return false;
    }

    private static void require(List<String> errors, String value, String message) {
        if (TextUtils.isBlank(value)) {
            errors.add(message);
        }
    }

    private static void throwIfAny(List<String> errors) {
        if (errors == null || errors.isEmpty()) {
            return;
        }
        throw new IllegalArgumentException(String.join(" ", errors));
    }

    private static String stringField(Map<String, Object> map, String key) {
        if (map == null) {
            return "";
        }
        return TextUtils.stringVal(map.get(key));
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> m) {
            return (Map<String, Object>) m;
        }
        return null;
    }

    private static Boolean asBoolean(Object value) {
        if (value instanceof Boolean b) {
            return b;
        }
        return null;
    }

    private static String firstNonBlank(String... values) {
        return TextUtils.firstNonBlank(values);
    }
}
