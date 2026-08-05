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
import java.util.List;
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

    @Test
    void authenticatedRequestWritesHttpAuditEvent() throws Exception {
        int before = auditEventRepository.findByAction("http.request").size();
        String token = loginToken("juan@abcfood.com", "Demo@1234");

        mockMvc.perform(get("/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        List<AuditEvent> events = auditEventRepository.findByAction("http.request");
        assertThat(events).hasSizeGreaterThan(before);

        AuditEvent match = events.stream()
                .filter(e -> "juan@abcfood.com".equals(e.getActorEmail()))
                .filter(e -> e.getDetailJson() != null && e.getDetailJson().contains("/auth/me"))
                .reduce((a, b) -> b)
                .orElseThrow();
        assertThat(match.getEntityType()).isEqualTo("http");
        assertThat(match.getCreatedAt()).isNotNull();

        JsonNode detail = objectMapper.readTree(match.getDetailJson());
        assertThat(detail.get("method").asText()).isEqualTo("GET");
        assertThat(detail.get("path").asText()).contains("/auth/me");
        assertThat(detail.get("status").asInt()).isEqualTo(200);
    }

    @Test
    void healthDoesNotWriteHttpAuditEvent() throws Exception {
        int before = auditEventRepository.findByAction("http.request").size();

        mockMvc.perform(get("/health")).andExpect(status().isOk());

        assertThat(auditEventRepository.findByAction("http.request")).hasSize(before);
    }
}
