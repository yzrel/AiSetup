/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna2;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.tna2.dto.Tna2DocumentResponse;
import ph.gov.dost.aisetup.tna2.dto.Tna2GenerationRequest;

@RestController
@RequestMapping("/tna2")
public class Tna2Controller {

    private final Tna2GenerationService tna2GenerationService;

    public Tna2Controller(Tna2GenerationService tna2GenerationService) {
        this.tna2GenerationService = tna2GenerationService;
    }

    @PostMapping("/generate")
    public ResponseEntity<Tna2DocumentResponse> generate(@Valid @RequestBody Tna2GenerationRequest request) {
        return ResponseEntity.ok(tna2GenerationService.generate(request));
    }
}
