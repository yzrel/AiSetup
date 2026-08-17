/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ph.gov.dost.aisetup.persistence.dto.Tna1FormSaveRequest;
import ph.gov.dost.aisetup.persistence.dto.Tna1FormSaveResponse;
import ph.gov.dost.aisetup.workflow.ModuleOrder;

@Service
public class ApplicantPersistenceService {

    /**
     * Upper bound for the legacy whole-blob column after heavy binaries are stripped.
     * Prefer {@link #MAX_MODULE_CHARS} per module row going forward.
     */
    static final int MAX_PAYLOAD_CHARS = 5 * 1024 * 1024;

    /** Per-module row cap in {@code applicant_module_data}. */
    static final int MAX_MODULE_CHARS = 2 * 1024 * 1024;

    private static final String DATA_URL_PREFIX = "data:";
    private static final int HEAVY_STRING_MIN = 512;

    private final ApplicantRecordRepository repository;
    private final ApplicantModuleDataRepository moduleDataRepository;
    private final ObjectMapper objectMapper;

    public ApplicantPersistenceService(
            ApplicantRecordRepository repository,
            ApplicantModuleDataRepository moduleDataRepository,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.moduleDataRepository = moduleDataRepository;
        this.objectMapper = objectMapper;
    }

    /** Reserved module row for top-level scalar / array flags (accountStatus, tinNumber, …). */
    public static final String CASE_META_KEY = "caseMeta";

    @Transactional
    public ApplicantRecordDto save(ApplicantRecordDto dto) {
        ApplicantRecord entity = repository.findById(dto.id())
                .orElseGet(ApplicantRecord::new);
        entity.setId(dto.id());
        entity.setApplicationId(dto.applicationId());
        entity.setEnterpriseName(dto.enterpriseName());
        entity.setCurrentModule(ModuleOrder.normalize(dto.currentModule()));
        Map<String, Object> merged = preserveServerOwnedKeys(
                dto.moduleData(), entity.getModuleDataJson());
        // Dual-write: per-module rows (primary SoR) + legacy blob for rollback/compat.
        upsertAllModuleRows(dto.id(), merged);
        entity.setModuleDataJson(writePayload(merged, "moduleData"));
        entity.setProfileJson(writePayload(dto.profile(), "profile"));
        entity.setUpdatedAt(Instant.now());
        return toDto(repository.save(entity));
    }

    /**
     * Updates case header only (profile / currentModule / enterpriseName) without
     * touching module payloads. Used so FE can advance workflow without a whole-blob PUT.
     */
    @Transactional
    public ApplicantRecordDto updateHeader(
            String id,
            String applicationId,
            String enterpriseName,
            String currentModule,
            Map<String, Object> profile) {
        ApplicantRecord entity = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Applicant not found: " + id));
        if (applicationId != null && !applicationId.isBlank()) {
            entity.setApplicationId(applicationId);
        }
        if (enterpriseName != null) {
            entity.setEnterpriseName(enterpriseName);
        }
        if (currentModule != null) {
            entity.setCurrentModule(ModuleOrder.normalize(currentModule));
        }
        if (profile != null) {
            entity.setProfileJson(writePayload(profile, "profile"));
        }
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
        Map<String, Object> merged = new LinkedHashMap<>(incoming != null ? incoming : Map.of());
        if (uploads != null) {
            merged.putIfAbsent("uploads", uploads);
        }
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

        Map<String, Object> moduleData = resolveModuleData(entity);
        @SuppressWarnings("unchecked")
        Map<String, Object> existingTna1 = moduleData.get("tna1") instanceof Map<?, ?> map
                ? new LinkedHashMap<>((Map<String, Object>) map)
                : new LinkedHashMap<>();

        existingTna1.put("form", request.getForm() != null ? request.getForm() : Map.of());
        existingTna1.put("tables", request.getTables() != null ? request.getTables() : Map.of());
        existingTna1.put("submitted", request.isSubmitted());
        if (request.isSubmitted()) {
            existingTna1.putIfAbsent("submittedAt", Instant.now().toString());
            entity.setCurrentModule("tna1");
        }
        existingTna1.put("updatedAt", Instant.now().toString());

        moduleData.put("tna1", existingTna1);
        upsertModuleRow(id, "tna1", existingTna1, null);
        entity.setModuleDataJson(writePayload(moduleData, "moduleData"));
        entity.setUpdatedAt(Instant.now());
        if (entity.getCurrentModule() == null || entity.getCurrentModule().isBlank()) {
            entity.setCurrentModule("tna1");
        }
        repository.save(entity);
        return new Tna1FormSaveResponse(true);
    }

