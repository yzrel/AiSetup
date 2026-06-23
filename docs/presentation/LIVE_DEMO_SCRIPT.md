# aiSETUP Live Demo Script

**Audience:** Stakeholders / leadership  
**Duration:** 15–20 minutes (full) · 5 minutes (fallback)  
**Companion docs:** [STAKEHOLDER_SLIDES.md](./STAKEHOLDER_SLIDES.md) · [WORKFLOW_DIAGRAMS.md](./WORKFLOW_DIAGRAMS.md)

---

## Before you present

### 1. Start the application

```bash
# Terminal 1 — frontend
npm run dev

# Terminal 2 — backend (only if showing AI document generation)
cd backend && mvn spring-boot:run
```

Open the app URL shown by Vite (typically `http://localhost:5173`).

### 2. Prepare two browser contexts

Use **two windows** (or one normal + one incognito) so you can switch between applicant and staff without logging out constantly.

| Window | Role | Purpose |
|--------|------|---------|
| A | Applicant | Enterprise view |
| B | Staff (Agent) | DOST provincial view |

### 3. Login credentials

**Staff (Window B)**

| Role | Email | Password |
|------|-------|----------|
| DOST Agent | `agent@dost.gov.ph` | `admin123` |
| DOST Admin | `admin@dost.gov.ph` | `admin123` |

Use **Agent** for provincial-scoped demo (recommended).

**Applicant (Window A)** — all demo passwords: `Demo@1234`

| Enterprise | Email | Best for demo act |
|------------|-------|-------------------|
| ABC Food Processing | `juan@abcfood.com` | TNA2 publish (staff) + applicant read |
| Tech Innovations Inc. | `maria@techinno.com` | Conduct of RTEC (staff-only) |
| Northern Star Textiles | `ana@northernstar.com` | Requirements staff review |
| Green Valley Foods | `carlos@greenvalley.com` | Approval letter / late stage |
| Sunrise Agri-Products | `pedro@sunrise.com` | Early registration (optional) |

**Recommended primary pair:** `juan@abcfood.com` (applicant) + `agent@dost.gov.ph` (staff) — ABC Food is at TNA2 with an unpublished report ready to publish.

---

## Full demo — 9 acts (~15–20 min)

### Act 0 — Opening (1 min)

**Window A** — Log in as `juan@abcfood.com`

**Say:**  
> “This is what an MSME owner sees when they log in. One application ID, one dashboard, every SETUP step in order.”

**Show:** Dashboard → application ID `LOI-2024-000145`, progress stepper, current step **TNA 2**.

**Do not show yet:** Locked sidebar items (mention they exist).

---

### Act 1 — Applicant visibility (2 min)

**Window A** — Stay on Dashboard

**Show:**
- Completed steps (Pre-Screening through TNA 1)
- Current step highlighted
- Upcoming steps grayed / locked
- Status text (e.g. In Progress)

**Say:**  
> “The applicant always knows where they are. They cannot skip ahead — each stage unlocks only after DOST completes the previous gate.”

**Navigate:** Sidebar → **TNA 1 Assessment** (briefly) to show submitted Form 01, then **TNA 2 Technical Report**.

**Say:**  
> “TNA 2 is the first clear staff–client handoff. The technical report exists, but the client cannot fully proceed until provincial DOST publishes it.”

---

### Act 2 — Staff selects a client (2 min)

**Window B** — Log in as `agent@dost.gov.ph`

**Show:**
- **Staff client bar** at top — select **ABC Food Processing**
- **Clients** hub (sidebar) — list with stages and “Needs review” indicators

**Say:**  
> “Provincial agents work on a caseload. They pick which enterprise they’re handling; every form and decision applies to that selected client.”

**Optional:** Open **Client case detail** for ABC Food to show assessment task checklist.

---

### Act 3 — TNA2 publish gate (3 min)

**Window B** — Navigate to **TNA 2 Technical Report** (with ABC Food selected)

**Show:**
- Generated technical report content (DOST TNA Form 02)
- **Publish** action (staff workflow)

**Click:** Publish

**Say:**  
> “When the agent publishes, this becomes the official technical report. That single action unlocks the client’s next steps.”

**Window A** — Refresh or revisit **TNA 2**

**Show:** Report now readable; notification bell may show “TNA2 technical report published”

**Say:**  
> “Same case record, two views. Staff published; the applicant immediately sees the result.”

---

### Act 4 — Requirements handoff (3 min)

**Switch client for variety (optional):**

**Window B** — Select **Northern Star Textiles** (`ana@northernstar.com`)  
**Window A** — Log in as `ana@northernstar.com`

**Show (Window A):** **Submit Requirements** — uploaded documents, submit state

**Show (Window B):** **Submit Requirements** — staff verification panel, per-document OK/flagged, **Approve** or **Request revision**, routing **SETUP** vs **MPEX**

**Say:**  
> “The client uploads; staff verify each document. Approval routes the case to project proposal — or to MPEX if capacity building is the right path instead of SETUP funding.”

**If time:** Approve requirements and show applicant notification.

---

### Act 5 — RTEC staff-only (2 min)

**Window B** — Select **Tech Innovations Inc.** → **Conduct of RTEC**

