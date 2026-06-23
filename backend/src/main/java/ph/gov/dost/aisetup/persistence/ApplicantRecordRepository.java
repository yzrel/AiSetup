/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicantRecordRepository extends JpaRepository<ApplicantRecord, String> {
}
