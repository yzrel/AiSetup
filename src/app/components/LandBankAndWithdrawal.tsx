/**
 * Author: Yzrel Jade B. Eborde
 */

import React, { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Banknote,
  Building2,
  CheckCircle,
  Download,
  FileText,
  RefreshCw,
  Save,
  Send,
  Shield,
  User,
} from "lucide-react";
import { AuthUser, authStore } from "../store/authStore";
import { applicantStore } from "../store/applicantStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { ModuleWorkflowLayout } from "./ModuleWorkflowLayout";
import { DOST_BLUE, MODULE_SHELL } from "./moduleTheme";
import { SignedDocumentUpload } from "./SignedDocumentUpload";
import { LbpIntroductionLetterEditor } from "./LbpIntroductionLetterEditor";
import { LbpIntroductionLetterPreview } from "./LbpIntroductionLetterPreview";
import { DocumentDeliveryPanel } from "./DocumentDeliveryPanel";
import type { LbpIntroductionLetterForm, ModuleDocument } from "../api/types";
import { appendStaffAssessment } from "../utils/clientAssessment";
import {
  notifyLandBankComplete,
  notifyLbpIntroductionPublished,
} from "../utils/notificationHelpers";
import { hasApprovalLetterAcknowledged } from "../utils/projectInformationSheet";
import {
  downloadLbpIntroductionPdf,
  getLbpIntroductionForm,
  getLbpIntroductionStored,
  hasLbpIntroductionPublished,
  publishLbpIntroduction,
  saveLbpIntroductionDraft,
  syncLbpIntroductionFromUpstream,
  validateLbpIntroductionPublish,
} from "../utils/lbpIntroductionLetter";
import {
  downloadAuthorityLetterPdf,
  getLandBankForm,
  getLandBankOverview,
  getLandBankStored,
  hasLandBankPrerequisite,
  isTranche1Complete,
  isTranche2Complete,
  isWithdrawalRequestReady,
  saveLandBankDraft,
  submitLandBank,
  validateLandBankSubmit,
} from "../utils/landBankWithdrawal";
import { allowWhenDemo, gateOpen } from "../utils/demoMode";
import { WithdrawalTranchePanel } from "./WithdrawalTranchePanel";

type SectionId = "introduction" | "account" | "withdrawal" | "authority";
type WithdrawalTrancheTab = 1 | 2;

const SECTION_NAV: { id: SectionId; label: string }[] = [
  { id: "introduction", label: "LBP Introduction" },
  { id: "account", label: "Account Opening" },
  { id: "withdrawal", label: "Withdrawal Request" },
  { id: "authority", label: "Authority Letter" },
];

const ACCOUNT_REQUIREMENTS = [
  "Valid government-issued IDs of the account holder",
  "Business registration documents (DTI / SEC / CDA)",
  "Mayor's or Business Permit",
  "SETUP Project Approval or Endorsement from DOST",
  "Completed LandBank account opening forms",
  "Initial deposit required by LandBank",
];

function moduleCardHeader(icon: ReactNode, label: string) {
  return (
    <div
      className="text-white px-5 py-3 font-semibold text-sm flex items-center gap-2"
      style={{ background: DOST_BLUE }}
    >
      {icon}
      {label}
    </div>
  );
}

function SectionHeader({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-gray-800">
        {number > 0 ? (
          <>
            <span className="text-gray-400 font-normal">Module {number} —</span> {title}
          </>
        ) : (
          title
        )}
      </h2>
      <p className="text-gray-500 text-sm mt-1">{description}</p>
    </div>
  );
}

interface LandBankAndWithdrawalProps {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
}

