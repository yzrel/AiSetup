/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Loads repo-root shared/*.json copied onto the classpath under {@code shared/}. */
public final class SharedJson {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private SharedJson() {}

    public static JsonNode readTree(String classpathResource) {
        try (InputStream in = SharedJson.class.getClassLoader().getResourceAsStream(classpathResource)) {
            if (in == null) {
                throw new IllegalStateException("Missing classpath resource: " + classpathResource);
            }
            return MAPPER.readTree(in);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read " + classpathResource, e);
        }
    }

    public static List<String> stringList(JsonNode node) {
        List<String> out = new ArrayList<>();
        if (node == null || !node.isArray()) {
            return List.of();
        }
        for (JsonNode item : node) {
            if (item != null && item.isTextual()) {
                out.add(item.asText());
            }
        }
        return Collections.unmodifiableList(out);
    }

    public static Map<String, String> stringMap(JsonNode node) {
        Map<String, String> out = new LinkedHashMap<>();
        if (node == null || !node.isObject()) {
            return Map.of();
        }
        node.fields().forEachRemaining(entry -> {
            if (entry.getValue() != null && entry.getValue().isTextual()) {
                out.put(entry.getKey(), entry.getValue().asText());
            }
        });
        return Collections.unmodifiableMap(out);
    }
}
