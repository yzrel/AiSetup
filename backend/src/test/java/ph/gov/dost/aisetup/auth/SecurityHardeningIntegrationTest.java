/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
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
import ph.gov.dost.aisetup.persistence.ApplicantPersistenceService;
import ph.gov.dost.aisetup.persistence.ApplicantRecordDto;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityHardeningIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ApplicantPersistenceService applicantPersistenceService;

    private String staffToken() throws Exception {
        return loginToken("admin@dost.gov.ph", "admin123");
    }

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

    private String registerApplicant(String email, String phone, String applicantId, String applicationId)
            throws Exception {
        verifyOtp("email", email);
        verifyOtp("sms", phone);
        MvcResult result = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "Secure@123",
                                "firstName", "Test",
                                "lastName", "User",
                                "enterpriseName", "Test Co",
                                "applicantId", applicantId,
                                "applicationId", applicationId,
                                "phone", phone))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void cannotRegisterOntoAlreadyBoundApplicantId() throws Exception {
        String victimId = "sec-bound-" + UUID.randomUUID();
        String victimAppId = "LOI-2026-" + UUID.randomUUID().toString().substring(0, 6);
        String email1 = "owner-" + UUID.randomUUID() + "@example.com";
        registerApplicant(email1, "09170000001", victimId, victimAppId);

        String attackerEmail = "attacker-" + UUID.randomUUID() + "@example.com";
        verifyOtp("email", attackerEmail);
        verifyOtp("sms", "09170000002");
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", attackerEmail,
                                "password", "Secure@123",
                                "firstName", "Bad",
                                "lastName", "Actor",
                                "enterpriseName", "Evil Co",
                                "applicantId", victimId,
                                "applicationId", "LOI-2026-ATTAC1",
                                "phone", "09170000002"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("This applicant case is already linked to an account"));
    }

    @Test
    void cannotRegisterOntoExistingCaseWithMismatchedEmail() throws Exception {
        String caseId = "sec-case-" + UUID.randomUUID();
        String appId = "LOI-2026-" + UUID.randomUUID().toString().substring(0, 6);
        applicantPersistenceService.save(new ApplicantRecordDto(
                caseId,
                appId,
                "Victim Foods",
                "registration",
                Map.of(),
                Map.of("emailAddress", "victim@example.com", "contactNumber", "09171111111"),
                null));

        String attackerEmail = "mismatch-" + UUID.randomUUID() + "@example.com";
        verifyOtp("email", attackerEmail);
        verifyOtp("sms", "09172222222");
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", attackerEmail,
                                "password", "Secure@123",
                                "firstName", "Bad",
                                "lastName", "Actor",
                                "enterpriseName", "Evil Co",
                                "applicantId", caseId,
                                "applicationId", appId,
                                "phone", "09172222222"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("Email does not match the existing applicant case profile"));
    }

    @Test
    void applicantCannotPublishStaffModule() throws Exception {
        String applicantId = "sec-pub-" + UUID.randomUUID();
        String appId = "LOI-2026-" + UUID.randomUUID().toString().substring(0, 6);
        String email = "pub-" + UUID.randomUUID() + "@example.com";
        String token = registerApplicant(email, "09173333333", applicantId, appId);

        mockMvc.perform(put("/applicants/" + applicantId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "id", applicantId,
                                "applicationId", appId,
                                "enterpriseName", "Test Co",
                                "currentModule", "registration",
                                "moduleData", Map.of(),
                                "profile", Map.of("emailAddress", email)))))
                .andExpect(status().isOk());

        mockMvc.perform(put("/applicants/" + applicantId + "/modules/approvalLetter")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "data", Map.of("body", "forged"),
                                "published", true))))
                .andExpect(status().isForbidden());
    }

    @Test
    void applicantCannotOverwriteStaffOwnedKeysOnFullPut() throws Exception {
        String applicantId = "sec-ow-" + UUID.randomUUID();
        String appId = "LOI-2026-" + UUID.randomUUID().toString().substring(0, 6);
        String staff = staffToken();

        Map<String, Object> staffBlob = new LinkedHashMap<>();
        staffBlob.put(
                "approvalLetter",
                Map.of("body", "official draft", "published", false));
        mockMvc.perform(put("/applicants/" + applicantId)
                        .header("Authorization", "Bearer " + staff)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "id", applicantId,
                                "applicationId", appId,
                                "enterpriseName", "Staff Case",
                                "currentModule", "approval-letter",
                                "moduleData", staffBlob,
                                "profile", Map.of("emailAddress", "case-" + applicantId + "@example.com")))))
                .andExpect(status().isOk());

        String email = "case-" + applicantId + "@example.com";
        // Bind account after staff created the case (email must match profile).
        verifyOtp("email", email);
        verifyOtp("sms", "09174444444");
        MvcResult reg = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "Secure@123",
                                "firstName", "Case",
                                "lastName", "Owner",
                                "enterpriseName", "Staff Case",
                                "applicantId", applicantId,
                                "applicationId", appId,
                                "phone", "09174444444"))))
                .andExpect(status().isCreated())
                .andReturn();
        String applicantToken =
                objectMapper.readTree(reg.getResponse().getContentAsString()).get("token").asText();

        Map<String, Object> forged = new LinkedHashMap<>();
        forged.put("approvalLetter", Map.of("body", "attacker overwrite", "published", true));
        mockMvc.perform(put("/applicants/" + applicantId)
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "id", applicantId,
                                "applicationId", appId,
                                "enterpriseName", "Staff Case",
                                "currentModule", "approval-letter",
                                "moduleData", forged,
                                "profile", Map.of("emailAddress", email)))))
                .andExpect(status().isOk());

        // Staff sees original draft preserved (not attacker overwrite / self-publish).
        MvcResult get = mockMvc.perform(get("/applicants/" + applicantId)
                        .header("Authorization", "Bearer " + staff))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode moduleData = objectMapper.readTree(get.getResponse().getContentAsString()).get("moduleData");
        org.junit.jupiter.api.Assertions.assertEquals(
                "official draft", moduleData.get("approvalLetter").get("body").asText());
        org.junit.jupiter.api.Assertions.assertFalse(
                moduleData.get("approvalLetter").get("published").asBoolean());
    }

    @Test
    void applicantCannotPassLandBankGateByForgingSignedMoaFlags() throws Exception {
        String applicantId = "sec-lbp-" + UUID.randomUUID();
        String appId = "LOI-2026-" + UUID.randomUUID().toString().substring(0, 6);
        String email = "lbp-" + UUID.randomUUID() + "@example.com";
        String token = registerApplicant(email, "09175555555", applicantId, appId);

        mockMvc.perform(put("/applicants/" + applicantId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "id", applicantId,
                                "applicationId", appId,
                                "enterpriseName", "LBP Co",
                                "currentModule", "registration",
                                "moduleData", Map.of(
                                        "landBank", Map.of("signedMoa", true),
                                        "signedDocuments", Map.of("moa", Map.of("fileName", "fake.pdf"))),
                                "profile", Map.of("emailAddress", email)))))
                .andExpect(status().isOk());

        // Applicants may persist wet-ink signed copies under signedDocuments.
        mockMvc.perform(put("/applicants/" + applicantId + "/modules/signedDocuments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "data", Map.of(
                                        "letter-of-intent",
                                        Map.of(
                                                "fileName", "signed-loi.pdf",
                                                "fileId", "file-1",
                                                "hasFileContent", true))))))
                .andExpect(status().isOk());

        // Staff-only signedMoa module key cannot be patched by applicants.
        mockMvc.perform(put("/applicants/" + applicantId + "/modules/signedMoa")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "data", Map.of("fileName", "forged-moa.pdf")))))
                .andExpect(status().isForbidden());

        // Forged landBank.signedMoa on full PUT is stripped (not persisted as attestation).
        MvcResult get = mockMvc.perform(get("/applicants/" + applicantId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode moduleData = objectMapper
                .readTree(get.getResponse().getContentAsString())
                .path("moduleData");
        JsonNode landBank = moduleData.path("landBank");
        org.junit.jupiter.api.Assertions.assertTrue(
                landBank.isMissingNode() || landBank.path("signedMoa").isMissingNode()
                        || landBank.path("signedMoa").isNull());
        org.junit.jupiter.api.Assertions.assertEquals(
                "signed-loi.pdf",
                moduleData.path("signedDocuments").path("letter-of-intent").path("fileName").asText());
    }

    /** Staff creates a case, then the matching applicant account is bound to it. */
    private String bindApplicantAccount(String applicantId, String appId, String email, String phone)
            throws Exception {
        verifyOtp("email", email);
        verifyOtp("sms", phone);
        MvcResult reg = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "Secure@123",
                                "firstName", "Case",
                                "lastName", "Owner",
                                "enterpriseName", "Staff Case",
                                "applicantId", applicantId,
                                "applicationId", appId,
                                "phone", phone))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(reg.getResponse().getContentAsString()).get("token").asText();
    }

    private void staffCreateCase(
            String staffToken, String applicantId, String appId, String email, Map<String, Object> moduleData)
            throws Exception {
        mockMvc.perform(put("/applicants/" + applicantId)
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "id", applicantId,
                                "applicationId", appId,
                                "enterpriseName", "Staff Case",
                                "currentModule", "approval-letter",
                                "moduleData", moduleData,
                                "profile", Map.of("emailAddress", email)))))
                .andExpect(status().isOk());
    }

    @Test
    void applicantAcknowledgmentOfPublishedApprovalLetterPersists() throws Exception {
        String applicantId = "sec-ack-" + UUID.randomUUID();
        String appId = "LOI-2026-" + UUID.randomUUID().toString().substring(0, 6);
        String email = "case-" + applicantId + "@example.com";
        String staff = staffToken();

        staffCreateCase(staff, applicantId, appId, email, Map.of(
                "approvalLetter", Map.of(
                        "form", Map.of("projectTitle", "Upgrading Project"),
                        "published", true,
                        "publishedAt", "2026-07-23T00:00:00Z")));
        String applicantToken = bindApplicantAccount(applicantId, appId, email, "09177777771");

        mockMvc.perform(put("/applicants/" + applicantId + "/approval-letter/acknowledge")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("conformeSignedName", "Juan Dela Cruz"))))
                .andExpect(status().isOk());

        // Staff view reflects the persisted acknowledgment.
        MvcResult get = mockMvc.perform(get("/applicants/" + applicantId)
                        .header("Authorization", "Bearer " + staff))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode letter = objectMapper
                .readTree(get.getResponse().getContentAsString())
                .path("moduleData")
                .path("approvalLetter");
        org.junit.jupiter.api.Assertions.assertTrue(letter.path("acknowledged").asBoolean());
        org.junit.jupiter.api.Assertions.assertEquals(
                "Juan Dela Cruz", letter.path("form").path("conformeSignedName").asText());
        org.junit.jupiter.api.Assertions.assertTrue(letter.path("published").asBoolean());
        org.junit.jupiter.api.Assertions.assertEquals(
                "Upgrading Project", letter.path("form").path("projectTitle").asText());
    }

    @Test
    void applicantCannotAcknowledgeUnpublishedApprovalLetter() throws Exception {
        String applicantId = "sec-ack-unpub-" + UUID.randomUUID();
        String appId = "LOI-2026-" + UUID.randomUUID().toString().substring(0, 6);
        String email = "case-" + applicantId + "@example.com";
        String staff = staffToken();

        staffCreateCase(staff, applicantId, appId, email, Map.of(
                "approvalLetter", Map.of(
                        "form", Map.of("projectTitle", "Draft Project"),
                        "published", false)));
        String applicantToken = bindApplicantAccount(applicantId, appId, email, "09177777772");

        mockMvc.perform(put("/applicants/" + applicantId + "/approval-letter/acknowledge")
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("conformeSignedName", "Juan Dela Cruz"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void applicantFullPutDoesNotEraseUnpublishedTna2Draft() throws Exception {
        String applicantId = "sec-tna2-" + UUID.randomUUID();
        String appId = "LOI-2026-" + UUID.randomUUID().toString().substring(0, 6);
        String email = "case-" + applicantId + "@example.com";
        String staff = staffToken();

        staffCreateCase(staff, applicantId, appId, email, Map.of(
                "tna2", Map.of("background", "staff draft", "published", false)));
        String applicantToken = bindApplicantAccount(applicantId, appId, email, "09177777773");

        // Applicant hydrated a filtered blob without tna2 — their whole-blob save
        // must not erase the hidden staff draft.
        mockMvc.perform(put("/applicants/" + applicantId)
                        .header("Authorization", "Bearer " + applicantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "id", applicantId,
                                "applicationId", appId,
                                "enterpriseName", "Staff Case",
                                "currentModule", "approval-letter",
                                "moduleData", Map.of("coreProducts", "Bananas"),
                                "profile", Map.of("emailAddress", email)))))
                .andExpect(status().isOk());

        MvcResult get = mockMvc.perform(get("/applicants/" + applicantId)
                        .header("Authorization", "Bearer " + staff))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode moduleData = objectMapper
                .readTree(get.getResponse().getContentAsString())
                .path("moduleData");
        org.junit.jupiter.api.Assertions.assertEquals(
                "staff draft", moduleData.path("tna2").path("background").asText());
        org.junit.jupiter.api.Assertions.assertEquals(
                "Bananas", moduleData.path("coreProducts").asText());
    }

    @Test
    void applicantCannotCallAiComplete() throws Exception {
        String applicantId = "sec-ai-" + UUID.randomUUID();
        String appId = "LOI-2026-" + UUID.randomUUID().toString().substring(0, 6);
        String email = "ai-" + UUID.randomUUID() + "@example.com";
        String token = registerApplicant(email, "09176666666", applicantId, appId);

        mockMvc.perform(post("/ai/complete")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("prompt", "hello"))))
                .andExpect(status().isForbidden());
    }
}
