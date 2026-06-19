package ph.gov.dost.aisetup.tna1.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.HashMap;
import java.util.Map;

public class Tna1GenerationRequest {

    private String applicationId;

    @NotBlank
    private String enterpriseName;

    private String applicantName;
    private String designation;
    private String emailAddress;
    private String contactNumber;
    private String address;
    private String province;
    private String msmeSize;
    private String businessType;
    private String businessSector;
    private String businessNature;
    private String yearsOfOperation;
    private String assetSize;
    private String productServices;
    private String projectDescription;
    private String expectedOutcome;
    private String companyDescription;
    private String loiBackground;

    @NotNull
    private Map<String, Object> form = new HashMap<>();

    @NotNull
    private Tna1TablesDto tables = new Tna1TablesDto();

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getEnterpriseName() { return enterpriseName; }
    public void setEnterpriseName(String enterpriseName) { this.enterpriseName = enterpriseName; }

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getEmailAddress() { return emailAddress; }
    public void setEmailAddress(String emailAddress) { this.emailAddress = emailAddress; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }

    public String getMsmeSize() { return msmeSize; }
    public void setMsmeSize(String msmeSize) { this.msmeSize = msmeSize; }

    public String getBusinessType() { return businessType; }
    public void setBusinessType(String businessType) { this.businessType = businessType; }

    public String getBusinessSector() { return businessSector; }
    public void setBusinessSector(String businessSector) { this.businessSector = businessSector; }

    public String getBusinessNature() { return businessNature; }
    public void setBusinessNature(String businessNature) { this.businessNature = businessNature; }

    public String getYearsOfOperation() { return yearsOfOperation; }
    public void setYearsOfOperation(String yearsOfOperation) { this.yearsOfOperation = yearsOfOperation; }

    public String getAssetSize() { return assetSize; }
    public void setAssetSize(String assetSize) { this.assetSize = assetSize; }

    public String getProductServices() { return productServices; }
    public void setProductServices(String productServices) { this.productServices = productServices; }

    public String getProjectDescription() { return projectDescription; }
    public void setProjectDescription(String projectDescription) { this.projectDescription = projectDescription; }

    public String getExpectedOutcome() { return expectedOutcome; }
    public void setExpectedOutcome(String expectedOutcome) { this.expectedOutcome = expectedOutcome; }

    public String getCompanyDescription() { return companyDescription; }
    public void setCompanyDescription(String companyDescription) { this.companyDescription = companyDescription; }

    public String getLoiBackground() { return loiBackground; }
    public void setLoiBackground(String loiBackground) { this.loiBackground = loiBackground; }

    public Map<String, Object> getForm() { return form; }
    public void setForm(Map<String, Object> form) { this.form = form; }

    public Tna1TablesDto getTables() { return tables; }
    public void setTables(Tna1TablesDto tables) { this.tables = tables; }
}
