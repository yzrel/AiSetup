/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna2.dto;

import java.util.ArrayList;
import java.util.List;

public class Tna2ProductivityImprovementDto {
    private List<Tna2KpiDto> kpis = new ArrayList<>();
    private List<String> outcomes = new ArrayList<>();

    public List<Tna2KpiDto> getKpis() { return kpis; }
    public void setKpis(List<Tna2KpiDto> kpis) { this.kpis = kpis; }

    public List<String> getOutcomes() { return outcomes; }
    public void setOutcomes(List<String> outcomes) { this.outcomes = outcomes; }
}
