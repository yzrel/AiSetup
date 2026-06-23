/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/applicants")
public class ApplicantController {

    private final ApplicantPersistenceService persistenceService;

    public ApplicantController(ApplicantPersistenceService persistenceService) {
        this.persistenceService = persistenceService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicantRecordDto> get(@PathVariable String id) {
        return persistenceService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApplicantRecordDto> save(
            @PathVariable String id,
            @RequestBody ApplicantRecordDto body) {
        ApplicantRecordDto dto = new ApplicantRecordDto(
                id,
                body.applicationId(),
                body.enterpriseName(),
                body.currentModule(),
                body.moduleData(),
                body.updatedAt());
        ApplicantRecord saved = persistenceService.save(dto);
        return persistenceService.findById(saved.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.internalServerError().build());
    }
}
