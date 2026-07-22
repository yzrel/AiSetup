/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth;

import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
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
import ph.gov.dost.aisetup.auth.dto.LoginRequest;
import ph.gov.dost.aisetup.auth.dto.RegisterRequest;

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
}
