/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.notification;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private NotificationRepository notificationRepository;

    private String loginToken(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private void verifyOtp(String channel, String target) throws Exception {
        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", channel,
                                "target", target))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", channel,
                                "target", target,
                                "code", "123456"))))
                .andExpect(status().isOk());
    }

    /** Register a fresh applicant and return token + applicantId. */
    private Map<String, String> registerApplicant(String phoneSuffix) throws Exception {
        String email = "notify-" + UUID.randomUUID() + "@example.com";
        String phone = "0917" + phoneSuffix;
        String applicantId = "notify-app-" + UUID.randomUUID();
        String applicationId = "LOI-2026-" + UUID.randomUUID().toString().substring(0, 6);
        verifyOtp("email", email);
        verifyOtp("sms", phone);
        MvcResult result = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "Secure@123",
                                "firstName", "Notify",
                                "lastName", "Tester",
                                "enterpriseName", "Notify Test Co",
                                "applicantId", applicantId,
                                "applicationId", applicationId,
                                "phone", phone))))
                .andExpect(status().isCreated())
                .andReturn();
        String token = objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
        return Map.of("token", token, "applicantId", applicantId, "email", email);
    }

    @Test
    void applicantCreatesStaffAlertAndOfficeStaffSeesIt() throws Exception {
        Map<String, String> applicant = registerApplicant("1000001");
        String applicantToken = applicant.get("token");
        String caseId = applicant.get("applicantId");
        String staffId = "req-staff-1-" + UUID.randomUUID();
        String applicantNotifId = "req-applicant-1-" + UUID.randomUUID();

        mockMvc.perform(post("/notifications")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(
                                Map.of(
                                        "id", staffId,
                                        "audience", "staff",
                                        "applicantId", caseId,
                                        "officeId", "south-cotabato",
                                        "kind", "action",
                                        "title", "Requirements awaiting review",
                                        "message", "Notify Test Co submitted documents.",
                                        "urgent", true,
                                        "view", "requirements"),
                                Map.of(
                                        "id", applicantNotifId,
                                        "audience", "applicant",
                                        "applicantId", caseId,
                                        "kind", "info",
                                        "title", "Requirements submitted",
                                        "message", "Your documents are with your provincial DOST office.",
                                        "view", "requirements")))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        String agentToken = loginToken("agent@dost.gov.ph", "admin123");
        mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + agentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id=='" + staffId + "')]").exists());

        String otherDirectorToken = loginToken("director.cotabato@dost.gov.ph", "admin123");
        mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + otherDirectorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id=='" + staffId + "')]").doesNotExist());

        mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + applicantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id=='" + applicantNotifId + "')]").exists())
                .andExpect(jsonPath("$[?(@.id=='" + staffId + "')]").doesNotExist());
    }

    @Test
    void markReadAndMarkAllReadPersist() throws Exception {
        Map<String, String> applicant = registerApplicant("1000002");
        String applicantToken = applicant.get("token");
        String caseId = applicant.get("applicantId");
        String id = "prescreen-1-" + UUID.randomUUID();

        mockMvc.perform(post("/notifications")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(Map.of(
                                "id", id,
                                "audience", "applicant",
                                "applicantId", caseId,
                                "kind", "success",
                                "title", "Pre-screening passed",
                                "message", "Continue with enterprise registration.",
                                "view", "registration")))))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/notifications/" + id + "/read")
                        .header("Authorization", "Bearer " + applicantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true));

        mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + applicantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id=='" + id + "')].read").value(org.hamcrest.Matchers.contains(true)));

        String secondId = "prescreen-extra-" + UUID.randomUUID();
        mockMvc.perform(post("/notifications")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(Map.of(
                                "id", secondId,
                                "audience", "applicant",
                                "applicantId", caseId,
                                "kind", "info",
                                "title", "Extra",
                                "message", "Unread item")))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/notifications/mark-all-read")
                        .header("Authorization", "Bearer " + applicantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));

        mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + applicantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id=='" + secondId + "')].read").value(org.hamcrest.Matchers.contains(true)));
    }

    @Test
    void upsertDoesNotResetReadState() throws Exception {
        Map<String, String> applicant = registerApplicant("1000003");
        String applicantToken = applicant.get("token");
        String caseId = applicant.get("applicantId");
        String id = "stable-req-applicant-1-" + UUID.randomUUID();

        mockMvc.perform(post("/notifications")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(Map.of(
                                "id", id,
                                "audience", "applicant",
                                "applicantId", caseId,
                                "kind", "info",
                                "title", "Requirements submitted",
                                "message", "With provincial office.")))))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/notifications/" + id + "/read")
                        .header("Authorization", "Bearer " + applicantToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/notifications")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(Map.of(
                                "id", id,
                                "audience", "applicant",
                                "applicantId", caseId,
                                "kind", "info",
                                "title", "Requirements submitted again",
                                "message", "Should not reset read.")))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].read").value(true))
                .andExpect(jsonPath("$[0].title").value("Requirements submitted"));

        notificationRepository.findById(id).ifPresent(n -> {
            org.junit.jupiter.api.Assertions.assertTrue(n.isReadFlag());
            org.junit.jupiter.api.Assertions.assertEquals("Requirements submitted", n.getTitle());
        });
    }

    @Test
    void applicantCannotCreateForOtherApplicant() throws Exception {
        Map<String, String> applicant = registerApplicant("1000004");
        Map<String, String> other = registerApplicant("1000005");
        String applicantToken = applicant.get("token");
        mockMvc.perform(post("/notifications")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(Map.of(
                                "id", "blocked-" + UUID.randomUUID(),
                                "audience", "applicant",
                                "applicantId", other.get("applicantId"),
                                "kind", "info",
                                "title", "Nope",
                                "message", "Should be forbidden")))))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminSeesAllStaffNotifications() throws Exception {
        String agentToken = loginToken("agent@dost.gov.ph", "admin123");
        String id = "admin-sees-" + UUID.randomUUID();

        mockMvc.perform(post("/notifications")
                        .header("Authorization", "Bearer " + agentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(Map.of(
                                "id", id,
                                "audience", "staff",
                                "applicantId", "staff-case-" + UUID.randomUUID(),
                                "officeId", "south-cotabato",
                                "kind", "action",
                                "title", "Staff only",
                                "message", "Visible to admin")))))
                .andExpect(status().isOk());

        String adminToken = loginToken("admin@dost.gov.ph", "admin123");
        mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id=='" + id + "')]").exists());
    }
}
