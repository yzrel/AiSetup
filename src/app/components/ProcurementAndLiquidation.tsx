/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState, type ChangeEvent, type ReactNode } from "react";
import {
  AlertCircle,
  Archive,
  BarChart2,
  CheckCircle,
  Edit2,
  Package,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
} from "lucide-react";
import { AuthUser } from "../store/authStore";
import { applicantStore } from "../store/applicantStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { useApplicantStoreVersion } from "../hooks/useApplicantSubscription";
import { ModuleWorkflowLayout, type ModuleStep } from "./ModuleWorkflowLayout";
import { DOST_BLUE, FORM_GRID_2, MODULE_SHELL } from "./moduleTheme";
import { appendStaffAssessment } from "../utils/clientAssessment";
import { notifyProcurementComplete } from "../utils/notificationHelpers";
import {
  addLiquidation,
  addLiquidationAttachment,
  addProcurementDocument,
  addProcurementItem,
  getProcurementFinancialSummary,
  getProcurementForm,
  getProcurementStored,
  hasLiquidationFiled,
  hasProcurementPrerequisite,
  removeLiquidation,
  removeLiquidationAttachment,
  removeProcurementItem,
  setAccountUntagged,
  submitProcurement,
  updateLiquidation,
  updateProcurementItem,
  validateProcurementSubmit,
} from "../utils/procurementLiquidation";
import { allowWhenDemo } from "../utils/demoMode";
import { readAndUploadModuleDocument } from "../utils/readFileAsDataUrl";
import { SubmittedFileActions } from "./SubmittedFileActions";

const STEPS: ModuleStep[] = [
  { id: "procurement", label: "Procurement", icon: <Package className="w-4 h-4" /> },
  { id: "liquidation", label: "Liquidation", icon: <BarChart2 className="w-4 h-4" /> },
  { id: "untagging", label: "Untagging", icon: <Tag className="w-4 h-4" /> },
];

type StepId = "procurement" | "liquidation" | "untagging";

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

interface ProcurementAndLiquidationProps {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
}

