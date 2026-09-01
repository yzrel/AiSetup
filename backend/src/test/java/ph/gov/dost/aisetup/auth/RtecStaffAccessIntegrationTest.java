/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
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
class RtecStaffAccessIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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

    private String rtecToken() throws Exception {
        String admin = loginToken("admin@dost.gov.ph", "admin123");
        String email = "rtec-test-" + UUID.randomUUID() + "@dost.gov.ph";
        mockMvc.perform(post("/auth/admin/staff")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "TempPass@123",
                                "firstName", "RTEC",
                                "lastName", "Tester",
                                "role", "rtec-staff",
                                "officeId", "south-cotabato",
                                "assignedProvinces", List.of("South Cotabato")))))
                .andExpect(status().isCreated());
        return loginToken(email, "TempPass@123");
    }

    @Test
    void rtecStaffCanPatchRtecReportButNotApprovalLetterOrTna1() throws Exception {
        String staff = loginToken("admin@dost.gov.ph", "admin123");
        String applicantId = "rtec-case-" + UUID.randomUUID();
        String appId = "LOI-2026-" + UUID.randomUUID().toString().substring(0, 6);

        Map<String, Object> blob = new LinkedHashMap<>();
        blob.put("rtecReport", Map.of("recommendation", "draft", "published", false));
        mockMvc.perform(put("/applicants/" + applicantId)
                        .header("Authorization", "Bearer " + staff)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "id", applicantId,
                                "applicationId", appId,
                                "enterpriseName", "RTEC Case",
                                "currentModule", "conduct-rtec",
                                "moduleData", blob,
                                "profile", Map.of("emailAddress", "case-" + applicantId + "@example.com")))))
                .andExpect(status().isOk());

        String rtec = rtecToken();

        mockMvc.perform(put("/applicants/" + applicantId + "/modules/rtecReport")
                        .header("Authorization", "Bearer " + rtec)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "data", Map.of(
                                        "form", Map.of("recommendation", "Proceed."),
                                        "reviewComments", List.of()),
                                "published", false))))
                .andExpect(status().isOk());

        mockMvc.perform(put("/applicants/" + applicantId + "/modules/approvalLetter")
                        .header("Authorization", "Bearer " + rtec)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "data", Map.of("body", "forged"),
                                "published", false))))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/applicants/" + applicantId + "/modules/landBank")
                        .header("Authorization", "Bearer " + rtec)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "data", Map.of("accountName", "x"),
                                "published", false))))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/applicants/" + applicantId + "/tna1")
                        .header("Authorization", "Bearer " + rtec)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "applicantId", applicantId,
                                "form", Map.of("firmName", "Hacked"),
                                "submitted", false))))
                .andExpect(status().isForbidden());
    }
}
