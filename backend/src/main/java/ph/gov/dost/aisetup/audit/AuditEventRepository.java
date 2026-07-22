/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.audit;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEventRepository extends JpaRepository<AuditEvent, String> {}
