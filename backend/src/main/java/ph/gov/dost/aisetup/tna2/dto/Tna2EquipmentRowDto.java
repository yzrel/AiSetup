/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna2.dto;

public class Tna2EquipmentRowDto {
    private String name;
    private String specifications;
    private String quantity;
    private String estimatedCost;
    private String priority;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecifications() { return specifications; }
    public void setSpecifications(String specifications) { this.specifications = specifications; }

    public String getQuantity() { return quantity; }
    public void setQuantity(String quantity) { this.quantity = quantity; }

    public String getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(String estimatedCost) { this.estimatedCost = estimatedCost; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
}
