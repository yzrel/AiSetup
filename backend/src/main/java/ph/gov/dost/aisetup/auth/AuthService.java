/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ph.gov.dost.aisetup.auth.dto.AdminResetPasswordRequest;
import ph.gov.dost.aisetup.auth.dto.AdminSetEnabledRequest;
import ph.gov.dost.aisetup.auth.dto.AuthResponse;
import ph.gov.dost.aisetup.auth.dto.AuthUserDto;
import ph.gov.dost.aisetup.auth.dto.ChangePasswordRequest;
import ph.gov.dost.aisetup.auth.dto.LoginRequest;
import ph.gov.dost.aisetup.auth.dto.RegisterRequest;
import ph.gov.dost.aisetup.otp.OtpService;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    private final OtpService otpService;

    public AuthService(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            ObjectMapper objectMapper,
            OtpService otpService) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
        this.otpService = otpService;
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        UserAccount account = userAccountRepository
                .findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!passwordEncoder.matches(request.getPassword(), account.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        if (!account.isEnabled()) {
            // #region agent log
            try { java.nio.file.Files.writeString(java.nio.file.Path.of("c:/Yzrel/AiSetup/debug-c5b70a.log"), "{\"sessionId\":\"c5b70a\",\"hypothesisId\":\"H-C\",\"location\":\"AuthService.login\",\"message\":\"login REJECTED (account disabled)\",\"data\":{\"email\":\"" + account.getEmail() + "\",\"applicantId\":\"" + account.getApplicantId() + "\"},\"timestamp\":" + System.currentTimeMillis() + "}\n", java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND); } catch (Exception ignored) {}
            // #endregion
            throw new BadCredentialsException(
                    "This account has been blocked by DOST Region XII. Please contact the DOST XII office for assistance.");
        }
        return toAuthResponse(account);
    }

    @Transactional
    public AuthResponse registerApplicant(RegisterRequest request) {
        String role = request.getRole() == null || request.getRole().isBlank()
                ? "applicant"
                : request.getRole().trim().toLowerCase();
        if (!"applicant".equals(role) && !"client".equals(role)) {
            throw new IllegalArgumentException("Public registration is limited to applicant accounts");
        }
        if (userAccountRepository.existsByEmailIgnoreCase(request.getEmail().trim())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }
        otpService.requireVerifiedForRegistration(request.getEmail(), request.getPhone());
        Instant now = Instant.now();
        UserAccount account = new UserAccount();
        account.setId(UUID.randomUUID().toString());
        account.setEmail(request.getEmail().trim().toLowerCase());
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        account.setFirstName(request.getFirstName().trim());
        account.setMiddleName(request.getMiddleName() != null ? request.getMiddleName().trim() : "");
        account.setLastName(request.getLastName().trim());
        account.setRole(role);
        account.setEnterpriseName(request.getEnterpriseName());
        account.setApplicantId(request.getApplicantId());
        account.setApplicationId(request.getApplicationId());
        account.setEnabled(true);
        account.setCreatedAt(now);
        account.setUpdatedAt(now);
        userAccountRepository.save(account);
        return toAuthResponse(account);
    }

    @Transactional(readOnly = true)
    public AuthUserDto currentUser(UserPrincipal principal) {
        return toUserDto(principal.getAccount());
    }

    /** Self-service password change (verifies the current password). */
    @Transactional
    public void changePassword(UserPrincipal principal, ChangePasswordRequest request) {
        UserAccount account = userAccountRepository.findById(principal.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        // 400 (not 401) so the client session is not cleared on a wrong current password.
        if (!passwordEncoder.matches(request.getCurrentPassword(), account.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        account.setUpdatedAt(Instant.now());
        userAccountRepository.save(account);
    }

    /** Staff reset of an applicant account password (no current-password check). */
    @Transactional
    public void adminResetPassword(AdminResetPasswordRequest request) {
        UserAccount account = requireApplicantAccount(request.getApplicantId());
        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        account.setUpdatedAt(Instant.now());
        userAccountRepository.save(account);
    }

    /** Staff block/unblock of an applicant account (users.enabled). */
    @Transactional
    public void adminSetEnabled(AdminSetEnabledRequest request) {
        UserAccount account = requireApplicantAccount(request.getApplicantId());
        account.setEnabled(Boolean.TRUE.equals(request.getEnabled()));
        account.setUpdatedAt(Instant.now());
        userAccountRepository.save(account);
    }

    private UserAccount requireApplicantAccount(String applicantId) {
        java.util.Optional<UserAccount> found = userAccountRepository.findByApplicantId(applicantId);
        // #region agent log
        try { java.nio.file.Files.writeString(java.nio.file.Path.of("c:/Yzrel/AiSetup/debug-c5b70a.log"), "{\"sessionId\":\"c5b70a\",\"hypothesisId\":\"H-C\",\"location\":\"AuthService.requireApplicantAccount\",\"message\":\"applicant account lookup\",\"data\":{\"applicantId\":\"" + applicantId + "\",\"found\":" + found.isPresent() + ",\"role\":\"" + found.map(UserAccount::getRole).orElse("-") + "\",\"enabled\":" + found.map(UserAccount::isEnabled).orElse(null) + "},\"timestamp\":" + System.currentTimeMillis() + "}\n", java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND); } catch (Exception ignored) {}
        // #endregion
        return found
                .filter(a -> "applicant".equals(a.getRole()) || "client".equals(a.getRole()))
                .orElseThrow(() -> new IllegalArgumentException(
                        "No applicant account found for id: " + applicantId));
    }

    public AuthResponse toAuthResponse(UserAccount account) {
        return new AuthResponse(jwtService.issueToken(account), toUserDto(account));
    }

    private AuthUserDto toUserDto(UserAccount account) {
        AuthUserDto dto = new AuthUserDto();
        dto.setId(account.getId());
        dto.setEmail(account.getEmail());
        dto.setFirstName(account.getFirstName());
        dto.setMiddleName(account.getMiddleName() != null ? account.getMiddleName() : "");
        dto.setLastName(account.getLastName());
        dto.setRole(account.getRole());
        dto.setEnterpriseName(account.getEnterpriseName());
        dto.setApplicationId(account.getApplicationId());
        dto.setApplicantId(account.getApplicantId());
        dto.setOfficeId(account.getOfficeId());
        dto.setAssignedProvinces(readProvinces(account.getAssignedProvincesJson()));
        dto.setVerified(true);
        dto.setPortal("admin");
        return dto;
    }

    private List<String> readProvinces(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }
}
