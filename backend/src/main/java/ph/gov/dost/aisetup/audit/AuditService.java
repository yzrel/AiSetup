/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import ph.gov.dost.aisetup.auth.UserPrincipal;

@Service
public class AuditService {

    /** Header carrying the UI action id (button) that triggered the call. */
    public static final String UI_ACTION_HEADER = "X-UI-Action";

    private static final int MAX_PATH_LENGTH = 512;
    private static final int MAX_UI_ACTION_LENGTH = 128;
    private static final int MAX_PREVIEW_LENGTH = 200;

    private final AuditEventRepository repository;
    private final ObjectMapper objectMapper;

    public AuditService(AuditEventRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void record(String action, String entityType, String entityId, Map<String, Object> detail) {
        persist(action, entityType, entityId, detail);
    }

    /**
     * HTTP trail for authenticated writes and button-tagged calls. Commits in a new
     * transaction so controller rollbacks do not drop the request log.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordHttp(String method, String path, int status, String uiAction) {
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("method", method != null ? method : "");
        detail.put("path", truncatePath(path));
        detail.put("status", status);
        String action = sanitizeUiAction(uiAction);
        if (action != null) {
            detail.put("uiAction", action);
        }
        persist("http.request", "http", null, detail);
    }

    /** Short, bounded excerpt of generated text so audit rows stay readable. */
    public static String preview(String text) {
        if (text == null) {
            return "";
        }
        String collapsed = text.replaceAll("\\s+", " ").trim();
        if (collapsed.length() <= MAX_PREVIEW_LENGTH) {
            return collapsed;
        }
        return collapsed.substring(0, MAX_PREVIEW_LENGTH) + "...";
    }

    /**
     * UI action id sent by the frontend for the current request, or {@code null}.
     * Restricted to id-safe characters so the audit trail stays queryable.
     */
    public static String sanitizeUiAction(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty() || !trimmed.matches("[A-Za-z0-9._:-]+")) {
            return null;
        }
        return trimmed.length() <= MAX_UI_ACTION_LENGTH
                ? trimmed
                : trimmed.substring(0, MAX_UI_ACTION_LENGTH);
    }

    private static String currentUiAction() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes servletAttributes)) {
            return null;
        }
        return sanitizeUiAction(servletAttributes.getRequest().getHeader(UI_ACTION_HEADER));
    }

    private void persist(String action, String entityType, String entityId, Map<String, Object> detail) {
        Map<String, Object> enriched = new LinkedHashMap<>(detail != null ? detail : Map.of());
        if (!enriched.containsKey("uiAction")) {
            String uiAction = currentUiAction();
            if (uiAction != null) {
                enriched.put("uiAction", uiAction);
            }
        }
        AuditEvent event = new AuditEvent();
        event.setId(UUID.randomUUID().toString());
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            event.setActorUserId(principal.getUserId());
            event.setActorEmail(principal.getUsername());
        }
        event.setAction(action);
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setDetailJson(writeJson(enriched));
        event.setCreatedAt(Instant.now());
        repository.save(event);
    }

    private static String truncatePath(String path) {
        if (path == null) {
            return "";
        }
        if (path.length() <= MAX_PATH_LENGTH) {
            return path;
        }
        return path.substring(0, MAX_PATH_LENGTH);
    }

    private String writeJson(Map<String, Object> detail) {
        try {
            return objectMapper.writeValueAsString(detail != null ? detail : Map.of());
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
