/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicantModuleDataRepository
        extends JpaRepository<ApplicantModuleData, ApplicantModuleDataId> {

    List<ApplicantModuleData> findByApplicantIdOrderByModuleKeyAsc(String applicantId);

    /** Bulk load for list views, so {@code findAll} stays one query instead of one per case. */
    List<ApplicantModuleData> findByApplicantIdInOrderByApplicantIdAscModuleKeyAsc(
            Collection<String> applicantIds);

    long countByApplicantId(String applicantId);
}
