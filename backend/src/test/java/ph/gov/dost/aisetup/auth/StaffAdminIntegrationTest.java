/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
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
import ph.gov.dost.aisetup.auth.dto.UpdateStaffRequest;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StaffAdminIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private AuthService authService;

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

    private String adminToken() throws Exception {
        return loginToken("admin@dost.gov.ph", "admin123");
    }

    private String agentToken() throws Exception {
        return loginToken("agent@dost.gov.ph", "admin123");
    }

    @Test
    void agentCannotListOrCreateStaff() throws Exception {
        String token = agentToken();
        mockMvc.perform(get("/auth/admin/staff")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/auth/admin/staff")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "blocked-" + UUID.randomUUID() + "@dost.gov.ph",
                                "password", "Secure@123",
                                "firstName", "Blocked",
                                "lastName", "Agent",
                                "role", "agent",
                                "officeId", "south-cotabato"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanCreateListUpdateAndResetStaff() throws Exception {
        String token = adminToken();
        String email = "new-agent-" + UUID.randomUUID() + "@dost.gov.ph";

        MvcResult created = mockMvc.perform(post("/auth/admin/staff")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "TempPass@123",
                                "firstName", "New",
                                "middleName", "T.",
                                "lastName", "Agent",
                                "role", "agent",
                                "officeId", "south-cotabato",
                                "assignedProvinces", List.of("South Cotabato"),
                                "enterpriseName", "PSTO South Cotabato"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("agent"))
                .andExpect(jsonPath("$.enabled").value(true))
                .andReturn();

        JsonNode staff = objectMapper.readTree(created.getResponse().getContentAsString());
        String userId = staff.get("id").asText();

        mockMvc.perform(get("/auth/admin/staff")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.email=='" + email + "')]").exists());

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "TempPass@123"))))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/auth/admin/staff/" + userId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firstName", "Renamed",
                                "lastName", "Staff"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Renamed"))
                .andExpect(jsonPath("$.lastName").value("Staff"));

        mockMvc.perform(post("/auth/admin/staff/" + userId + "/reset-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "newPassword", "ResetPass@456"))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "ResetPass@456"))))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/auth/admin/staff/" + userId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("enabled", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));
    }

    @Test
    void adminCannotDisableOrDemoteSelf() throws Exception {
        String token = adminToken();
        String adminId = userAccountRepository
                .findByEmailIgnoreCase("admin@dost.gov.ph")
                .orElseThrow()
                .getId();

        mockMvc.perform(patch("/auth/admin/staff/" + adminId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("enabled", false))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("You cannot disable your own account"));

        mockMvc.perform(patch("/auth/admin/staff/" + adminId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("role", "agent"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("You cannot demote your own admin account"));
    }

    @Test
    void cannotDemoteLastEnabledAdminViaService() {
        UserAccount sole = userAccountRepository
                .findByEmailIgnoreCase("admin@dost.gov.ph")
                .orElseThrow();
        // Simulate another admin principal acting on the sole enabled admin.
        UserAccount actorShell = new UserAccount();
        actorShell.setId("other-admin-actor");
        actorShell.setEmail("other-admin-actor@dost.gov.ph");
        actorShell.setPasswordHash("x");
        actorShell.setFirstName("Other");
        actorShell.setLastName("Admin");
        actorShell.setRole("admin");
        actorShell.setEnabled(true);
        UserPrincipal actor = new UserPrincipal(actorShell);

        UpdateStaffRequest demote = new UpdateStaffRequest();
        demote.setRole("agent");
        org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> authService.updateStaffUser(sole.getId(), demote, actor));
    }

    @Test
    void rejectsNonStaffRoleOnCreate() throws Exception {
        String token = adminToken();
        mockMvc.perform(post("/auth/admin/staff")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "bad-role-" + UUID.randomUUID() + "@dost.gov.ph",
                                "password", "TempPass@123",
                                "firstName", "Bad",
                                "lastName", "Role",
                                "role", "applicant"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void staffCanUpdateOwnProfileAndPassword() throws Exception {
        String token = agentToken();
        String newEmail = "agent-renamed-" + UUID.randomUUID() + "@dost.gov.ph";

        mockMvc.perform(patch("/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firstName", "Updated",
                                "lastName", "Agent"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Updated"))
                .andExpect(jsonPath("$.lastName").value("Agent"))
                .andExpect(jsonPath("$.email").value("agent@dost.gov.ph"));

        mockMvc.perform(patch("/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", newEmail,
                                "currentPassword", "admin123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(newEmail));

        mockMvc.perform(post("/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "currentPassword", "admin123",
                                "newPassword", "NewPass@123"))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", newEmail,
                                "password", "NewPass@123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.firstName").value("Updated"));

        // Restore seed credentials so other tests keep working.
        UserAccount agent = userAccountRepository.findByEmailIgnoreCase(newEmail).orElseThrow();
        agent.setEmail("agent@dost.gov.ph");
        agent.setFirstName("DOST");
        agent.setLastName("Agent");
        userAccountRepository.save(agent);
        mockMvc.perform(post("/auth/admin/staff/" + agent.getId() + "/reset-password")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "newPassword", "Admin123"))))
                .andExpect(status().isOk());
        // Seed uses admin123 (no uppercase); keep that hash for other tests.
        agent = userAccountRepository.findByEmailIgnoreCase("agent@dost.gov.ph").orElseThrow();
        agent.setPasswordHash(
                userAccountRepository
                        .findByEmailIgnoreCase("admin@dost.gov.ph")
                        .orElseThrow()
                        .getPasswordHash());
        userAccountRepository.save(agent);
    }

    @Test
    void provincialDirectorCanUpdateOwnProfile() throws Exception {
        String token = loginToken("director.cotabato@dost.gov.ph", "admin123");
        mockMvc.perform(patch("/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firstName", "Cotabato",
                                "middleName", "P.",
                                "lastName", "Director"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Cotabato"))
                .andExpect(jsonPath("$.role").value("provincial-director"));
    }

    @Test
    void emailChangeRequiresCurrentPasswordAndRejectsDuplicates() throws Exception {
        String token = loginToken("director.southcot@dost.gov.ph", "admin123");

        mockMvc.perform(patch("/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "pd-new-" + UUID.randomUUID() + "@dost.gov.ph"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Current password is required to change email"));

        mockMvc.perform(patch("/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "pd-wrong-" + UUID.randomUUID() + "@dost.gov.ph",
                                "currentPassword", "wrong-password"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Current password is incorrect"));

        mockMvc.perform(patch("/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "admin@dost.gov.ph",
                                "currentPassword", "admin123"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("An account with this email already exists"));
    }

    @Test
    void applicantCannotUpdateStaffProfile() throws Exception {
        String email = "applicant-profile-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "email",
                                "target", email))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "email",
                                "target", email,
                                "code", "123456"))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "sms",
                                "target", "09170001122"))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "channel", "sms",
                                "target", "09170001122",
                                "code", "123456"))))
                .andExpect(status().isOk());

        MvcResult registered = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "Applicant1",
                                "firstName", "App",
                                "lastName", "Licant",
                                "phone", "09170001122",
                                "enterpriseName", "Test Co",
                                "applicantId", "staff-profile-block-" + UUID.randomUUID(),
                                "applicationId", "LOI-2026-008888"))))
                .andExpect(status().isCreated())
                .andReturn();
        String token = objectMapper
                .readTree(registered.getResponse().getContentAsString())
                .get("token")
                .asText();

        mockMvc.perform(patch("/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("firstName", "Hacked"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanCorrectStaffEmail() throws Exception {
        String token = adminToken();
        String createEmail = "correct-me-" + UUID.randomUUID() + "@dost.gov.ph";
        String correctedEmail = "corrected-" + UUID.randomUUID() + "@dost.gov.ph";

        MvcResult created = mockMvc.perform(post("/auth/admin/staff")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", createEmail,
                                "password", "TempPass@123",
                                "firstName", "Correct",
                                "lastName", "Me",
                                "role", "agent",
                                "officeId", "south-cotabato"))))
                .andExpect(status().isCreated())
                .andReturn();
        String userId = objectMapper
                .readTree(created.getResponse().getContentAsString())
                .get("id")
                .asText();

        mockMvc.perform(patch("/auth/admin/staff/" + userId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", correctedEmail))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(correctedEmail));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", correctedEmail,
                                "password", "TempPass@123"))))
                .andExpect(status().isOk());
    }
}
