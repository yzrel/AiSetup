/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void loginWithSeededAdminReturnsToken() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "admin@dost.gov.ph",
                                "password", "admin123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("admin"));
    }

    @Test
    void loginWithBadPasswordReturns401() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "admin@dost.gov.ph",
                                "password", "wrong-password"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerApplicantThenLogin() throws Exception {
        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "email",
                                "target", "new.msme@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.demo").value(true));

        mockMvc.perform(post("/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "email",
                                "target", "new.msme@example.com",
                                "code", "123456"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true));

        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "sms",
                                "target", "09171234567"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.demo").value(true));

        mockMvc.perform(post("/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "sms",
                                "target", "09171234567",
                                "code", "123456"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "new.msme@example.com",
                                "password", "Secure@123",
                                "firstName", "Ana",
                                "lastName", "Reyes",
                                "enterpriseName", "Ana Foods",
                                "applicantId", "reg-app-1",
                                "applicationId", "LOI-2026-009999",
                                "phone", "09171234567"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.applicantId").value("reg-app-1"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "new.msme@example.com",
                                "password", "Secure@123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("applicant"));
    }

    @Test
    void sendEmailOtpRejectsAlreadyRegisteredEmail() throws Exception {
        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "email",
                                "target", "admin@dost.gov.ph"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("This email is already registered. Please sign in or use Forgot Password."));
    }

    @Test
    void sendSmsOtpRejectsAlreadyRegisteredMobile() throws Exception {
        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "email",
                                "target", "phone.taken@example.com"))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "email",
                                "target", "phone.taken@example.com",
                                "code", "123456"))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "sms",
                                "target", "09179876543"))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "sms",
                                "target", "09179876543",
                                "code", "123456"))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "phone.taken@example.com",
                                "password", "Secure@123",
                                "firstName", "Gina",
                                "lastName", "Cruz",
                                "enterpriseName", "Gina Foods",
                                "applicantId", "phone-taken-1",
                                "applicationId", "LOI-2026-007777",
                                "phone", "09179876543"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "sms",
                                "target", "09179876543"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("This mobile number is already registered. Please sign in or use Forgot Password."));
    }

    @Test
    void forgotPasswordUnknownEmailStillReturnsOk() throws Exception {
        mockMvc.perform(post("/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "nobody@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));
    }

    @Test
    void forgotPasswordThenResetAllowsLoginWithNewPassword() throws Exception {
        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "email",
                                "target", "reset.msme@example.com"))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "email",
                                "target", "reset.msme@example.com",
                                "code", "123456"))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "sms",
                                "target", "09170001111"))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "sms",
                                "target", "09170001111",
                                "code", "123456"))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "reset.msme@example.com",
                                "password", "Secure@123",
                                "firstName", "Ben",
                                "lastName", "Cruz",
                                "enterpriseName", "Ben Foods",
                                "applicantId", "reset-app-1",
                                "applicationId", "LOI-2026-008888",
                                "phone", "09170001111"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "reset.msme@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.demo").value(true));

        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "reset.msme@example.com",
                                "code", "000000",
                                "newPassword", "NewSecure@456"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "reset.msme@example.com",
                                "code", "123456",
                                "newPassword", "NewSecure@456"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "reset.msme@example.com",
                                "password", "Secure@123"))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "reset.msme@example.com",
                                "password", "NewSecure@456"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("reset.msme@example.com"));
    }
}
