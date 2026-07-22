/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.otp;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, String> {

    Optional<VerificationCode> findFirstByChannelAndTargetOrderByCreatedAtDesc(
            String channel, String target);
}