    @Transactional
    public Optional<ApplicantRecordDto> findById(String id) {
        return repository.findById(id).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<ApplicantRecordDto> findAll() {
        return repository.findAll().stream().map(this::toDtoReadOnly).toList();
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
        Map<String, Object> moduleData = resolveModuleData(entity);
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
        boolean alreadyPublished = existing instanceof Map<?, ?> ex
                && ex.get("published") instanceof Boolean b
                && b;
        if (Boolean.TRUE.equals(published)) {
            merged.put("published", true);
            merged.putIfAbsent("publishedAt", Instant.now().toString());
        } else if (alreadyPublished) {
            // No unpublish API — stale drafts must not demote published docs.
            merged.put("published", true);
            if (existing instanceof Map<?, ?> ex && ex.get("publishedAt") != null) {
                merged.putIfAbsent("publishedAt", ex.get("publishedAt"));
            }
        }
        moduleData.put(moduleKey, merged);
        upsertModuleRow(id, moduleKey, merged, published);
        entity.setModuleDataJson(writePayload(moduleData, "moduleData"));
        entity.setUpdatedAt(Instant.now());
        return toDto(repository.save(entity));
    }

    /**
     * Client conforme acknowledgment on a published Notice of Approval.
     * Only sets acknowledgment fields — clients cannot alter the staff-authored
     * letter itself ({@code approvalLetter} stays staff-owned everywhere else).
     */
    @Transactional
    public ApplicantRecordDto acknowledgeApprovalLetter(String id, String conformeSignedName) {
        ApplicantRecord entity = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Applicant not found: " + id));
        Map<String, Object> moduleData = resolveModuleData(entity);
        Object existing = moduleData.get("approvalLetter");
        if (!(existing instanceof Map<?, ?> existingMap)) {
            throw new NoSuchElementException("No approval letter on file to acknowledge");
        }
        Map<String, Object> letter = new LinkedHashMap<>();
        existingMap.forEach((k, v) -> letter.put(String.valueOf(k), v));
        if (!(letter.get("published") instanceof Boolean published && published)) {
            throw new AccessDeniedException(
                    "The Notice of Approval must be published before it can be acknowledged");
        }
        Object rdDecision = letter.get("rdDecision");
        if (!(rdDecision instanceof String decision)
                || !"approved".equalsIgnoreCase(decision.trim())) {
            throw new AccessDeniedException(
                    "The Notice of Approval must be approved by the Regional Director before acknowledgment");
        }
        String now = Instant.now().toString();
        letter.put("acknowledged", true);
        letter.put("acknowledgedAt", now);
        letter.put("updatedAt", now);
        Map<String, Object> form = new LinkedHashMap<>();
        if (letter.get("form") instanceof Map<?, ?> formMap) {
            formMap.forEach((k, v) -> form.put(String.valueOf(k), v));
        }
        form.put("conformeSignedName", conformeSignedName);
        form.put("acknowledgedAt", now);
        letter.put("form", form);
        moduleData.put("approvalLetter", letter);
        upsertModuleRow(id, "approvalLetter", letter, null);
        entity.setModuleDataJson(writePayload(moduleData, "moduleData"));
        entity.setUpdatedAt(Instant.now());
        return toDto(repository.save(entity));
    }

    @Transactional
    public Optional<ApplicantRecordDto> findByApplicationId(String applicationId) {
        return repository.findByApplicationId(applicationId).map(this::toDto);
    }

    /**
     * Load module map from per-module rows when present; otherwise use the legacy
     * blob and lazily backfill rows so subsequent saves stay split.
     */
    private Map<String, Object> resolveModuleData(ApplicantRecord entity) {
        String applicantId = entity.getId();
        List<ApplicantModuleData> rows =
                moduleDataRepository.findByApplicantIdOrderByModuleKeyAsc(applicantId);
        Map<String, Object> blob = readPayload(entity.getModuleDataJson());
        if (rows.isEmpty()) {
            if (!blob.isEmpty()) {
                upsertAllModuleRows(applicantId, blob);
            }
            return flattenCaseMeta(new LinkedHashMap<>(blob));
        }
        Map<String, Object> assembled = new LinkedHashMap<>();
        for (ApplicantModuleData row : rows) {
            assembled.put(row.getModuleKey(), readJsonValue(row.getDataJson()));
        }
        for (Map.Entry<String, Object> entry : blob.entrySet()) {
            assembled.putIfAbsent(entry.getKey(), entry.getValue());
        }
        return flattenCaseMeta(assembled);
    }

    /**
     * Promote {@code caseMeta} scalar flags to top-level keys so FE keep reading
     * {@code moduleData.accountStatus} / {@code tinNumber} etc.
     * caseMeta values win over stale flat keys left in the legacy blob.
     */
    private Map<String, Object> flattenCaseMeta(Map<String, Object> moduleData) {
        Object raw = moduleData.get(CASE_META_KEY);
        if (!(raw instanceof Map<?, ?> metaMap)) {
            return moduleData;
        }
        for (Map.Entry<?, ?> entry : metaMap.entrySet()) {
            String key = String.valueOf(entry.getKey());
            if (CASE_META_KEY.equals(key)) {
                continue;
            }
            moduleData.put(key, entry.getValue());
        }
        return moduleData;
    }

    private void upsertAllModuleRows(String applicantId, Map<String, Object> moduleData) {
        if (moduleData == null || moduleData.isEmpty()) {
            return;
        }
        Map<String, Object> caseMeta = new LinkedHashMap<>();
        Object existingMeta = moduleData.get(CASE_META_KEY);
        if (existingMeta instanceof Map<?, ?> map) {
            map.forEach((k, v) -> caseMeta.put(String.valueOf(k), v));
        }
        for (Map.Entry<String, Object> entry : moduleData.entrySet()) {
            if (entry.getKey() == null || entry.getKey().isBlank()) {
                continue;
            }
            if (CASE_META_KEY.equals(entry.getKey())) {
                continue;
            }
            Object value = entry.getValue();
            if (isPlainObject(value)) {
                Boolean published = null;
                if (value instanceof Map<?, ?> map && map.get("published") instanceof Boolean b) {
                    published = b;
                }
                upsertModuleRow(applicantId, entry.getKey(), value, published);
            } else {
                caseMeta.put(entry.getKey(), value);
            }
        }
        if (!caseMeta.isEmpty()) {
            upsertModuleRow(applicantId, CASE_META_KEY, caseMeta, null);
        }
    }

    private static boolean isPlainObject(Object value) {
        return value instanceof Map<?, ?>;
    }

    private void upsertModuleRow(
            String applicantId, String moduleKey, Object value, Boolean publishedFlag) {
        ApplicantModuleDataId id = new ApplicantModuleDataId(applicantId, moduleKey);
        ApplicantModuleData row = moduleDataRepository.findById(id).orElseGet(ApplicantModuleData::new);
        row.setApplicantId(applicantId);
        row.setModuleKey(moduleKey);
        row.setDataJson(writeModuleValue(value, "module:" + moduleKey));
        if (Boolean.TRUE.equals(publishedFlag)) {
            row.setPublished(true);
            if (row.getPublishedAt() == null) {
                row.setPublishedAt(Instant.now());
            }
        } else if (value instanceof Map<?, ?> map && Boolean.TRUE.equals(map.get("published"))) {
            row.setPublished(true);
            if (row.getPublishedAt() == null) {
                row.setPublishedAt(Instant.now());
            }
        }
        row.setUpdatedAt(Instant.now());
        moduleDataRepository.save(row);
    }

    private String writePayload(Map<String, Object> payload, String fieldName) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> slim = payload != null
                    ? (Map<String, Object>) stripHeavyPayloads(payload)
                    : Map.of();
            String json = objectMapper.writeValueAsString(slim);
            if (json.length() > MAX_PAYLOAD_CHARS) {
                throw new IllegalArgumentException(fieldName + " payload exceeds the maximum allowed size");
            }
            return json;
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid " + fieldName + " JSON", e);
        }
    }

    private String writeModuleValue(Object value, String fieldName) {
        try {
            Object slim = stripHeavyPayloads(value);
            String json = objectMapper.writeValueAsString(slim != null ? slim : Map.of());
            if (json.length() > MAX_MODULE_CHARS) {
                throw new IllegalArgumentException(fieldName + " payload exceeds the maximum allowed size");
            }
            return json;
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid " + fieldName + " JSON", e);
        }
    }

    /**
     * Drop embedded data-URL / base64 bodies so moduleData stays under the cap.
     * File bytes belong in {@code file_uploads}; metadata keys are retained.
     */
    static Object stripHeavyPayloads(Object value) {
        if (value instanceof List<?> list) {
            List<Object> out = new ArrayList<>(list.size());
            for (Object item : list) {
                out.add(stripHeavyPayloads(item));
            }
            return out;
        }
        if (!(value instanceof Map<?, ?> map)) {
            if (isHeavyDataUrl(value)) {
                return null;
            }
            return value;
        }
        Map<String, Object> out = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : map.entrySet()) {
            String key = String.valueOf(entry.getKey());
            Object child = entry.getValue();
            if ("dataUrl".equals(key) && isHeavyDataUrl(child)) {
                out.put("hasFileContent", true);
                continue;
            }
            if ("selfie".equals(key) && isHeavyDataUrl(child)) {
                out.put("selfieUploaded", true);
                continue;
            }
            if (key.endsWith("FileData") && isHeavyDataUrl(child)) {
                String flagKey = key.substring(0, key.length() - "FileData".length()) + "FileUploaded";
                out.put(flagKey, true);
                continue;
            }
            if (isHeavyDataUrl(child)) {
                continue;
            }
            Object stripped = stripHeavyPayloads(child);
            if (stripped != null) {
                out.put(key, stripped);
            }
        }
        return out;
    }

    private static boolean isHeavyDataUrl(Object value) {
        if (!(value instanceof String s)) {
            return false;
        }
        return s.startsWith(DATA_URL_PREFIX) && s.length() >= HEAVY_STRING_MIN;
    }

    private ApplicantRecordDto toDto(ApplicantRecord entity) {
        return new ApplicantRecordDto(
                entity.getId(),
                entity.getApplicationId(),
                entity.getEnterpriseName(),
                ModuleOrder.normalize(entity.getCurrentModule()),
                resolveModuleData(entity),
                readPayload(entity.getProfileJson()),
                entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null);
    }

    /** List views skip lazy backfill writes. */
    private ApplicantRecordDto toDtoReadOnly(ApplicantRecord entity) {
        String applicantId = entity.getId();
        List<ApplicantModuleData> rows =
                moduleDataRepository.findByApplicantIdOrderByModuleKeyAsc(applicantId);
        Map<String, Object> blob = readPayload(entity.getModuleDataJson());
        Map<String, Object> moduleData;
        if (rows.isEmpty()) {
            moduleData = blob;
        } else {
            moduleData = new LinkedHashMap<>();
            for (ApplicantModuleData row : rows) {
                moduleData.put(row.getModuleKey(), readJsonValue(row.getDataJson()));
            }
            for (Map.Entry<String, Object> entry : blob.entrySet()) {
                moduleData.putIfAbsent(entry.getKey(), entry.getValue());
            }
        }
        return new ApplicantRecordDto(
                entity.getId(),
                entity.getApplicationId(),
                entity.getEnterpriseName(),
                ModuleOrder.normalize(entity.getCurrentModule()),
                flattenCaseMeta(moduleData),
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

    private Object readJsonValue(String json) {
        try {
            return objectMapper.readValue(json != null ? json : "null", Object.class);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