**Say:**  
> “RTEC is internal to DOST. The applicant never sees this module — their dashboard shows ‘Under DOST Review’ while we evaluate the proposal.”

**Show:** RTEC report form (SETUP Form 002 · Annex A-2), compliance/evaluation fields, submit to advance case

**Window A** — `maria@techinno.com` dashboard (optional contrast)

**Show:** No RTEC in sidebar; waiting state on dashboard

---

### Act 6 — Approval letter and conforme (2 min)

**Window B** — Select **Green Valley Foods** → **Approval Letter**

**Show:** Notice of Approval draft (SETUP Form 003 · Annex A-3), **Publish** action

**Say:**  
> “The Notice of Approval is another publish gate. Until we publish, the client cannot acknowledge conforme.”

**Window A** — `carlos@greenvalley.com` → **Approval Letter** (after publish if demonstrated)

**Show:** Conforme / acknowledgment for client

**Say:**  
> “The client’s legal acknowledgment is recorded on the same case before we move to MOA signing.”

---

### Act 7 — MOA signing and LandBank (2 min)

**Window B** — **Project Information Sheet** (Green Valley or advance ABC Food as staff)

**Show:**
- MOA signing day panel
- Upload signed MOA, Pre-Implementation PIS (Form 008)
- Mark signing day complete

**Say:**  
> “Signing day is a staff-led event. Completing it unlocks LandBank coordination.”

**Navigate:** **LandBank & Withdrawal**

**Show:** Publish **Letter of Introduction to LandBank** → client can then upload passbook / withdrawal documents

**Say:**  
> “Fund release follows the same pattern: staff publish an official letter; the cooperator opens the account and submits proof.”

---

### Act 8 — Notifications (1 min)

**Either window** — Click **notification bell**

**Show:** Mix of staff and applicant alerts from earlier actions

**Say:**  
> “Both sides get in-app notifications scoped to their role. In production this can extend to email or SMS — the workflow logic is the same.”

**Optional:** Click a notification to jump to the relevant module.

---

### Act 9 — Close (1 min)

**Say:**  
> “From pre-screening to terminal report, one shared case. Applicants drive data entry; DOST staff review, publish official documents, and monitor compliance. aiSETUP makes that relationship visible and auditable.”

Return to **Dashboard** or slide deck Q&A.

---

## 5-minute fallback path

Use when time is cut. Single applicant + agent pair: **ABC Food Processing**.

| Min | Action |
|-----|--------|
| 0:00 | Applicant dashboard — progress stepper (30 sec) |
| 0:30 | Staff Clients hub — select ABC Food (30 sec) |
| 1:00 | Staff TNA2 → **Publish** (1 min) |
| 2:00 | Applicant TNA2 — show unlocked report + notification (1 min) |
| 3:00 | Staff Requirements on Northern Star OR show RTEC staff-only on Tech Innovations (1 min) |
| 4:00 | Explain handoff pattern: submit → review/publish → proceed (30 sec) |
| 4:30 | Notification bell both sides (30 sec) |

**One sentence summary:**  
> “One case, two portals, publish gates that mirror how SETUP actually works on paper — but trackable in real time.”

---

## What NOT to show (unless asked)

| Topic | Why avoid in stakeholder demo |
|-------|------------------------------|
| Login validation errors | Breaks narrative flow |
| Locked modules during early demo | Use seed accounts at the right stage (see credentials table) |
| Backend / H2 / API details | Too technical unless IT stakeholders |
| `clientPortalStore` deprecated flow | Superseded by main pipeline |
| Empty AI generation without backend running | Start backend first or skip AI button |
| Account blocked state | Edge case |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Modules locked | Use a seed account at the correct `currentModule`, or advance workflow as staff |
| Staff sees no clients | Use `agent@dost.gov.ph`; check provincial scope matches seed data (Region XII) |
| AI generate fails | Start Spring Boot backend on port 8080 |
| Wrong client data | Confirm staff client bar shows intended enterprise |

---

## Suggested screenshot list for slides

Capture these during rehearsal:

1. Login page — dual portal tabs  
2. Applicant dashboard — progress stepper  
3. Applicant sidebar — locked future modules  
4. Staff Clients hub — case list  
5. Staff client bar — selected enterprise  
6. TNA2 staff publish button  
7. TNA2 applicant read-only → published state  
8. Requirements staff verification panel  
9. Conduct of RTEC (staff-only)  
10. Approval letter publish + applicant conforme  
11. LandBank LBP introduction publish gate  
12. Notification bell — both roles  
13. Demo mode amber banner  

Store under `docs/presentation/screenshots/` if you capture them during rehearsal.

---

## Rehearsal checklist

- [ ] Frontend running (`npm run dev`)
- [ ] Backend running if showing AI generate
- [ ] Demo mode tested in both windows
- [ ] Agent + ABC Food logins verified
- [ ] Backup logins ready (Northern Star, Green Valley, Tech Innovations)
- [ ] Slides loaded through Slide 13 (Live Demo Preview)
- [ ] Diagrams exported from WORKFLOW_DIAGRAMS.md if embedding in deck
- [ ] Presenter notes: four phases memorized (Engagement → Assessment → Approval → Implementation)
