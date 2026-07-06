/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna2.dto;

import java.util.ArrayList;
import java.util.List;

public class Tna2TeamDto {
    private Tna2TeamMemberDto leader = new Tna2TeamMemberDto();
    private List<Tna2TeamMemberDto> members = new ArrayList<>();

    public Tna2TeamMemberDto getLeader() { return leader; }
    public void setLeader(Tna2TeamMemberDto leader) { this.leader = leader; }

    public List<Tna2TeamMemberDto> getMembers() { return members; }
    public void setMembers(List<Tna2TeamMemberDto> members) { this.members = members; }
}