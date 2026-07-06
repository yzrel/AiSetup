/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna2.dto;

public class Tna2FindingSubsectionDto {
    private String id;
    private String label;
    private String content;

    public Tna2FindingSubsectionDto() {}

    public Tna2FindingSubsectionDto(String id, String label, String content) {
        this.id = id;
        this.label = label;
        this.content = content;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
