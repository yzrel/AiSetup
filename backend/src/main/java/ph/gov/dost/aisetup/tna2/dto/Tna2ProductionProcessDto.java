package ph.gov.dost.aisetup.tna2.dto;

import java.util.ArrayList;
import java.util.List;

public class Tna2ProductionProcessDto {
    private String summary = "";
    private List<String> findings = new ArrayList<>();

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public List<String> getFindings() { return findings; }
    public void setFindings(List<String> findings) { this.findings = findings; }
}
