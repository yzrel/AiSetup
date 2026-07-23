/**
 * Author: Yzrel Jade B. Eborde
 *
 * Per-tranche editor for Letter Request for Withdrawal: supplier, equipment
 * from project proposal budget, generate/send letter, signed upload, and
 * (tranche 1) quotations + equipment photos.
 */

import { useMemo, useState } from "react";
import {
  CheckCircle,
  Download,
  FileText,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import type { AuthUser } from "../store/authStore";
import type { Applicant } from "../store/applicantStore";
import type {
  LandBankForm,
  ModuleDocument,
  WithdrawalEquipmentRow,
  WithdrawalLetterDraft,
  WithdrawalTranchePackage,
} from "../api/types";
import { DocumentDeliveryPanel } from "./DocumentDeliveryPanel";
import { SubmittedFileActions } from "./SubmittedFileActions";
import { readAndUploadModuleDocument } from "../utils/readFileAsDataUrl";
import {
  availableProposalBudgetItems,
  budgetRowToWithdrawalEquipment,
  getTranchePackage,
  isTranche1Complete,
  isTranche2Complete,
  saveLandBankDraft,
  updateTranchePackage,
  WITHDRAWAL_SIGNED_KEY,
} from "../utils/landBankWithdrawal";
import {
  downloadWithdrawalRequestLetterPdf,
  emptyWithdrawalLetterDraft,
  formatWithdrawalPhp,
  sumWithdrawalEquipment,
  validateWithdrawalLetterGenerate,
} from "../utils/withdrawalRequestLetter";
import { DOST_BLUE } from "./moduleTheme";

function newEquipmentId(): string {
  return `we-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface WithdrawalTranchePanelProps {
  applicant: Applicant;
  user?: AuthUser | null;
  form: LandBankForm;
  tranche: 1 | 2;
  readOnly?: boolean;
  isStaff?: boolean;
}

export function WithdrawalTranchePanel({
  applicant,
  user,
  form,
  tranche,
  readOnly,
  isStaff,
}: WithdrawalTranchePanelProps) {
  const pkg = getTranchePackage(form, tranche);
  const signedKey =
    tranche === 1 ? WITHDRAWAL_SIGNED_KEY.first : WITHDRAWAL_SIGNED_KEY.second;
  const documentTitle = `Letter Request for Withdrawal (${tranche === 1 ? "1st" : "2nd"} Tranche)`;
  const uploadedBy = user?.email ?? applicant.emailAddress ?? "applicant";

  const [selectedBudgetIds, setSelectedBudgetIds] = useState<string[]>([]);
  const [letterNotice, setLetterNotice] = useState("");
  const [letterErrors, setLetterErrors] = useState<string[]>([]);

  const availableBudget = useMemo(
    () => availableProposalBudgetItems(applicant, form),
    [applicant, form],
  );

  const total = sumWithdrawalEquipment(pkg.equipment);
  const complete =
    tranche === 1 ? isTranche1Complete(pkg) : isTranche2Complete(pkg);

  const persist = (next: LandBankForm) => {
    saveLandBankDraft(applicant.id, next);
  };

  const patchPkg = (patch: Partial<WithdrawalTranchePackage>) => {
    persist(updateTranchePackage(form, tranche, patch));
  };

  const draftForLetter = (): WithdrawalLetterDraft => {
    const base =
      pkg.letterDraft ?? emptyWithdrawalLetterDraft(applicant, pkg.supplierName);
    return {
      ...base,
      supplierName: pkg.supplierName || base.supplierName,
      firmName: base.firmName || applicant.enterpriseName,
    };
  };

  const handleAddSelectedBudget = () => {
    if (!selectedBudgetIds.length) return;
    const additions = availableBudget
      .filter((b) => selectedBudgetIds.includes(b.id))
      .map(budgetRowToWithdrawalEquipment);
    patchPkg({ equipment: [...pkg.equipment, ...additions] });
    setSelectedBudgetIds([]);
  };

  const handleAddEmptyRow = () => {
    const row: WithdrawalEquipmentRow = {
      id: newEquipmentId(),
      item: "",
      amount: "",
    };
    patchPkg({ equipment: [...pkg.equipment, row] });
  };

  const handleUpdateRow = (
    id: string,
    field: "item" | "amount",
    value: string,
  ) => {
    patchPkg({
      equipment: pkg.equipment.map((r) =>
        r.id === id ? { ...r, [field]: value } : r,
      ),
    });
  };

  const handleDeleteRow = (id: string) => {
    patchPkg({ equipment: pkg.equipment.filter((r) => r.id !== id) });
  };

  const handleGenerate = () => {
    const draft = {
      ...draftForLetter(),
      supplierName: pkg.supplierName,
      generatedAt: new Date().toISOString(),
    };
    const errors = validateWithdrawalLetterGenerate(pkg, draft);
    if (errors.length) {
      setLetterErrors(errors);
      setLetterNotice("");
      return;
    }
    setLetterErrors([]);
    patchPkg({ letterDraft: draft, status: pkg.status === "draft" ? "draft" : pkg.status });
    downloadWithdrawalRequestLetterPdf(draft, { ...pkg, supplierName: pkg.supplierName }, applicant.applicationId);
    setLetterNotice("Letter generated — use print dialog to save as PDF.");
    setTimeout(() => setLetterNotice(""), 4000);
  };

  const handleMultiUpload = async (
    field: "quotations" | "equipmentPhotos",
    files: FileList | null,
  ) => {
    if (!files?.length || readOnly) return;
    const docs: ModuleDocument[] = [];
    for (const file of Array.from(files)) {
      docs.push(
        await readAndUploadModuleDocument(file, uploadedBy, {
          applicantId: applicant.id,
          moduleKey: `withdrawal-t${tranche}-${field}`,
        }),
      );
    }
    patchPkg({ [field]: [...(pkg[field] ?? []), ...docs] });
  };

  const handleRemoveMulti = (
    field: "quotations" | "equipmentPhotos",
    index: number,
  ) => {
    const list = [...(pkg[field] ?? [])];
    list.splice(index, 1);
    patchPkg({ [field]: list });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600">
          Build the letter from project proposal budgetary equipment, enter the
          selected supplier, generate the letter, email it to the client for
          signature, then upload the signed copy
          {tranche === 1 ? " plus quotations and equipment photos" : ""}.
        </p>
        {complete ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
            <CheckCircle className="w-3.5 h-3.5" />
            Tranche {tranche} complete
          </span>
        ) : (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
            Incomplete
          </span>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">
          Selected supplier
        </label>
        <input
          type="text"
          value={pkg.supplierName}
          onChange={(e) => patchPkg({ supplierName: e.target.value })}
          disabled={readOnly || !isStaff}
          placeholder="e.g. MCH COMMERCIAL"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Appears in the letter as “for the purchase of the following equipment
          at [supplier]”.
        </p>
      </div>

      {/* Equipment from proposal */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-700">
            Equipment list
          </span>
          <span className="text-xs font-semibold text-gray-600">
            Total: {formatWithdrawalPhp(total)}
          </span>
        </div>
        <div className="p-4 space-y-3">
          {!readOnly && isStaff && (
            <div className="space-y-2 bg-blue-50/60 border border-blue-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700">
                Add from Project Proposal budgetary requirement
              </p>
              {availableBudget.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  No remaining budget lines available (all assigned or proposal
                  has no items).
                </p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {availableBudget.map((b) => (
                    <label
                      key={b.id}
                      className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={selectedBudgetIds.includes(b.id)}
                        onChange={(e) => {
                          setSelectedBudgetIds((prev) =>
                            e.target.checked
                              ? [...prev, b.id]
                              : prev.filter((id) => id !== b.id),
                          );
                        }}
                      />
                      <span className="min-w-0">
                        <span className="font-medium">{b.item}</span>
                        <span className="text-gray-500">
                          {" "}
                          —{" "}
                          {b.setupShare || b.total || b.unitCost || "₱0"}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAddSelectedBudget}
                  disabled={!selectedBudgetIds.length}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: DOST_BLUE }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add selected
                </button>
                <button
                  type="button"
                  onClick={handleAddEmptyRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add blank row
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-2 font-semibold">Equipment / item</th>
                  <th className="py-2 pr-2 font-semibold w-36">Amount</th>
                  {!readOnly && isStaff && <th className="py-2 w-10" />}
                </tr>
              </thead>
              <tbody>
                {pkg.equipment.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-gray-400 italic">
                      No equipment rows yet.
                    </td>
                  </tr>
                ) : (
                  pkg.equipment.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50">
                      <td className="py-1.5 pr-2">
                        <input
                          value={row.item}
                          onChange={(e) =>
                            handleUpdateRow(row.id, "item", e.target.value)
                          }
                          disabled={readOnly || !isStaff}
                          className="w-full border border-gray-200 rounded px-2 py-1.5 disabled:bg-gray-50"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          value={row.amount}
                          onChange={(e) =>
                            handleUpdateRow(row.id, "amount", e.target.value)
                          }
                          disabled={readOnly || !isStaff}
                          placeholder="785000"
                          className="w-full border border-gray-200 rounded px-2 py-1.5 disabled:bg-gray-50"
                        />
                      </td>
                      {!readOnly && isStaff && (
                        <td className="py-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pkg.equipment.length > 0 && (
            <p className="text-xs text-gray-600 text-right">
              Line total preview: <strong>{formatWithdrawalPhp(total)}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Generate letter */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-sm text-gray-700">
          <FileText className="w-4 h-4 text-blue-600" />
          Generate letter request
        </div>
        {letterErrors.length > 0 && (
          <ul className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 space-y-0.5">
            {letterErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        {letterNotice && (
          <p className="text-xs text-green-700 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            {letterNotice}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={readOnly}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: DOST_BLUE }}
          >
            <Download className="w-4 h-4" />
            Generate &amp; print letter (PDF)
          </button>
        </div>
        {pkg.letterDraft?.generatedAt && (
          <p className="text-[11px] text-gray-400">
            Last generated:{" "}
            {new Date(pkg.letterDraft.generatedAt).toLocaleString("en-PH")}
          </p>
        )}
      </div>

      <DocumentDeliveryPanel
        applicant={applicant}
        user={user}
        moduleKey={signedKey}
        documentTitle={documentTitle}
        sendTarget="client"
        onSent={() => {
          if (pkg.status === "draft" || !pkg.status) {
            patchPkg({ status: "sent" });
          }
        }}
        onSignedUpload={(doc) => {
          patchPkg({
            signedLetter: {
              fileName: doc.fileName,
              mimeType: doc.mimeType,
              dataUrl: doc.dataUrl,
              uploadedAt: doc.uploadedAt,
              uploadedBy: doc.uploadedBy,
            },
            status: "signed",
          });
        }}
        onSignedRemove={() => {
          patchPkg({ signedLetter: null, status: "sent" });
        }}
      />

      {tranche === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MultiDocUploadBlock
            title="Quotations / canvass"
            hint="Upload supplier quotations for equipment in this tranche."
            docs={pkg.quotations ?? []}
            inputId={`wd-quotes-t${tranche}`}
            readOnly={readOnly}
            applicantId={applicant.id}
            onUpload={(files) => handleMultiUpload("quotations", files)}
            onRemove={(i) => handleRemoveMulti("quotations", i)}
          />
          <MultiDocUploadBlock
            title="Equipment acquired photos"
            hint="Upload photos of the equipment acquired under the 1st tranche."
            docs={pkg.equipmentPhotos ?? []}
            inputId={`wd-photos-t${tranche}`}
            accept="image/*,.pdf"
            readOnly={readOnly}
            applicantId={applicant.id}
            onUpload={(files) => handleMultiUpload("equipmentPhotos", files)}
            onRemove={(i) => handleRemoveMulti("equipmentPhotos", i)}
          />
        </div>
      )}
    </div>
  );
}

function MultiDocUploadBlock({
  title,
  hint,
  docs,
  inputId,
  accept = ".pdf,image/*,.doc,.docx",
  readOnly,
  applicantId,
  onUpload,
  onRemove,
}: {
  title: string;
  hint: string;
  docs: ModuleDocument[];
  inputId: string;
  accept?: string;
  readOnly?: boolean;
  applicantId?: string;
  onUpload: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
      </div>
      {!readOnly && (
        <>
          <input
            type="file"
            id={inputId}
            className="hidden"
            accept={accept}
            multiple
            onChange={(e) => {
              onUpload(e.target.files);
              e.target.value = "";
            }}
          />
          <label
            htmlFor={inputId}
            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload files
          </label>
        </>
      )}
      <div className="space-y-1">
        {docs.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No files uploaded yet.</p>
        ) : (
          docs.map((d, i) => (
            <div
              key={`${d.fileName}-${d.uploadedAt}-${i}`}
              className="flex flex-wrap items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
            >
              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span className="flex-1 min-w-0 font-medium truncate">
                {d.fileName}
              </span>
              <SubmittedFileActions
                fileName={d.fileName}
                mimeType={d.mimeType}
                dataUrl={d.dataUrl}
                fileId={d.fileId}
                applicantId={applicantId}
                compact
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
