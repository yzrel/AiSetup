# aiSETUP Live Demo Script — Register → Close-Out

**Audience:** High officials / DOST XII leadership  
**Narrative:** Register **one new client** and process **that same case** from start to end  
**Duration:** ~35–50 min rehearsal · ~25–40 min live (narrate faster) · 5 min fallback (appendix)  
**Companion docs:** [OFFICIAL_WALKTHROUGH_BRIEF.md](./OFFICIAL_WALKTHROUGH_BRIEF.md) · [E2E_REHEARSAL_LOG.md](./E2E_REHEARSAL_LOG.md) · [WORKFLOW_DIAGRAMS.md](./WORKFLOW_DIAGRAMS.md) · [STAKEHOLDER_SLIDES.md](./STAKEHOLDER_SLIDES.md)

**Do not jump between seed enterprises mid-demo.** One application ID throughout.

---

## Before you present

### 1. Environment (local / staging only for rehearsal)

```bash
# From repo root — starts FE + BE together
npm run start
```

Or separately: `npm run backend` and `npm run dev`.

Open the Vite URL (typically `http://localhost:5173`). Confirm API health (e.g. `http://localhost:8080/api/health`).

**Production:** Only if intentional — real OTP email/SMS and a permanent case. Prefer local/staging for rehearsal.

### 2. Two browser windows

| Window | Role | Purpose |
|--------|------|---------|
| A | Applicant (new registration) | Create and drive the case |
| B | Staff Agent | Review, publish, RTEC, unlock funding |

Use normal + incognito (or two profiles) so both stay logged in.

### 3. Staff login (Window B) — prepare first

| Role | Email | Password (local seed) |
|------|-------|------------------------|
| DOST Agent | `agent@dost.gov.ph` | `admin123` |

Keep agent logged in and ready. Province scope must cover **South Cotabato / Region XII** (sample card below).

### 4. Applicant credentials (Window A) — created live

Before the room (or in Act 1), invent unique values and **write them down**:

| Field | Example (change the digits) |
|-------|-----------------------------|
| Email | `demo.setup.20260805@example.com` |
| Phone | `09171234567` |
| Password | Meet password policy (e.g. `Demo@1234`) |
| Enterprise | `Koronadal Valley Foods` |

### 5. OTP

- If SMTP/SMS are **not** configured and server demo-delivery fallback is on: UI shows amber hint — use OTP **`123456`** for email and SMS.
- If real delivery is configured: use codes from inbox/SMS.
- **Workflow demo mode** (skip gates / unlock modules): keep **OFF** so publish and staff gates look authentic. OTP `123456` is delivery fallback only, not a workflow unlock.

### 6. Demo mode

Leave the amber “demo unlock” **off** during the walkthrough. Only turn on if a hard blocker would kill the room — then say so briefly.

---

## Sample enterprise card (use every act)

Copy these into forms so you do not invent data live.

| Field | Value |
|-------|--------|
| Applicant name | Juan Dela Cruz |
| Designation | Proprietor / Owner |
| Enterprise | Koronadal Valley Foods |
| Contact | 09171234567 |
| Email | *(your Act 1 email)* |
| Region | Region XII (SOCCSKSARGEN) |
| Province | South Cotabato |
| Address / City | Koronadal City |
| Zip | 9506 |
| Sector | Food Processing |
| Business nature | Registered with DTI or SEC for manufacturing |
| Years of operation | 5 |
| MSME size | Small |
| Date established | 2019-01-15 |
| TIN | 123-456-789-000 |
| Registration | DTI · `DTI-12-9998887` |
| Products | Dried mangoes, banana chips |
| Project | Vacuum packaging line to raise capacity and reduce spoilage |
| Expected outcome | Increase production capacity by 40% |
| Budget | 2000000 / ₱2,000,000 |
| Timeline | 18 months |

**Prescreen must qualify** with the sector / manufacturing / years / MSME values above.

---

## Live narrative — same case throughout

```mermaid
flowchart LR
  Reg[Register_OTP] --> Pre[Qualify]
  Pre --> Ent[Enterprise_LOI]
  Ent --> Tna[TNA1_TNA2]
  Tna --> Prop[Proposal_Reqs]
  Prop --> Rtec[RTEC_Approval]
  Rtec --> Fund[LandBank_to_CloseOut]
```

---

