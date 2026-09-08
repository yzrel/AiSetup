/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.otp;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ph.gov.dost.aisetup.auth.UserAccountRepository;
import ph.gov.dost.aisetup.config.AisetupProperties;
import ph.gov.dost.aisetup.otp.dto.OtpResponses;

@Service
public class OtpService {

    public static final String CHANNEL_EMAIL = "email";
    public static final String CHANNEL_SMS = "sms";
    /** Email OTP used only for self-service password reset (distinct from registration). */
    public static final String CHANNEL_PASSWORD_RESET = "password-reset";
    public static final String DEMO_CODE = "123456";
    public static final String EMAIL_ALREADY_REGISTERED =
            "This email is already registered. Please sign in or use Forgot Password.";
    public static final String PHONE_ALREADY_REGISTERED =
            "This mobile number is already registered. Please sign in or use Forgot Password.";

    private static final Duration CODE_TTL = Duration.ofMinutes(10);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final Duration VERIFIED_WINDOW = Duration.ofMinutes(30);
    private static final int MAX_ATTEMPTS = 5;

    private final VerificationCodeRepository repository;
    private final EmailOtpSender emailOtpSender;
    private final SemaphoreSmsSender smsSender;
    private final AisetupProperties properties;
    private final UserAccountRepository userAccountRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(
            VerificationCodeRepository repository,
            EmailOtpSender emailOtpSender,
            SemaphoreSmsSender smsSender,
            AisetupProperties properties,
            UserAccountRepository userAccountRepository) {
        this.repository = repository;
        this.emailOtpSender = emailOtpSender;
        this.smsSender = smsSender;
        this.properties = properties;
        this.userAccountRepository = userAccountRepository;
    }

    public boolean isEmailConfigured() {
        return emailOtpSender.isConfigured();
    }

    public boolean isSmsConfigured() {
        return smsSender.isConfigured();
    }

    public boolean isDemoFallback(String channel) {
        if (!properties.isDemoModeEnabled()) {
            return false;
        }
        if (CHANNEL_EMAIL.equals(channel) || CHANNEL_PASSWORD_RESET.equals(channel)) {
            return !isEmailConfigured();
        }
        if (CHANNEL_SMS.equals(channel)) {
            return !isSmsConfigured();
        }
        return false;
    }

    /** Sends a password-reset OTP to the given email (demo fallback when SMTP is off). */
    @Transactional
    public Map<String, Object> sendPasswordReset(String email) {
        return send(CHANNEL_PASSWORD_RESET, email);
    }

    /**
     * Verifies a password-reset OTP and marks it consumed (single-use). Throws on failure.
     */
    @Transactional
    public void consumePasswordReset(String email, String code) {
        String target = normalizeTarget(CHANNEL_PASSWORD_RESET, email);
        Instant now = Instant.now();

        VerificationCode latest = repository
                .findFirstByChannelAndTargetOrderByCreatedAtDesc(CHANNEL_PASSWORD_RESET, target)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid or expired reset code. Please request a new one."));

        if (latest.isVerified()) {
            throw new IllegalArgumentException(
                    "This reset code was already used. Please request a new one.");
        }
        if (latest.getExpiresAt().isBefore(now)) {
            throw new IllegalArgumentException(
                    "This reset code has expired. Please request a new one.");
        }
        if (latest.getAttempts() >= MAX_ATTEMPTS) {
            throw new IllegalArgumentException(
                    "Too many incorrect attempts. Please request a new reset code.");
        }

        String submitted = code == null ? "" : code.trim();
        boolean demoAccept = isDemoFallback(CHANNEL_PASSWORD_RESET) && DEMO_CODE.equals(submitted);
        boolean match = demoAccept || hash(submitted).equalsIgnoreCase(latest.getCodeHash());
        if (!match) {
            latest.setAttempts(latest.getAttempts() + 1);
            repository.save(latest);
            throw new IllegalArgumentException("Incorrect verification code");
        }

        latest.setVerified(true);
        repository.save(latest);
    }

