/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai.dto;

import ph.gov.dost.aisetup.proposal.dto.ProjectProposalRiskRowDto;

import java.util.ArrayList;
import java.util.List;

public class AiFieldSuggestionResponse {

    private String module;
    private String field;
    private String text;
    private List<String> bullets = new ArrayList<>();
    private List<ProjectProposalRiskRowDto> riskRows = new ArrayList<>();
    private boolean aiGenerated;

    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }

    public String getField() { return field; }
    public void setField(String field) { this.field = field; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public List<String> getBullets() { return bullets; }
    public void setBullets(List<String> bullets) { this.bullets = bullets; }

    public List<ProjectProposalRiskRowDto> getRiskRows() { return riskRows; }
    public void setRiskRows(List<ProjectProposalRiskRowDto> riskRows) { this.riskRows = riskRows; }

    public boolean isAiGenerated() { return aiGenerated; }
    public void setAiGenerated(boolean aiGenerated) { this.aiGenerated = aiGenerated; }
}
