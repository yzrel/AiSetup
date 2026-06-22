/**
 * Author: Yzrel Jade B. Eborde
 */

import {
  DostProgram,
  getRecommendedPrograms,
  RecommendationContext,
} from "../constants/dostProgramRecommendations";
import { isSetupPrioritySector } from "../constants/setupBrochure";

export interface PrescreeningFormInput {
  businessSector: string;
  businessNature: string;
  yearsOfOperation: string;
  msmeSize: string;
  exportClassification?: string;
}

export interface EligibilityReason {
  ok: boolean;
  text: string;
}

export interface PrescreeningEvaluation {
  qualified: boolean;
  failedReasons: EligibilityReason[];
  recommendedPrograms: DostProgram[];
  recommendedProgramIds: string[];
}

const MANUFACTURING_NATURE =
  "Registered with DTI or SEC for manufacturing";

const MSME_SIZES = new Set(["Micro", "Small", "Medium"]);

const MIN_YEARS_OPERATION = 3;

export function evaluatePrescreening(
  form: PrescreeningFormInput,
): PrescreeningEvaluation {
  const sectorOk = isSetupPrioritySector(form.businessSector);
  const manufacturingOk = form.businessNature === MANUFACTURING_NATURE;
  const years = Number(form.yearsOfOperation);
  const yearsOk =
    form.yearsOfOperation !== "" &&
    !Number.isNaN(years) &&
    years >= MIN_YEARS_OPERATION;
  const msmeOk = MSME_SIZES.has(form.msmeSize);

  const failedReasons: EligibilityReason[] = [
    {
      ok: sectorOk,
      text: sectorOk
        ? "Enterprise is in a SETUP 4.0 priority sector"
        : "Enterprise must fall under a SETUP 4.0 priority sector",
    },
    {
      ok: manufacturingOk,
      text: manufacturingOk
        ? "Registered with DTI or SEC for manufacturing"
        : "SETUP requires DTI/SEC manufacturing registration (startups may explore other DOST programs)",
    },
    {
      ok: yearsOk,
      text: yearsOk
        ? `At least ${MIN_YEARS_OPERATION} years of operation`
        : `Minimum ${MIN_YEARS_OPERATION} years of operation required for SETUP`,
    },
    {
      ok: msmeOk,
      text: msmeOk
        ? "MSME size classified (Micro, Small, or Medium)"
        : "Select MSME size: Micro, Small, or Medium",
    },
  ];

  const qualified =
    sectorOk && manufacturingOk && yearsOk && msmeOk;

  const context: RecommendationContext = {
    businessNature: form.businessNature,
    yearsOfOperation: form.yearsOfOperation,
    exportClassification: form.exportClassification,
  };

  const recommendedPrograms = qualified
    ? []
    : getRecommendedPrograms(form.businessSector, context).slice(0, 5);

  return {
    qualified,
    failedReasons,
    recommendedPrograms,
    recommendedProgramIds: recommendedPrograms.map((p) => p.id),
  };
}
