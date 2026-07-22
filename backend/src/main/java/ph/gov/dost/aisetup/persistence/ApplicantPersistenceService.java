/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ph.gov.dost.aisetup.persistence.dto.Tna1FormSaveRequest;
import ph.gov.dost.aisetup.persistence.dto.Tna1FormSaveResponse;

@Service
public class ApplicantPersistenceService {

    /** Upper bound for a serialized payload (moduleData or profile) — 5 MB. */
    static final int MAX_PAYLOAD_CHARS = 5 * 1024 * 1024;

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
        entity.setModuleDataJson(writePayload(
                preserveServerOwnedKeys(dto.moduleData(), entity.getModuleDataJson()), "moduleData"));
        entity.setProfileJson(writePayload(dto.profile(), "profile"));
        entity.setUpdatedAt(Instant.now());
        return toDto(repository.save(entity));
    }

    /**
     * The "uploads" slice is written server-side by the file store; keep it when
     * a whole-blob save from the frontend does not carry it.
     */
    private Map<String, Object> preserveServerOwnedKeys(
            Map<String, Object> incoming, String existingJson) {
        Map<String, Object> existing = readPayload(existingJson);
        Object uploads = existing.get("uploads");
        if (uploads == null) {
            return incoming;
        }
        Map<String, Object> merged = new LinkedHashMap<>(incoming != null ? incoming : Map.of());
        merged.putIfAbsent("uploads", uploads);
        return merged;
    }

    /**
     * Merges a TNA Form 01 payload into {@code moduleData.tna1}, preserving
     * unrelated keys (staff review flags, file metadata, etc.).
     */
    @Transactional
    public Tna1FormSaveResponse saveTna1(String id, Tna1FormSaveRequest request) {
        if (request.getApplicantId() != null
                && !request.getApplicantId().isBlank()
                && !request.getApplicantId().equals(id)) {
            throw new IllegalArgumentException("applicantId in body must match path id");
        }

        ApplicantRecord entity = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Applicant not found: " + id));

        Map<String, Object> moduleData = new LinkedHashMap<>(readPayload(entity.getModuleDataJson()));
        @SuppressWarnings("unchecked")
        Map<String, Object> existingTna1 = moduleData.get("tna1") instanceof Map<?, ?> map
                ? new LinkedHashMap<>((Map<String, Object>) map)
                : new LinkedHashMap<>();

        existingTna1.put("form", request.getForm() != null ? request.getForm() : Map.of());
        existingTna1.put("tables", request.getTables() != null ? request.getTables() : Map.of());
        existingTna1.put("submitted", request.isSubmitted());
        if (request.isSubmitted()) {
            existingTna1.putIfAbsent("submittedAt", Instant.now().toString());
        }
        existingTna1.put("updatedAt", Instant.now().toString());

        moduleData.put("tna1", existingTna1);
        entity.setModuleDataJson(writePayload(moduleData, "moduleData"));
        entity.setUpdatedAt(Instant.now());
        if (entity.getCurrentModule() == null || entity.getCurrentModule().isBlank()) {
            entity.setCurrentModule("tna1");
        }
        repository.save(entity);
        return new Tna1FormSaveResponse(true);
    }

    @Transactional(readOnly = true)
    public Optional<ApplicantRecordDto> findById(String id) {
        return repository.findById(id).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<ApplicantRecordDto> findAll() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    /**
     * Merges a single module payload into {@code moduleData[moduleKey]},
     * optionally setting {@code published}/{@code publishedAt}.
     */
    @Transactional
    public ApplicantRecordDto mergeModuleKey(
            String id,
            String moduleKey,
            Map<String, Object> data,
            Boolean published) {
        if (moduleKey == null || moduleKey.isBlank()) {
            throw new IllegalArgumentException("moduleKey is required");
        }
        ApplicantRecord entity = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Applicant not found: " + id));
        Map<String, Object> moduleData = new LinkedHashMap<>(readPayload(entity.getModuleDataJson()));
        Map<String, Object> merged = new LinkedHashMap<>();
        Object existing = moduleData.get(moduleKey);
        if (existing instanceof Map<?, ?> map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> existingMap = (Map<String, Object>) map;
            merged.putAll(existingMap);
        }
        if (data != null) {
            merged.putAll(data);
        }
        if (Boolean.TRUE.equals(published)) {
            merged.put("published", true);
            merged.putIfAbsent("publishedAt", Instant.now().toString());
        }
        moduleData.put(moduleKey, merged);
        entity.setModuleDataJson(writePayload(moduleData, "moduleData"));
        entity.setUpdatedAt(Instant.now());
        return toDto(repository.save(entity));
    }

    @Transactional(readOnly = true)
    public Optional<ApplicantRecordDto> findByApplicationId(String applicationId) {
        return repository.findByApplicationId(applicationId).map(this::toDto);
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
            // Legacy / corrupt blobs normalize to empty map on read.
            return Map.of();
        }
    }
}
