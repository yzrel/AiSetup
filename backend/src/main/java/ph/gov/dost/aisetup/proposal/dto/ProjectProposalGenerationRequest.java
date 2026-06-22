/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.proposal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ProjectProposalGenerationRequest {

    private String applicationId;

    @NotBlank
    private String enterpriseName;

    private String applicantName;
    private String province;
    private String businessSector;
    private String productServices;
    private String projectDescription;
    private String expectedOutcome;
    private String budget;

    @NotNull
    private Map<String, Object> form = new HashMap<>();

    private List<String> attachmentKinds = new ArrayList<>();

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getEnterpriseName() { return enterpriseName; }
    public void setEnterpriseName(String enterpriseName) { this.enterpriseName = enterpriseName; }

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }

    public String getBusinessSector() { return businessSector; }
    public void setBusinessSector(String businessSector) { this.businessSector = businessSector; }

    public String getProductServices() { return productServices; }
    public void setProductServices(String productServices) { this.productServices = productServices; }

    public String getProjectDescription() { return projectDescription; }
    public void setProjectDescription(String projectDescription) { this.projectDescription = projectDescription; }

    public String getExpectedOutcome() { return expectedOutcome; }
    public void setExpectedOutcome(String expectedOutcome) { this.expectedOutcome = expectedOutcome; }

    public String getBudget() { return budget; }
    public void setBudget(String budget) { this.budget = budget; }

    public Map<String, Object> getForm() { return form; }
    public void setForm(Map<String, Object> form) { this.form = form; }

    public List<String> getAttachmentKinds() { return attachmentKinds; }
    public void setAttachmentKinds(List<String> attachmentKinds) { this.attachmentKinds = attachmentKinds; }
}
