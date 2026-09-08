/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import ph.gov.dost.aisetup.otp.SemaphoreSmsSender;
import ph.gov.dost.aisetup.persistence.ApplicantRecordRepository;

/**
 * Copies contact numbers from linked applicant profiles onto {@code users.phone}
 * so registration OTP can reject already-used mobiles for accounts created
 * before the phone column existed.
 */
@Component
@Order(200)
public class UserPhoneBackfillRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(UserPhoneBackfillRunner.class);

    private final UserAccountRepository userAccountRepository;
    private final ApplicantRecordRepository applicantRecordRepository;
    private final ObjectMapper objectMapper;

    public UserPhoneBackfillRunner(
            UserAccountRepository userAccountRepository,
            ApplicantRecordRepository applicantRecordRepository,
            ObjectMapper objectMapper) {
        this.userAccountRepository = userAccountRepository;
        this.applicantRecordRepository = applicantRecordRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(ApplicationArguments args) {
        int copied = 0;
        int skipped = 0;
        for (UserAccount account : userAccountRepository.findAll()) {
            if (account.getPhone() != null && !account.getPhone().isBlank()) {
                continue;
            }
            if (account.getApplicantId() == null || account.getApplicantId().isBlank()) {
                continue;
            }
            String extracted = applicantRecordRepository
                    .findById(account.getApplicantId())
                    .map(record -> phoneFromProfile(record.getProfileJson()))
                    .orElse(null);
            if (extracted == null) {
                continue;
            }
            if (userAccountRepository.existsByPhone(extracted)) {
                skipped++;
                continue;
            }
            account.setPhone(extracted);
            account.setUpdatedAt(Instant.now());
            userAccountRepository.save(account);
            copied++;
        }
        if (copied > 0 || skipped > 0) {
            log.info("Backfilled users.phone for {} account(s) ({} skipped as duplicate)", copied, skipped);
        }
    }

    private String phoneFromProfile(String profileJson) {
        if (profileJson == null || profileJson.isBlank()) {
            return null;
        }
        try {
            Map<String, Object> profile = objectMapper.readValue(profileJson, new TypeReference<>() {});
            Object raw = profile.get("contactNumber");
            if (raw == null) {
                raw = profile.get("phone");
            }
            if (raw == null) {
                return null;
            }
            String normalized = SemaphoreSmsSender.normalizePhMobile(String.valueOf(raw));
            return SemaphoreSmsSender.isValidPhMobile(normalized) ? normalized : null;
        } catch (Exception e) {
            return null;
        }
    }
}
