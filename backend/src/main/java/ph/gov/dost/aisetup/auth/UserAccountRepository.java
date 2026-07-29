/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, String> {
    Optional<UserAccount> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Optional<UserAccount> findByApplicantId(String applicantId);

    boolean existsByApplicantId(String applicantId);

    List<UserAccount> findByRoleInOrderByLastNameAscFirstNameAsc(Collection<String> roles);

    long countByRoleAndEnabledTrue(String role);
}
