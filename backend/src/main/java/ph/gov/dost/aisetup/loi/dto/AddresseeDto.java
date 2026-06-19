package ph.gov.dost.aisetup.loi.dto;

import java.util.List;

public class AddresseeDto {

    private String name;
    private String title;
    private String thruLine;
    private String officeName;
    private List<String> lines;
    private List<String> addressLines;
    private boolean defaulted;

    public AddresseeDto() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getThruLine() { return thruLine; }
    public void setThruLine(String thruLine) { this.thruLine = thruLine; }

    public String getOfficeName() { return officeName; }
    public void setOfficeName(String officeName) { this.officeName = officeName; }

    public List<String> getLines() { return lines; }
    public void setLines(List<String> lines) { this.lines = lines; }

    public List<String> getAddressLines() { return addressLines; }
    public void setAddressLines(List<String> addressLines) { this.addressLines = addressLines; }

    public boolean isDefaulted() { return defaulted; }
    public void setDefaulted(boolean defaulted) { this.defaulted = defaulted; }
}
