/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.proposal.dto;

public class ProjectProposalRiskRowDto {

    private String id;
    private String risk;
    private String assumption;
    private String plan;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRisk() { return risk; }
    public void setRisk(String risk) { this.risk = risk; }

    public String getAssumption() { return assumption; }
    public void setAssumption(String assumption) { this.assumption = assumption; }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
}
