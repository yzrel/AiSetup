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

    @Test
    void applicantCreatesStaffAlertAndOfficeStaffSeesIt() throws Exception {
        String applicantToken = loginToken("juan@abcfood.com", "Demo@1234");
        String staffId = "req-staff-1-" + UUID.randomUUID();
        String applicantId = "req-applicant-1-" + UUID.randomUUID();

        mockMvc.perform(post("/notifications")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(
                                Map.of(
                                        "id", staffId,
                                        "audience", "staff",
                                        "applicantId", "1",
                                        "officeId", "south-cotabato",
                                        "kind", "action",
                                        "title", "Requirements awaiting review",
                                        "message", "ABC Food Processing submitted documents.",
                                        "urgent", true,
                                        "view", "requirements"),
                                Map.of(
                                        "id", applicantId,
                                        "audience", "applicant",
                                        "applicantId", "1",
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
                .andExpect(jsonPath("$[?(@.id=='" + applicantId + "')]").exists())
                .andExpect(jsonPath("$[?(@.id=='" + staffId + "')]").doesNotExist());
    }

    @Test
    void markReadAndMarkAllReadPersist() throws Exception {
        String applicantToken = loginToken("juan@abcfood.com", "Demo@1234");
        String id = "prescreen-1-" + UUID.randomUUID();

        mockMvc.perform(post("/notifications")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(Map.of(
                                "id", id,
                                "audience", "applicant",
                                "applicantId", "1",
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
                                "applicantId", "1",
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
        String applicantToken = loginToken("juan@abcfood.com", "Demo@1234");
        String id = "stable-req-applicant-1-" + UUID.randomUUID();

        mockMvc.perform(post("/notifications")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(Map.of(
                                "id", id,
                                "audience", "applicant",
                                "applicantId", "1",
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
                                "applicantId", "1",
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
        String applicantToken = loginToken("juan@abcfood.com", "Demo@1234");
        mockMvc.perform(post("/notifications")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(Map.of(
                                "id", "blocked-" + UUID.randomUUID(),
                                "audience", "applicant",
                                "applicantId", "2",
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
                                "applicantId", "1",
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
