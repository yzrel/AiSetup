/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState } from "react";
import {
  CheckCircle,
  ClipboardCheck,
  Eye,
  FileText,
  Pencil,
  Plus,
  Printer,
  Trash2,
  Upload,
} from "lucide-react";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { useApplicantChangeEffect, useApplicantSyncedState } from "../hooks/useApplicantSyncedState";
import { ModuleFormHeader } from "./ModuleFormHeader";
import { StaffApplicantBanner, StaffApplicantPicker } from "./StaffApplicantPicker";
import {
  emptyInventoryRow,
  getCloseOutForm,
  hasCloseOutComplete,
  hasCloseOutPrerequisite,
  inventoryAmountTotal,
  saveCloseOutDraft,
  submitCloseOut,
} from "../utils/projectCloseOut";
import type { EquipmentInventoryRow } from "../api/types";
import { formatFormMention } from "../constants/setupForms";
import { formatInventoryAmountTotal } from "../constants/inventoryOfEquipmentLayout";
import { allowWhenDemo } from "../utils/demoMode";
import { MODULE_HEADER, MODULE_BODY } from "./moduleTheme";
import { notifyCloseoutComplete } from "../utils/notificationHelpers";
import { InventoryOfEquipmentPreview } from "./InventoryOfEquipmentPreview";
import { printInventoryOfEquipmentPdf } from "../utils/inventoryOfEquipmentPrint";

interface ProjectCloseOutProps {
  user?: import("../store/authStore").AuthUser | null;
  onSubmitSuccess?: () => void;
}

const DOST_BLUE = "#0C2461";

type InventoryView = "edit" | "preview";

