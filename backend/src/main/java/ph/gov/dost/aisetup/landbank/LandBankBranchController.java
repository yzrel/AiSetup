/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.landbank;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.audit.AuditService;
import ph.gov.dost.aisetup.auth.SecurityUtils;
import ph.gov.dost.aisetup.auth.UserPrincipal;
import ph.gov.dost.aisetup.landbank.dto.CreateLandBankBranchRequest;
import ph.gov.dost.aisetup.landbank.dto.LandBankBranchDto;
import ph.gov.dost.aisetup.landbank.dto.UpdateLandBankBranchRequest;

@RestController
@RequestMapping("/landbank-branches")
public class LandBankBranchController {

    private final LandBankBranchService service;
    private final AuditService auditService;

    public LandBankBranchController(LandBankBranchService service, AuditService auditService) {
        this.service = service;
        this.auditService = auditService;
    }

    @GetMapping
    public List<LandBankBranchDto> list(
            @RequestParam(name = "activeOnly", defaultValue = "false") boolean activeOnly) {
        SecurityUtils.requireStaff();
        return service.list(activeOnly);
    }

    @GetMapping("/{id}")
    public LandBankBranchDto get(@PathVariable String id) {
        SecurityUtils.requireStaff();
        return service.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LandBankBranchDto create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateLandBankBranchRequest request) {
        SecurityUtils.requireStaff();
        LandBankBranchDto created = service.create(request, principal.getUserId());
        auditService.record(
                "landbank-branch.create",
                "landbank_branch",
                created.getId(),
                Map.of("name", created.getName()));
        return created;
    }

    @PatchMapping("/{id}")
    public LandBankBranchDto update(
            @PathVariable String id, @Valid @RequestBody UpdateLandBankBranchRequest request) {
        SecurityUtils.requireStaff();
        LandBankBranchDto updated = service.update(id, request);
        auditService.record("landbank-branch.update", "landbank_branch", id, Map.of());
        return updated;
    }

    @PostMapping("/{id}/deactivate")
    public LandBankBranchDto deactivate(@PathVariable String id) {
        SecurityUtils.requireStaff();
        LandBankBranchDto updated = service.deactivate(id);
        auditService.record("landbank-branch.deactivate", "landbank_branch", id, Map.of());
        return updated;
    }
}
