/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
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
class ApplicantControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String staffToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "admin@dost.gov.ph",
                                "password", "admin123"))))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("token").asText();
    }

    @Test
    void healthIsPublic() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.authRequired").value(true));
    }

    @Test
    void applicantsRequireAuth() throws Exception {
        mockMvc.perform(get("/applicants"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void healthAndApplicantTna1Flow() throws Exception {
        String token = staffToken();

        String applicantId = "it-app-1";
        Map<String, Object> record = Map.of(
                "id", applicantId,
                "applicationId", "LOI-2026-000050",
                "enterpriseName", "Integration Foods",
                "currentModule", "tna1",
                "moduleData", Map.of(),
                "profile", Map.of("applicantName", "Maria"));

        mockMvc.perform(put("/applicants/" + applicantId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(record)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationId").value("LOI-2026-000050"));

        Map<String, Object> tna1Payload = Map.of(
                "applicantId", applicantId,
                "form", Map.of("mainProduct", "Banana chips"),
                "tables", Map.of(
                        "rawMaterials", java.util.List.of(),
                        "production", java.util.List.of(),
                        "equipment", java.util.List.of()),
                "submitted", true);

        mockMvc.perform(put("/applicants/" + applicantId + "/tna1")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tna1Payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));

        mockMvc.perform(get("/applicants/" + applicantId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.moduleData.tna1.submitted").value(true))
                .andExpect(jsonPath("$.moduleData.tna1.form.mainProduct").value("Banana chips"));
    }

    @Test
    void saveTna1ForUnknownApplicantReturns404() throws Exception {
        String token = staffToken();
        Map<String, Object> tna1Payload = Map.of(
                "applicantId", "does-not-exist",
                "form", Map.of(),
                "tables", Map.of(),
                "submitted", false);

        mockMvc.perform(put("/applicants/does-not-exist/tna1")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tna1Payload)))
                .andExpect(status().isNotFound());
    }
}
