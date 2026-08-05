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
import ph.gov.dost.aisetup.auth.UserPrincipal;

@Service
public class AuditService {

    private static final int MAX_PATH_LENGTH = 512;

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
     * Universal HTTP trail for authenticated requests. Commits in a new transaction so
     * controller rollbacks do not drop the request log.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordHttp(String method, String path, int status) {
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("method", method != null ? method : "");
        detail.put("path", truncatePath(path));
        detail.put("status", status);
        persist("http.request", "http", null, detail);
    }

    private void persist(String action, String entityType, String entityId, Map<String, Object> detail) {
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
        event.setDetailJson(writeJson(detail));
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