    @Transactional
    public Map<String, Object> send(String channel, String rawTarget) {
        String normalizedChannel = normalizeChannel(channel);
        String target = normalizeTarget(normalizedChannel, rawTarget);
        Instant now = Instant.now();

        if (CHANNEL_EMAIL.equals(normalizedChannel)
                && userAccountRepository.existsByEmailIgnoreCase(target)) {
            throw new IllegalArgumentException(EMAIL_ALREADY_REGISTERED);
        }
        if (CHANNEL_SMS.equals(normalizedChannel) && isPhoneRegistered(target)) {
            throw new IllegalArgumentException(PHONE_ALREADY_REGISTERED);
        }

        repository
                .findFirstByChannelAndTargetOrderByCreatedAtDesc(normalizedChannel, target)
                .ifPresent(latest -> {
                    if (!latest.isVerified()
                            && Duration.between(latest.getCreatedAt(), now).compareTo(RESEND_COOLDOWN) < 0) {
                        long wait = RESEND_COOLDOWN.getSeconds()
                                - Duration.between(latest.getCreatedAt(), now).getSeconds();
                        throw new IllegalArgumentException(
                                "Please wait " + Math.max(wait, 1) + " seconds before requesting another code");
                    }
                });

        boolean demo = isDemoFallback(normalizedChannel);
        if (!demo) {
            ensureProviderConfigured(normalizedChannel);
        }

        String code = demo ? DEMO_CODE : generateCode();
        VerificationCode entity = new VerificationCode();
        entity.setId(UUID.randomUUID().toString());
        entity.setChannel(normalizedChannel);
        entity.setTarget(target);
        entity.setCodeHash(hash(code));
        entity.setAttempts(0);
        entity.setVerified(false);
        entity.setExpiresAt(now.plus(CODE_TTL));
        entity.setCreatedAt(now);
        repository.save(entity);

        if (demo) {
            return OtpResponses.sendResult(
                    false,
                    true,
                    "Demo mode: use OTP " + DEMO_CODE + " (delivery not configured for " + normalizedChannel + ")");
        }

        if (CHANNEL_EMAIL.equals(normalizedChannel)) {
            emailOtpSender.send(target, code);
        } else if (CHANNEL_PASSWORD_RESET.equals(normalizedChannel)) {
            emailOtpSender.sendPasswordReset(target, code);
        } else {
            smsSender.send(target, code);
        }
        return OtpResponses.sendResult(true, false, "Verification code sent");
    }

    @Transactional
    public Map<String, Object> verify(String channel, String rawTarget, String code) {
        String normalizedChannel = normalizeChannel(channel);
        String target = normalizeTarget(normalizedChannel, rawTarget);
        Instant now = Instant.now();

        VerificationCode latest = repository
                .findFirstByChannelAndTargetOrderByCreatedAtDesc(normalizedChannel, target)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No verification code found. Please request a new OTP."));

        if (latest.isVerified()) {
            return OtpResponses.verifyResult(true);
        }
        if (latest.getExpiresAt().isBefore(now)) {
            throw new IllegalArgumentException("This verification code has expired. Please request a new one.");
        }
        if (latest.getAttempts() >= MAX_ATTEMPTS) {
            throw new IllegalArgumentException(
                    "Too many incorrect attempts. Please request a new verification code.");
        }

        String submitted = code == null ? "" : code.trim();
        boolean demoAccept = isDemoFallback(normalizedChannel) && DEMO_CODE.equals(submitted);
        boolean match = demoAccept || hash(submitted).equalsIgnoreCase(latest.getCodeHash());
        if (!match) {
            latest.setAttempts(latest.getAttempts() + 1);
            repository.save(latest);
            throw new IllegalArgumentException("Incorrect verification code");
        }

        latest.setVerified(true);
        repository.save(latest);
        return OtpResponses.verifyResult(true);
    }

