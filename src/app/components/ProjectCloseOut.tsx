/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState } from "react";
import {
  CheckCircle,
  ClipboardCheck,
  FileText,
  Upload,
} from "lucide-react";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { useApplicantChangeEffect, useApplicantSyncedState } from "../hooks/useApplicantSyncedState";
import { ModuleFormHeader } from "./ModuleFormHeader";
import { StaffApplicantBanner, StaffApplicantPicker } from "./StaffApplicantPicker";
import {
  getCloseOutForm,
  hasCloseOutComplete,
  hasCloseOutPrerequisite,
  saveCloseOutDraft,
  submitCloseOut,
} from "../utils/projectCloseOut";
import type { EquipmentInventoryRow } from "../api/types";
import { formatFormMention } from "../constants/setupForms";
import { allowWhenDemo } from "../utils/demoMode";
import { MODULE_HEADER, MODULE_BODY } from "./moduleTheme";

interface ProjectCloseOutProps {
  user?: import("../store/authStore").AuthUser | null;
  onSubmitSuccess?: () => void;
}

const DOST_BLUE = "#0C2461";

export function ProjectCloseOut({ user, onSubmitSuccess }: ProjectCloseOutProps) {
  const { applicant, isStaff } = useStaffApplicant(user);
  const [form, setForm] = useApplicantSyncedState(applicant, getCloseOutForm);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");

  useApplicantChangeEffect(applicant, () => {
    setErrors([]);
    setNotice("");
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

  const handleSubmit = () => {
    const errs = submitCloseOut(applicant.id, user?.email ?? "staff");
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setNotice("Project close-out complete. Certificate of ownership recorded.");
    onSubmitSuccess?.();
  };

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

          <div>
            <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" /> Equipment Inventory
            </h3>
            <div className="space-y-3">
              {form.equipmentInventory.map((row) => (
                <div key={row.id} className="grid gap-2 sm:grid-cols-4 border border-gray-100 rounded-lg p-3">
                  <input
                    className="border rounded-lg px-2 py-1.5 text-sm"
                    placeholder="Description"
                    value={row.description}
                    onChange={(e) => updateInventoryRow(row.id, "description", e.target.value)}
                  />
                  <input
                    className="border rounded-lg px-2 py-1.5 text-sm"
                    placeholder="Serial No."
                    value={row.serialNumber}
                    onChange={(e) => updateInventoryRow(row.id, "serialNumber", e.target.value)}
                  />
                  <input
                    className="border rounded-lg px-2 py-1.5 text-sm"
                    placeholder="Cost"
                    value={row.acquisitionCost}
                    onChange={(e) => updateInventoryRow(row.id, "acquisitionCost", e.target.value)}
                  />
                  <input
                    className="border rounded-lg px-2 py-1.5 text-sm"
                    placeholder="Location"
                    value={row.location}
                    onChange={(e) => updateInventoryRow(row.id, "location", e.target.value)}
                  />
                </div>
              ))}
            </div>
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
              disabled={!allowWhenDemo(true)}
              className="w-full py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: "#059669" }}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Complete Project Close-Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
