package ph.gov.dost.aisetup.loi;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.loi.dto.LoiDocumentResponse;
import ph.gov.dost.aisetup.loi.dto.LoiGenerationRequest;

@RestController
@RequestMapping("/loi")
public class LoiController {

    private final LoiGenerationService loiGenerationService;

    public LoiController(LoiGenerationService loiGenerationService) {
        this.loiGenerationService = loiGenerationService;
    }

    @PostMapping("/generate")
    public ResponseEntity<LoiDocumentResponse> generate(@Valid @RequestBody LoiGenerationRequest request) {
        return ResponseEntity.ok(loiGenerationService.generate(request));
    }
}
