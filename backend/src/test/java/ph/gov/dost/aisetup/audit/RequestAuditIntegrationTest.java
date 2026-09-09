/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
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
class RequestAuditIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditEventRepository auditEventRepository;

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

    private Map<String, String> registerApplicant() throws Exception {
        String email = "audit-" + UUID.randomUUID() + "@example.com";
        String phone = "0917" + String.format("%07d", Math.abs(UUID.randomUUID().hashCode() % 10_000_000));
        String applicantId = "audit-app-" + UUID.randomUUID();
        String applicationId = "LOI-2026-" + UUID.randomUUID().toString().substring(0, 6);
        verifyOtp("email", email);
        verifyOtp("sms", phone);
        MvcResult result = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "Secure@123",
                                "firstName", "Audit",
                                "lastName", "Tester",
                                "enterpriseName", "Audit Test Co",
                                "applicantId", applicantId,
                                "applicationId", applicationId,
                                "phone", phone))))
                .andExpect(status().isCreated())
                .andReturn();
        String token = objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
        return Map.of("token", token, "email", email);
    }

    @Test
    void buttonTaggedRequestRecordsUiAction() throws Exception {
        int before = auditEventRepository.findByAction("http.request").size();
        Map<String, String> applicant = registerApplicant();
        String token = applicant.get("token");
        String email = applicant.get("email");

        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .header("X-UI-Action", "profile.refresh"))
                .andExpect(status().isOk());

        List<AuditEvent> events = auditEventRepository.findByAction("http.request");
        assertThat(events).hasSizeGreaterThan(before);

        AuditEvent match = events.stream()
                .filter(e -> email.equals(e.getActorEmail()))
                .filter(e -> e.getDetailJson() != null && e.getDetailJson().contains("/auth/me"))
                .reduce((a, b) -> b)
                .orElseThrow();
        assertThat(match.getEntityType()).isEqualTo("http");
        assertThat(match.getCreatedAt()).isNotNull();

        JsonNode detail = objectMapper.readTree(match.getDetailJson());
        assertThat(detail.get("method").asText()).isEqualTo("GET");
        assertThat(detail.get("path").asText()).contains("/auth/me");
        assertThat(detail.get("status").asInt()).isEqualTo(200);
        assertThat(detail.get("uiAction").asText()).isEqualTo("profile.refresh");
    }

    @Test
    void untaggedReadDoesNotWriteHttpAuditEvent() throws Exception {
        Map<String, String> applicant = registerApplicant();
        String token = applicant.get("token");
        String email = applicant.get("email");
        int before = auditEventRepository.findByAction("http.request").size();

        mockMvc.perform(get("/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        List<AuditEvent> events = auditEventRepository.findByAction("http.request");
        assertThat(events).hasSize(before);
        assertThat(events).noneMatch(e -> email.equals(e.getActorEmail()));
    }

    @Test
    void healthDoesNotWriteHttpAuditEvent() throws Exception {
        int before = auditEventRepository.findByAction("http.request").size();

        mockMvc.perform(get("/health")).andExpect(status().isOk());

        assertThat(auditEventRepository.findByAction("http.request")).hasSize(before);
    }

    @Test
    void aiFieldSuggestionWritesDomainAuditEventWithSummary() throws Exception {
        Map<String, String> applicant = registerApplicant();
        String token = applicant.get("token");
        String email = applicant.get("email");

        mockMvc.perform(post("/ai/suggest-field")
                        .header("Authorization", "Bearer " + token)
                        .header("X-UI-Action", "ai.suggest-field.loi.projectDescription")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "module", "loi",
                                "field", "projectDescription",
                                "context", Map.of(
                                        "enterpriseName", "Audit Test Co",
                                        "businessSector", "Food Processing",
                                        "projectDescription", "Upgrade bakery equipment")))))
                .andExpect(status().isOk());

        AuditEvent match = auditEventRepository.findByAction("ai.suggest-field").stream()
                .filter(e -> email.equals(e.getActorEmail()))
                .reduce((a, b) -> b)
                .orElseThrow();
        assertThat(match.getEntityType()).isEqualTo("ai_field");
        assertThat(match.getEntityId()).isEqualTo("loi.projectDescription");

        JsonNode detail = objectMapper.readTree(match.getDetailJson());
        assertThat(detail.get("api").asText()).isEqualTo("/ai/suggest-field");
        assertThat(detail.get("module").asText()).isEqualTo("loi");
        assertThat(detail.get("field").asText()).isEqualTo("projectDescription");
        assertThat(detail.get("aiGenerated").asBoolean()).isFalse();
        assertThat(detail.get("preview").asText()).isNotBlank();
        assertThat(detail.get("uiAction").asText()).isEqualTo("ai.suggest-field.loi.projectDescription");
    }

    @Test
    void loiGenerationWritesDomainAuditEvent() throws Exception {
        Map<String, String> applicant = registerApplicant();
        String token = applicant.get("token");
        String email = applicant.get("email");

        mockMvc.perform(post("/loi/generate")
                        .header("Authorization", "Bearer " + token)
                        .header("X-UI-Action", "loi.regenerate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loiPayload())))
                .andExpect(status().isOk());

        AuditEvent match = auditEventRepository.findByAction("loi.generate").stream()
                .filter(e -> email.equals(e.getActorEmail()))
                .reduce((a, b) -> b)
                .orElseThrow();
        assertThat(match.getEntityType()).isEqualTo("loi");

        JsonNode detail = objectMapper.readTree(match.getDetailJson());
        assertThat(detail.get("api").asText()).isEqualTo("/loi/generate");
        assertThat(detail.get("enterpriseName").asText()).isEqualTo("Audit Test Co");
        assertThat(detail.get("paragraphs").asInt()).isGreaterThan(0);
        assertThat(detail.get("preview").asText()).isNotBlank();
        assertThat(detail.get("uiAction").asText()).isEqualTo("loi.regenerate");
    }

    private static Map<String, Object> loiPayload() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("applicantName", "Audit Tester");
        payload.put("designation", "Owner");
        payload.put("enterpriseName", "Audit Test Co");
        payload.put("emailAddress", "audit@example.com");
        payload.put("contactNumber", "09171234567");
        payload.put("address", "Koronadal City");
        payload.put("province", "South Cotabato");
        payload.put("tinNumber", "123-456-789-000");
        payload.put("dateEstablished", "2018-01-15");
        payload.put("registrationType", "DTI");
        payload.put("registrationNumber", "DTI-123456");
        payload.put("msmeSize", "Micro");
        payload.put("businessType", "Single Proprietorship");
        payload.put("businessSector", "Food Processing");
        payload.put("businessNature", "Baking");
        payload.put("productServices", "Breads and pastries");
        payload.put("projectDescription", "Upgrade bakery equipment to increase capacity.");
        payload.put("expectedOutcome", "Higher throughput and consistent product quality.");
        payload.put("budget", "1500000");
        payload.put("timeline", "12 months");
        payload.put("commitmentAmount", "1500000");
        payload.put("repaymentTerm", "24 months");
        payload.put("qualified", true);
        payload.put("signature", "Audit Tester");
        payload.put("dateSigned", "2026-09-09");
        return payload;
    }
}
