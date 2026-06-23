# aiSETUP Workflow Diagrams

Mermaid diagrams for stakeholder slides, documentation, or export to PNG/SVG via [Mermaid Live Editor](https://mermaid.live).

---

## 1. Swimlane — Client vs Staff (Full Pipeline)

Shows parallel responsibilities across all workflow modules. **Solid arrows** = primary action; **dashed** = wait state.

```mermaid
flowchart TB
  subgraph clientLane [Applicant_Client]
    C1[PreScreening]
    C2[Registration]
    C3[LetterOfIntent]
    C4[Submit_TNA1]
    C5[Wait_TNA1_Review]
    C6[Read_TNA2_After_Publish]
    C7[Upload_Requirements]
    C8[Wait_Requirements_Review]
    C9[Submit_ProjectProposal]
    C10[Wait_Under_DOST_Review]
    C11[Acknowledge_Approval_Conforme]
    C12[Wait_MOA_Signing]
    C13[LandBank_Account_and_Uploads]
    C14[Procurement_Docs]
    C15[Refund_PDCs]
    C16[Terminal_Report]
  end

  subgraph staffLane [DOST_Staff]
    S1[View_Prescreening]
    S2[Monitor_Registration]
    S3[View_LOI]
    S4[Review_TNA1]
    S5[Generate_Publish_TNA2]
    S6[Verify_Requirements]
    S7[Route_SETUP_or_MPEX]
    S8[Conduct_RTEC]
    S9[Publish_Approval_Letter]
    S10[MOA_Signing_Day]
    S11[Publish_LBP_Introduction]
    S12[Verify_Procurement]
    S13[Monitor_Refund_Delinquency]
    S14[Complete_CloseOut]
  end

  C1 --> C2 --> C3 --> C4 --> C5
  C5 -.->|unlocked| C6
  C6 --> C7 --> C8
  C8 -.->|approved| C9 --> C10
  C10 -.->|RTEC_and_approval| C11 --> C12
  C12 -.->|signing_complete| C13 --> C14 --> C15 --> C16

  S4 --> S5
  S6 --> S7
  S8 --> S9
  S10 --> S11
  S12 --> S13 --> S14

  C4 -->|submit| S4
  S5 -->|publish| C6
  C7 -->|submit| S6
  S7 -->|SETUP_route| C9
  C9 -->|submit| S8
  S9 -->|publish| C11
  S10 -->|complete| C13
  S11 -->|publish| C13
```

### Module-to-lane mapping

| Module | Client lane | Staff lane |
|--------|-------------|------------|
| Pre-Screening | Fill questionnaire | Optional monitoring |
| Registration | Complete profile | Review in Clients hub |
| Letter of Intent | Draft and submit | View case |
| TNA 1 | Submit Form 01 | Review / approve / resubmit |
| TNA 2 | Read after publish | Generate and publish Form 02 |
| Requirements | Upload docs | Verify, approve, route |
| Project Proposal | Submit Form 001 | — |
| Conduct of RTEC | *No access* | Form 002 evaluation |
| Approval Letter | Conforme after publish | Publish Form 003 |
| PIS / MOA | Wait, then ongoing filings | Signing day, uploads |
| LandBank | Account and withdrawal docs | Publish LBP intro |
| Procurement | Upload receipts | Verify, untagging |
| Refund | Submit PDCs | Monitor delinquency |
| Close-Out | Terminal report | Review and complete |

---

## 2. Handoff Gates — Decision Points

Each gate blocks the client until staff action (or client acknowledgment) completes.

```mermaid
flowchart TD
  Start([Case_created]) --> PS{PreScreening_qualified}
  PS -->|No| EndMPEX[End_or_other_programs]
  PS -->|Yes| REG[Registration_and_LOI]

  REG --> TNA1S[TNA1_submitted]
  TNA1S --> G1{Staff_TNA1_review}
  G1 -->|Resubmission| TNA1S
  G1 -->|Approved| TNA2P{TNA2_published}
  TNA2P -->|No| WaitTNA2[Client_blocked]
  TNA2P -->|Yes| REQ[Requirements_uploaded]

  REQ --> G2{Staff_requirements_decision}
  G2 -->|Revision| REQ
  G2 -->|Approved| G3{Route_SETUP_or_MPEX}
  G3 -->|MPEX| MPEXTrack[Client_on_MPEX_track]
  G3 -->|SETUP| PP[Project_Proposal_submitted]

  PP --> RTEC[Staff_RTEC_complete]
  RTEC --> G4{Approval_letter_published}
  G4 -->|No| WaitAL[Client_Under_DOST_Review]
  G4 -->|Yes| CONF{Client_conforme}
  CONF -->|No| WaitCONF[Blocked_at_approval]
  CONF -->|Yes| MOA{MOA_signing_day_complete}

  MOA -->|No| WaitMOA[Client_waits]
  MOA -->|Yes| G5{LBP_intro_published}
  G5 -->|No| WaitLBP[LandBank_locked]
  G5 -->|Yes| LB[LandBank_submissions]

  LB --> PROC[Procurement_verified]
  PROC --> REF[Refund_monitoring]
  REF --> CLOSE[Close_out_complete]
  CLOSE --> Done([Project_completed])
```

### Gate summary table

| Gate | Blocking condition | Who releases |
|------|-------------------|--------------|
| TNA1 review | `tna1.submitted` without staff approval | DOST Agent |
| TNA2 publish | `tna2Document.published === false` | DOST Agent |
| Requirements | `staffDecision` pending | DOST Agent |
| SETUP vs MPEX | `routingDecision` not set | DOST Agent |
| RTEC | `currentModule === conduct-rtec` | DOST Agent (client sees “Under Review”) |
| Approval letter | `approvalLetter.published === false` | DOST Agent |
| Conforme | Client has not acknowledged | Applicant |
| MOA signing | `signingDayComplete === false` | DOST Agent |
| LBP introduction | `landBank.introductionLetter.published === false` | DOST Agent |
| Procurement | `staffReview.verified` pending | DOST Agent |

---

## 3. Provincial Scoping — Who Sees Which Clients

```mermaid
flowchart TB
  subgraph regional [Regional_Scope]
    Admin[DOST_Admin]
    AllClients[All_Regional_Applicants]
  end

  subgraph provincial [Provincial_Scope]
    AgentA[Agent_South_Cotabato]
    AgentB[Agent_Sarangani]
    ClientsA[ABC_Food_Processing]
    ClientsB[Northern_Star_Textiles]
  end

  Admin --> AllClients
  AgentA --> ClientsA
  AgentB --> ClientsB

  AllClients --> AgentA
  AllClients --> AgentB

  NotifA[Notifications_officeId_match]
  NotifB[Notifications_officeId_match]

  ClientsA --> NotifA --> AgentA
  ClientsB --> NotifB --> AgentB
```

### Rules

| Role | Client visibility | Notifications |
|------|-------------------|---------------|
| **Applicant** | Own record only (`user.id` / email) | Applicant audience, own `applicantId` |
| **Agent** | Applicants in `assignedProvinces` | Staff audience, matching `officeId` |
| **Admin** | All applicants in region | Staff audience, all offices |

**Staff client picker:** Agent selects active client via `StaffClientBar` / Clients hub. All module actions apply to the selected case until switched.

**Demo seed enterprises (Region XII):**

| Enterprise | Province | Demo stage |
|------------|----------|------------|
| ABC Food Processing | South Cotabato | TNA 2 (unpublished report — good for publish demo) |
| Tech Innovations Inc. | General Santos City | Conduct of RTEC |
| Sunrise Agri-Products | Sultan Kudarat | Registration (early stage) |
| Northern Star Textiles | Sarangani | Requirements (awaiting staff review) |
| Green Valley Foods | South Cotabato | Approval letter (late stage) |

---

## 4. Notification Flow — Key Events

Sequence of in-app alerts between applicant and staff (no email required in demo).

```mermaid
sequenceDiagram
  participant Client as Applicant
  participant System as aiSETUP
  participant Staff as DOST_Agent

  Note over Client,Staff: TNA 1 cycle
  Client->>System: Submit TNA Form 01
  System->>Staff: TNA1 awaiting review
  System->>Client: Submission received
  Staff->>System: Approve TNA1
  System->>Client: TNA1 reviewed — proceed

  Note over Client,Staff: TNA 2 cycle
  Staff->>System: Generate and publish TNA2
  System->>Client: TNA2 technical report published

  Note over Client,Staff: Requirements cycle
  Client->>System: Submit all requirements
  System->>Staff: Requirements awaiting review
  System->>Client: Documents with provincial office
  Staff->>System: Approve or request revision
  System->>Client: Approved or revisions requested

  Note over Client,Staff: Approval cycle
  Staff->>System: Publish Notice of Approval
  System->>Client: Approval letter available — acknowledge conforme

  Note over Client,Staff: MOA and LandBank
  Staff->>System: Upload MOA, complete signing day
  System->>Client: MOA signing complete
  Staff->>System: Publish LBP introduction
  System->>Client: Open LandBank account
  Client->>System: Submit LandBank documents
  System->>Staff: LandBank submission complete

  Note over Client,Staff: Post-award
  Client->>System: Complete procurement uploads
  System->>Staff: Procurement ready for verification
  Staff->>System: Complete refund monitoring
  System->>Client: Refund monitoring complete
```

### Notification catalog

| Event | Staff alert | Applicant alert |
|-------|-------------|-----------------|
| Pre-screening result | — | Passed / not qualified |
| TNA1 submitted | Awaiting review | Submission received |
| TNA1 reviewed | — | Proceed to next step |
| TNA1 resubmission | — | Revisions requested |
| TNA2 published | — | Report available |
| Requirements submitted | Awaiting review | With provincial office |
| Requirements approved | — | Proceed |
| Requirements revision | — | Flagged documents |
| Project proposal submitted | Awaiting RTEC | Under DOST review |
| Approval letter published | — | Acknowledge conforme |
| MOA uploaded | — | Signing materials ready |
| Signing day complete | — | LandBank unlocked |
| LBP intro published | — | Open account at LBP |
| LandBank complete | Review submission | — |
| Procurement complete | Verify docs | — |
| Refund monitoring complete | — | Monitoring closed |

---

## 5. Four-Phase Overview (compact)

Use on title or summary slides.

```mermaid
flowchart LR
  subgraph phase1 [Phase1_Engagement]
    PS[PreScreening]
    REG[Registration]
    LOI[LetterOfIntent]
  end
  subgraph phase2 [Phase2_Assessment]
    TNA1[TNA1_ClientSubmit]
    TNA2[TNA2_StaffPublish]
    REQ[Requirements_Upload]
    STAFF1[Staff_VerifyAndRoute]
  end
  subgraph phase3 [Phase3_Approval]
    PP[ProjectProposal]
    RTEC[RTEC_StaffOnly]
    AL[ApprovalLetter_Publish]
  end
  subgraph phase4 [Phase4_Implementation]
    MOA[MOA_SigningDay]
    LBP[LandBank_FundRelease]
    PROC[Procurement_Monitoring]
    CLOSE[ProjectCloseOut]
  end
  phase1 --> phase2 --> phase3 --> phase4
```

---

## Export tips

1. Paste any diagram into [mermaid.live](https://mermaid.live) and export PNG/SVG for slides.
2. For PowerPoint: use **Insert → Pictures** with exported PNG, or the Mermaid add-in if available.
3. Keep stakeholder slides to **one diagram per slide** — split swimlane if it feels crowded.
4. Use DOST brand colors manually after export if required by communications office.
