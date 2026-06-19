package ph.gov.dost.aisetup.tna2.dto;

public class Tna2EnterpriseProfileDto {
    private String enterpriseName;
    private String address;
    private String businessType;
    private String sector;
    private String commodity;
    private String mainProduct;
    private String employees;
    private String contactPerson;
    private String contactNumber;
    private String emailAddress;

    public String getEnterpriseName() { return enterpriseName; }
    public void setEnterpriseName(String enterpriseName) { this.enterpriseName = enterpriseName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getBusinessType() { return businessType; }
    public void setBusinessType(String businessType) { this.businessType = businessType; }

    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }

    public String getCommodity() { return commodity; }
    public void setCommodity(String commodity) { this.commodity = commodity; }

    public String getMainProduct() { return mainProduct; }
    public void setMainProduct(String mainProduct) { this.mainProduct = mainProduct; }

    public String getEmployees() { return employees; }
    public void setEmployees(String employees) { this.employees = employees; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getEmailAddress() { return emailAddress; }
    public void setEmailAddress(String emailAddress) { this.emailAddress = emailAddress; }
}