export function ProcurementAndLiquidation({
  user,
  onSubmitSuccess,
}: ProcurementAndLiquidationProps = {}) {
  const { applicant, isStaff } = useStaffApplicant(user);
  const [step, setStep] = useState<StepId>("procurement");
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  useApplicantStoreVersion();

  const form = applicant ? getProcurementForm(applicant) : null;
  const stored = applicant ? getProcurementStored(applicant) : null;
  const summary = getProcurementFinancialSummary(applicant);
  const prerequisiteOk = hasProcurementPrerequisite(applicant);
  const uploadedBy = user?.email ?? "applicant";

  const maxReached = stored?.submitted
    ? 2
    : form?.untagged
      ? 2
      : form && hasLiquidationFiled(form)
        ? 1
        : form?.documents.length
          ? 0
          : 0;

  const handleProcurementUpload = async (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !applicant) return;
    try {
      const moduleDoc = await readAndUploadModuleDocument(file, uploadedBy, {
        applicantId: applicant.id,
        moduleKey: "procurement",
      });
      addProcurementDocument(applicant.id, moduleDoc);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed.");
    }
    e.target.value = "";
  };

  const handleLiquidationAttachmentUpload = async (
    entryId: string,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !applicant || !isStaff) return;
    try {
      const moduleDoc = await readAndUploadModuleDocument(file, uploadedBy, {
        applicantId: applicant.id,
        moduleKey: "liquidation",
      });
      addLiquidationAttachment(applicant.id, entryId, moduleDoc);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed.");
    }
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (!applicant) {
      setSubmitErrors(["Select an applicant to continue."]);
      return;
    }
    const errors = validateProcurementSubmit(applicant);
    if (errors.length) {
      setSubmitErrors(errors);
      return;
    }
    const submitErrs = submitProcurement(applicant.id, uploadedBy);
    if (submitErrs.length) {
      setSubmitErrors(submitErrs);
      return;
    }
    applicantStore.update(applicant.id, {
      ...appendStaffAssessment(applicant, {
        stage: "procurement-liquidation",
        decision: "submitted",
        assessedBy: uploadedBy,
        assessedAt: new Date().toISOString(),
        remarks: "Procurement, liquidation, and account untagging verified.",
      }),
    });
    notifyProcurementComplete(applicant);
    setSubmitErrors([]);
    onSubmitSuccess?.();
  };

  const alerts = (
    <>
      {!prerequisiteOk && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Complete LandBank &amp; Withdrawal (Modules 11–13) before procurement.</p>
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

  return (
    <ModuleWorkflowLayout
      title="Procurement & Liquidation"
      subtitle="Modules 14–16 — Equipment & Financial Docs"
      user={user}
      steps={STEPS}
      currentStep={step}
      maxReached={maxReached}
      onStepClick={(id) => setStep(id as StepId)}
      showStaffPicker={isStaff}
      alerts={alerts}
      insetBody={false}
      maxWidth="5xl"
    >
      {step === "procurement" && form && applicant && (
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          {moduleCardHeader(
            <Package className="w-4 h-4" />,
            "Module 14 — Procurement (Submission of Official Receipts)",
          )}
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              Upload procurement-related documents: official receipts, sales invoices, delivery
              receipts, and photos of purchased equipment.
            </p>
            <input
              type="file"
              id="proc-upload"
              className="hidden"
              onChange={handleProcurementUpload}
              disabled={!!stored?.submitted}
            />
            <label
              htmlFor="proc-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Upload Procurement Document
            </label>
            <div className="space-y-1">
              {form.documents.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  <span className="flex-1 min-w-0 font-medium truncate">{d.fileName}</span>
                  <span className="text-gray-400 shrink-0">{d.uploadedAt}</span>
                  <SubmittedFileActions
                    fileName={d.fileName}
                    mimeType={d.mimeType}
                    dataUrl={d.dataUrl}
                    fileId={d.fileId}
                    applicantId={applicant.id}
                    compact
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-gray-800">Procurement Line Items</h3>
              {!stored?.submitted && (
                <button
                  type="button"
                  onClick={() => {
                    const item = addProcurementItem(applicant.id);
                    setEditingId(item.id);
                  }}
                  className="flex items-center gap-1 text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Mobile cards */}
              <div className="md:hidden p-3 space-y-3">
                {form.items.map((item) =>
                  editingId === item.id && !stored?.submitted ? (
                    <div key={item.id} className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2 text-xs">
                      {(["description", "supplier", "purchaseDate"] as const).map((f) => (
                        <div key={f}>
                          <label className="text-[10px] font-bold uppercase text-gray-500 capitalize">{f}</label>
                          <input
                            value={item[f]}
                            onChange={(e) =>
                              updateProcurementItem(applicant.id, item.id, { [f]: e.target.value })
                            }
                            className="w-full mt-0.5 border border-blue-300 rounded px-2 py-1.5 text-xs"
                          />
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-gray-500">Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateProcurementItem(applicant.id, item.id, {
                                quantity: parseInt(e.target.value, 10) || 1,
                              })
                            }
                            className="w-full mt-0.5 border border-blue-300 rounded px-2 py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-gray-500">Cost</label>
                          <input
                            value={item.totalCost}
                            onChange={(e) =>
                              updateProcurementItem(applicant.id, item.id, { totalCost: e.target.value })
                            }
                            className="w-full mt-0.5 border border-blue-300 rounded px-2 py-1.5 text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => setEditingId(null)} className="flex-1 text-xs bg-green-600 text-white rounded-lg py-2">Save</button>
                        <button type="button" onClick={() => removeProcurementItem(applicant.id, item.id)} className="text-xs bg-red-100 text-red-600 rounded-lg px-3 py-2">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-2 text-xs">
                      <p className="font-semibold text-gray-800">{item.description || "—"}</p>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <div><span className="text-[10px] font-bold uppercase text-gray-400 block">Supplier</span>{item.supplier || "—"}</div>
                        <div><span className="text-[10px] font-bold uppercase text-gray-400 block">Date</span>{item.purchaseDate || "—"}</div>
                        <div><span className="text-[10px] font-bold uppercase text-gray-400 block">Qty</span>{item.quantity}</div>
                        <div><span className="text-[10px] font-bold uppercase text-gray-400 block">Cost</span><span className="font-semibold">{item.totalCost || "—"}</span></div>
                      </div>
                      {!stored?.submitted && (
                        <button type="button" onClick={() => setEditingId(item.id)} className="w-full text-xs bg-blue-600 text-white rounded-lg py-2 flex items-center justify-center gap-1">
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>
                  ),
                )}
              </div>
              {/* Desktop table */}
              <table className="hidden md:table w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["Description", "Supplier", "Date", "Qty", "Cost", ""].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item) =>
                    editingId === item.id && !stored?.submitted ? (
                      <tr key={item.id} className="bg-blue-50">
                        {(["description", "supplier", "purchaseDate"] as const).map((f) => (
                          <td key={f} className="px-2 py-1.5">
                            <input
                              value={item[f]}
                              onChange={(e) =>
                                updateProcurementItem(applicant.id, item.id, {
                                  [f]: e.target.value,
                                })
                              }
                              className="w-full border border-blue-300 rounded px-2 py-1 text-xs"
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateProcurementItem(applicant.id, item.id, {
                                quantity: parseInt(e.target.value, 10) || 1,
                              })
                            }
                            className="w-14 border border-blue-300 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            value={item.totalCost}
                            onChange={(e) =>
                              updateProcurementItem(applicant.id, item.id, {
                                totalCost: e.target.value,
                              })
                            }
                            className="w-24 border border-blue-300 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="text-xs bg-green-600 text-white rounded px-2 py-0.5"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => removeProcurementItem(applicant.id, item.id)}
                              className="text-xs bg-red-100 text-red-600 rounded px-2 py-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="px-3 py-2">{item.description || "—"}</td>
                        <td className="px-3 py-2">{item.supplier || "—"}</td>
                        <td className="px-3 py-2">{item.purchaseDate || "—"}</td>
                        <td className="px-3 py-2">{item.quantity}</td>
                        <td className="px-3 py-2 font-semibold">{item.totalCost || "—"}</td>
                        <td className="px-3 py-2">
                          {!stored?.submitted && (
                            <button
                              type="button"
                              onClick={() => setEditingId(item.id)}
                              className="text-xs bg-blue-600 text-white rounded px-2 py-0.5 flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
            {isStaff && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-xs text-gray-600">
                Staff verification: procurement documents and line items reviewed by PSTO officer.
              </div>
            )}
          </div>
        </div>
      )}

      {step === "liquidation" && form && applicant && (
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          {moduleCardHeader(
            <BarChart2 className="w-4 h-4" />,
            "Module 15 — Liquidation (Financial Report and Equipment Documentation)",
          )}
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              {isStaff
                ? "Add one or more liquidations with title/period, amount, date, remarks, and supporting attachments."
                : "DOST staff record liquidations and attachments. You can review entries below."}
            </p>

            {isStaff && !stored?.submitted && (
              <button
                type="button"
                onClick={() => addLiquidation(applicant.id, uploadedBy)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Add liquidation
              </button>
            )}

            {!isStaff && form.liquidations.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                DOST staff will record liquidations and attachments.
              </div>
            )}

            <div className="space-y-4">
              {form.liquidations.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/40"
                >
                  {isStaff && !stored?.submitted ? (
                    <>
                      <div className={FORM_GRID_2}>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-gray-500">
                            Title / period
                          </label>
                          <input
                            value={entry.title}
                            onChange={(e) =>
                              updateLiquidation(applicant.id, entry.id, {
                                title: e.target.value,
                              })
                            }
                            placeholder="e.g. 1st Tranche / Q1 2026"
                            className="w-full mt-0.5 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-gray-500">
                            Amount
                          </label>
                          <input
                            value={entry.amount}
                            onChange={(e) =>
                              updateLiquidation(applicant.id, entry.id, {
                                amount: e.target.value,
                              })
                            }
                            placeholder="₱0.00"
                            className="w-full mt-0.5 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-gray-500">
                            Date
                          </label>
                          <input
                            type="date"
                            value={entry.date}
                            onChange={(e) =>
                              updateLiquidation(applicant.id, entry.id, {
                                date: e.target.value,
                              })
                            }
                            className="w-full mt-0.5 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase text-gray-500">
                            Remarks
                          </label>
                          <textarea
                            rows={2}
                            value={entry.remarks}
                            onChange={(e) =>
                              updateLiquidation(applicant.id, entry.id, {
                                remarks: e.target.value,
                              })
                            }
                            placeholder="Notes for this liquidation…"
                            className="w-full mt-0.5 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="file"
                          id={`liq-att-${entry.id}`}
                          className="hidden"
                          onChange={(e) =>
                            handleLiquidationAttachmentUpload(entry.id, e)
                          }
                        />
                        <label
                          htmlFor={`liq-att-${entry.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Upload attachment
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Remove this liquidation and all its attachments?",
                              )
                            ) {
                              removeLiquidation(applicant.id, entry.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-gray-800">
                        {entry.title.trim() || "Untitled liquidation"}
                      </p>
                      <div className={`${FORM_GRID_2} text-xs text-gray-600`}>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-gray-400 block">
                            Amount
                          </span>
                          {entry.amount || "—"}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-gray-400 block">
                            Date
                          </span>
                          {entry.date || "—"}
                        </div>
                        {entry.remarks.trim() && (
                          <div className="sm:col-span-2">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">
                              Remarks
                            </span>
                            {entry.remarks}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    {entry.attachments.length === 0 && (
                      <p className="text-xs text-gray-400 italic">
                        No attachments yet.
                      </p>
                    )}
                    {entry.attachments.map((d) => (
                      <div
                        key={d.id}
                        className="flex flex-wrap items-center gap-2 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        <span className="flex-1 min-w-0 font-medium truncate">
                          {d.fileName}
                        </span>
                        <span className="text-gray-400 shrink-0">
                          {d.uploadedAt}
                        </span>
                        <SubmittedFileActions
                          fileName={d.fileName}
                          mimeType={d.mimeType}
                          dataUrl={d.dataUrl}
                          fileId={d.fileId}
                          applicantId={applicant.id}
                          compact
                        />
                        {isStaff && !stored?.submitted && (
                          <button
                            type="button"
                            onClick={() =>
                              removeLiquidationAttachment(
                                applicant.id,
                                entry.id,
                                d.id,
                              )
                            }
                            className="text-red-600 hover:bg-red-50 rounded p-1"
                            aria-label="Remove attachment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === "untagging" && form && applicant && (
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          {moduleCardHeader(
            <Tag className="w-4 h-4" />,
            "Module 16 — Untagging of Account",
          )}
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              Mark completion of SETUP project financial activities after all procurement and
              liquidation documents are verified.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 space-y-2 text-xs">
                {[
                  { label: "Procurement Submitted", done: form.documents.length > 0 },
                  {
                    label: "Liquidation Report Filed",
                    done: hasLiquidationFiled(form),
                  },
                  { label: "Equipment Documented", done: form.items.length > 0 },
                  { label: "Account Untagged", done: form.untagged },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 py-1">
                    <CheckCircle
                      className={`w-4 h-4 ${s.done ? "text-green-500" : "text-gray-300"}`}
                    />
                    <span className={s.done ? "text-gray-800" : "text-gray-400"}>{s.label}</span>
                  </div>
                ))}
              </div>
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <Archive className="w-3.5 h-3.5 text-blue-500" />
                    Approved: <strong>{summary.approvedAmount}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5 text-green-500" />
                    Disbursed: <strong>{summary.totalDisbursed}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                    Remaining: <strong>{summary.remainingBalance}</strong>
                  </div>
                </div>
                {!form.untagged && !stored?.submitted && (
                  <button
                    type="button"
                    onClick={() => setAccountUntagged(applicant.id)}
                    className="w-full py-2.5 rounded-lg text-white text-sm font-semibold"
                    style={{ background: DOST_BLUE }}
                  >
                    Proceed with Account Untagging
                  </button>
                )}
                {form.untagged && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Account successfully untagged.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!stored?.submitted && onSubmitSuccess && (
        <div className="print:hidden pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allowWhenDemo(prerequisiteOk)}
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: DOST_BLUE }}
          >
            Submit &amp; Continue to Refund Monitoring →
          </button>
        </div>
      )}
    </ModuleWorkflowLayout>
  );
}
