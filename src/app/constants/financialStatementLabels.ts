/**
 * Author: Yzrel Jade B. Eborde
 */

/** SETUP Guidelines 3.0 — micro vs SME historical FS year rules. */

export function isMicroEnterprise(msmeSize?: string | null): boolean {
  return String(msmeSize ?? "")
    .trim()
    .toLowerCase()
    .includes("micro");
}

export function financialStatementUploadLabel(msmeSize?: string | null): string {
  if (isMicroEnterprise(msmeSize)) {
    return "Financial statements (at least 1 year) with notarized sworn statement";
  }
  return "Financial statements (past 3 years) with notarized sworn statement";
}

export function financialStatementBrochureLabel(msmeSize?: string | null): string {
  if (isMicroEnterprise(msmeSize)) {
    return "Financial Statements of at least one (1) year (micro-enterprises).";
  }
  return "Financial Statements of at least the past three (3) years.";
}

/** @deprecated Use financialStatementUploadLabel(msmeSize) — kept for static imports. */
export const FINANCIAL_STATEMENT_UPLOAD_LABEL = financialStatementUploadLabel();

/** @deprecated Use financialStatementBrochureLabel(msmeSize) — kept for static imports. */
export const FINANCIAL_STATEMENT_BROCHURE_LABEL = financialStatementBrochureLabel();
