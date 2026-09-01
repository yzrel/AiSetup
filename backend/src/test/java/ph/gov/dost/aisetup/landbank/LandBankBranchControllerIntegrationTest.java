/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.landbank;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class LandBankBranchControllerIntegrationTest {

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
    void listRequiresAuth() throws Exception {
        mockMvc.perform(get("/landbank-branches"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void staffCanCreateListUpdateAndDeactivateBranch() throws Exception {
        String token = staffToken();

        Map<String, Object> createPayload = Map.of(
                "name", "Kidapawan Branch",
                "address", "Quezon Blvd., Kidapawan City",
                "cityProvince", "Kidapawan City, North Cotabato",
                "managerName", "Ms. Test Manager",
                "managerTitle", "Branch Manager",
                "officeId", "cotabato");

        MvcResult createResult = mockMvc.perform(post("/landbank-branches")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createPayload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Kidapawan Branch"))
                .andExpect(jsonPath("$.active").value(true))
                .andReturn();

        String branchId = objectMapper
                .readTree(createResult.getResponse().getContentAsString())
                .get("id")
                .asText();

        mockMvc.perform(get("/landbank-branches?activeOnly=true")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(branchId));

        mockMvc.perform(patch("/landbank-branches/" + branchId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "managerName", "Ms. Updated Manager"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.managerName").value("Ms. Updated Manager"));

        mockMvc.perform(post("/landbank-branches/" + branchId + "/deactivate")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        mockMvc.perform(get("/landbank-branches?activeOnly=true")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void createWithInvalidOfficeIdReturns400() throws Exception {
        String token = staffToken();

        Map<String, Object> createPayload = Map.of(
                "name", "Invalid Office Branch",
                "address", "Some Street",
                "cityProvince", "Some City",
                "managerName", "Manager",
                "officeId", "not-a-real-office");

        mockMvc.perform(post("/landbank-branches")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createPayload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Unknown PSTO office id: not-a-real-office"));
    }
}