    /**
     * True when the target has a verified OTP created within the registration window.
     */
    @Transactional(readOnly = true)
    public boolean isRecentlyVerified(String channel, String rawTarget) {
        String normalizedChannel = normalizeChannel(channel);
        String target = normalizeTarget(normalizedChannel, rawTarget);
        Instant cutoff = Instant.now().minus(VERIFIED_WINDOW);
        return repository
                .findFirstByChannelAndTargetOrderByCreatedAtDesc(normalizedChannel, target)
                .filter(VerificationCode::isVerified)
                .filter(vc -> vc.getCreatedAt().isAfter(cutoff))
                .isPresent();
    }

    /**
     * Enforces email (and SMS when configured) OTP before registration.
     * When aisetup.demo-mode-enabled is true, OTP checks are skipped so demo
     * registration can proceed without verifying (production keeps this off).
     */
    public void requireVerifiedForRegistration(String email, String phone) {
        if (properties.isDemoModeEnabled()) {
            return;
        }
        if (!isRecentlyVerified(CHANNEL_EMAIL, email)) {
            throw new IllegalArgumentException("Please verify your email address before registering");
        }
        // Require SMS verification when SMS is configured.
        if (isSmsConfigured()) {
            if (phone == null || phone.isBlank()) {
                throw new IllegalArgumentException("Mobile number is required for registration");
            }
            if (!isRecentlyVerified(CHANNEL_SMS, phone)) {
                throw new IllegalArgumentException("Please verify your mobile number before registering");
            }
        }
    }

    /** True when this mobile is stored on an existing {@code users.phone} row. */
    public boolean isPhoneRegistered(String rawPhone) {
        String normalized = SemaphoreSmsSender.normalizePhMobile(rawPhone);
        if (!SemaphoreSmsSender.isValidPhMobile(normalized)) {
            return false;
        }
        return userAccountRepository.existsByPhone(normalized);
    }

    private void ensureProviderConfigured(String channel) {
        if ((CHANNEL_EMAIL.equals(channel) || CHANNEL_PASSWORD_RESET.equals(channel))
                && !isEmailConfigured()) {
            throw new IllegalStateException(
                    "Email verification is unavailable. Configure SMTP_USERNAME / SMTP_PASSWORD or enable demo mode.");
        }
        if (CHANNEL_SMS.equals(channel) && !isSmsConfigured()) {
            throw new IllegalStateException(
                    "SMS verification is unavailable. Configure SEMAPHORE_API_KEY or enable demo mode.");
        }
    }

    private String normalizeChannel(String channel) {
        if (channel == null) {
            throw new IllegalArgumentException("channel is required");
        }
        String c = channel.trim().toLowerCase();
        if (!CHANNEL_EMAIL.equals(c)
                && !CHANNEL_SMS.equals(c)
                && !CHANNEL_PASSWORD_RESET.equals(c)) {
            throw new IllegalArgumentException("channel must be email, sms, or password-reset");
        }
        return c;
    }

    private String normalizeTarget(String channel, String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("target is required");
        }
        if (CHANNEL_EMAIL.equals(channel) || CHANNEL_PASSWORD_RESET.equals(channel)) {
            String email = raw.trim().toLowerCase();
            if (!email.contains("@") || email.length() < 5) {
                throw new IllegalArgumentException("Enter a valid email address");
            }
            return email;
        }
        String phone = SemaphoreSmsSender.normalizePhMobile(raw);
        if (!SemaphoreSmsSender.isValidPhMobile(phone)) {
            throw new IllegalArgumentException(
                    "Enter a valid Philippine mobile number (e.g. 09171234567)");
        }
        return phone;
    }

    private String generateCode() {
        int n = secureRandom.nextInt(1_000_000);
        return String.format("%06d", n);
    }

    private static String hash(String code) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(code.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
