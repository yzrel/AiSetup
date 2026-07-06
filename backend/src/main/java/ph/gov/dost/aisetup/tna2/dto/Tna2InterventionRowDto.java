/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna2.dto;

public class Tna2InterventionRowDto {
    private String problem;
    private String intervention;
    private String equipment;
    private String impact;

    public String getProblem() { return problem; }
    public void setProblem(String problem) { this.problem = problem; }

    public String getIntervention() { return intervention; }
    public void setIntervention(String intervention) { this.intervention = intervention; }

    public String getEquipment() { return equipment; }
    public void setEquipment(String equipment) { this.equipment = equipment; }

    public String getImpact() { return impact; }
    public void setImpact(String impact) { this.impact = impact; }
}