## Act 1 — Register a new client (~3 min)

**Window A** — Landing → **Register**

1. Personal info → email + phone OTP → company basics → privacy accept.  
2. On success: log in if needed; open **Dashboard**.  
3. **Write down** application ID `LOI-YYYY-######`.

**Say:**  
> “We start with a real registration — not a pre-staged account. This ID is the case we will carry all the way to project close-out.”

**Show:** Sidebar locks on future modules; current step Pre-Screening.

---

## Act 2 — Qualify → Enterprise registration → SETUP LOI (~5 min)

**Window A — Pre-Screening**

Fill the sample card (Food Processing, DTI/SEC manufacturing, 5 years, Small). Submit → **qualified** → advances to Registration.

**Window A — Enterprise Registration**

Complete enterprise profile fields from the sample card. Submit → Letter of Intent.

**Window A — Letter of Intent**

Generate/submit SETUP LOI (template fallback is fine if AI is offline).

**Show:** Body mentions **seed fund / refund** commitment (qualified SETUP path — not a program LOI).

**Say:**  
> “Because this enterprise qualifies for SETUP, the LOI includes seed-fund terms. Unqualified applicants get a program referral LOI instead — we are on the full SETUP track.”

Advance to TNA 1.

---

## Act 3 — TNA 1 submit + staff review (~5 min)

**Window A — TNA 1**

Fill required Form 01 fields from the sample card (enterprise, contact, sector, commodity, employees, production problems, process flow, undertaking, prepared date, uploads as required). Submit.

**Window B — Agent**

1. Open **Clients**; find **Koronadal Valley Foods** / the `LOI-…` ID.  
2. Select that client in the staff client bar.  
3. Open **TNA 1** → complete staff review / approve → director validate if the UI requires it.

**Say:**  
> “Staff verification is on the same case. The applicant submitted; DOST confirms the assessment before the technical report.”

---

## Act 4 — TNA 2 publish gate (~4 min)

**Window B — TNA 2 Technical Report**

Generate (AI or template) → edit lightly if needed → **Publish**.

**Say:**  
> “Until we publish, the client does not get the official technical report. Publish is the handoff.”

**Window A — TNA 2**

Refresh / reopen. Show report readable; note notification if present. Proceed toward Project Proposal.

---

## Act 5 — Project proposal → requirements (~6 min)

**Window A — Project Proposal (Form 001)**

Minimal valid form: title, proponent, amount requested (₱2,000,000), costs, vicinity map + plant layout attachments (small PDF/PNG placeholders). Submit → Requirements.

**Window A — Submit Requirements**

Upload required documents (placeholders OK). Submit for staff review.

**Window B — Requirements**

Verify documents → **Approve** → route **SETUP** (not MPEX).

**Say:**  
> “Proposal comes first, then documentary requirements. Approval routes this case to RTEC for SETUP funding — MPEX would park the case outside the seed-fund path.”

---

## Act 6 — RTEC (staff-only) (~4 min)

**Window A — Dashboard**

**Show:** Status **Under DOST Review**; **no RTEC** in applicant sidebar.

**Window B — Conduct of RTEC**

Complete Form 002: compliance items, recommendation, chairperson signature. Submit → advance to Approval Letter.

**Say:**  
> “RTEC is internal. The cooperator waits; DOST evaluates the proposal on the same case record.”

---

## Act 7 — Approval publish → conforme (~3 min)

**Window B — Approval Letter**

Draft Notice of Approval → **Publish**.

**Window A — Approval Letter**

Acknowledge conforme (type full name).

**Say:**  
> “Another publish gate: the Notice is official only after staff publish; the client’s conforme is recorded before MOA and fund release.”

Case advances toward LandBank; applicant may see waiting for MOA/PDCs.

---

## Act 8 — Unlock LandBank → procurement → refund → close-out (~10 min)

**Window B (unlock sequence)**

1. Upload **signed MOA** (staff file).  
2. Record **PDCs** for disbursement.  
3. **LandBank & Withdrawal** — publish **Letter of Introduction to LBP**.

**Window A — LandBank & Withdrawal**

Complete account snapshot + 1st tranche minimal docs; submit.

**Window A — Procurement & Liquidation**

Minimal valid submit.

**Window A — Refund & Delinquent**

Complete monitoring / PDC schedule as required; submit → Close-Out.

