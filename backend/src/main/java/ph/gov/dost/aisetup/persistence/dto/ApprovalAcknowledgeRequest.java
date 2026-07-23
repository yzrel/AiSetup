/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Client conforme acknowledgment of a published Notice of Approval. */
public class ApprovalAcknowledgeRequest {

    @NotBlank
    @Size(max = 200)
    private String conformeSignedName;

    public String getConformeSignedName() {
        return conformeSignedName;
    }

    public void setConformeSignedName(String conformeSignedName) {
        this.conformeSignedName = conformeSignedName;
    }
}
