/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.landbank;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LandBankBranchRepository extends JpaRepository<LandBankBranch, String> {

    List<LandBankBranch> findAllByActiveTrueOrderByNameAsc();

    List<LandBankBranch> findAllByOrderByNameAsc();

    Optional<LandBankBranch> findByNameIgnoreCase(String name);

    Optional<LandBankBranch> findFirstByOfficeIdAndActiveTrueOrderByNameAsc(String officeId);
}
