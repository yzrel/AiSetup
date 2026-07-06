/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna2.dto;

import java.util.ArrayList;
import java.util.List;

public class Tna2FindingSectionDto {
    private String title;
    private String content;
    private List<Tna2FindingSubsectionDto> subsections = new ArrayList<>();

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public List<Tna2FindingSubsectionDto> getSubsections() { return subsections; }
    public void setSubsections(List<Tna2FindingSubsectionDto> subsections) {
        this.subsections = subsections != null ? subsections : new ArrayList<>();
    }
}
