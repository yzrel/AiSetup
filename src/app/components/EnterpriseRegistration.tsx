/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState, useEffect, useRef } from "react";
import { REGION_12_LABEL, REGION_12_PROVINCES } from "../constants/region12";
import { applicantStore, Applicant } from "../store/applicantStore";
import { AuthUser } from "../store/authStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { normalizeRegistrationType } from "../utils/applicantPrefill";
import { PrioritySectorSelect } from "./PrioritySectorSelect";
import { StaffApplicantBanner, StaffApplicantPicker } from "./StaffApplicantPicker";
import { allowWhenDemo, isDemoModeActive } from "../utils/demoMode";
import { MODULE_HEADER, MODULE_BODY } from "./moduleTheme";
import { readAndUploadModuleDocument } from "../utils/readFileAsDataUrl";
import {
  BusinessPermitEntry,
  loadBusinessPermits,
  validateBusinessPermits,
} from "../utils/businessPermits";
import { isFoodSector } from "../utils/foodSector";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";

const DOST_BLUE = "#0C2461";
const DOST_MID = "#1a3a7a";

function loadEnterpriseFormFromApplicant(app: Applicant | null) {
  if (!app) {
    return {
      contactInfo: { email: "", phone: "" },
      formData: {
        enterpriseName: "",
        businessSector: "",
        dtiSec: "DTI" as const,
        registrationNumber: "",
        tinNumber: "",
        fdaNumber: "",
        enterpriseAddress: "",
        province: "",
        postalCode: "",
        companyStartDate: "",
        companyDescription: "",
      },
      businessPermits: loadBusinessPermits(null),
    };
  }
  const md = app.moduleData ?? {};
  return {
    contactInfo: {
      email: app.emailAddress,
      phone: app.contactNumber,
    },
    formData: {
      enterpriseName: app.enterpriseName,
      businessSector: app.businessSector,
      dtiSec: normalizeRegistrationType(
        String(md.registrationType ?? app.businessType ?? "DTI"),
      ) as "DTI" | "SEC" | "CDA",
      registrationNumber: String(md.registrationNumber ?? ""),
      tinNumber: String(md.tinNumber ?? ""),
      fdaNumber: String(md.fdaNumber ?? ""),
      enterpriseAddress: app.address,
      province: String(md.province ?? ""),
      postalCode: String(md.postalCode ?? md.zipCode ?? ""),
      companyStartDate: String(md.companyStartDate ?? md.dateEstablished ?? ""),
      companyDescription: String(md.companyDescription ?? ""),
    },
    businessPermits: loadBusinessPermits(md),
  };
}

