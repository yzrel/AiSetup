/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicantRecordRepository extends JpaRepository<ApplicantRecord, String> {
    Optional<ApplicantRecord> findByApplicationId(String applicationId);
}
