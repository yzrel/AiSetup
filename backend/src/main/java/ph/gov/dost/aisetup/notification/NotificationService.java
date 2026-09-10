/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.notification;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    private static final ObjectMapper TARGET_ROLES_MAPPER = new ObjectMapper();

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
        entity.setTargetRoles(serializeTargetRoles(request.getTargetRoles()));
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
            if (principal.isAdmin()) {
                return notificationRepository.findAllStaff();
            }
            List<NotificationEntity> candidates;
            if (isRegional(principal)) {
                candidates = notificationRepository.findAllStaff();
            } else {
                String officeId = principal.getAccount().getOfficeId();
                if (officeId == null || officeId.isBlank()) {
                    return List.of();
                }
                candidates = notificationRepository.findStaffByOffice(officeId);
            }
            // Role-targeted handoffs must not leak to every regional account.
            return candidates.stream()
                    .filter(entity -> matchesTargetRoles(principal, entity))
                    .toList();
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
        if (principal.isAdmin()) {
            return true;
        }
        if (!matchesTargetRoles(principal, entity)) {
            return false;
        }
        if (isRegional(principal)) {
            return true;
        }
        String officeId = principal.getAccount().getOfficeId();
        return officeId != null && officeId.equals(entity.getOfficeId());
    }

    /**
     * Untargeted rows stay visible to the whole office scope (legacy behavior).
     * Targeted rows only reach the roles named on the notification.
     */
    private static boolean matchesTargetRoles(UserPrincipal principal, NotificationEntity entity) {
        List<String> roles = parseTargetRoles(entity.getTargetRoles());
        if (roles.isEmpty()) {
            return true;
        }
        String role = principal.getRole();
        return role != null && roles.contains(role.trim().toLowerCase(Locale.ROOT));
    }

    static List<String> parseTargetRoles(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        String trimmed = raw.trim();
        List<String> out = new ArrayList<>();
        try {
            JsonNode node = TARGET_ROLES_MAPPER.readTree(trimmed);
            if (node.isArray()) {
                for (JsonNode item : node) {
                    String value = item.asText("").trim().toLowerCase(Locale.ROOT);
                    if (!value.isEmpty()) {
                        out.add(value);
                    }
                }
                return List.copyOf(out);
            }
        } catch (JsonProcessingException ignored) {
            // Fall through to comma-separated parsing for hand-edited rows.
        }
        for (String part : trimmed.split(",")) {
            String value = part.replace("[", "").replace("]", "").replace("\"", "").trim().toLowerCase(Locale.ROOT);
            if (!value.isEmpty()) {
                out.add(value);
            }
        }
        return List.copyOf(out);
    }

    static String serializeTargetRoles(List<String> roles) {
        if (roles == null || roles.isEmpty()) {
            return null;
        }
        List<String> cleaned = roles.stream()
                .filter(role -> role != null && !role.isBlank())
                .map(role -> role.trim().toLowerCase(Locale.ROOT))
                .distinct()
                .toList();
        if (cleaned.isEmpty()) {
            return null;
        }
        try {
            return TARGET_ROLES_MAPPER.writeValueAsString(cleaned);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("targetRoles could not be serialized");
        }
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
        List<String> roles = parseTargetRoles(entity.getTargetRoles());
        dto.setTargetRoles(roles.isEmpty() ? null : roles);
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