export function EnterpriseRegistration({
  user,
  onOpenAccount,
  onSubmitSuccess,
}: {
  user?: AuthUser | null;
  onOpenAccount?: () => void;
  onSubmitSuccess?: () => void;
}) {
  const { applicant, isStaff } = useStaffApplicant(user);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
  });
  const [formData, setFormData] = useState({
    enterpriseName: "",
    businessSector: "",
    dtiSec: "DTI" as "DTI" | "SEC" | "CDA",
    registrationNumber: "",
    tinNumber: "",
    fdaNumber: "",
    enterpriseAddress: "",
    province: "",
    postalCode: "",
    companyStartDate: "",
    companyDescription: "",
  });
  const [businessPermits, setBusinessPermits] = useState<BusinessPermitEntry[]>(
    loadBusinessPermits(null),
  );

  const formDataRef = useRef(formData);
  const businessPermitsRef = useRef(businessPermits);
  formDataRef.current = formData;
  businessPermitsRef.current = businessPermits;

  useEffect(() => {
    const loaded = loadEnterpriseFormFromApplicant(applicant);
    setContactInfo(loaded.contactInfo);
    setFormData(loaded.formData);
    setBusinessPermits(loaded.businessPermits);
    formDataRef.current = loaded.formData;
    businessPermitsRef.current = loaded.businessPermits;
    setSaved(false);
    setFormError(null);
  }, [applicant?.id]);

  const persistEnterpriseDetails = (opts?: { markSaved?: boolean }) => {
    if (!applicant) return;
    const data = formDataRef.current;
    const permits = businessPermitsRef.current;
    setFormError(null);
    applicantStore.update(applicant.id, {
      enterpriseName: data.enterpriseName,
      businessSector: data.businessSector,
      address: data.enterpriseAddress,
      businessType: data.dtiSec,
      region: data.province || applicant.region,
      currentModule: "registration",
      moduleData: {
        ...applicant.moduleData,
        registrationType: data.dtiSec,
        registrationNumber: data.registrationNumber,
        tinNumber: data.tinNumber,
        fdaNumber: data.fdaNumber,
        businessPermits: permits,
        province: data.province,
        postalCode: data.postalCode,
        zipCode: data.postalCode,
        companyStartDate: data.companyStartDate,
        dateEstablished: data.companyStartDate,
        companyDescription: data.companyDescription,
        registrationDraftSavedAt: new Date().toISOString(),
      },
    });
    if (opts?.markSaved !== false) setSaved(true);
  };

  const scheduleDraftPersist = useDebouncedCallback(() => {
    persistEnterpriseDetails({ markSaved: false });
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

  const foodSector = isFoodSector(formData.businessSector);

  const setPermitYear = (index: number, year: string) => {
    setBusinessPermits((prev) => {
      const next = prev.map((entry, i) =>
        i === index ? { ...entry, year } : entry,
      );
      businessPermitsRef.current = next;
      return next;
    });
    scheduleDraftPersist();
  };

  const handlePermitFile = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      const doc = await readAndUploadModuleDocument(
        file,
        user?.email || applicant?.emailAddress || "applicant",
        applicant?.id
          ? { applicantId: applicant.id, moduleKey: "businessPermits" }
          : undefined,
      );
      setBusinessPermits((prev) => {
        const next = prev.map((entry, i) =>
          i === index ? { ...entry, document: doc } : entry,
        );
        businessPermitsRef.current = next;
        return next;
      });
      setFormError(null);
      scheduleDraftPersist();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not read file.");
    }
  };

  const removePermitFile = (index: number) => {
    setBusinessPermits((prev) => {
      const next = prev.map((entry, i) =>
        i === index ? { ...entry, document: null } : entry,
      );
      businessPermitsRef.current = next;
      return next;
    });
    scheduleDraftPersist();
  };

  const handleSaveDraft = () => {
    if (!applicant) return;
    persistEnterpriseDetails({ markSaved: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicant) return;

    if (!isDemoModeActive()) {
      const permitError = validateBusinessPermits(businessPermits);
      if (permitError) {
        setFormError(permitError);
        return;
      }
      if (foodSector && !formData.fdaNumber.trim()) {
        setFormError(
          "FDA License to Operate No. is required for food sector enterprises.",
        );
        return;
      }
    }
    persistEnterpriseDetails({ markSaved: true });
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
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
              <h1 className="text-xl font-black">Enterprise Registration</h1>
              <p className="text-white/60 text-sm">
                Step 2 — Legal business profile for your SETUP application
              </p>
            </div>
          </div>
          {isStaff && (
            <StaffApplicantPicker
              user={user}
              label="Review applicant registration"
              className="mt-4 p-3 bg-white/10 rounded-xl border border-white/20"
            />
          )}
        </div>
        <StaffApplicantBanner user={user} />

        {saved && (
          <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
            Enterprise details saved. These will carry forward to Letter of
            Intent and TNA Form 01.
          </div>
        )}

        {isDemoModeActive() && !saved && (
          <div className="mx-6 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            Demo mode: you can continue to Letter of Intent without saving, or
            save with partial fields.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={MODULE_BODY}
          noValidate={isDemoModeActive()}
        >
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">Contact information</p>
            <p>
              Email: <span className="font-medium">{contactInfo.email || "—"}</span>
              {" · "}
              Mobile: <span className="font-medium">{contactInfo.phone || "—"}</span>
            </p>
            {onOpenAccount && (
              <button
                type="button"
                onClick={onOpenAccount}
                className="mt-2 text-blue-700 font-semibold hover:underline"
              >
                Edit in My Account →
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name of Enterprise
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.enterpriseName}
              onChange={(e) => setField("enterpriseName", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority Sector (SETUP 4.0) *
            </label>
            <PrioritySectorSelect
              required
              value={formData.businessSector}
              onChange={(value) => setField("businessSector", value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Select the SETUP priority sector that best describes your enterprise.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DTI / SEC / CDA
            </label>
            <div className="flex gap-4">
              {(["DTI", "SEC", "CDA"] as const).map((type) => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="registration"
                    value={type}
                    checked={formData.dtiSec === type}
                    onChange={(e) =>
                      setField("dtiSec", e.target.value as typeof formData.dtiSec)
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Number
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.registrationNumber}
                onChange={(e) =>
                  setField("registrationNumber", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TIN Number
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.tinNumber}
                onChange={(e) => setField("tinNumber", e.target.value)}
              />
            </div>
          </div>

          {foodSector && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FDA License to Operate No. *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.fdaNumber}
                onChange={(e) => setField("fdaNumber", e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Required for food sector enterprises (Food Processing).
              </p>
            </div>
          )}

          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Business Permits — Last 3 Years *
              </p>
              <p className="text-xs text-gray-500">
                SETUP requires Mayor's / business permits for three consecutive
                years (e.g. 2023, 2024, 2025). Upload one file per year (PDF or
                image, max 15 MB).
              </p>
            </div>
            {businessPermits.map((entry, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-3 items-start"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={entry.year}
                    onChange={(e) => setPermitYear(index, e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Business permit file
                  </label>
                  {entry.document ? (
                    <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm">
                      <span className="text-green-800 truncate">
                        {entry.document.fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePermitFile(index)}
                        className="text-red-600 text-xs font-semibold hover:underline shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full text-sm text-gray-600 file:mr-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm file:font-semibold hover:file:bg-blue-100"
                      onChange={(e) =>
                        handlePermitFile(index, e.target.files?.[0] ?? null)
                      }
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complete Business Address
            </label>
            <textarea
              rows={2}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={formData.enterpriseAddress}
              onChange={(e) => setField("enterpriseAddress", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.province}
                onChange={(e) => setField("province", e.target.value)}
              >
                <option value="">Select province</option>
                {REGION_12_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <input
                type="text"
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600 text-sm"
                value={REGION_12_LABEL}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal / Zip Code
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.postalCode}
                onChange={(e) => setField("postalCode", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Start Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.companyStartDate}
                onChange={(e) =>
                  setField("companyStartDate", e.target.value)
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Description
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={formData.companyDescription}
              onChange={(e) =>
                setField("companyDescription", e.target.value)
              }
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={!applicant}
              className="w-full sm:w-auto border border-gray-300 text-gray-800 py-3 px-8 rounded-md hover:bg-gray-50 transition-colors font-medium disabled:opacity-40"
            >
              Save Draft
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto bg-green-600 text-white py-3 px-8 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              Save &amp; Continue
            </button>
            {allowWhenDemo(saved) && onSubmitSuccess && (
              <button
                type="button"
                onClick={onSubmitSuccess}
                className="w-full sm:w-auto bg-blue-600 text-white py-3 px-8 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Continue to Letter of Intent →
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
