/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.tna1.dto;

import java.util.HashMap;
import java.util.Map;

public class Tna1DocumentResponse {

    private Map<String, Object> form = new HashMap<>();
    private Tna1TablesDto tables = new Tna1TablesDto();
    private String generatedAt;
    private boolean aiGenerated;

    public Map<String, Object> getForm() { return form; }
    public void setForm(Map<String, Object> form) { this.form = form; }

    public Tna1TablesDto getTables() { return tables; }
    public void setTables(Tna1TablesDto tables) { this.tables = tables; }

    public String getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(String generatedAt) { this.generatedAt = generatedAt; }

    public boolean isAiGenerated() { return aiGenerated; }
    public void setAiGenerated(boolean aiGenerated) { this.aiGenerated = aiGenerated; }
}
