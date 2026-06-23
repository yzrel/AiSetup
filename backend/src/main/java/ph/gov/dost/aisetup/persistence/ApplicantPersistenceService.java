/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ApplicantPersistenceService {

    private final ApplicantRecordRepository repository;
    private final ObjectMapper objectMapper;

    public ApplicantPersistenceService(
            ApplicantRecordRepository repository,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public ApplicantRecord save(ApplicantRecordDto dto) {
        ApplicantRecord entity = repository.findById(dto.id())
                .orElseGet(ApplicantRecord::new);
        entity.setId(dto.id());
        entity.setApplicationId(dto.applicationId());
        entity.setEnterpriseName(dto.enterpriseName());
        entity.setCurrentModule(dto.currentModule());
        try {
            entity.setModuleDataJson(objectMapper.writeValueAsString(dto.moduleData()));
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid moduleData JSON", e);
        }
        entity.setUpdatedAt(Instant.now());
        return repository.save(entity);
    }

    public Optional<ApplicantRecordDto> findById(String id) {
        return repository.findById(id).map(this::toDto);
    }

    private ApplicantRecordDto toDto(ApplicantRecord entity) {
        Map<String, Object> moduleData;
        try {
            moduleData = objectMapper.readValue(
                    entity.getModuleDataJson() != null ? entity.getModuleDataJson() : "{}",
                    new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            moduleData = Map.of();
        }
        return new ApplicantRecordDto(
                entity.getId(),
                entity.getApplicationId(),
                entity.getEnterpriseName(),
                entity.getCurrentModule(),
                moduleData,
                entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null);
    }
}
