/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna1.dto;

import java.util.ArrayList;
import java.util.List;

public class Tna1TablesDto {

    private List<List<String>> rawMaterials = new ArrayList<>();
    private List<List<String>> production = new ArrayList<>();
    private List<List<String>> equipment = new ArrayList<>();

    public List<List<String>> getRawMaterials() { return rawMaterials; }
    public void setRawMaterials(List<List<String>> rawMaterials) { this.rawMaterials = rawMaterials; }

    public List<List<String>> getProduction() { return production; }
    public void setProduction(List<List<String>> production) { this.production = production; }

    public List<List<String>> getEquipment() { return equipment; }
    public void setEquipment(List<List<String>> equipment) { this.equipment = equipment; }
}
