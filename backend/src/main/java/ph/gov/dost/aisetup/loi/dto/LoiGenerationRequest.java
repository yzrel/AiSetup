/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.loi.dto;

import jakarta.validation.constraints.NotBlank;

public class LoiGenerationRequest {

    private String applicantName;
    private String designation;
    @NotBlank
    private String enterpriseName;
    private String emailAddress;
    private String contactNumber;
    private String address;
    private String province;
    private String zipCode;
    private String tinNumber;
    private String registrationType;
    private String registrationNumber;
    private String companyDescription;
    private String dateEstablished;

    private String msmeSize;
    private String businessType;
    private String businessSector;
    private String businessNature;
    private String yearsOfOperation;
    private String assetSize;
    private String coreProducts;
    private String turnover;
    private Boolean qualified;
    private String exportClassification;

    private String productServices;
    private String projectDescription;
    private String expectedOutcome;
    private String budget;
    private String timeline;
    private String commitmentAmount;
    private String repaymentTerm;
    private String productionPlanFile;

    private String signature;
    private String dateSigned;

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getEnterpriseName() { return enterpriseName; }
    public void setEnterpriseName(String enterpriseName) { this.enterpriseName = enterpriseName; }

    public String getEmailAddress() { return emailAddress; }
    public void setEmailAddress(String emailAddress) { this.emailAddress = emailAddress; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }

    public String getZipCode() { return zipCode; }
    public void setZipCode(String zipCode) { this.zipCode = zipCode; }

    public String getTinNumber() { return tinNumber; }
    public void setTinNumber(String tinNumber) { this.tinNumber = tinNumber; }

    public String getRegistrationType() { return registrationType; }
    public void setRegistrationType(String registrationType) { this.registrationType = registrationType; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getCompanyDescription() { return companyDescription; }
    public void setCompanyDescription(String companyDescription) { this.companyDescription = companyDescription; }

    public String getDateEstablished() { return dateEstablished; }
    public void setDateEstablished(String dateEstablished) { this.dateEstablished = dateEstablished; }

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

    public String getCoreProducts() { return coreProducts; }
    public void setCoreProducts(String coreProducts) { this.coreProducts = coreProducts; }

    public String getTurnover() { return turnover; }
    public void setTurnover(String turnover) { this.turnover = turnover; }

    public Boolean getQualified() { return qualified; }
    public void setQualified(Boolean qualified) { this.qualified = qualified; }

    public String getExportClassification() { return exportClassification; }
    public void setExportClassification(String exportClassification) { this.exportClassification = exportClassification; }

    public String getProductServices() { return productServices; }
    public void setProductServices(String productServices) { this.productServices = productServices; }

    public String getProjectDescription() { return projectDescription; }
    public void setProjectDescription(String projectDescription) { this.projectDescription = projectDescription; }

    public String getExpectedOutcome() { return expectedOutcome; }
    public void setExpectedOutcome(String expectedOutcome) { this.expectedOutcome = expectedOutcome; }

    public String getBudget() { return budget; }
    public void setBudget(String budget) { this.budget = budget; }

    public String getTimeline() { return timeline; }
    public void setTimeline(String timeline) { this.timeline = timeline; }

    public String getCommitmentAmount() { return commitmentAmount; }
    public void setCommitmentAmount(String commitmentAmount) { this.commitmentAmount = commitmentAmount; }

    public String getRepaymentTerm() { return repaymentTerm; }
    public void setRepaymentTerm(String repaymentTerm) { this.repaymentTerm = repaymentTerm; }

    public String getProductionPlanFile() { return productionPlanFile; }
    public void setProductionPlanFile(String productionPlanFile) { this.productionPlanFile = productionPlanFile; }

    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }

    public String getDateSigned() { return dateSigned; }
    public void setDateSigned(String dateSigned) { this.dateSigned = dateSigned; }
}
