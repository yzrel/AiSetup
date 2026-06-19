import { useState, useEffect } from "react";
import { REGION_12_LABEL } from "../constants/region12";
import { Check, X, Users, FileText } from "lucide-react";
import { applicantStore } from "../store/applicantStore";
import { AuthUser } from "../store/authStore";
import { resolveApplicantForUser } from "../utils/resolveApplicant";

const DOST_BLUE = "#0C2461";
const DOST_MID = "#1a3a7a";

export function PrescreeningForm({
  user,
  onSubmitSuccess,
}: {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "form" | "registry"
  >("form");
  const [qualified, setQualified] = useState<boolean | null>(
    null,
  );
  const [formData, setFormData] = useState({
    applicantName: "",
    designation: "",
    enterpriseName: "",
    contactNumber: "",
    emailAddress: "",
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

  const setField = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K],
  ) => setFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    const app = resolveApplicantForUser(user);
    if (!app) return;
    setFormData({
      applicantName: app.applicantName,
      designation: app.designation,
      enterpriseName: app.enterpriseName,
      contactNumber: app.contactNumber,
      emailAddress: app.emailAddress,
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
    if (app.qualified) setQualified(true);
  }, [user?.id, user?.email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQualified(true);
    const existing = resolveApplicantForUser(user);
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
      currentModule: "registration" as const,
      qualified: true,
      moduleData: {
        ...existing?.moduleData,
        coreProducts: formData.coreProducts,
        exportClassification: formData.exportClassification,
        classificationRange: formData.classificationRange,
        essentialPeriod: formData.essentialPeriod,
        turnover: formData.turnover,
      },
    };

    if (existing) {
      applicantStore.update(existing.id, payload);
    } else {
      applicantStore.add(payload);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      {activeTab === "form" && (
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
                <h1 className="text-xl font-black">aiSETUP Pre-Screening</h1>
                <p className="text-white/60 text-sm">
                  Determine eligibility for the DOST SETUP Program
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {qualified !== null && (
                <div
                  className={`p-6 rounded-lg ${qualified ? "bg-green-50 border-2 border-green-500" : "bg-red-50 border-2 border-red-500"}`}
                >
                  <div className="flex items-center gap-4">
                    {qualified ? (
                      <>
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
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
                        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                          <X className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-red-800">
                            Not Qualified to SETUP
                          </h3>
                          <p className="text-red-700">
                            Based on your initial answers, you
                            do not meet the minimum
                            qualifications for SETUP.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
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
                      Business Sector
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.businessSector}
                      onChange={(e) =>
                        setField("businessSector", e.target.value)
                      }
                    >
                      <option value="">Select sector</option>
                      <option>Agri-processing</option>
                      <option>Food Processing</option>
                      <option>Manufacturing</option>
                      <option>Services</option>
                      <option>ICT</option>
                      <option>Metals & Engineering</option>
                      <option>Pharmaceuticals & Herbal</option>
                    </select>
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
                      Size
                    </label>
                    <select
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
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                  Submit
                </button>
                {qualified && onSubmitSuccess && (
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
            </form>
        </div>
      )}
    </div>
  );
}