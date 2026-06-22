/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.proposal.dto;

import java.util.ArrayList;
import java.util.List;

public class ProjectProposalDocumentResponse {

    private String applicationId;
    private String formTitle;
    private String generatedAt;
    private boolean aiGenerated;
    private String generalObjective;
    private List<String> specificObjectives = new ArrayList<>();
    private String enterpriseBackground;
    private String skillsExpertise;
    private String plantSiteNarrative;
    private String capacityVolumeNarrative;
    private String rawMaterialsNarrative;
    private String marketSituation;
    private String productDemandSupply;
    private String distributionChannel;
    private String competitors;
    private List<String> marketStrategies = new ArrayList<>();
    private String productionProcess;
    private String equipmentNarrative;
    private String interventionProblem;
    private String interventionProposed;
    private String interventionEquipment;
    private String interventionImpact;
    private List<String> expectedOutputBullets = new ArrayList<>();
    private String wasteManagement;
    private String financialAnalysis;
    private List<ProjectProposalRiskRowDto> riskRows = new ArrayList<>();

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getFormTitle() { return formTitle; }
    public void setFormTitle(String formTitle) { this.formTitle = formTitle; }

    public String getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(String generatedAt) { this.generatedAt = generatedAt; }

    public boolean isAiGenerated() { return aiGenerated; }
    public void setAiGenerated(boolean aiGenerated) { this.aiGenerated = aiGenerated; }

    public String getGeneralObjective() { return generalObjective; }
    public void setGeneralObjective(String generalObjective) { this.generalObjective = generalObjective; }

    public List<String> getSpecificObjectives() { return specificObjectives; }
    public void setSpecificObjectives(List<String> specificObjectives) { this.specificObjectives = specificObjectives; }

    public String getEnterpriseBackground() { return enterpriseBackground; }
    public void setEnterpriseBackground(String enterpriseBackground) { this.enterpriseBackground = enterpriseBackground; }

    public String getSkillsExpertise() { return skillsExpertise; }
    public void setSkillsExpertise(String skillsExpertise) { this.skillsExpertise = skillsExpertise; }

    public String getPlantSiteNarrative() { return plantSiteNarrative; }
    public void setPlantSiteNarrative(String plantSiteNarrative) { this.plantSiteNarrative = plantSiteNarrative; }

    public String getCapacityVolumeNarrative() { return capacityVolumeNarrative; }
    public void setCapacityVolumeNarrative(String capacityVolumeNarrative) { this.capacityVolumeNarrative = capacityVolumeNarrative; }

    public String getRawMaterialsNarrative() { return rawMaterialsNarrative; }
    public void setRawMaterialsNarrative(String rawMaterialsNarrative) { this.rawMaterialsNarrative = rawMaterialsNarrative; }

    public String getMarketSituation() { return marketSituation; }
    public void setMarketSituation(String marketSituation) { this.marketSituation = marketSituation; }

    public String getProductDemandSupply() { return productDemandSupply; }
    public void setProductDemandSupply(String productDemandSupply) { this.productDemandSupply = productDemandSupply; }

    public String getDistributionChannel() { return distributionChannel; }
    public void setDistributionChannel(String distributionChannel) { this.distributionChannel = distributionChannel; }

    public String getCompetitors() { return competitors; }
    public void setCompetitors(String competitors) { this.competitors = competitors; }

    public List<String> getMarketStrategies() { return marketStrategies; }
    public void setMarketStrategies(List<String> marketStrategies) { this.marketStrategies = marketStrategies; }

    public String getProductionProcess() { return productionProcess; }
    public void setProductionProcess(String productionProcess) { this.productionProcess = productionProcess; }

    public String getEquipmentNarrative() { return equipmentNarrative; }
    public void setEquipmentNarrative(String equipmentNarrative) { this.equipmentNarrative = equipmentNarrative; }

    public String getInterventionProblem() { return interventionProblem; }
    public void setInterventionProblem(String interventionProblem) { this.interventionProblem = interventionProblem; }

    public String getInterventionProposed() { return interventionProposed; }
    public void setInterventionProposed(String interventionProposed) { this.interventionProposed = interventionProposed; }

    public String getInterventionEquipment() { return interventionEquipment; }
    public void setInterventionEquipment(String interventionEquipment) { this.interventionEquipment = interventionEquipment; }

    public String getInterventionImpact() { return interventionImpact; }
    public void setInterventionImpact(String interventionImpact) { this.interventionImpact = interventionImpact; }

    public List<String> getExpectedOutputBullets() { return expectedOutputBullets; }
    public void setExpectedOutputBullets(List<String> expectedOutputBullets) { this.expectedOutputBullets = expectedOutputBullets; }

    public String getWasteManagement() { return wasteManagement; }
    public void setWasteManagement(String wasteManagement) { this.wasteManagement = wasteManagement; }

    public String getFinancialAnalysis() { return financialAnalysis; }
    public void setFinancialAnalysis(String financialAnalysis) { this.financialAnalysis = financialAnalysis; }

    public List<ProjectProposalRiskRowDto> getRiskRows() { return riskRows; }
    public void setRiskRows(List<ProjectProposalRiskRowDto> riskRows) { this.riskRows = riskRows; }
}
