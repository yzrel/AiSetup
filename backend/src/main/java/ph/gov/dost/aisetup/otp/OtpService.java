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
import ph.gov.dost.aisetup.config.AisetupProperties;
import ph.gov.dost.aisetup.otp.dto.OtpResponses;

@Service
public class OtpService {

    public static final String CHANNEL_EMAIL = "email";
    public static final String CHANNEL_SMS = "sms";
    public static final String DEMO_CODE = "123456";

    private static final Duration CODE_TTL = Duration.ofMinutes(10);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final Duration VERIFIED_WINDOW = Duration.ofMinutes(30);
    private static final int MAX_ATTEMPTS = 5;

    private final VerificationCodeRepository repository;
    private final EmailOtpSender emailOtpSender;
    private final SemaphoreSmsSender smsSender;
    private final AisetupProperties properties;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(
            VerificationCodeRepository repository,
            EmailOtpSender emailOtpSender,
            SemaphoreSmsSender smsSender,
            AisetupProperties properties) {
        this.repository = repository;
        this.emailOtpSender = emailOtpSender;
        this.smsSender = smsSender;
        this.properties = properties;
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
        if (CHANNEL_EMAIL.equals(channel)) {
            return !isEmailConfigured();
        }
        if (CHANNEL_SMS.equals(channel)) {
            return !isSmsConfigured();
        }
        return false;
    }

    @Transactional
    public Map<String, Object> send(String channel, String rawTarget) {
        String normalizedChannel = normalizeChannel(channel);
        String target = normalizeTarget(normalizedChannel, rawTarget);
        Instant now = Instant.now();

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

    private void ensureProviderConfigured(String channel) {
        if (CHANNEL_EMAIL.equals(channel) && !isEmailConfigured()) {
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
        if (!CHANNEL_EMAIL.equals(c) && !CHANNEL_SMS.equals(c)) {
            throw new IllegalArgumentException("channel must be email or sms");
        }
        return c;
    }

    private String normalizeTarget(String channel, String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("target is required");
        }
        if (CHANNEL_EMAIL.equals(channel)) {
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
