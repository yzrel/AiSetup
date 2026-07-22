/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ph.gov.dost.aisetup.auth.UserPrincipal;

@Service
public class AuditService {

    private final AuditEventRepository repository;
    private final ObjectMapper objectMapper;

    public AuditService(AuditEventRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void record(String action, String entityType, String entityId, Map<String, Object> detail) {
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

    private String writeJson(Map<String, Object> detail) {
        try {
            return objectMapper.writeValueAsString(detail != null ? detail : Map.of());
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
