/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicantModuleDataRepository
        extends JpaRepository<ApplicantModuleData, ApplicantModuleDataId> {

    List<ApplicantModuleData> findByApplicantIdOrderByModuleKeyAsc(String applicantId);

    long countByApplicantId(String applicantId);
}
