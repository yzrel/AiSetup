/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class AiIfundAssessmentResponse {

    private String proposedAmount;
    /** LOW | MEDIUM | HIGH */
    private String refundRisk;
    private String authorityBand;
    private String rationale;
    private List<String> sourcesPresent = new ArrayList<>();
    private List<String> sourcesMissing = new ArrayList<>();
    private boolean aiGenerated;

    public String getProposedAmount() {
        return proposedAmount;
    }

    public void setProposedAmount(String proposedAmount) {
        this.proposedAmount = proposedAmount;
    }

    public String getRefundRisk() {
        return refundRisk;
    }

    public void setRefundRisk(String refundRisk) {
        this.refundRisk = refundRisk;
    }

    public String getAuthorityBand() {
        return authorityBand;
    }

    public void setAuthorityBand(String authorityBand) {
        this.authorityBand = authorityBand;
    }

    public String getRationale() {
        return rationale;
    }

    public void setRationale(String rationale) {
        this.rationale = rationale;
    }

    public List<String> getSourcesPresent() {
        return sourcesPresent;
    }

    public void setSourcesPresent(List<String> sourcesPresent) {
        this.sourcesPresent = sourcesPresent != null ? sourcesPresent : new ArrayList<>();
    }

    public List<String> getSourcesMissing() {
        return sourcesMissing;
    }

    public void setSourcesMissing(List<String> sourcesMissing) {
        this.sourcesMissing = sourcesMissing != null ? sourcesMissing : new ArrayList<>();
    }

    public boolean isAiGenerated() {
        return aiGenerated;
    }

    public void setAiGenerated(boolean aiGenerated) {
        this.aiGenerated = aiGenerated;
    }
}
