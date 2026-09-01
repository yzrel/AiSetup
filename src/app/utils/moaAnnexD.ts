/**
 * Author: Yzrel Jade B. Eborde
 *
 * Approval-letter routing helpers (GIA EXECOM threshold).
 * Proforma MOA print/preview now lives in moaAnnexC.ts (Annex C Word pack).
 * Legacy moaAnnexD moduleData keys remain readable for projected FS duration.
 */

import type { ApprovalLetterForm } from "../api/types";

export function needsGiaExcomRouting(approvedAmountRaw: string): boolean {
  const n = parseFloat(String(approvedAmountRaw).replace(/[^\d.]/g, ""));
  return n > 2_000_000;
}

export function getApprovalRoutingNote(form: ApprovalLetterForm): string | null {
  if (!needsGiaExcomRouting(form.approvedAmount)) return null;
  return "Approved amount exceeds ₱2,000,000 — route to DOST-GIA EXECOM for consideration per SETUP Guidelines.";
}
