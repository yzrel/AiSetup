# SETUP Forms — Follow-up Backlog

Reference: regional forms pack (`SETUP Forms`, Jul 2026).  
Implemented in this pass: Form 001/002 field deltas, TNA 01 labels, Form 008/009 templates, TNA Form 02 scope layout.  
Registry notes live in [`src/app/constants/setupForms.ts`](../src/app/constants/setupForms.ts).

## Open numbering decisions (do not renumber yet)

| App key | App title | Pack title | Notes |
|---------|-----------|------------|-------|
| Form 003 | Notice of Approval (Annex A-3) | Status Report | Notice of Approval is **not** in the pack |
| Form 010 | Terminal Report | Completion Report | Pack Terminal Report is **Form 013** |

## Workflow gaps (not implemented)

| Pack document | Suggested module / phase | Notes |
|---------------|--------------------------|-------|
| Form 003 Status Report | Monitoring (post fund release) | Expected vs actual outputs, equipment, fund utilization, refund status, employment, markets |
| Form 004 Audited Financial Report | Procurement & Liquidation (within 1 month of commissioning) | Currently upload-only at close-out |
| Form 005 Property Transfer Receipt | Equipment transfer / pull-out | No module |
| Form 006 Inventory of Equipment | Close-out / monitoring | Close-out has partial inventory columns only |
| Form 007 List of Pulled-Out Equipment | Termination / delinquent recovery | No module |
| Form 010 Completion Report | Successful project completion | Distinct from termination and terminal |
| Form 011 Termination/Withdrawal Report | Early exit / withdrawal | Includes final obligation fields |
| Form 012 Refund Performance Report | Portfolio monitoring (province/sector) | Aging of overdue refunds — not per-case PDC UI |
| Form 013 Terminal Report | End-of-project terminal reporting | Pack number; app currently labels Form 010 as Terminal |
| Payment Reminder Letter | Refund & Delinquent | Letter template |
| Computation of Final Obligation (Annex B) | Termination settlement | Formula for pulled-out vs not |
| Proforma MOA – Annex C | MOA signing day | App uses Annex D naming — content parity TBD |
| Sworn Affidavit of No Relatives | Requirements | Upload only; no fillable template |
| Letter Request for Equipment | — | **Corrupt/empty** in pack; cannot use as template |

## Application Requirements Checklist

Already aligned with Step 4 uploads and RTEC Form 002 compliance list. Optional ECC/CNC remains an app-only extra.

## Suggested implementation order (future)

1. Resolve Form 003 / 010 numbering with DOST XII.
2. Form 004 printable AFR at liquidation stage.
3. Form 006 inventory columns aligned to pack (qty, description, amount, property no., date acquired, remarks).
4. Form 003 Status Report for ongoing monitoring.
5. Split close-out into Completion (010) / Termination (011) / Terminal (013) paths.
6. Form 012 portfolio refund performance (staff dashboard).
7. Letters: Payment Reminder, Final Obligation Annex B; MOA Annex C parity.
