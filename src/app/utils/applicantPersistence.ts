/**
 * Author: Yzrel Jade B. Eborde
 */

import { api } from "../api/client";
import type { Applicant } from "../store/applicantStore";

/** Best-effort sync to Spring Boot persistence (non-blocking). */
export function syncApplicantToBackend(applicant: Applicant): void {
  void api
    .saveApplicantRecord({
      id: applicant.id,
      applicationId: applicant.applicationId,
      enterpriseName: applicant.enterpriseName,
      currentModule: applicant.currentModule,
      moduleData: applicant.moduleData,
      updatedAt: applicant.lastUpdated,
    })
    .catch(() => {
      /* backend optional in demo / offline */
    });
}
