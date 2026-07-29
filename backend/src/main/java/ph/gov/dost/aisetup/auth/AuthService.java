/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
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
import ph.gov.dost.aisetup.auth.dto.CreateStaffRequest;
import ph.gov.dost.aisetup.auth.dto.LoginRequest;
import ph.gov.dost.aisetup.auth.dto.RegisterRequest;
import ph.gov.dost.aisetup.auth.dto.StaffResetPasswordRequest;
import ph.gov.dost.aisetup.auth.dto.StaffUserDto;
import ph.gov.dost.aisetup.auth.dto.UpdateStaffRequest;
import ph.gov.dost.aisetup.otp.OtpService;
import ph.gov.dost.aisetup.persistence.ApplicantRecordDto;
import ph.gov.dost.aisetup.persistence.ApplicantRecordRepository;

@Service
public class AuthService {

    private static final List<String> STAFF_ROLES =
            List.of("admin", "agent", "provincial-director");

    private final UserAccountRepository userAccountRepository;
    private final ApplicantRecordRepository applicantRecordRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    private final OtpService otpService;

    public AuthService(
            UserAccountRepository userAccountRepository,
            ApplicantRecordRepository applicantRecordRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            ObjectMapper objectMapper,
            OtpService otpService) {
        this.userAccountRepository = userAccountRepository;
        this.applicantRecordRepository = applicantRecordRepository;
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
            throw new BadCredentialsException(
                    "This account has been blocked by DOST Region XII. Please contact the DOST XII office for assistance.");
        }
        return toAuthResponse(account);
    }

    @Transactional
    public AuthResponse registerApplicant(RegisterRequest request) {
        String role = request.getRole() == null || request.getRole().isBlank()
                ? "applicant"
                : request.getRole().trim().toLowerCase(Locale.ROOT);
        if (!"applicant".equals(role) && !"client".equals(role)) {
            throw new IllegalArgumentException("Public registration is limited to applicant accounts");
        }
        if (userAccountRepository.existsByEmailIgnoreCase(request.getEmail().trim())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }
        otpService.requireVerifiedForRegistration(request.getEmail(), request.getPhone());

        String applicantId = request.getApplicantId().trim();
        String applicationId = request.getApplicationId().trim();
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        bindApplicantCase(applicantId, applicationId, email, request.getPhone());

        Instant now = Instant.now();
        UserAccount account = new UserAccount();
        account.setId(UUID.randomUUID().toString());
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        account.setFirstName(request.getFirstName().trim());
        account.setMiddleName(request.getMiddleName() != null ? request.getMiddleName().trim() : "");
        account.setLastName(request.getLastName().trim());
        account.setRole(role);
        account.setEnterpriseName(request.getEnterpriseName());
        account.setApplicantId(applicantId);
        account.setApplicationId(applicationId);
        account.setEnabled(true);
        account.setCreatedAt(now);
        account.setUpdatedAt(now);
        userAccountRepository.save(account);
        return toAuthResponse(account);
    }

    /**
     * Prevents case takeover: reject already-bound applicant ids; when a case
     * blob already exists, require matching email (and phone when present).
     * New registrations may bind a fresh id before the case blob is synced.
     */
    private void bindApplicantCase(String applicantId, String applicationId, String email, String phone) {
        if (userAccountRepository.existsByApplicantId(applicantId)) {
            throw new IllegalArgumentException(
                    "This applicant case is already linked to an account");
        }
        Optional<ApplicantRecordDto> existing = applicantRecordRepository
                .findById(applicantId)
                .map(entity -> new ApplicantRecordDto(
                        entity.getId(),
                        entity.getApplicationId(),
                        entity.getEnterpriseName(),
                        entity.getCurrentModule(),
                        readJsonMap(entity.getModuleDataJson()),
                        readJsonMap(entity.getProfileJson()),
                        entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null));

        if (existing.isEmpty()) {
            applicantRecordRepository.findByApplicationId(applicationId).ifPresent(other -> {
                if (!applicantId.equals(other.getId())) {
                    throw new IllegalArgumentException(
                            "This application ID is already assigned to another case");
                }
            });
            return;
        }

        ApplicantRecordDto record = existing.get();
        if (record.applicationId() != null
                && !record.applicationId().isBlank()
                && !record.applicationId().equalsIgnoreCase(applicationId)) {
            throw new IllegalArgumentException("applicationId does not match the existing case");
        }
        String profileEmail = profileString(record.profile(), "emailAddress", "email");
        if (profileEmail != null && !profileEmail.equalsIgnoreCase(email)) {
            throw new IllegalArgumentException(
                    "Email does not match the existing applicant case profile");
        }
        String profilePhone = profileString(record.profile(), "contactNumber", "phone");
        if (phone != null
                && !phone.isBlank()
                && profilePhone != null
                && !normalizePhone(profilePhone).equals(normalizePhone(phone))) {
            throw new IllegalArgumentException(
                    "Mobile number does not match the existing applicant case profile");
        }
    }

    private String profileString(Map<String, Object> profile, String... keys) {
        if (profile == null) {
            return null;
        }
        for (String key : keys) {
            Object value = profile.get(key);
            if (value instanceof String s && !s.isBlank()) {
                return s.trim();
            }
        }
        return null;
    }

    private static String normalizePhone(String raw) {
        return raw.replaceAll("\\D", "");
    }

    private Map<String, Object> readJsonMap(String json) {
        try {
            return objectMapper.readValue(json != null ? json : "{}", new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            return Map.of();
        }
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

    @Transactional(readOnly = true)
    public List<StaffUserDto> listStaffUsers() {
        return userAccountRepository.findByRoleInOrderByLastNameAscFirstNameAsc(STAFF_ROLES).stream()
                .map(this::toStaffDto)
                .toList();
    }

    @Transactional
    public StaffUserDto createStaffUser(CreateStaffRequest request) {
        String role = normalizeStaffRole(request.getRole());
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }
        Instant now = Instant.now();
        UserAccount account = new UserAccount();
        account.setId(UUID.randomUUID().toString());
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        account.setFirstName(request.getFirstName().trim());
        account.setMiddleName(request.getMiddleName() != null ? request.getMiddleName().trim() : "");
        account.setLastName(request.getLastName().trim());
        account.setRole(role);
        account.setOfficeId(blankToNull(request.getOfficeId()));
        account.setAssignedProvincesJson(writeProvinces(request.getAssignedProvinces()));
        account.setEnterpriseName(blankToNull(request.getEnterpriseName()));
        account.setEnabled(true);
        account.setCreatedAt(now);
        account.setUpdatedAt(now);
        userAccountRepository.save(account);
        return toStaffDto(account);
    }

    @Transactional
    public StaffUserDto updateStaffUser(
            String userId, UpdateStaffRequest request, UserPrincipal actor) {
        UserAccount account = requireStaffAccount(userId);
        boolean targetingSelf = account.getId().equals(actor.getUserId());

        if (request.getFirstName() != null) {
            String firstName = request.getFirstName().trim();
            if (firstName.isEmpty()) {
                throw new IllegalArgumentException("firstName must not be blank");
            }
            account.setFirstName(firstName);
        }
        if (request.getMiddleName() != null) {
            account.setMiddleName(request.getMiddleName().trim());
        }
        if (request.getLastName() != null) {
            String lastName = request.getLastName().trim();
            if (lastName.isEmpty()) {
                throw new IllegalArgumentException("lastName must not be blank");
            }
            account.setLastName(lastName);
        }
        if (request.getEnterpriseName() != null) {
            account.setEnterpriseName(blankToNull(request.getEnterpriseName()));
        }
        if (request.getOfficeId() != null) {
            account.setOfficeId(blankToNull(request.getOfficeId()));
        }
        if (request.getAssignedProvinces() != null) {
            account.setAssignedProvincesJson(writeProvinces(request.getAssignedProvinces()));
        }

        if (request.getRole() != null) {
            String newRole = normalizeStaffRole(request.getRole());
            if (targetingSelf && !"admin".equals(newRole)) {
                throw new IllegalArgumentException("You cannot demote your own admin account");
            }
            if ("admin".equals(account.getRole())
                    && !"admin".equals(newRole)
                    && account.isEnabled()
                    && userAccountRepository.countByRoleAndEnabledTrue("admin") <= 1) {
                throw new IllegalArgumentException("Cannot demote the last enabled admin account");
            }
            account.setRole(newRole);
        }

        if (request.getEnabled() != null) {
            boolean enabled = Boolean.TRUE.equals(request.getEnabled());
            if (targetingSelf && !enabled) {
                throw new IllegalArgumentException("You cannot disable your own account");
            }
            if (!enabled
                    && "admin".equals(account.getRole())
                    && account.isEnabled()
                    && userAccountRepository.countByRoleAndEnabledTrue("admin") <= 1) {
                throw new IllegalArgumentException("Cannot disable the last enabled admin account");
            }
            account.setEnabled(enabled);
        }

        account.setUpdatedAt(Instant.now());
        userAccountRepository.save(account);
        return toStaffDto(account);
    }

    @Transactional
    public void resetStaffPassword(String userId, StaffResetPasswordRequest request) {
        UserAccount account = requireStaffAccount(userId);
        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        account.setUpdatedAt(Instant.now());
        userAccountRepository.save(account);
    }

    private UserAccount requireApplicantAccount(String applicantId) {
        return userAccountRepository.findByApplicantId(applicantId)
                .filter(a -> "applicant".equals(a.getRole()) || "client".equals(a.getRole()))
                .orElseThrow(() -> new IllegalArgumentException(
                        "No applicant account found for id: " + applicantId));
    }

    private UserAccount requireStaffAccount(String userId) {
        return userAccountRepository.findById(userId)
                .filter(a -> STAFF_ROLES.contains(a.getRole()))
                .orElseThrow(() -> new IllegalArgumentException(
                        "No staff account found for id: " + userId));
    }

    private static String normalizeStaffRole(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("role is required");
        }
        String role = raw.trim().toLowerCase(Locale.ROOT);
        if (!STAFF_ROLES.contains(role)) {
            throw new IllegalArgumentException(
                    "Staff role must be admin, agent, or provincial-director");
        }
        return role;
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private StaffUserDto toStaffDto(UserAccount account) {
        StaffUserDto dto = new StaffUserDto();
        dto.setId(account.getId());
        dto.setEmail(account.getEmail());
        dto.setFirstName(account.getFirstName());
        dto.setMiddleName(account.getMiddleName() != null ? account.getMiddleName() : "");
        dto.setLastName(account.getLastName());
        dto.setRole(account.getRole());
        dto.setEnterpriseName(account.getEnterpriseName());
        dto.setOfficeId(account.getOfficeId());
        dto.setAssignedProvinces(readProvinces(account.getAssignedProvincesJson()));
        dto.setEnabled(account.isEnabled());
        return dto;
    }

    private String writeProvinces(List<String> provinces) {
        try {
            return objectMapper.writeValueAsString(provinces != null ? provinces : List.of());
        } catch (JsonProcessingException e) {
            return "[]";
        }
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