export function ProjectCloseOut({ user, onSubmitSuccess }: ProjectCloseOutProps) {
  const { applicant, isStaff } = useStaffApplicant(user);
  const [form, setForm] = useApplicantSyncedState(applicant, getCloseOutForm);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [inventoryView, setInventoryView] = useState<InventoryView>("edit");

  useApplicantChangeEffect(applicant, () => {
    setErrors([]);
    setNotice("");
    setInventoryView("edit");
  });

  if (!applicant) {
    return (
      <div className="p-8 text-center text-gray-500">
        Select an applicant to manage project close-out.
      </div>
    );
  }

  if (!hasCloseOutPrerequisite(applicant) && !isStaff) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
        Complete refund monitoring setup before project close-out.
      </div>
    );
  }

  const patch = (partial: Partial<typeof form>) => {
    const next = { ...form, ...partial };
    setForm(next);
    saveCloseOutDraft(applicant.id, next);
  };

  const updateInventoryRow = (id: string, field: keyof EquipmentInventoryRow, value: string) => {
    patch({
      equipmentInventory: form.equipmentInventory.map((r) =>
        r.id === id ? { ...r, [field]: value } : r,
      ),
    });
  };

  const addInventoryRow = () => {
    patch({
      equipmentInventory: [...form.equipmentInventory, emptyInventoryRow()],
    });
  };

  const removeInventoryRow = (id: string) => {
    const next = form.equipmentInventory.filter((r) => r.id !== id);
    patch({
      equipmentInventory: next.length > 0 ? next : [emptyInventoryRow()],
    });
  };

  const handlePrint = () => {
    void printInventoryOfEquipmentPdf({
      form,
      applicationId: applicant.applicationId,
    });
  };

  const handleSubmit = () => {
    const errs = submitCloseOut(applicant.id, user?.email ?? "staff");
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setNotice("Project close-out complete. Certificate of ownership recorded.");
    notifyCloseoutComplete(applicant);
    onSubmitSuccess?.();
  };

  const amountTotal = inventoryAmountTotal(form);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div
          className={`${MODULE_HEADER} text-white`}
          style={{ background: `linear-gradient(135deg,${DOST_BLUE},#1a3a7a)` }}
        >
          <ModuleFormHeader
            formKey="010"
            title="Project Close-Out"
            subtitle="Terminal report, equipment inventory, and certificate of ownership"
          />
          {isStaff && (
            <StaffApplicantPicker
              user={user}
              label="Close-out applicant"
              className="mt-4 p-3 bg-white/10 rounded-xl border border-white/20"
            />
          )}
        </div>
        <StaffApplicantBanner user={user} />

        <div className={MODULE_BODY}>
          {hasCloseOutComplete(applicant) && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
              <CheckCircle className="w-5 h-5" /> Project marked completed.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                key: "terminalReportFileName" as const,
                label: formatFormMention("010"),
              },
              {
                key: "auditedFinancialFileName" as const,
                label: "Audited Financial Report",
              },
              {
                key: "equipmentAcknowledgementFileName" as const,
                label: "Equipment Acknowledgement Receipt",
              },
            ].map(({ key, label }) => (
              <div key={key} className="border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{label}</p>
                <label className="flex items-center gap-2 text-sm text-blue-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  {form[key] || "Upload PDF"}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) patch({ [key]: f.name });
                    }}
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" />
                {formatFormMention("006")}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setInventoryView("edit")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold ${
                      inventoryView === "edit"
                        ? "bg-[#0C2461] text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setInventoryView("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold ${
                      inventoryView === "preview"
                        ? "bg-[#0C2461] text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0C2461]/30 text-[#0C2461] text-xs font-semibold hover:bg-blue-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </div>
            </div>

            {inventoryView === "edit" ? (
              <div className="p-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Project Title
                    </span>
                    <input
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                      value={form.inventoryProjectTitle ?? ""}
                      onChange={(e) => patch({ inventoryProjectTitle: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Project Cooperator
                    </span>
                    <input
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                      value={form.inventoryProjectCooperator ?? ""}
                      onChange={(e) => patch({ inventoryProjectCooperator: e.target.value })}
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Inventory of Acquired Equipment (SETUP Funded)
                  </p>
                  {form.equipmentInventory.map((row, index) => (
                    <div
                      key={row.id}
                      className="border border-gray-100 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-500">
                          Item {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeInventoryRow(row.id)}
                          className="text-red-600 hover:bg-red-50 rounded-lg p-1.5"
                          aria-label={`Remove inventory item ${index + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                        <input
                          className="border rounded-lg px-2 py-1.5 text-sm"
                          placeholder="QTY"
                          value={row.qty}
                          onChange={(e) => updateInventoryRow(row.id, "qty", e.target.value)}
                        />
                        <input
                          className="border rounded-lg px-2 py-1.5 text-sm sm:col-span-2 lg:col-span-2"
                          placeholder="Name / Description / Spec"
                          value={row.description}
                          onChange={(e) =>
                            updateInventoryRow(row.id, "description", e.target.value)
                          }
                        />
                        <input
                          className="border rounded-lg px-2 py-1.5 text-sm"
                          placeholder="Amount"
                          value={row.amount}
                          onChange={(e) => updateInventoryRow(row.id, "amount", e.target.value)}
                        />
                        <input
                          className="border rounded-lg px-2 py-1.5 text-sm"
                          placeholder="Property No."
                          value={row.propertyNo}
                          onChange={(e) =>
                            updateInventoryRow(row.id, "propertyNo", e.target.value)
                          }
                        />
                        <input
                          className="border rounded-lg px-2 py-1.5 text-sm"
                          placeholder="Date acquired"
                          value={row.dateAcquired}
                          onChange={(e) =>
                            updateInventoryRow(row.id, "dateAcquired", e.target.value)
                          }
                        />
                        <input
                          className="border rounded-lg px-2 py-1.5 text-sm sm:col-span-3 lg:col-span-6"
                          placeholder="Remarks"
                          value={row.remarks}
                          onChange={(e) => updateInventoryRow(row.id, "remarks", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={addInventoryRow}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0C2461] hover:underline"
                    >
                      <Plus className="w-4 h-4" />
                      Add equipment row
                    </button>
                    <p className="text-sm font-semibold text-gray-700">
                      TOTAL: {formatInventoryAmountTotal(amountTotal) || "—"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 pt-2 border-t border-gray-100">
                  <label className="block text-sm sm:col-span-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Inventory Conducted by
                    </span>
                    <input
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Regional Office Representative"
                      value={form.inventoryConductedBy ?? ""}
                      onChange={(e) => patch({ inventoryConductedBy: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Date</span>
                    <input
                      type="date"
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                      value={form.inventoryConductedDate ?? ""}
                      onChange={(e) => patch({ inventoryConductedDate: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Witnessed by
                    </span>
                    <input
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Cooperator / Authorized Representative"
                      value={form.inventoryWitnessedBy ?? ""}
                      onChange={(e) => patch({ inventoryWitnessedBy: e.target.value })}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100">
                <InventoryOfEquipmentPreview
                  form={form}
                  applicationId={applicant.applicationId}
                  onPrint={handlePrint}
                  compact
                />
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={form.certificateOfOwnershipIssued}
              onChange={(e) =>
                patch({
                  certificateOfOwnershipIssued: e.target.checked,
                  certificateIssuedDate: e.target.checked
                    ? new Date().toISOString().split("T")[0]
                    : undefined,
                })
              }
              className="mt-1"
            />
            <div className="text-sm">
              <p className="font-semibold text-gray-800">Certificate of Ownership & IRP issued</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Confirm full refund and technology transfer fee (0.5%) are settled and ownership
                transferred per SETUP Guidelines.
              </p>
            </div>
          </label>

          {errors.length > 0 && (
            <ul className="text-sm text-red-600 space-y-1">
              {errors.map((e) => (
                <li key={e}>• {e}</li>
              ))}
            </ul>
          )}
          {notice && <p className="text-sm text-green-700">{notice}</p>}

          {isStaff && !hasCloseOutComplete(applicant) && (
            <button
              type="button"
              onClick={handleSubmit}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold ${
                allowWhenDemo(false) ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              <FileText className="w-5 h-5" />
              Complete Project Close-Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
