/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna2.dto;

import java.util.ArrayList;
import java.util.List;

public class Tna2DocumentResponse {
    private String documentRef;
    private String assessmentDate;
    private String applicationId;
    private Tna2EnterpriseProfileDto enterpriseProfile = new Tna2EnterpriseProfileDto();
    private String background;
    private String methodology;
    private List<Tna2FindingSectionDto> findingsByArea = new ArrayList<>();
    private String otherObservations;
    private String conclusions;
    private List<String> recommendations = new ArrayList<>();
    private List<Tna2InterventionRowDto> interventionRows = new ArrayList<>();
    private Tna2TeamDto tnaTeam = new Tna2TeamDto();
    private List<String> siteValidationFindings = new ArrayList<>();
    private Tna2ProductionProcessDto productionProcessAnalysis = new Tna2ProductionProcessDto();
    private List<String> technologyGaps = new ArrayList<>();
    private List<String> proposedInterventions = new ArrayList<>();
    private List<Tna2EquipmentRowDto> recommendedEquipment = new ArrayList<>();
    private Tna2ProductivityImprovementDto productivityImprovement = new Tna2ProductivityImprovementDto();
    private Tna2AssessorDto assessor = new Tna2AssessorDto();
    private Tna2AssessorDto attestedBy = new Tna2AssessorDto();
    private String generatedAt;
    private boolean aiGenerated;

    public String getDocumentRef() { return documentRef; }
    public void setDocumentRef(String documentRef) { this.documentRef = documentRef; }

    public String getAssessmentDate() { return assessmentDate; }
    public void setAssessmentDate(String assessmentDate) { this.assessmentDate = assessmentDate; }

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public Tna2EnterpriseProfileDto getEnterpriseProfile() { return enterpriseProfile; }
    public void setEnterpriseProfile(Tna2EnterpriseProfileDto enterpriseProfile) { this.enterpriseProfile = enterpriseProfile; }

    public String getBackground() { return background; }
    public void setBackground(String background) { this.background = background; }

    public String getMethodology() { return methodology; }
    public void setMethodology(String methodology) { this.methodology = methodology; }

    public List<Tna2FindingSectionDto> getFindingsByArea() { return findingsByArea; }
    public void setFindingsByArea(List<Tna2FindingSectionDto> findingsByArea) { this.findingsByArea = findingsByArea; }

    public String getOtherObservations() { return otherObservations; }
    public void setOtherObservations(String otherObservations) { this.otherObservations = otherObservations; }

    public String getConclusions() { return conclusions; }
    public void setConclusions(String conclusions) { this.conclusions = conclusions; }

    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }

    public List<Tna2InterventionRowDto> getInterventionRows() { return interventionRows; }
    public void setInterventionRows(List<Tna2InterventionRowDto> interventionRows) { this.interventionRows = interventionRows; }

    public Tna2TeamDto getTnaTeam() { return tnaTeam; }
    public void setTnaTeam(Tna2TeamDto tnaTeam) { this.tnaTeam = tnaTeam; }

    public List<String> getSiteValidationFindings() { return siteValidationFindings; }
    public void setSiteValidationFindings(List<String> siteValidationFindings) { this.siteValidationFindings = siteValidationFindings; }

    public Tna2ProductionProcessDto getProductionProcessAnalysis() { return productionProcessAnalysis; }
    public void setProductionProcessAnalysis(Tna2ProductionProcessDto productionProcessAnalysis) { this.productionProcessAnalysis = productionProcessAnalysis; }

    public List<String> getTechnologyGaps() { return technologyGaps; }
    public void setTechnologyGaps(List<String> technologyGaps) { this.technologyGaps = technologyGaps; }

    public List<String> getProposedInterventions() { return proposedInterventions; }
    public void setProposedInterventions(List<String> proposedInterventions) { this.proposedInterventions = proposedInterventions; }

    public List<Tna2EquipmentRowDto> getRecommendedEquipment() { return recommendedEquipment; }
    public void setRecommendedEquipment(List<Tna2EquipmentRowDto> recommendedEquipment) { this.recommendedEquipment = recommendedEquipment; }

    public Tna2ProductivityImprovementDto getProductivityImprovement() { return productivityImprovement; }
    public void setProductivityImprovement(Tna2ProductivityImprovementDto productivityImprovement) { this.productivityImprovement = productivityImprovement; }

    public Tna2AssessorDto getAssessor() { return assessor; }
    public void setAssessor(Tna2AssessorDto assessor) { this.assessor = assessor; }

    public Tna2AssessorDto getAttestedBy() { return attestedBy; }
    public void setAttestedBy(Tna2AssessorDto attestedBy) { this.attestedBy = attestedBy; }

    public String getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(String generatedAt) { this.generatedAt = generatedAt; }

    public boolean isAiGenerated() { return aiGenerated; }
    public void setAiGenerated(boolean aiGenerated) { this.aiGenerated = aiGenerated; }
}
