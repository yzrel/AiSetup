# E2E Rehearsal Log — Register → Close-Out

**Date:** 2026-08-05  
**Environment:** Local API `http://localhost:8080/api` (not production)  
**Method:** Automated local API walkthrough via [`scripts/e2e-register-to-closeout.ps1`](../../scripts/e2e-register-to-closeout.ps1), mirroring the one-case narrative in [LIVE_DEMO_SCRIPT.md](./LIVE_DEMO_SCRIPT.md)  
**Companion:** FE `systemFlow.test.ts` (4/4 pass) as store-level baseline  

---

## Case under test

| Field | Value |
|-------|--------|
| Application ID | `LOI-2026-091308` |
| Applicant ID | `f0d3d2fd-f52e-4b73-bd89-2190bfdd6e8c` |
| Email | `rehearsal.20260805091308@example.com` |
| Enterprise | Koronadal Valley Foods |
| Staff actor | `agent@dost.gov.ph` |
| Server `demoModeEnabled` | `true` (local health) |

**Note:** With server demo mode on, some hard content validators and skip caps are soft. Publish visibility, registration, staff MOA upload, and module progression were still exercised end-to-end. For the official room, keep **workflow demo unlock off** in the UI; rehearse OTP once if SMTP/SMS differ from this local box.

---

## Stage checklist

| Stage | Result | Notes |
|-------|--------|--------|
| Health | PASS | API ok |
| Staff login | PASS | Agent seed |
| Register new client | PASS | Fresh JWT + case binding |
| Cold create at `prescreening` | PASS | |
| Advance → `registration` | PASS | |
| SETUP LOI stored | PASS | Seed-fund / refund language in payload |
| TNA1 submit + staff review → `tna2` | PASS | |
| Client cannot see unpublished TNA2 | PASS | `tna2Document` absent for applicant GET |
| TNA2 publish → `project-proposal` | PASS | Staff publish |
| Proposal → `requirements` | PASS | |
| Requirements approve SETUP → `conduct-rtec` | PASS | |
| RTEC → `approval-letter` | PASS | Staff |
| Approval publish + conforme → `landbank-withdrawal` | PASS | |
| Staff upload `signedMoa` file | PASS | HTTP 200 |
| PDCs + LBP intro published | PASS | |
| LandBank → `procurement-liquidation` | PASS | |
| Procurement → `refund-delinquent` | PASS | |
| Refund → `project-closeout` | PASS | |
| Close-out → `completed` | PASS | `currentModule=completed` |
| Client sees published approval | PASS | |

**Overall:** PASS — registered case reached **completed** on local.

---

## Spot-checks

- Unpublished TNA2 stripped from applicant GET (publish visibility).  
- Staff file upload under `signedMoa` succeeds (LandBank MOA attestation path).  
- Same `applicationId` from register through `completed`.

---

## Blockers found

None critical. No code fixes required from this dry-run.

---

## How to re-run (minimal gate path)

1. Ensure local backend is up (`npm run backend` or `npm run start`).  
2. From repo root:  
   `powershell -ExecutionPolicy Bypass -File scripts/e2e-register-to-closeout.ps1`  
3. Update this log with the new `applicationId` / results.  
4. Optional UI dress rehearsal: follow [LIVE_DEMO_SCRIPT.md](./LIVE_DEMO_SCRIPT.md) with two browsers using the sample enterprise card.

---

## Full-field dummy (second case)

**Date:** 2026-08-05  
**Script:** [`scripts/e2e-full-field-register-to-closeout.ps1`](../../scripts/e2e-full-field-register-to-closeout.ps1)  
**Intent:** Required + important optional fields per module (dense `moduleData`), not gate stubs.

| Field | Value |
|-------|--------|
| Application ID | `LOI-2026-093624` |
| Applicant ID | `9c95b283-8f2d-4e77-9be6-74e3c11c55b8` |
| Email | `fullfield.20260805093607@example.com` |
| Enterprise | Full Field Foods Corp |
| Staff actor | `agent@dost.gov.ph` |
| Server `demoModeEnabled` | `true` |

### What was filled (dense)

| Stage | Full-fill coverage |
|-------|-------------------|
| Register / profile | Name parts, birthday/gender/civilStatus, TIN, DTI, address, sector, turnover, export class, selfie meta |
| Prescreening | Full eligibility + company/product/financial context |
| Enterprise registration | 3× business permit file uploads + FDA LTO for Food Processing |
| LOI | Full additional fields, production plan file, general agreements, SETUP commitment block |
| TNA1 | Broad Form 01 narratives/tables + GA1–6 + plant layout file + staff review + director validate |
| TNA2 | Full Form 02 structure (profile, scope, findings, interventions, team) published |
| Proposal | Full Form 001 narratives/tables, budgetItems×3, risk rows, 4 attachment kinds |
| Requirements | 10 doc uploads (incl. FDA + ECC) + staff review remarks + Approve SETUP |
| RTEC | All 14 compliance IDs + costs + full signatures |
| Approval | Full NOA publish fields + conforme + signed MOA file/meta |
| LandBank | Full LBP intro publish fields, 3 PDCs, tranche1 supplier/equipment/quotations/photos |
| Procurement | documents, line items, liquidation + attachment, staff review, untagged |
| Refund | PDC schedule + SOA/delinquency operational flags |
| Close-out | Terminal/FS/ack files + 2 inventory rows + ownership cert |

### Results

| Check | Result |
|-------|--------|
| `currentModule=completed` | PASS |
| Staff GET `tna1.form.enterpriseBackground` | PASS |
| Staff GET `projectProposal.form.budgetItems` count ≥ 2 | PASS (3) |
| Staff GET RTEC chairperson | PASS |
| Applicant sees published TNA2 | PASS |
| Applicant sees published approval | PASS |
| Close-out inventory rows ≥ 2 | PASS |

**Overall:** PASS — full-field dummy reached **completed** on local.

**Blockers:** None. No code fixes required.

### Re-run full-field

```powershell
powershell -ExecutionPolicy Bypass -File scripts/e2e-full-field-register-to-closeout.ps1
```
