/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "aisetup")
public class AisetupProperties {

    private final Security security = new Security();
    private final Mail mail = new Mail();
    private final Sms sms = new Sms();
    private boolean seedUsers = true;
    private boolean demoModeEnabled = true;
    private String uploadDir = "./data/uploads";
    private final RateLimit rateLimit = new RateLimit();

    public Security getSecurity() {
        return security;
    }

    public Mail getMail() {
        return mail;
    }

    public Sms getSms() {
        return sms;
    }

    public RateLimit getRateLimit() {
        return rateLimit;
    }

    public boolean isSeedUsers() {
        return seedUsers;
    }

    public void setSeedUsers(boolean seedUsers) {
        this.seedUsers = seedUsers;
    }

    public boolean isDemoModeEnabled() {
        return demoModeEnabled;
    }

    public void setDemoModeEnabled(boolean demoModeEnabled) {
        this.demoModeEnabled = demoModeEnabled;
    }

    public String getUploadDir() {
        return uploadDir;
    }

    public void setUploadDir(String uploadDir) {
        this.uploadDir = uploadDir;
    }

    public static class Security {
        private String jwtSecret = "aisetup-dev-jwt-secret-change-me-in-production-32chars-min";
        private long jwtExpirationMs = 86_400_000L;

        public String getJwtSecret() {
            return jwtSecret;
        }

        public void setJwtSecret(String jwtSecret) {
            this.jwtSecret = jwtSecret;
        }

        public long getJwtExpirationMs() {
            return jwtExpirationMs;
        }

        public void setJwtExpirationMs(long jwtExpirationMs) {
            this.jwtExpirationMs = jwtExpirationMs;
        }
    }

    public static class Mail {
        private String from = "";
        private String username = "";
        private String password = "";

        public String getFrom() {
            return from;
        }

        public void setFrom(String from) {
            this.from = from;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public boolean isConfigured() {
            return username != null
                    && !username.isBlank()
                    && password != null
                    && !password.isBlank();
        }
    }

    public static class Sms {
        private String apiKey = "";
        private String senderName = "DOSTXII";

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getSenderName() {
            return senderName;
        }

        public void setSenderName(String senderName) {
            this.senderName = senderName;
        }

        public boolean isConfigured() {
            return apiKey != null && !apiKey.isBlank();
        }
    }

    public static class RateLimit {
        /** OTP sends allowed per client IP per window. */
        private int otpPerIp = 10;
        /** OTP sends allowed per email/phone target per window. */
        private int otpPerTarget = 5;
        private int otpWindowMinutes = 15;
        /** AI /complete calls allowed per staff user per window. */
        private int aiPerUser = 30;
        private int aiWindowMinutes = 60;

        public int getOtpPerIp() {
            return otpPerIp;
        }

        public void setOtpPerIp(int otpPerIp) {
            this.otpPerIp = otpPerIp;
        }

        public int getOtpPerTarget() {
            return otpPerTarget;
        }

        public void setOtpPerTarget(int otpPerTarget) {
            this.otpPerTarget = otpPerTarget;
        }

        public int getOtpWindowMinutes() {
            return otpWindowMinutes;
        }

        public void setOtpWindowMinutes(int otpWindowMinutes) {
            this.otpWindowMinutes = otpWindowMinutes;
        }

        public int getAiPerUser() {
            return aiPerUser;
        }

        public void setAiPerUser(int aiPerUser) {
            this.aiPerUser = aiPerUser;
        }

        public int getAiWindowMinutes() {
            return aiWindowMinutes;
        }

        public void setAiWindowMinutes(int aiWindowMinutes) {
            this.aiWindowMinutes = aiWindowMinutes;
        }
    }
}
