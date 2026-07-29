/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.dost.aisetup.audit.AuditService;
import ph.gov.dost.aisetup.auth.dto.AdminResetPasswordRequest;
import ph.gov.dost.aisetup.auth.dto.AdminSetEnabledRequest;
import ph.gov.dost.aisetup.auth.dto.AuthResponse;
import ph.gov.dost.aisetup.auth.dto.AuthUserDto;
import ph.gov.dost.aisetup.auth.dto.ChangePasswordRequest;
import ph.gov.dost.aisetup.auth.dto.CreateStaffRequest;
import ph.gov.dost.aisetup.auth.dto.LoginRequest;
import ph.gov.dost.aisetup.auth.dto.RegisterRequest;
import ph.gov.dost.aisetup.auth.dto.StaffResetPasswordRequest;
import ph.gov.dost.aisetup.auth.dto.StaffUserDto;
import ph.gov.dost.aisetup.auth.dto.UpdateStaffRequest;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final AuditService auditService;

    public AuthController(AuthService authService, AuditService auditService) {
        this.authService = authService;
        this.auditService = auditService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.registerApplicant(request);
    }

    @GetMapping("/me")
    public AuthUserDto me(@AuthenticationPrincipal UserPrincipal principal) {
        return authService.currentUser(principal);
    }

    @PostMapping("/change-password")
    public Map<String, Boolean> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(principal, request);
        auditService.record("auth.change-password", "user", principal.getUserId(), Map.of());
        return Map.of("ok", true);
    }

    @PostMapping("/admin/reset-password")
    public Map<String, Boolean> adminResetPassword(
            @Valid @RequestBody AdminResetPasswordRequest request) {
        SecurityUtils.requireStaff();
        authService.adminResetPassword(request);
        auditService.record("auth.admin-reset-password", "applicant", request.getApplicantId(), Map.of());
        return Map.of("ok", true);
    }

    @PostMapping("/admin/set-enabled")
    public Map<String, Boolean> adminSetEnabled(
            @Valid @RequestBody AdminSetEnabledRequest request) {
        SecurityUtils.requireStaff();
        authService.adminSetEnabled(request);
        auditService.record(
                Boolean.TRUE.equals(request.getEnabled()) ? "auth.admin-unblock" : "auth.admin-block",
                "applicant",
                request.getApplicantId(),
                Map.of());
        return Map.of("ok", true);
    }

    @GetMapping("/admin/staff")
    public List<StaffUserDto> listStaff() {
        SecurityUtils.requireAdmin();
        return authService.listStaffUsers();
    }

    @PostMapping("/admin/staff")
    @ResponseStatus(HttpStatus.CREATED)
    public StaffUserDto createStaff(@Valid @RequestBody CreateStaffRequest request) {
        SecurityUtils.requireAdmin();
        StaffUserDto created = authService.createStaffUser(request);
        auditService.record("auth.staff-create", "user", created.getId(), Map.of(
                "email", created.getEmail(),
                "role", created.getRole()));
        return created;
    }

    @PatchMapping("/admin/staff/{userId}")
    public StaffUserDto updateStaff(
            @PathVariable String userId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateStaffRequest request) {
        SecurityUtils.requireAdmin();
        StaffUserDto updated = authService.updateStaffUser(userId, request, principal);
        auditService.record("auth.staff-update", "user", userId, Map.of());
        return updated;
    }

    @PostMapping("/admin/staff/{userId}/reset-password")
    public Map<String, Boolean> resetStaffPassword(
            @PathVariable String userId,
            @Valid @RequestBody StaffResetPasswordRequest request) {
        SecurityUtils.requireAdmin();
        authService.resetStaffPassword(userId, request);
        auditService.record("auth.staff-reset-password", "user", userId, Map.of());
        return Map.of("ok", true);
    }
}
