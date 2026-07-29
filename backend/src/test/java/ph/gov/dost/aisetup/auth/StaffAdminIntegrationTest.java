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
}
