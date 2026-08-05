/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.notification;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<NotificationEntity, String> {

    @Query("""
            SELECT n FROM NotificationEntity n
            WHERE n.audience = 'applicant' AND n.applicantId = :applicantId
            ORDER BY n.createdAt DESC
            """)
    List<NotificationEntity> findForApplicant(@Param("applicantId") String applicantId);

    @Query("""
            SELECT n FROM NotificationEntity n
            WHERE n.audience = 'staff'
            ORDER BY n.createdAt DESC
            """)
    List<NotificationEntity> findAllStaff();

    @Query("""
            SELECT n FROM NotificationEntity n
            WHERE n.audience = 'staff' AND n.officeId = :officeId
            ORDER BY n.createdAt DESC
            """)
    List<NotificationEntity> findStaffByOffice(@Param("officeId") String officeId);
}
