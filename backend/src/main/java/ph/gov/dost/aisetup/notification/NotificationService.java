/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.notification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ph.gov.dost.aisetup.auth.SecurityUtils;
import ph.gov.dost.aisetup.auth.UserPrincipal;
import ph.gov.dost.aisetup.notification.dto.CreateNotificationRequest;
import ph.gov.dost.aisetup.notification.dto.NotificationDto;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> listForCurrentUser() {
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        return listVisible(principal).stream().map(this::toDto).toList();
    }

    @Transactional
    public List<NotificationDto> createBatch(List<CreateNotificationRequest> requests) {
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        if (requests == null || requests.isEmpty()) {
            throw new IllegalArgumentException("At least one notification is required");
        }
        List<NotificationDto> created = new ArrayList<>();
        for (CreateNotificationRequest request : requests) {
            created.add(upsertOne(principal, request));
        }
        return created;
    }

    @Transactional
    public NotificationDto markRead(String id) {
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        NotificationEntity entity = notificationRepository
                .findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!isVisible(principal, entity)) {
            throw new AccessDeniedException("Not allowed to access this notification");
        }
        entity.setReadFlag(true);
        return toDto(notificationRepository.save(entity));
    }

    @Transactional
    public int markAllRead() {
        UserPrincipal principal = SecurityUtils.requirePrincipal();
        List<NotificationEntity> visible = listVisible(principal);
        int count = 0;
        for (NotificationEntity entity : visible) {
            if (!entity.isReadFlag()) {
                entity.setReadFlag(true);
                notificationRepository.save(entity);
                count++;
            }
        }
        return count;
    }

    private NotificationDto upsertOne(UserPrincipal principal, CreateNotificationRequest request) {
        validateCreate(principal, request);

        String id = request.getId();
        if (id == null || id.isBlank()) {
            id = "n-" + UUID.randomUUID();
        }

        NotificationEntity existing = notificationRepository.findById(id).orElse(null);
        if (existing != null) {
            // Idempotent upsert: keep read state and original timestamp.
            return toDto(existing);
        }

        NotificationEntity entity = new NotificationEntity();
        entity.setId(id);
        entity.setAudience(normalizeAudience(request.getAudience()));
        entity.setApplicantId(blankToNull(request.getApplicantId()));
        entity.setOfficeId(blankToNull(request.getOfficeId()));
        entity.setKind(normalizeKind(request.getKind()));
        entity.setTitle(request.getTitle().trim());
        entity.setMessage(request.getMessage().trim());
        entity.setViewKey(blankToNull(request.getView()));
        entity.setReadFlag(Boolean.TRUE.equals(request.getRead()));
        entity.setUrgent(Boolean.TRUE.equals(request.getUrgent()));
        entity.setCreatedAt(parseTimestamp(request.getTimestamp()));
        return toDto(notificationRepository.save(entity));
    }

    private void validateCreate(UserPrincipal principal, CreateNotificationRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Notification payload is required");
        }
        String audience = normalizeAudience(request.getAudience());
        String applicantId = blankToNull(request.getApplicantId());

        if ("applicant".equals(audience)) {
            if (applicantId == null) {
                throw new IllegalArgumentException("applicantId is required for applicant notifications");
            }
            boolean self = applicantId.equals(principal.getApplicantId());
            if (!principal.isStaff() && !self) {
                throw new AccessDeniedException("Not allowed to create this notification");
            }
            return;
        }

        // staff audience
        boolean selfApplicant = applicantId != null && applicantId.equals(principal.getApplicantId());
        if (!principal.isStaff() && !selfApplicant) {
            throw new AccessDeniedException("Not allowed to create this notification");
        }
    }

    private List<NotificationEntity> listVisible(UserPrincipal principal) {
        if (principal.isStaff()) {
            if (principal.isAdmin() || isRegional(principal)) {
                return notificationRepository.findAllStaff();
            }
            String officeId = principal.getAccount().getOfficeId();
            if (officeId == null || officeId.isBlank()) {
                return List.of();
            }
            return notificationRepository.findStaffByOffice(officeId);
        }

        String applicantId = principal.getApplicantId();
        if (applicantId == null || applicantId.isBlank()) {
            return List.of();
        }
        return notificationRepository.findForApplicant(applicantId);
    }

    private boolean isVisible(UserPrincipal principal, NotificationEntity entity) {
        if ("applicant".equals(entity.getAudience())) {
            if (principal.isStaff()) {
                return false;
            }
            String applicantId = principal.getApplicantId();
            return applicantId != null && applicantId.equals(entity.getApplicantId());
        }

        if (!principal.isStaff()) {
            return false;
        }
        if (principal.isAdmin() || isRegional(principal)) {
            return true;
        }
        String officeId = principal.getAccount().getOfficeId();
        return officeId != null && officeId.equals(entity.getOfficeId());
    }

    private static boolean isRegional(UserPrincipal principal) {
        String officeId = principal.getAccount().getOfficeId();
        return officeId != null && "regional".equalsIgnoreCase(officeId.trim());
    }

    private static String normalizeAudience(String audience) {
        if (audience == null || audience.isBlank()) {
            throw new IllegalArgumentException("audience is required");
        }
        String normalized = audience.trim().toLowerCase(Locale.ROOT);
        if (!"applicant".equals(normalized) && !"staff".equals(normalized)) {
            throw new IllegalArgumentException("audience must be applicant or staff");
        }
        return normalized;
    }

    private static String normalizeKind(String kind) {
        if (kind == null || kind.isBlank()) {
            throw new IllegalArgumentException("kind is required");
        }
        String normalized = kind.trim().toLowerCase(Locale.ROOT);
        if (!List.of("info", "success", "warning", "action").contains(normalized)) {
            throw new IllegalArgumentException("kind must be info, success, warning, or action");
        }
        return normalized;
    }

    private static Instant parseTimestamp(String timestamp) {
        if (timestamp == null || timestamp.isBlank()) {
            return Instant.now();
        }
        try {
            return Instant.parse(timestamp.trim());
        } catch (Exception e) {
            throw new IllegalArgumentException("timestamp must be an ISO-8601 instant");
        }
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private NotificationDto toDto(NotificationEntity entity) {
        NotificationDto dto = new NotificationDto();
        dto.setId(entity.getId());
        dto.setAudience(entity.getAudience());
        dto.setApplicantId(entity.getApplicantId());
        dto.setOfficeId(entity.getOfficeId());
        dto.setKind(entity.getKind());
        dto.setTitle(entity.getTitle());
        dto.setMessage(entity.getMessage());
        dto.setRead(entity.isReadFlag());
        dto.setUrgent(entity.isUrgent());
        dto.setTimestamp(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : Instant.now().toString());
        dto.setView(entity.getViewKey());
        return dto;
    }
}
