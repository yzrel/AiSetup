/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.proposal;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.proposal.dto.ProjectProposalDocumentResponse;
import ph.gov.dost.aisetup.proposal.dto.ProjectProposalGenerationRequest;

@RestController
@RequestMapping("/project-proposal")
public class ProjectProposalController {

    private final ProjectProposalGenerationService generationService;

    public ProjectProposalController(ProjectProposalGenerationService generationService) {
        this.generationService = generationService;
    }

    @PostMapping("/generate")
    public ResponseEntity<ProjectProposalDocumentResponse> generate(
            @Valid @RequestBody ProjectProposalGenerationRequest request) {
        return ResponseEntity.ok(generationService.generate(request));
    }
}
