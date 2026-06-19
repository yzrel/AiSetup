package ph.gov.dost.aisetup.tna1;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.tna1.dto.Tna1DocumentResponse;
import ph.gov.dost.aisetup.tna1.dto.Tna1GenerationRequest;

@RestController
@RequestMapping("/tna1")
public class Tna1Controller {

    private final Tna1GenerationService tna1GenerationService;

    public Tna1Controller(Tna1GenerationService tna1GenerationService) {
        this.tna1GenerationService = tna1GenerationService;
    }

    @PostMapping("/generate")
    public ResponseEntity<Tna1DocumentResponse> generate(@Valid @RequestBody Tna1GenerationRequest request) {
        return ResponseEntity.ok(tna1GenerationService.generate(request));
    }
}
