/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.files;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ph.gov.dost.aisetup.audit.AuditService;
import ph.gov.dost.aisetup.auth.SecurityUtils;
import ph.gov.dost.aisetup.auth.UserPrincipal;
import ph.gov.dost.aisetup.config.AisetupProperties;
import ph.gov.dost.aisetup.persistence.ApplicantPersistenceService;
import ph.gov.dost.aisetup.persistence.ApplicantRecordDto;
import ph.gov.dost.aisetup.workflow.ModuleOrder;
import ph.gov.dost.aisetup.workflow.WorkflowGateService;

@Service
public class FileUploadService {

    private static final long MAX_BYTES = 15L * 1024 * 1024;

    private final FileUploadRepository repository;
    private final ApplicantPersistenceService applicantPersistenceService;
    private final AisetupProperties properties;
    private final AuditService auditService;

    public FileUploadService(
            FileUploadRepository repository,
            ApplicantPersistenceService applicantPersistenceService,
            AisetupProperties properties,
            AuditService auditService) {
        this.repository = repository;
        this.applicantPersistenceService = applicantPersistenceService;
        this.properties = properties;
        this.auditService = auditService;
    }

    @Transactional
    public Map<String, Object> upload(String applicantId, String moduleKey, MultipartFile file)
            throws IOException {
        SecurityUtils.requireCanAccessApplicant(applicantId);
        String resolvedKey = moduleKey != null && !moduleKey.isBlank() ? moduleKey : "general";
        if (WorkflowGateService.SIGNED_MOA_MODULE_KEY.equals(resolvedKey)
                || ModuleOrder.isStaffOnlyModule(resolvedKey)) {
            SecurityUtils.requireStaff();
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("File exceeds 15 MB limit");
        }
        ApplicantRecordDto applicant = applicantPersistenceService.findById(applicantId)
                .orElseThrow(() -> new IllegalArgumentException("Applicant not found: " + applicantId));

        String id = UUID.randomUUID().toString();
        String safeName = sanitize(file.getOriginalFilename());
        Path dir = Path.of(properties.getUploadDir(), applicantId).toAbsolutePath().normalize();
        Files.createDirectories(dir);
        Path target = dir.resolve(id + "_" + safeName);
        file.transferTo(target);

        UserPrincipal principal = SecurityUtils.requirePrincipal();
        FileUpload entity = new FileUpload();
        entity.setId(id);
        entity.setApplicantId(applicantId);
        entity.setApplicationId(applicant.applicationId());
        entity.setModuleKey(resolvedKey);
        entity.setOriginalFilename(safeName);
        entity.setContentType(file.getContentType());
        entity.setSizeBytes(file.getSize());
        entity.setStoragePath(target.toString());
        entity.setUploadedBy(principal.getUserId());
        entity.setCreatedAt(Instant.now());
        repository.save(entity);

        Map<String, Object> meta = toDto(entity);
        Map<String, Object> slice = new LinkedHashMap<>();
        slice.put(id, meta);
        applicantPersistenceService.mergeModuleKey(applicantId, "uploads", slice, null);
        auditService.record("file.upload", "applicant", applicantId,
                Map.of("fileId", id, "moduleKey", entity.getModuleKey()));
        return meta;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(String applicantId) {
        SecurityUtils.requireCanAccessApplicant(applicantId);
        return repository.findByApplicantIdOrderByCreatedAtDesc(applicantId).stream()
                .map(this::toDto)
                .toList();
    }

    /** Resolves a stored file for download; enforces applicant/staff access. */
    @Transactional(readOnly = true)
    public FileUpload requireForDownload(String applicantId, String fileId) {
        SecurityUtils.requireCanAccessApplicant(applicantId);
        FileUpload entity = repository.findById(fileId)
                .filter(f -> applicantId.equals(f.getApplicantId()))
                .orElseThrow(() -> new java.util.NoSuchElementException("File not found: " + fileId));
        if (!Files.exists(Path.of(entity.getStoragePath()))) {
            throw new java.util.NoSuchElementException("Stored file is missing: " + fileId);
        }
        return entity;
    }

    private Map<String, Object> toDto(FileUpload entity) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", entity.getId());
        dto.put("applicantId", entity.getApplicantId());
        dto.put("applicationId", entity.getApplicationId());
        dto.put("moduleKey", entity.getModuleKey());
        dto.put("originalFilename", entity.getOriginalFilename());
        dto.put("contentType", entity.getContentType());
        dto.put("sizeBytes", entity.getSizeBytes());
        dto.put("uploadedBy", entity.getUploadedBy());
        dto.put("createdAt", entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null);
        return dto;
    }

    private String sanitize(String name) {
        if (name == null || name.isBlank()) {
            return "upload.bin";
        }
        return name.replaceAll("[\\\\/\\r\\n\\t]", "_");
    }
}
