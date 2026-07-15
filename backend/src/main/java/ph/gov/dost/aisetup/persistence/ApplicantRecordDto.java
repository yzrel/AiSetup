/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import java.util.Map;

public record ApplicantRecordDto(
        String id,
        String applicationId,
        String enterpriseName,
        String currentModule,
        Map<String, Object> moduleData,
        Map<String, Object> profile,
        String updatedAt) {}
