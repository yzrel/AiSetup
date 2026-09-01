/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.landbank;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.HashSet;
import java.util.Set;
import ph.gov.dost.aisetup.workflow.SharedJson;

/** Validates PSTO office ids from shared/region12-offices.json. */
public final class LandBankOfficeIds {

    private static final Set<String> KNOWN_OFFICE_IDS;

    static {
        Set<String> ids = new HashSet<>();
        JsonNode root = SharedJson.readTree("shared/region12-offices.json");
        JsonNode contactsNode = root.get("contacts");
        if (contactsNode != null && contactsNode.isArray()) {
            for (JsonNode c : contactsNode) {
                JsonNode idNode = c.get("id");
                if (idNode != null && idNode.isTextual()) {
                    String id = idNode.asText();
                    if (!"regional".equals(id)) {
                        ids.add(id);
                    }
                }
            }
        }
        KNOWN_OFFICE_IDS = Set.copyOf(ids);
    }

    private LandBankOfficeIds() {}

    public static boolean isKnownOfficeId(String officeId) {
        return officeId != null && KNOWN_OFFICE_IDS.contains(officeId);
    }

    public static Set<String> knownOfficeIds() {
        return KNOWN_OFFICE_IDS;
    }
}
