/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.loi.dto;

import java.util.List;

public class LoiDocumentResponse {

    private LetterheadDto letterhead;
    private AddresseeDto regionalAddressee;
    private AddresseeDto thruAddressee;
    private String salutation;
    private List<String> bodyParagraphs;
    private String closing;
    private SignatureDto signature;
    private String generatedAt;
    private boolean aiGenerated;
    private boolean provincialOfficeDefaulted;

    public LetterheadDto getLetterhead() { return letterhead; }
    public void setLetterhead(LetterheadDto letterhead) { this.letterhead = letterhead; }

    public AddresseeDto getRegionalAddressee() { return regionalAddressee; }
    public void setRegionalAddressee(AddresseeDto regionalAddressee) { this.regionalAddressee = regionalAddressee; }

    public AddresseeDto getThruAddressee() { return thruAddressee; }
    public void setThruAddressee(AddresseeDto thruAddressee) { this.thruAddressee = thruAddressee; }

    public String getSalutation() { return salutation; }
    public void setSalutation(String salutation) { this.salutation = salutation; }

    public List<String> getBodyParagraphs() { return bodyParagraphs; }
    public void setBodyParagraphs(List<String> bodyParagraphs) { this.bodyParagraphs = bodyParagraphs; }

    public String getClosing() { return closing; }
    public void setClosing(String closing) { this.closing = closing; }

    public SignatureDto getSignature() { return signature; }
    public void setSignature(SignatureDto signature) { this.signature = signature; }

    public String getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(String generatedAt) { this.generatedAt = generatedAt; }

    public boolean isAiGenerated() { return aiGenerated; }
    public void setAiGenerated(boolean aiGenerated) { this.aiGenerated = aiGenerated; }

    public boolean isProvincialOfficeDefaulted() { return provincialOfficeDefaulted; }
    public void setProvincialOfficeDefaulted(boolean provincialOfficeDefaulted) {
        this.provincialOfficeDefaulted = provincialOfficeDefaulted;
    }
}
