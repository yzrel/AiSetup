/**
 * Author: Yzrel Jade B. Eborde
 */

import React, { useState, useEffect, useRef } from "react";
import { REGION_12_LABEL } from "../constants/region12";
import { Check, X } from "lucide-react";
import { applicantStore } from "../store/applicantStore";
import { AuthUser } from "../store/authStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { StaffApplicantPicker, StaffApplicantBanner } from "./StaffApplicantPicker";
import { Applicant } from "../store/applicantStore";
import { PrioritySectorSelect } from "./PrioritySectorSelect";
import { notifyPrescreeningResult } from "../utils/notificationHelpers";
import {
  evaluatePrescreening,
  EligibilityReason,
  PrescreeningEvaluation,
} from "../utils/prescreeningEligibility";
import {
  DostProgram,
  getProgramsByIds,
} from "../constants/dostProgramRecommendations";
import { DostProgramRecommendationCards } from "./DostProgramRecommendationCards";
import { getOfficeContact, resolveApplicantOfficeId } from "../utils/provincialOffice";
import { allowWhenDemo } from "../utils/demoMode";
import { MODULE_HEADER, MODULE_BODY } from "./moduleTheme";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";

const DOST_BLUE = "#0C2461";
const DOST_MID = "#1a3a7a";

