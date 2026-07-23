/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Fails fast on the {@code prod} profile when insecure defaults are still active.
 * Warns on other profiles when the default JWT secret is in use.
 */
@Component
@Order(0)
public class SecurityStartupValidator implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SecurityStartupValidator.class);

    static final String DEFAULT_JWT_SECRET =
            "aisetup-dev-jwt-secret-change-me-in-production-32chars-min";

    private final Environment environment;
    private final AisetupProperties properties;

    public SecurityStartupValidator(Environment environment, AisetupProperties properties) {
        this.environment = environment;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean prod = false;
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(profile)) {
                prod = true;
                break;
            }
        }

        String jwtSecret = properties.getSecurity().getJwtSecret();
        boolean defaultJwt = jwtSecret == null
                || jwtSecret.isBlank()
                || DEFAULT_JWT_SECRET.equals(jwtSecret);

        if (prod) {
            if (defaultJwt) {
                throw new IllegalStateException(
                        "Production startup blocked: set JWT_SECRET to a strong secret "
                                + "(do not use the development default).");
            }
            if (properties.isSeedUsers()) {
                throw new IllegalStateException(
                        "Production startup blocked: aisetup.seed-users must be false "
                                + "(use SPRING_PROFILES_ACTIVE=prod / application-prod.yml).");
            }
            if (properties.isDemoModeEnabled()) {
                throw new IllegalStateException(
                        "Production startup blocked: aisetup.demo-mode-enabled must be false.");
            }
            log.info("Production security checks passed (JWT secret set, seed/demo disabled)");
            return;
        }

        if (defaultJwt) {
            log.warn(
                    "Using the default JWT secret — acceptable for local/dev only. "
                            + "Set JWT_SECRET and SPRING_PROFILES_ACTIVE=prod before production.");
        }
        if (properties.isSeedUsers() || properties.isDemoModeEnabled()) {
            log.info(
                    "Dev security defaults active (seed-users={}, demo-mode={})",
                    properties.isSeedUsers(),
                    properties.isDemoModeEnabled());
        }
    }
}