**Window A — Project Close-Out**

Upload terminal report (Form 010), audited FS; complete Form 006 inventory and Form 005 Property Transfer Receipt (sync, preview/print, signed scan); confirm Certificate of Ownership / IRP. Submit.

**Show:** Dashboard → **Completed**; application ID unchanged from Act 1.

**Say:**  
> “Same registration, same case ID — from OTP to terminal report. Applicants enter data; DOST reviews, publishes, and unlocks each gate.”

---

## Staff handoff checklist (same `LOI-…`)

- [ ] Client appears under agent caseload (Region XII / South Cotabato)  
- [ ] TNA1 staff review (+ director validate if required)  
- [ ] TNA2 **published**  
- [ ] Requirements **approved** + route **SETUP**  
- [ ] RTEC submitted  
- [ ] Approval letter **published**  
- [ ] Client conforme done  
- [ ] Signed MOA uploaded (staff)  
- [ ] PDCs recorded  
- [ ] LBP introduction **published**  
- [ ] Case reaches **completed**

---

## Spot-checks to narrate

| Moment | What to show |
|--------|----------------|
| After register | Future modules locked |
| Before TNA2 publish | Client cannot treat report as official |
| During RTEC | Applicant dashboard wait; no RTEC nav item |
| Before approval publish | Conforme blocked |
| Before MOA/PDCs/LBP | LandBank waiting / locked |

---

## What NOT to show (unless asked)

| Topic | Why |
|-------|-----|
| Seed-account hopping | Breaks “one new client” story |
| Login / OTP failures | Rehearse OTP the day before |
| Backend / H2 internals | Too technical |
| Empty AI without backend | Use template fallback or skip Generate |
| MPEX / program LOI | Mention in one sentence only if asked |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| OTP not arriving | Use **`123456`** when amber demo-delivery hint shows |
| Staff cannot find client | Confirm province South Cotabato; refresh Clients; check agent login |
| Modules locked | Complete prior submit/publish; do not enable demo unlock unless emergency |
| AI generate fails | Continue with template / local draft |
| LandBank blocked | Staff must upload signed MOA file + PDCs + publish LBP intro |
| Wrong client in staff UI | Re-select application ID in staff client bar |

---

## Rehearsal checklist

- [ ] Local FE + BE running (`npm run start`)  
- [ ] `/api/health` OK  
- [ ] Agent login verified  
- [ ] Fresh email/phone prepared; OTP path verified once  
- [ ] Sample card printed or on second screen  
- [ ] Demo unlock **off**  
- [ ] [E2E_REHEARSAL_LOG.md](./E2E_REHEARSAL_LOG.md) updated after dry-run  
- [ ] Brief + slides note match this narrative  

---

## Appendix A — 5-minute fallback (seed accounts)

Use **only** if time is cut and you cannot finish a live registration. Prefer still opening with “normally we register live…” then jump to a seed at TNA2.

| Min | Action |
|-----|--------|
| 0:00 | Applicant `juan@abcfood.com` / `Demo@1234` — dashboard stepper |
| 0:30 | Staff `agent@dost.gov.ph` — select ABC Food |
| 1:00 | Staff TNA2 → **Publish** |
| 2:00 | Applicant TNA2 unlocked + notification |
| 3:00 | Staff RTEC or Requirements on another seed (one handoff only) |
| 4:00 | Publish-gate pattern + close |

| Seed | Email | Password | Stage hint |
|------|-------|----------|------------|
| ABC Food Processing | `juan@abcfood.com` | `Demo@1234` | TNA2 publish |
| Northern Star Textiles | `ana@northernstar.com` | `Demo@1234` | Requirements |
| Tech Innovations Inc. | `maria@techinno.com` | `Demo@1234` | RTEC |
| Green Valley Foods | `carlos@greenvalley.com` | `Demo@1234` | Approval / late |

---

## Suggested screenshots

Capture during rehearsal under `docs/presentation/screenshots/` if useful:

1. Register + OTP  
2. New dashboard + `LOI-…`  
3. Locked sidebar  
4. SETUP LOI (seed-fund language)  
5. Staff Clients → select live case  
6. TNA2 publish → applicant view  
7. Requirements approve + SETUP  
8. Applicant “Under DOST Review” during RTEC  
9. Approval publish + conforme  
10. Completed dashboard  
