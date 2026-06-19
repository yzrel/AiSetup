import { useState, useEffect } from "react";
import { REGION_12_LABEL, REGION_12_PROVINCES } from "../constants/region12";
import { applicantStore } from "../store/applicantStore";
import { AuthUser } from "../store/authStore";
import { resolveApplicantForUser } from "../utils/resolveApplicant";
import { normalizeRegistrationType } from "../utils/applicantPrefill";

const DOST_BLUE = "#0C2461";
const DOST_MID = "#1a3a7a";

export function EnterpriseRegistration({
  user,
  onOpenAccount,
  onSubmitSuccess,
}: {
  user?: AuthUser | null;
  onOpenAccount?: () => void;
  onSubmitSuccess?: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
  });
  const [formData, setFormData] = useState({
    enterpriseName: "",
    dtiSec: "DTI",
    registrationNumber: "",
    tinNumber: "",
    enterpriseAddress: "",
    province: "",
    postalCode: "",
    companyStartDate: "",
    companyDescription: "",
  });

  const loadFromStore = () => {
    const app = resolveApplicantForUser(user);
    if (!app) return;
    const md = app.moduleData ?? {};
    setContactInfo({
      email: app.emailAddress,
      phone: app.contactNumber,
    });
    setFormData({
      enterpriseName: app.enterpriseName,
      dtiSec: normalizeRegistrationType(
        String(md.registrationType ?? app.businessType ?? "DTI"),
      ),
      registrationNumber: String(md.registrationNumber ?? ""),
      tinNumber: String(md.tinNumber ?? ""),
      enterpriseAddress: app.address,
      province: String(md.province ?? ""),
      postalCode: String(md.postalCode ?? md.zipCode ?? ""),
      companyStartDate: String(md.companyStartDate ?? md.dateEstablished ?? ""),
      companyDescription: String(md.companyDescription ?? ""),
    });
  };

  useEffect(() => {
    loadFromStore();
    return applicantStore.subscribe(loadFromStore);
  }, [user?.id, user?.email]);

  const setField = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K],
  ) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = resolveApplicantForUser(user);
    if (!existing) return;

    applicantStore.update(existing.id, {
      enterpriseName: formData.enterpriseName,
      address: formData.enterpriseAddress,
      businessType: formData.dtiSec,
      region: formData.province || existing.region,
      currentModule: "registration",
      moduleData: {
        ...existing.moduleData,
        registrationType: formData.dtiSec,
        registrationNumber: formData.registrationNumber,
        tinNumber: formData.tinNumber,
        province: formData.province,
        postalCode: formData.postalCode,
        zipCode: formData.postalCode,
        companyStartDate: formData.companyStartDate,
        dateEstablished: formData.companyStartDate,
        companyDescription: formData.companyDescription,
      },
    });
    setSaved(true);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div
          className="p-6 text-white"
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
        </div>

        {saved && (
          <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
            Enterprise details saved. These will carry forward to Letter of
            Intent and TNA Form 01.
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                    onChange={(e) => setField("dtiSec", e.target.value)}
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
              type="submit"
              className="w-full sm:w-auto bg-green-600 text-white py-3 px-8 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              Save Enterprise Details
            </button>
            {saved && onSubmitSuccess && (
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
