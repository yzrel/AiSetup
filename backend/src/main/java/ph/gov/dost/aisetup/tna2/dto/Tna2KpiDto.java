/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna2.dto;

public class Tna2KpiDto {
    private String label;
    private String before;
    private String after;
    private String change;

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getBefore() { return before; }
    public void setBefore(String before) { this.before = before; }

    public String getAfter() { return after; }
    public void setAfter(String after) { this.after = after; }

    public String getChange() { return change; }
    public void setChange(String change) { this.change = change; }
}
