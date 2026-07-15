/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicantPersistenceService {

    /** Upper bound for a serialized payload (moduleData or profile) — 5 MB. */
    private static final int MAX_PAYLOAD_CHARS = 5 * 1024 * 1024;

    private final ApplicantRecordRepository repository;
    private final ObjectMapper objectMapper;

    public ApplicantPersistenceService(
            ApplicantRecordRepository repository,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ApplicantRecordDto save(ApplicantRecordDto dto) {
        ApplicantRecord entity = repository.findById(dto.id())
                .orElseGet(ApplicantRecord::new);
        entity.setId(dto.id());
        entity.setApplicationId(dto.applicationId());
        entity.setEnterpriseName(dto.enterpriseName());
        entity.setCurrentModule(dto.currentModule());
        entity.setModuleDataJson(writePayload(dto.moduleData(), "moduleData"));
        entity.setProfileJson(writePayload(dto.profile(), "profile"));
        entity.setUpdatedAt(Instant.now());
        return toDto(repository.save(entity));
    }

    @Transactional(readOnly = true)
    public Optional<ApplicantRecordDto> findById(String id) {
        return repository.findById(id).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<ApplicantRecordDto> findAll() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    private String writePayload(Map<String, Object> payload, String fieldName) {
        try {
            String json = objectMapper.writeValueAsString(payload != null ? payload : Map.of());
            if (json.length() > MAX_PAYLOAD_CHARS) {
                throw new IllegalArgumentException(fieldName + " payload exceeds the maximum allowed size");
            }
            return json;
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid " + fieldName + " JSON", e);
        }
    }

    private ApplicantRecordDto toDto(ApplicantRecord entity) {
        return new ApplicantRecordDto(
                entity.getId(),
                entity.getApplicationId(),
                entity.getEnterpriseName(),
                entity.getCurrentModule(),
                readPayload(entity.getModuleDataJson()),
                readPayload(entity.getProfileJson()),
                entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null);
    }

    private Map<String, Object> readPayload(String json) {
        try {
            return objectMapper.readValue(json != null ? json : "{}", new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }
}
