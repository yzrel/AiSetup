/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.loi;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import ph.gov.dost.aisetup.loi.dto.AddresseeDto;
import ph.gov.dost.aisetup.workflow.SharedJson;

public final class ProvincialOfficeResolver {

    private record OfficeContact(
            String id,
            String name,
            String director,
            String address
    ) {}

    private static final List<OfficeContact> CONTACTS;
    private static final Map<String, String> PROVINCE_TO_OFFICE;

    static {
        JsonNode root = SharedJson.readTree("shared/region12-offices.json");
        List<OfficeContact> contacts = new ArrayList<>();
        JsonNode contactsNode = root.get("contacts");
        if (contactsNode != null && contactsNode.isArray()) {
            for (JsonNode c : contactsNode) {
                contacts.add(new OfficeContact(
                        text(c, "id"),
                        text(c, "name"),
                        text(c, "director"),
                        text(c, "address")));
            }
        }
        if (contacts.isEmpty()) {
            throw new IllegalStateException("shared/region12-offices.json has no contacts");
        }
        CONTACTS = List.copyOf(contacts);
        PROVINCE_TO_OFFICE = SharedJson.stringMap(root.get("provinceToOffice"));
    }

    public static final AddresseeDto REGIONAL_ADDRESSEE = buildRegionalAddressee();

    private ProvincialOfficeResolver() {}

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value != null && value.isTextual() ? value.asText() : "";
    }

    public static AddresseeDto buildRegionalAddressee() {
        AddresseeDto dto = new AddresseeDto();
        dto.setName("ENGR. SAMMY P. MALAWAN");
        dto.setTitle("Regional Director");
        dto.setLines(List.of(
                "ENGR. SAMMY P. MALAWAN",
                "Regional Director",
                "Department of Science and Technology",
                "Regional Office No. XII",
                "Philippine National Halal Laboratory and Science",
                "Center, Brgy. Paraiso, Koronadal City"
        ));
        return dto;
    }

    public static String regionalDirectorSurname() {
        return "Malawan";
    }

    public static ResolvedOffice resolveProvincialOffice(String province) {
        String normalized = normalize(province);
        String officeId = PROVINCE_TO_OFFICE.getOrDefault(normalized, "regional");
        boolean defaulted = !PROVINCE_TO_OFFICE.containsKey(normalized);

        OfficeContact contact = CONTACTS.stream()
                .filter(c -> c.id().equals(officeId))
                .findFirst()
                .orElse(CONTACTS.get(0));

        return new ResolvedOffice(toThruAddressee(contact), defaulted);
    }

    public record ResolvedOffice(AddresseeDto addressee, boolean defaulted) {}

    private static AddresseeDto toThruAddressee(OfficeContact contact) {
        ParsedDirector parsed = parseDirector(contact.director());
        String pstShortName = toPstoShortName(contact.id(), contact.name());

        AddresseeDto dto = new AddresseeDto();
        dto.setName(parsed.nameUpper());
        dto.setTitle(parsed.title());
        dto.setThruLine("THRU: " + parsed.nameUpper());
        dto.setOfficeName(pstShortName);
        dto.setAddressLines(splitAddress(contact.address()));
        dto.setLines(buildThruLines(parsed, pstShortName, contact.address()));
        return dto;
    }

    private static List<String> buildThruLines(ParsedDirector parsed, String officeName, String address) {
        List<String> lines = new ArrayList<>();
        lines.add("THRU: " + parsed.nameUpper());
        lines.add(parsed.title());
        lines.add(officeName);
        lines.addAll(splitAddress(address));
        return lines;
    }

    private static String toPstoShortName(String id, String fullName) {
        return switch (id) {
            case "cotabato" -> "PSTO - Cotabato";
            case "south-cotabato" -> "PSTO - South Cotabato";
            case "sultan-kudarat" -> "PSTO - Sultan Kudarat";
            case "gensan-sarangani" -> "PSTO - General Santos / Sarangani";
            default -> fullName;
        };
    }

    private static List<String> splitAddress(String address) {
        if (address == null || address.isBlank()) {
            return List.of();
        }
        return List.of(address.split(",\\s*"));
    }

    private static ParsedDirector parseDirector(String director) {
        if (director == null || director.isBlank()) {
            return new ParsedDirector("PROVINCIAL DIRECTOR", "Provincial Director");
        }

        String[] parts = director.split(",", 2);
        String namePart = parts[0].trim();
        String title = parts.length > 1 ? parts[1].trim() : "Provincial Director";

        String honorific = "";
        String name = namePart;
        String[] tokens = namePart.split("\\s+", 2);
        if (tokens.length == 2 && isHonorific(tokens[0])) {
            honorific = tokens[0];
            name = tokens[1];
        }

        String upperHonorific = toUpperHonorific(honorific);
        String nameUpper = (upperHonorific + " " + name).trim().toUpperCase(Locale.ROOT);
        return new ParsedDirector(nameUpper, title);
    }

    private static boolean isHonorific(String token) {
        String lower = token.toLowerCase(Locale.ROOT);
        return lower.equals("engr.") || lower.equals("dr.") || lower.equals("mr.") || lower.equals("ms.");
    }

    private static String toUpperHonorific(String honorific) {
        if (honorific == null || honorific.isBlank()) {
            return "";
        }
        return switch (honorific.toLowerCase(Locale.ROOT)) {
            case "engr." -> "ENGR.";
            case "dr." -> "DR.";
            case "mr." -> "MR.";
            case "ms." -> "MS.";
            default -> honorific.toUpperCase(Locale.ROOT);
        };
    }

    private static String normalize(String province) {
        if (province == null) {
            return "";
        }
        return province.trim().toLowerCase(Locale.ROOT);
    }

    private record ParsedDirector(String nameUpper, String title) {}
}
