/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.loi.dto;

public class SignatureDto {

    private String typedName;
    private String printedName;
    private String designation;
    private String enterpriseName;
    private String dateSigned;

    public SignatureDto() {}

    public SignatureDto(String typedName, String printedName, String designation, String enterpriseName, String dateSigned) {
        this.typedName = typedName;
        this.printedName = printedName;
        this.designation = designation;
        this.enterpriseName = enterpriseName;
        this.dateSigned = dateSigned;
    }

    public String getTypedName() { return typedName; }
    public void setTypedName(String typedName) { this.typedName = typedName; }

    public String getPrintedName() { return printedName; }
    public void setPrintedName(String printedName) { this.printedName = printedName; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getEnterpriseName() { return enterpriseName; }
    public void setEnterpriseName(String enterpriseName) { this.enterpriseName = enterpriseName; }

    public String getDateSigned() { return dateSigned; }
    public void setDateSigned(String dateSigned) { this.dateSigned = dateSigned; }
}
