/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.loi;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.ai.AnthropicClient;
import ph.gov.dost.aisetup.common.AiTemplateFallback;
import ph.gov.dost.aisetup.loi.dto.AddresseeDto;
import ph.gov.dost.aisetup.loi.dto.LetterheadDto;
import ph.gov.dost.aisetup.loi.dto.LoiDocumentResponse;
import ph.gov.dost.aisetup.loi.dto.LoiGenerationRequest;
import ph.gov.dost.aisetup.loi.dto.SignatureDto;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import static ph.gov.dost.aisetup.common.TextUtils.isBlank;
import static ph.gov.dost.aisetup.common.TextUtils.safe;

@Service
public class LoiGenerationService {

    private static final Logger log = LoggerFactory.getLogger(LoiGenerationService.class);
    private static final DateTimeFormatter DISPLAY_DATE =
            DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.ENGLISH);

    private final AnthropicClient anthropicClient;

    public LoiGenerationService(AnthropicClient anthropicClient) {
        this.anthropicClient = anthropicClient;
    }

    public LoiDocumentResponse generate(LoiGenerationRequest request) {
        LetterheadDto letterhead = buildLetterhead(request);
        AddresseeDto regional = ProvincialOfficeResolver.REGIONAL_ADDRESSEE;
        ProvincialOfficeResolver.ResolvedOffice thru = ProvincialOfficeResolver.resolveProvincialOffice(request.getProvince());
        String salutation = "Dear Regional Director " + ProvincialOfficeResolver.regionalDirectorSurname() + ":";

        AiTemplateFallback.Result<List<String>> body = AiTemplateFallback.generate(
                log,
                "LOI body",
                () -> anthropicClient.generateBodyParagraphs(buildPrompt(request)),
                () -> buildTemplateParagraphs(request));
        List<String> bodyParagraphs = body.value();
        boolean aiGenerated = body.aiGenerated();

        SignatureDto signature = new SignatureDto(
                safe(request.getSignature()),
                safe(request.getApplicantName()),
                safe(request.getDesignation()),
                safe(request.getEnterpriseName()),
                safe(request.getDateSigned())
        );

        LoiDocumentResponse response = new LoiDocumentResponse();
        response.setLetterhead(letterhead);
        response.setRegionalAddressee(regional);
        response.setThruAddressee(thru.addressee());
        response.setSalutation(salutation);
        response.setBodyParagraphs(bodyParagraphs);
        response.setClosing("Respectfully yours,");
        response.setSignature(signature);
        response.setGeneratedAt(Instant.now().toString());
        response.setAiGenerated(aiGenerated);
        response.setProvincialOfficeDefaulted(thru.defaulted());
        return response;
    }

    private LetterheadDto buildLetterhead(LoiGenerationRequest request) {
        String date = request.getDateSigned();
        if (date == null || date.isBlank()) {
            date = DISPLAY_DATE.format(LocalDate.now());
        } else {
            try {
                date = DISPLAY_DATE.format(LocalDate.parse(date));
            } catch (Exception ignored) {
                // keep original format
            }
        }

        return new LetterheadDto(
                safe(request.getEnterpriseName()).toUpperCase(Locale.ROOT),
                safe(request.getAddress()),
                safe(request.getEmailAddress()),
                safe(request.getContactNumber()),
                date
        );
    }

    private static boolean hasProgram(LoiGenerationRequest r) {
        return r.getProgramName() != null && !r.getProgramName().isBlank();
    }

    /** SETUP seed-fund LOI path: qualified applicant with no alternate program. */
    private static boolean isSetupQualified(LoiGenerationRequest r) {
        return Boolean.TRUE.equals(r.getQualified()) && !hasProgram(r);
    }

    private static String programLabel(LoiGenerationRequest r) {
        return hasProgram(r)
                ? r.getProgramName().trim()
                : "the Small Enterprise Technology Upgrading Program (SETUP) 4.0";
    }

    private String buildPrompt(LoiGenerationRequest r) {
        String facts = """
                Enterprise: %s
                Applicant: %s (%s)
                Address: %s, %s %s
                Email: %s | Mobile: %s
                TIN: %s | Registration: %s %s
                Date established: %s
                Company description: %s
                MSME size: %s | Business type: %s | Sector: %s
                Business nature: %s | Years of operation: %s | Asset size: %s
                Core products: %s | Turnover: %s | Export classification: %s
                Products/Services: %s
                Production plan file: %s
                Target DOST program: %s
                """.formatted(
                val(r.getEnterpriseName()),
                val(r.getApplicantName()),
                val(r.getDesignation()),
                val(r.getAddress()),
                val(r.getProvince()),
                val(r.getZipCode()),
                val(r.getEmailAddress()),
                val(r.getContactNumber()),
                val(r.getTinNumber()),
                val(r.getRegistrationType()),
                val(r.getRegistrationNumber()),
                val(r.getDateEstablished()),
                val(r.getCompanyDescription()),
                val(r.getMsmeSize()),
                val(r.getBusinessType()),
                val(r.getBusinessSector()),
                val(r.getBusinessNature()),
                val(r.getYearsOfOperation()),
                val(r.getAssetSize()),
                val(r.getCoreProducts()),
                val(r.getTurnover()),
                val(r.getExportClassification()),
                val(r.getProductServices()),
                val(r.getProductionPlanFile()),
                programLabel(r)
        );

        // Project / budget / refund terms: qualified SETUP LOIs only.
        if (isSetupQualified(r)) {
            facts += "Project description: " + val(r.getProjectDescription()) + "\n"
                    + "Expected outcome: " + val(r.getExpectedOutcome()) + "\n"
                    + "Budget: " + val(r.getBudget()) + " | Timeline: " + val(r.getTimeline()) + "\n"
                    + "Commitment amount: " + val(r.getCommitmentAmount())
                    + " | Repayment term: " + val(r.getRepaymentTerm()) + "\n";
        }

        // Only present for program-targeted LOIs; the SETUP prompt is unchanged.
        if (hasProgram(r) && !isBlank(r.getProgramSummary())) {
            facts += "Program assistance offered: " + r.getProgramSummary().trim() + "\n";
        }

        String programName = programLabel(r);
        String complianceLine = isSetupQualified(r)
                ? "willingness to comply with DOST guidelines and refund commitments"
                : "willingness to comply with DOST program guidelines and requirements";

        String coverLine = isSetupQualified(r)
                ? "Cover: intent to participate in %s, company background, products/services, technology upgrade needs, project summary, expected outcomes, budget and timeline when provided, and %s."
                        .formatted(programName, complianceLine)
                : "Cover: intent to participate in %s, company background, products/services, why this program fits the enterprise, and %s. Do NOT write a 'proposed project involves' paragraph and do NOT mention budget, cost, funding, seed funds, repayment, or timeline."
                        .formatted(programName, complianceLine);

        return """
                You are drafting the body of a formal Letter of Intent from a Philippine MSME to DOST Region XII for %s.

                Write 3 to 5 formal paragraphs in English, written in the first person as the enterprise representative.
                %s
                Do NOT invent facts not present in the data below. If a field is empty, use neutral phrasing or omit that detail.
                Do NOT include letterhead, addressee, salutation, closing, or signature — body paragraphs only.

                Return ONLY a valid JSON array of strings, each string being one paragraph. No markdown, no code fences, no extra text.

                Applicant data:
                %s
                """.formatted(programName, coverLine, facts);
    }

    private List<String> buildTemplateParagraphs(LoiGenerationRequest r) {
        List<String> paragraphs = new ArrayList<>();

        paragraphs.add(String.format(
                "We, %s, %s of %s, hereby express our sincere intent to participate in %s of the Department of Science and Technology.",
                val(r.getApplicantName()),
                val(r.getDesignation()),
                val(r.getEnterpriseName()),
                programLabel(r)
        ));

        paragraphs.add(String.format(
                "%s is a %s %s operating in the %s sector with %s years of operation. %s and seeks to upgrade our operations through appropriate science and technology interventions.",
                val(r.getEnterpriseName()),
                val(r.getMsmeSize()),
                val(r.getBusinessType()),
                val(r.getBusinessSector()),
                val(r.getYearsOfOperation()),
                val(r.getProductServices())
        ));

        if (hasProgram(r) && !isBlank(r.getProgramSummary())) {
            String summary = r.getProgramSummary().trim().replaceAll("\\.+$", "");
            if (!summary.isEmpty()) {
                paragraphs.add(String.format(
                        "We are particularly interested in this program because %s%s. We believe this assistance directly addresses our enterprise's current needs.",
                        Character.toLowerCase(summary.charAt(0)),
                        summary.substring(1)
                ));
            }
        }

        // Project / budget paragraph: qualified SETUP clients only.
        // Unqualified (recommended-program) LOIs must omit this section.
        if (isSetupQualified(r)) {
            paragraphs.add(String.format(
                    "Our proposed project involves %s. We expect this initiative to %s, with an estimated budget of %s and a timeline of %s",
                    val(r.getProjectDescription()),
                    val(r.getExpectedOutcome()),
                    formatBudget(r.getBudget()),
                    val(r.getTimeline())
            ));
        }

        if (isSetupQualified(r)) {
            paragraphs.add(String.format(
                    "We commit to fully comply with all DOST SETUP 4.0 guidelines and requirements, including the refund of the approved seed fund amounting to %s over %s at zero percent interest. We understand our obligations under the program and pledge our full cooperation throughout the evaluation and implementation process.",
                    formatBudget(r.getCommitmentAmount()),
                    val(r.getRepaymentTerm())
            ));
        } else {
            paragraphs.add(String.format(
                    "We commit to fully comply with all %s guidelines and requirements of the Department of Science and Technology. We understand our obligations under the program and pledge our full cooperation throughout the evaluation and implementation process.",
                    programLabel(r)
            ));
        }

        if (!isBlank(r.getProductionPlanFile())) {
            paragraphs.add(String.format(
                    "For your reference, we have attached our Production Plan (%s) detailing our operational requirements and projected improvements.",
                    val(r.getProductionPlanFile())
            ));
        }

        return paragraphs;
    }

    private static String val(String value) {
        return isBlank(value) ? "as indicated in our application" : value.trim();
    }

    private static String formatBudget(String budget) {
        if (isBlank(budget)) {
            return "the amount stated in our application";
        }
        String trimmed = budget.trim();
        return trimmed.startsWith("₱") ? trimmed : "₱" + trimmed;
    }
}
