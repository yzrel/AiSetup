/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.files;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileUploadRepository extends JpaRepository<FileUpload, String> {
    List<FileUpload> findByApplicantIdOrderByCreatedAtDesc(String applicantId);

    boolean existsByApplicantIdAndModuleKey(String applicantId, String moduleKey);
}
