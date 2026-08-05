/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.notification;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.notification.dto.CreateNotificationRequest;
import ph.gov.dost.aisetup.notification.dto.NotificationDto;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationDto> list() {
        return notificationService.listForCurrentUser();
    }

    @PostMapping
    public List<NotificationDto> create(@Valid @RequestBody List<@Valid CreateNotificationRequest> requests) {
        return notificationService.createBatch(requests);
    }

    @PatchMapping("/{id}/read")
    public NotificationDto markRead(@PathVariable String id) {
        return notificationService.markRead(id);
    }

    @PostMapping("/mark-all-read")
    public Map<String, Object> markAllRead() {
        int updated = notificationService.markAllRead();
        return Map.of("ok", true, "updated", updated);
    }
}
