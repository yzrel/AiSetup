/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import ph.gov.dost.aisetup.config.AisetupProperties;

/**
 * Seeds staff + demo applicant logins when {@code aisetup.seed-users=true}
 * (default for local/dev; disabled on the prod profile).
 */
@Component
public class UserSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(UserSeedRunner.class);

    private final AisetupProperties properties;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public UserSeedRunner(
            AisetupProperties properties,
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper) {
        this.properties = properties;
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isSeedUsers()) {
            log.info("User seeding skipped (aisetup.seed-users=false)");
            return;
        }
        seedStaff(
                "admin-001",
                "admin@dost.gov.ph",
                "DOST",
                "",
                "Admin",
                "admin",
                "DOST SOCCSKSARGEN — Regional Office",
                "regional",
                List.of());
        seedStaff(
                "rd-malawan",
                "rd@dost.gov.ph",
                "Sammy",
                "P.",
                "Malawan",
                "regional-director",
                "DOST SOCCSKSARGEN — Regional Office",
                "regional",
                List.of());
        seedStaff(
                "agent-001",
                "agent@dost.gov.ph",
                "DOST",
                "",
                "Agent",
                "agent",
                "DOST SOCCSKSARGEN — Provincial S&T Center",
                "south-cotabato",
                List.of("South Cotabato"));
        seedStaff(
                "director-cotabato",
                "director.cotabato@dost.gov.ph",
                "Michael",
                "T.",
                "Mayo",
                "provincial-director",
                "PSTO - Cotabato",
                "cotabato",
                List.of("Cotabato", "North Cotabato"));
        seedStaff(
                "director-south-cotabato",
                "director.southcot@dost.gov.ph",
                "Gisele Eve",
                "O.",
                "Siladan",
                "provincial-director",
                "PSTO - South Cotabato",
                "south-cotabato",
                List.of("South Cotabato"));
        seedStaff(
                "director-sultan-kudarat",
                "director.sk@dost.gov.ph",
                "Zenaida",
                "",
                "Guiano",
                "provincial-director",
                "PSTO - Sultan Kudarat",
                "sultan-kudarat",
                List.of("Sultan Kudarat"));
        seedStaff(
                "director-gensan-sarangani",
                "director.sargen@dost.gov.ph",
                "Babai",
                "",
                "Tagitican",
                "provincial-director",
                "PSTO - General Santos / Sarangani",
                "gensan-sarangani",
                List.of("Sarangani", "General Santos City"));
        seedStaff(
                "rtec-001",
                "rtec@dost.gov.ph",
                "RTEC",
                "",
                "Evaluator",
                "rtec-staff",
                "DOST SOCCSKSARGEN — RTEC",
                "regional",
                List.of());

        seedApplicant(
                "1",
                "juan@abcfood.com",
                "Juan",
                "",
                "Dela Cruz",
                "ABC Food Processing",
                "LOI-2024-000145");
        seedApplicant(
                "2",
                "maria@techinno.com",
                "Maria",
                "",
                "Santos",
                "Tech Innovations Inc.",
                "LOI-2024-000301");
        seedApplicant(
                "5",
                "carlos@greenvalley.com",
                "Carlos",
                "",
                "Reyes",
                "Green Valley Farms",
                "LOI-2024-000512");
        log.info("Seed users ready (staff + demo applicants)");
    }

    private void seedStaff(
            String id,
            String email,
            String firstName,
            String middleName,
            String lastName,
            String role,
            String enterpriseName,
            String officeId,
            List<String> provinces) {
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            return;
        }
        Instant now = Instant.now();
        UserAccount account = new UserAccount();
        account.setId(id);
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode("admin123"));
        account.setFirstName(firstName);
        account.setMiddleName(middleName);
        account.setLastName(lastName);
        account.setRole(role);
        account.setEnterpriseName(enterpriseName);
        account.setOfficeId(officeId);
        account.setAssignedProvincesJson(writeJson(provinces));
        account.setEnabled(true);
        account.setCreatedAt(now);
        account.setUpdatedAt(now);
        userAccountRepository.save(account);
        log.info("Seeded staff user {} ({})", email, role);
    }

    private void seedApplicant(
            String applicantId,
            String email,
            String firstName,
            String middleName,
            String lastName,
            String enterpriseName,
            String applicationId) {
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            return;
        }
        Instant now = Instant.now();
        UserAccount account = new UserAccount();
        account.setId(UUID.randomUUID().toString());
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode("Demo@1234"));
        account.setFirstName(firstName);
        account.setMiddleName(middleName);
        account.setLastName(lastName);
        account.setRole("applicant");
        account.setEnterpriseName(enterpriseName);
        account.setApplicantId(applicantId);
        account.setApplicationId(applicationId);
        account.setEnabled(true);
        account.setCreatedAt(now);
        account.setUpdatedAt(now);
        userAccountRepository.save(account);
    }

    private String writeJson(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values != null ? values : List.of());
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
}