export function PrescreeningForm({
  user,
  onSubmitSuccess,
  onProceedToLoi,
}: {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
  /** Navigate to the Letter of Intent module after a program is selected */
  onProceedToLoi?: () => void;
}) {
  const { applicant, isStaff } = useStaffApplicant(user);
  const [activeTab, setActiveTab] = useState<
    "form" | "registry"
  >("form");
  const [qualified, setQualified] = useState<boolean | null>(
    null,
  );
  const [evaluation, setEvaluation] = useState<PrescreeningEvaluation | null>(
    null,
  );
  const [formData, setFormData] = useState({
    applicantName: "",
    designation: "",
    enterpriseName: "",
    contactNumber: "",
    emailAddress: "",
    companyDescription: "",
    businessType: "",
    businessNature: "",
    businessSector: "",
    yearsOfOperation: "",
    enterpriseType: "",
    coreProducts: "",
    exportClassification: "",
    msmeSize: "",
    assetSize: "",
    classificationRange: "",
    essentialPeriod: "",
    turnover: "",
  });
  const [draftNotice, setDraftNotice] = useState("");

  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const persistPrescreeningDraft = (
    data: typeof formData,
    showNotice: boolean,
  ) => {
    const existing = applicant;
    const payload = {
      applicantName: data.applicantName,
      designation: data.designation,
      enterpriseName: data.enterpriseName,
      contactNumber: data.contactNumber,
      emailAddress: data.emailAddress,
      businessType: data.businessType,
      businessNature: data.businessNature,
      businessSector: data.businessSector,
      yearsOfOperation: data.yearsOfOperation,
      enterpriseType: data.enterpriseType,
      msmeSize: data.msmeSize,
      assetSize: data.assetSize,
      region: existing?.region ?? REGION_12_LABEL,
      address: existing?.address ?? "",
      currentModule: existing?.currentModule ?? "prescreening",
      moduleData: {
        ...existing?.moduleData,
        companyDescription: data.companyDescription,
        coreProducts: data.coreProducts,
        exportClassification: data.exportClassification,
        classificationRange: data.classificationRange,
        essentialPeriod: data.essentialPeriod,
        turnover: data.turnover,
        prescreeningDraftSavedAt: new Date().toISOString(),
      },
    };

    if (existing) {
      applicantStore.update(existing.id, payload);
    } else if (
      data.applicantName.trim() ||
      data.enterpriseName.trim() ||
      data.emailAddress.trim()
    ) {
      applicantStore.add({
        applicantName: data.applicantName,
        designation: data.designation,
        enterpriseName: data.enterpriseName,
        contactNumber: data.contactNumber,
        emailAddress: data.emailAddress,
        businessType: data.businessType,
        businessNature: data.businessNature,
        businessSector: data.businessSector,
        yearsOfOperation: data.yearsOfOperation,
        enterpriseType: data.enterpriseType,
        msmeSize: data.msmeSize,
        assetSize: data.assetSize,
        region: REGION_12_LABEL,
        address: "",
        currentModule: "prescreening",
        qualified: false,
        moduleData: payload.moduleData,
      });
    }
    if (showNotice) {
      setDraftNotice("Draft saved.");
      setTimeout(() => setDraftNotice(""), 3000);
    }
  };

  const scheduleDraftPersist = useDebouncedCallback(() => {
    persistPrescreeningDraft(formDataRef.current, false);
  }, 400);

  const setField = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K],
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      formDataRef.current = next;
      return next;
    });
    scheduleDraftPersist();
  };

  const prescreeningInputFromForm = () => ({
    businessSector: formData.businessSector,
    businessNature: formData.businessNature,
    yearsOfOperation: formData.yearsOfOperation,
    msmeSize: formData.msmeSize,
    exportClassification: formData.exportClassification,
  });

  const prescreeningInputFromApplicant = (app: Applicant) => ({
    businessSector: app.businessSector,
    businessNature: app.businessNature,
    yearsOfOperation: app.yearsOfOperation,
    msmeSize: app.msmeSize,
    exportClassification: String(app.moduleData?.exportClassification ?? ""),
  });

  const applyEvaluationToState = (
    result: PrescreeningEvaluation,
    app?: Applicant | null,
  ) => {
    setQualified(result.qualified);
    if (result.qualified) {
      setEvaluation(result);
      return;
    }
    const storedIds = (app?.moduleData?.prescreening?.recommendedProgramIds ??
      result.recommendedProgramIds) as string[];
    const storedReasons = (app?.moduleData?.prescreening?.failedReasons ??
      []) as EligibilityReason[];
    const programs =
      storedIds.length > 0 && app
        ? getProgramsByIds(storedIds)
        : result.recommendedPrograms;
    setEvaluation({
      ...result,
      failedReasons:
        storedReasons.length > 0 ? storedReasons : result.failedReasons,
      recommendedPrograms: programs,
      recommendedProgramIds: programs.map((p) => p.id),
    });
  };

  const loadApplicantPrescreening = (app: Applicant | null) => {
    if (!app) {
      setQualified(null);
      setEvaluation(null);
      return;
    }
    setFormData({
      applicantName: app.applicantName,
      designation: app.designation,
      enterpriseName: app.enterpriseName,
      contactNumber: app.contactNumber,
      emailAddress: app.emailAddress,
      companyDescription: String(app.moduleData?.companyDescription ?? ""),
      businessType: app.businessType,
      businessNature: app.businessNature,
      businessSector: app.businessSector,
      yearsOfOperation: app.yearsOfOperation,
      enterpriseType: app.enterpriseType,
      coreProducts: String(app.moduleData?.coreProducts ?? ""),
      exportClassification: String(app.moduleData?.exportClassification ?? ""),
      msmeSize: app.msmeSize,
      assetSize: app.assetSize,
      classificationRange: String(app.moduleData?.classificationRange ?? ""),
      essentialPeriod: String(app.moduleData?.essentialPeriod ?? ""),
      turnover: String(app.moduleData?.turnover ?? ""),
    });

    const hasEvaluation = Boolean(app.moduleData?.prescreening?.evaluatedAt);
    if (!hasEvaluation && !app.qualified) {
      setQualified(null);
      setEvaluation(null);
      return;
    }

    const result = evaluatePrescreening(prescreeningInputFromApplicant(app));
    applyEvaluationToState(result, app);
  };

  useEffect(() => {
    loadApplicantPrescreening(applicant);
  }, [applicant?.id]);

  const handleSaveDraft = () => {
    persistPrescreeningDraft(formData, true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = evaluatePrescreening(prescreeningInputFromForm());
    applyEvaluationToState(result);
    const existing = applicant;
    const payload = {
      applicantName: formData.applicantName,
      designation: formData.designation,
      enterpriseName: formData.enterpriseName,
      contactNumber: formData.contactNumber,
      emailAddress: formData.emailAddress,
      businessType: formData.businessType,
      businessNature: formData.businessNature,
      businessSector: formData.businessSector,
      yearsOfOperation: formData.yearsOfOperation,
      enterpriseType: formData.enterpriseType,
      msmeSize: formData.msmeSize,
      assetSize: formData.assetSize,
      region: existing?.region ?? REGION_12_LABEL,
      address: existing?.address ?? "",
      currentModule: result.qualified ? ("registration" as const) : ("prescreening" as const),
      qualified: result.qualified,
      moduleData: {
        ...existing?.moduleData,
        companyDescription: formData.companyDescription,
        coreProducts: formData.coreProducts,
        exportClassification: formData.exportClassification,
        classificationRange: formData.classificationRange,
        essentialPeriod: formData.essentialPeriod,
        turnover: formData.turnover,
        // A qualified client proceeds with the standard SETUP LOI, so drop any
        // recommended program picked while previously not qualified.
        ...(result.qualified
          ? { selectedProgramId: undefined, selectedProgramName: undefined }
          : {}),
        prescreening: {
          failedReasons: result.failedReasons,
          recommendedProgramIds: result.recommendedProgramIds,
          evaluatedAt: new Date().toISOString(),
        },
      },
    };

    if (existing) {
      applicantStore.update(existing.id, payload);
      const saved = applicantStore.getById(existing.id);
      if (saved) notifyPrescreeningResult(saved, result.qualified);
    } else {
      const added = applicantStore.add(payload);
      notifyPrescreeningResult(added, result.qualified);
    }
  };

  const contactEmail = applicant
    ? getOfficeContact(resolveApplicantOfficeId(applicant)).email
    : undefined;

  const recommendedPrograms: DostProgram[] =
    evaluation?.recommendedPrograms ?? [];

  const handleProgramInterest = (program: DostProgram) => {
    if (!applicant) return;
    // Record the chosen program and unlock the Letter of Intent module so
    // the LOI content can be generated for this program. Any letter already
    // generated for a different program (or for SETUP) is discarded so the
    // client gets a fresh program-based letter instead of the stale one.
    const md = { ...(applicant.moduleData ?? {}) };
    const existingLetterProgramId = String(md.loiDocumentProgramId ?? "");
    if (md.loiDocument && existingLetterProgramId !== program.id) {
      delete md.loiDocument;
      delete md.loiSubmittedAt;
      delete md.loiDocumentProgramId;
    }
    applicantStore.update(applicant.id, {
      currentModule: "letter-of-intent",
      moduleData: {
        ...md,
        selectedProgramId: program.id,
        selectedProgramName: `${program.name} (${program.tagline})`,
      },
    });
    onProceedToLoi?.();
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      {activeTab === "form" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className={`${MODULE_HEADER} text-white`}
            style={{
              background: `linear-gradient(135deg,${DOST_BLUE} 0%,${DOST_MID} 100%)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <span className="text-blue-800 font-black text-sm">ai</span>
              </div>
              <div>
                <h1 className="text-xl font-black">aiSETUP Pre-Screening</h1>
                <p className="text-white/60 text-sm">
                  Determine eligibility for the DOST SETUP Program
                </p>
              </div>
            </div>
            {isStaff && (
              <StaffApplicantPicker
                user={user}
                label="Review applicant pre-screening"
                className="mt-4 p-3 bg-white/10 rounded-xl border border-white/20"
              />
            )}
          </div>
          <StaffApplicantBanner user={user} />

          <form onSubmit={handleSubmit} className={`${MODULE_BODY} space-y-8`}>
              {qualified !== null && (
                <div
                  className={`p-4 sm:p-6 rounded-lg ${qualified ? "bg-green-50 border-2 border-green-500" : "bg-red-50 border-2 border-red-500"}`}
                >
                  <div className="flex items-start gap-4">
                    {qualified ? (
                      <>
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-green-800">
                            Qualified to Proceed
                          </h3>
                          <p className="text-green-700">
                            You meet the minimum qualifications
                            to proceed with the SETUP
                            registration.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shrink-0">
                          <X className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-red-800">
                            Not Qualified for SETUP
                          </h3>
                          <p className="text-red-700 mb-3">
                            Your enterprise does not yet meet all SETUP
                            requirements. Review the items below and explore
                            alternative DOST programs for your sector.
                          </p>
                          {evaluation?.failedReasons && (
                            <ul className="space-y-1.5">
                              {evaluation.failedReasons.map((reason) => (
                                <li
                                  key={reason.text}
                                  className={`flex items-start gap-2 text-sm ${reason.ok ? "text-green-700" : "text-red-800"}`}
                                >
                                  <span className="shrink-0 font-bold">
                                    {reason.ok ? "✓" : "✗"}
                                  </span>
                                  <span>{reason.text}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {qualified === false && recommendedPrograms.length > 0 && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#0C2461]">
                      Recommended DOST Programs You May Avail
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Based on your priority sector
                      {formData.businessSector
                        ? `: ${formData.businessSector}`
                        : ""}
                      . Preview each program for full details.
                    </p>
                  </div>
                  <DostProgramRecommendationCards
                    programs={recommendedPrograms}
                    contactEmail={contactEmail}
                    onSelectProgram={
                      applicant && onProceedToLoi
                        ? handleProgramInterest
                        : undefined
                    }
                  />
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Applicant Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Applicant Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.applicantName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          applicantName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.designation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          designation: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enterprise Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.enterpriseName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enterpriseName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.contactNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.emailAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emailAddress: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brief Description of Company
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                      Describe your enterprise&apos;s products, services, and
                      operations (max 500 characters)
                    </p>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      value={formData.companyDescription}
                      onChange={(e) =>
                        setField(
                          "companyDescription",
                          e.target.value.slice(0, 500),
                        )
                      }
                      placeholder="We are a food processing enterprise specializing in..."
                    />
                    <p className="text-[10px] text-gray-400 text-right mt-1">
                      {formData.companyDescription.length}/500
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Main Qualification Questions
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      A. Nature of Business
                    </label>
                    <div className="space-y-2">
                      {[
                        "Registered with DTI or SEC for manufacturing",
                        "Startup (Includes enterprises with or without revenue)",
                      ].map((option) => (
                        <label key={option} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="businessNature"
                            className="w-4 h-4 text-blue-600"
                            checked={formData.businessNature === option}
                            onChange={() => setField("businessNature", option)}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      B. Essential Period Question (0–10 years of operation)
                    </label>
                    <div className="space-y-2">
                      {["Yes", "No"].map((option) => (
                        <label key={option} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="essentialPeriod"
                            className="w-4 h-4 text-blue-600"
                            checked={formData.essentialPeriod === option}
                            onChange={() => setField("essentialPeriod", option)}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Years of Operation
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.yearsOfOperation}
                        onChange={(e) =>
                          setField("yearsOfOperation", e.target.value)
                        }
                        placeholder="e.g. 5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      C. Business Record Turnover
                    </label>
                    <input
                      type="text"
                      placeholder="Enter turnover amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.turnover}
                      onChange={(e) => setField("turnover", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      D. Type of Enterprise
                    </label>
                    <div className="space-y-2">
                      {[
                        "Sole Proprietor",
                        "Partnership",
                        "Corporation",
                        "Cooperative",
                      ].map((option) => (
                        <label key={option} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="enterpriseType"
                            className="w-4 h-4 text-blue-600"
                            checked={formData.enterpriseType === option}
                            onChange={() => setField("enterpriseType", option)}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E. Nature of Product or Service
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your core product or service"
                      value={formData.coreProducts}
                      onChange={(e) => setField("coreProducts", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      F. EXPORT Classification
                    </label>
                    <div className="space-y-2">
                      {["Yes", "No", "Potential Export"].map((option) => (
                        <label key={option} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="exportClassification"
                            className="w-4 h-4 text-blue-600"
                            checked={formData.exportClassification === option}
                            onChange={() =>
                              setField("exportClassification", option)
                            }
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Sector (SETUP 4.0) *
                    </label>
                    <PrioritySectorSelect
                      required
                      value={formData.businessSector}
                      onChange={(value) => setField("businessSector", value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Must match one of the priority sectors on the SETUP landing page.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  G. MSME Classification
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.msmeSize}
                      onChange={(e) => setField("msmeSize", e.target.value)}
                    >
                      <option value="">Select size</option>
                      <option>Micro</option>
                      <option>Small</option>
                      <option>Medium</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Asset Size (PHP)
                      </label>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.assetSize}
                        onChange={(e) => setField("assetSize", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Classification Range
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.classificationRange}
                        onChange={(e) =>
                          setField("classificationRange", e.target.value)
                        }
                      >
                        <option value="">Select range</option>
                        <option>₱0 - ₱3M</option>
                        <option>₱3M - ₱15M</option>
                        <option>₱15M - ₱100M</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                  Submit
                </button>
                {allowWhenDemo(!!qualified) && onSubmitSuccess && (
                  <button
                    type="button"
                    onClick={onSubmitSuccess}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Continue to Enterprise Registration →
                  </button>
                )}
                <button
                  type="button"
                  className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
              {draftNotice && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  {draftNotice}
                </p>
              )}
            </form>
        </div>
      )}
    </div>
  );
}