export function LandBankAndWithdrawal({
  user,
  onSubmitSuccess,
}: LandBankAndWithdrawalProps = {}) {
  const { applicant, isStaff } = useStaffApplicant(user);
  const [activeSection, setActiveSection] = useState<SectionId>("introduction");
  const [withdrawalTrancheTab, setWithdrawalTrancheTab] = useState<WithdrawalTrancheTab>(1);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [uploadDate, setUploadDate] = useState("");
  const [authorityTranche, setAuthorityTranche] = useState<1 | 2>(1);
  const [lbpForm, setLbpForm] = useState<LbpIntroductionLetterForm | null>(null);
  const [lbpSaveNotice, setLbpSaveNotice] = useState("");
  const [lbpPublishNotice, setLbpPublishNotice] = useState("");
  const [, setTick] = useState(0);

  const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement | null>>>({});

  const reload = useCallback(() => setTick((t) => t + 1), []);

  const loadLbpForm = useCallback(() => {
    if (!applicant) {
      setLbpForm(null);
      return;
    }
    setLbpForm(getLbpIntroductionForm(applicant));
  }, [applicant]);

  useEffect(() => {
    const unsub = applicantStore.subscribe(() => {
      reload();
      loadLbpForm();
    });
    return unsub;
  }, [reload, loadLbpForm]);

  useEffect(() => {
    loadLbpForm();
  }, [applicant?.id, loadLbpForm]);

  const form = applicant ? getLandBankForm(applicant) : null;
  const overview = getLandBankOverview(applicant);
  const stored = applicant ? getLandBankStored(applicant) : null;
  const lbpStored = applicant ? getLbpIntroductionStored(applicant) : null;
  const introPublished = hasLbpIntroductionPublished(applicant);
  const prerequisiteOk = hasLandBankPrerequisite(applicant);
  const accountReady = !!form?.accountSnapshot;
  const withdrawalUnlocked = gateOpen(accountReady);
  const withdrawalReady = form ? isWithdrawalRequestReady(form) : false;
  const tranche1Ready = form ? isTranche1Complete(form.tranches.first) : false;
  const tranche2Ready = form ? isTranche2Complete(form.tranches.second) : false;
  const authorityReady = !!(stored?.submitted || form?.authorityLetterGenerated);
  const uploadedBy = user?.email ?? "applicant";

  useEffect(() => {
    const notes = form?.accountSnapshot?.notes?.trim();
    if (notes) {
      setUploadDate(notes);
    }
  }, [form?.accountSnapshot?.notes, form?.accountSnapshot?.uploadedAt]);

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSaveDoc = (
    field: "accountSnapshot",
    doc: ModuleDocument,
  ) => {
    if (!applicant || !form) return;
    saveLandBankDraft(applicant.id, { ...form, [field]: doc });
  };

  const handleRemoveDoc = (field: "accountSnapshot") => {
    if (!applicant || !form) return;
    saveLandBankDraft(applicant.id, { ...form, [field]: null });
  };

  const handleLbpSave = () => {
    if (!applicant || !lbpForm) return;
    saveLbpIntroductionDraft(applicant.id, lbpForm);
    setLbpSaveNotice("Draft saved.");
    setTimeout(() => setLbpSaveNotice(""), 3000);
  };

  const handleLbpSync = () => {
    if (!applicant) return;
    const synced = syncLbpIntroductionFromUpstream(applicant);
    setLbpForm(synced);
    saveLbpIntroductionDraft(applicant.id, synced);
    setLbpSaveNotice("Synced from approval letter and project proposal.");
    setTimeout(() => setLbpSaveNotice(""), 3000);
  };

  const handleLbpPublish = () => {
    if (!applicant || !lbpForm) return;
    const errors = validateLbpIntroductionPublish(lbpForm);
    if (errors.length) {
      setSubmitErrors(errors);
      return;
    }
    setSubmitErrors([]);
    const publishErrors = publishLbpIntroduction(applicant.id, lbpForm, uploadedBy);
    if (publishErrors.length) {
      setSubmitErrors(publishErrors);
      return;
    }
    if (user && authStore.isStaff(user.role)) {
      applicantStore.update(applicant.id, {
        ...appendStaffAssessment(applicant, {
          stage: "landbank-withdrawal",
          decision: "lbp-intro-published",
          assessedBy: user.email,
          assessedAt: new Date().toISOString(),
          remarks: "Letter of Introduction to LBP published",
        }),
      });
    }
    notifyLbpIntroductionPublished(applicant);
    setLbpPublishNotice("Letter of Introduction published to applicant.");
    setTimeout(() => setLbpPublishNotice(""), 5000);
    loadLbpForm();
  };

  const handleLbpDownload = () => {
    downloadLbpIntroductionPdf(applicant?.applicationId);
  };

  const handleWithdrawalSubmit = () => {
    if (!applicant || !form) return;
    if (!allowWhenDemo(accountReady)) {
      setSubmitErrors(["Upload your LandBank account snapshot in Module 11 first."]);
      scrollToSection("account");
      return;
    }
    if (!allowWhenDemo(withdrawalReady)) {
      setSubmitErrors([
        "Complete 1st tranche: signed letter request, quotations, and equipment photos.",
      ]);
      return;
    }
    setSubmitErrors([]);
    scrollToSection("authority");
  };

  const handleAuthorityDownload = () => {
    if (!applicant || !form) return;
    const ready =
      authorityTranche === 1
        ? isTranche1Complete(form.tranches.first)
        : isTranche2Complete(form.tranches.second);
    if (!allowWhenDemo(ready)) {
      setSubmitErrors([
        authorityTranche === 1
          ? "Complete the 1st tranche letter request (signed letter, quotations, photos) before downloading authority."
          : "Upload the signed 2nd tranche letter request before downloading authority.",
      ]);
      scrollToSection("withdrawal");
      return;
    }
    downloadAuthorityLetterPdf(applicant, applicant.applicationId, authorityTranche);
    reload();
  };

  const handleSubmit = () => {
    if (!applicant) {
      setSubmitErrors(["Select an applicant to continue."]);
      return;
    }
    const errors = validateLandBankSubmit(applicant);
    if (errors.length) {
      setSubmitErrors(errors);
      return;
    }
    const submitErrs = submitLandBank(applicant.id, uploadedBy);
    if (submitErrs.length) {
      setSubmitErrors(submitErrs);
      return;
    }
    applicantStore.update(applicant.id, {
      ...appendStaffAssessment(applicant, {
        stage: "landbank-withdrawal",
        decision: "submitted",
        assessedBy: uploadedBy,
        assessedAt: new Date().toISOString(),
        remarks: "LandBank account and withdrawal documents verified.",
      }),
    });
    notifyLandBankComplete(applicant);
    setSubmitErrors([]);
    onSubmitSuccess?.();
  };

  const alerts = (
    <>
      {!prerequisiteOk && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Complete MOA signing day (Project Information Sheet) before opening a LandBank
            account.{" "}
            {!hasApprovalLetterAcknowledged(applicant) &&
              "Approval letter conforme is also required."}
          </p>
        </div>
      )}
      {prerequisiteOk && !introPublished && !isStaff && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Your PSTO is preparing the Letter of Introduction to Land Bank of the Philippines.
            You can review the sections below; account upload unlocks when the letter is published.
          </p>
        </div>
      )}
      {lbpSaveNotice && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          {lbpSaveNotice}
        </div>
      )}
      {lbpPublishNotice && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          {lbpPublishNotice}
        </div>
      )}
      {submitErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 space-y-1">
          {submitErrors.map((e) => (
            <p key={e}>• {e}</p>
          ))}
        </div>
      )}
    </>
  );

  const sectionNav = (
    <div className="flex flex-wrap gap-2 print:hidden">
      {SECTION_NAV.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => scrollToSection(s.id)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
            activeSection === s.id
              ? "bg-white text-[#0C2461]"
              : "bg-white/15 text-white/80 hover:bg-white/25"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );

  return (
    <ModuleWorkflowLayout
      title="LandBank & Withdrawal"
      subtitle="Modules 11–13 — Account opening, withdrawal request, and authority letter"
      user={user}
      showStaffPicker={isStaff}
      staffPickerLabel="Review applicant"
      headerExtra={sectionNav}
      alerts={alerts}
      insetBody={false}
      maxWidth="5xl"
    >
      {/* Letter of Introduction */}
      <section
        ref={(el) => {
          sectionRefs.current.introduction = el;
        }}
        id="landbank-introduction"
        className="scroll-mt-4"
      >
        <SectionHeader
          number={0}
          title="Letter of Introduction to Land Bank of the Philippines"
          description="DOST publishes this letter so you can open a dedicated SETUP savings passbook account at LandBank."
        />
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          {moduleCardHeader(
            <FileText className="w-4 h-4" />,
            "Letter of Introduction to LBP",
          )}
          <div className="p-5 space-y-4">
            {isStaff && applicant && lbpForm && !introPublished && (
              <>
                <div className="flex flex-wrap gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={handleLbpSync}
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sync from upstream
                  </button>
                  <button
                    type="button"
                    onClick={handleLbpSave}
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <Save className="w-4 h-4" />
                    Save draft
                  </button>
                  <button
                    type="button"
                    onClick={handleLbpPublish}
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg text-white"
                    style={{ background: DOST_BLUE }}
                  >
                    <Send className="w-4 h-4" />
                    Publish to applicant
                  </button>
                </div>
                <LbpIntroductionLetterEditor form={lbpForm} onChange={setLbpForm} />
              </>
            )}

            {isStaff && introPublished && lbpForm && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Published
                {lbpStored?.publishedAt
                  ? ` on ${new Date(lbpStored.publishedAt).toLocaleDateString()}`
                  : ""}
                . Applicant may download and present at LandBank.
              </div>
            )}

            {!isStaff && !introPublished && (
              <p className="text-sm text-gray-600">
                DOST staff will publish the Letter of Introduction after MOA signing. Present
                this letter at your LandBank branch when opening your SETUP savings passbook
                account.
              </p>
            )}

            {(gateOpen(introPublished) || isStaff) && lbpForm && (
              <>
                <LbpIntroductionLetterPreview
                  form={lbpForm}
                  applicationId={applicant?.applicationId}
                  onPrint={gateOpen(introPublished) || isStaff ? handleLbpDownload : undefined}
                  showToolbar={gateOpen(introPublished) || isStaff}
                />
                <DocumentDeliveryPanel
                  applicant={applicant}
                  user={user}
                  moduleKey="landbank-withdrawal"
                  documentTitle="LBP Letter of Introduction"
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Module 11 — Account Opening */}
      <section
        ref={(el) => {
          sectionRefs.current.account = el;
        }}
        id="landbank-account"
        className="scroll-mt-4"
      >
        <SectionHeader
          number={11}
          title="Opening of LandBank Savings Account"
          description="Open a LandBank savings account dedicated to the SETUP project where financial assistance will be deposited and managed."
        />
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          {moduleCardHeader(
            <Building2 className="w-4 h-4" />,
            "Opening of LandBank Savings Account",
          )}
          <div className="p-5 space-y-4">
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-amber-800">System Advisory</p>
              </div>
              <p className="text-xs text-amber-700 mb-3">
                Present the published Letter of Introduction when opening your SETUP savings
                passbook account. The account will be held/tagged until DOST issues a letter of
                authority for withdrawals.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ul className="space-y-1.5">
                  {ACCOUNT_REQUIREMENTS.map((req) => (
                    <li
                      key={req}
                      className="flex items-start gap-2 text-xs text-amber-800"
                    >
                      <span className="mt-0.5 w-3.5 h-3.5 bg-amber-300 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-amber-900">
                        ·
                      </span>
                      {req}
                    </li>
                  ))}
                </ul>
                <div className="bg-green-50 border border-green-200 rounded-lg flex flex-col items-center justify-center py-6 gap-2">
                  <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center shadow">
                    <Building2 className="w-9 h-9 text-white" />
                  </div>
                  <p className="font-bold text-green-700 text-sm tracking-wide">LANDBANK</p>
                  <p className="text-xs text-green-600">Land Bank of the Philippines</p>
                </div>
              </div>
            </div>

            {!introPublished && (
              <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Account snapshot upload is locked until the Letter of Introduction is
                  published.
                </p>
              </div>
            )}

            {applicant && form && gateOpen(introPublished) && (
              <SignedDocumentUpload
                label="LandBank account snapshot"
                document={form.accountSnapshot}
                signedDate={uploadDate}
                onSignedDateChange={setUploadDate}
                onUpload={(doc) =>
                  handleSaveDoc("accountSnapshot", { ...doc, notes: uploadDate })
                }
                onRemove={() => handleRemoveDoc("accountSnapshot")}
                uploadedBy={uploadedBy}
                readOnly={stored?.submitted}
                dateLabel="Account opened on"
                applicantId={applicant.id}
                moduleKey="landBank"
              />
            )}

            {accountReady && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <Shield className="w-3.5 h-3.5" />
                LandBank account verified — proceed to withdrawal request below
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Module 12 — Withdrawal Request */}
      <section
        ref={(el) => {
          sectionRefs.current.withdrawal = el;
        }}
        id="landbank-withdrawal"
        className="scroll-mt-4"
      >
        <SectionHeader
          number={12}
          title="Letter Request for Withdrawal"
          description="Generate and process Letter Requests for Withdrawal for the 1st and 2nd tranches using equipment from the project proposal budgetary requirement."
        />
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          {moduleCardHeader(
            <FileText className="w-4 h-4" />,
            "Letter Request for Withdrawal",
          )}
          <div className="p-5 space-y-5">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-700">Project Overview</span>
              </div>
              <div className="p-4 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-700">{overview.projectTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-700">
                      Total Withdrawal: {overview.totalWithdrawal}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-700">{overview.enterpriseName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-700">
                      Approved Project Amount: {overview.approvedAmount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-700">
                      1st Tranche: {overview.tranche1Amount}
                      {tranche1Ready ? " ✓" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-700">
                      2nd Tranche: {overview.tranche2Amount}
                      {tranche2Ready ? " ✓" : ""}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-700">
                      Remaining Balance: {overview.remainingBalance}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  {accountReady ? (
                    <div className="flex items-center gap-1.5 bg-green-100 border border-green-300 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                      <Shield className="w-3.5 h-3.5" />
                      LANDBANK ACCOUNT VERIFIED
                    </div>
                  ) : (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                      Complete Module 11 account snapshot first
                    </div>
                  )}
                </div>
              </div>
            </div>

            {applicant && form && (
              <>
                <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
                  {(
                    [
                      { n: 1 as const, label: "1st Tranche", ready: tranche1Ready },
                      { n: 2 as const, label: "2nd Tranche", ready: tranche2Ready },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.n}
                      type="button"
                      onClick={() => setWithdrawalTrancheTab(tab.n)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        withdrawalTrancheTab === tab.n
                          ? "text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      style={
                        withdrawalTrancheTab === tab.n
                          ? { background: DOST_BLUE }
                          : undefined
                      }
                    >
                      {tab.label}
                      {tab.ready && <CheckCircle className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>

                <WithdrawalTranchePanel
                  applicant={applicant}
                  user={user}
                  form={form}
                  tranche={withdrawalTrancheTab}
                  readOnly={!!stored?.submitted || !withdrawalUnlocked}
                  isStaff={isStaff}
                />

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Remarks</label>
                  <textarea
                    rows={2}
                    value={form.withdrawalRemarks}
                    onChange={(e) =>
                      saveLandBankDraft(applicant.id, {
                        ...form,
                        withdrawalRemarks: e.target.value,
                      })
                    }
                    disabled={!!stored?.submitted || !withdrawalUnlocked}
                    placeholder="Additional remarks for withdrawal request..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none disabled:opacity-60"
                  />
                </div>

                {!stored?.submitted && (
                  <button
                    type="button"
                    onClick={handleWithdrawalSubmit}
                    disabled={!allowWhenDemo(withdrawalReady && accountReady)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Continue to Authority Letter
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Module 13 — Authority Letter */}
      <section
        ref={(el) => {
          sectionRefs.current.authority = el;
        }}
        id="landbank-authority"
        className="scroll-mt-4"
      >
        <SectionHeader
          number={13}
          title="Authority Letter to Withdraw"
          description="Download the authority letter and present it at your LandBank branch with valid IDs to process the withdrawal."
        />
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          {moduleCardHeader(
            <Banknote className="w-4 h-4" />,
            "Authority Letter to Withdraw",
          )}
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              After your withdrawal request is approved, download the authority letter and
              present it at your LandBank branch with valid government-issued IDs.
            </p>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { n: 1 as const, label: "1st Tranche", ready: tranche1Ready, amount: overview.tranche1Amount },
                  { n: 2 as const, label: "2nd Tranche", ready: tranche2Ready, amount: overview.tranche2Amount },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.n}
                  type="button"
                  onClick={() => setAuthorityTranche(tab.n)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    authorityTranche === tab.n
                      ? "text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={
                    authorityTranche === tab.n ? { background: DOST_BLUE } : undefined
                  }
                >
                  {tab.label} ({tab.amount})
                  {tab.ready && <CheckCircle className="w-3 h-3" />}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <p className="font-semibold text-sm text-gray-700">Withdrawal Summary</p>
                <div className="space-y-2 text-xs">
                  {[
                    { icon: <User className="w-3.5 h-3.5" />, label: "Account Holder", value: overview.accountHolder },
                    { icon: <Building2 className="w-3.5 h-3.5" />, label: "Enterprise", value: overview.enterpriseName },
                    { icon: <Banknote className="w-3.5 h-3.5" />, label: "Approved Amount", value: overview.approvedAmount },
                    {
                      icon: <Banknote className="w-3.5 h-3.5" />,
                      label: `Amount to Withdraw (T${authorityTranche})`,
                      value:
                        authorityTranche === 1
                          ? overview.tranche1Amount
                          : overview.tranche2Amount,
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-blue-400">{row.icon}</span>
                      <span className="text-gray-500 w-36 shrink-0">{row.label}:</span>
                      <span className="font-semibold text-gray-800">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 flex flex-col justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm text-gray-700 mb-2">
                    Download Authority Letter
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Download the authority letter for the selected tranche and present it to
                    your nearest LandBank branch together with valid IDs.
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleAuthorityDownload}
                    disabled={
                      !allowWhenDemo(
                        authorityTranche === 1 ? tranche1Ready : tranche2Ready,
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                    style={{ background: DOST_BLUE }}
                  >
                    <Download className="w-4 h-4" />
                    Download Authority Letter (PDF)
                  </button>
                  <button
                    type="button"
                    onClick={handleAuthorityDownload}
                    disabled={
                      !allowWhenDemo(
                        authorityTranche === 1 ? tranche1Ready : tranche2Ready,
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Download DOCX Version
                  </button>
                </div>
              </div>
            </div>

            {authorityReady && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-green-700">
                  Your Authority Letter to Withdraw has been generated and is ready for download.
                  Present this letter at any LandBank branch along with valid government-issued
                  IDs.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {!stored?.submitted && onSubmitSuccess && (
        <div className="print:hidden pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allowWhenDemo(prerequisiteOk && introPublished && accountReady && withdrawalReady)}
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: DOST_BLUE }}
          >
            Submit &amp; Continue to Procurement &amp; Liquidation →
          </button>
        </div>
      )}
    </ModuleWorkflowLayout>
  );
}
