/**
 * Author: Yzrel Jade B. Eborde
 *
 * Per-tranche editor for Letter Request for Withdrawal: supplier blocks with
 * nested equipment, letter preview/generate, signed upload, and (tranche 1)
 * quotations + equipment photos.
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
  WithdrawalSupplierBlock,
  WithdrawalTrancheNum,
  WithdrawalTranchePackage,
} from "../api/types";
import { DocumentDeliveryPanel } from "./DocumentDeliveryPanel";
import { SubmittedFileActions } from "./SubmittedFileActions";
import { WithdrawalRequestLetterPreview } from "./WithdrawalRequestLetterPreview";
import { readAndUploadModuleDocument } from "../utils/readFileAsDataUrl";
import {
  availableProposalBudgetItems,
  budgetRowToWithdrawalEquipment,
  emptySupplierBlock,
  getSelectedSupplierBlock,
  getTranchePackage,
  isTrancheComplete,
  saveLandBankDraft,
  sumTrancheEquipment,
  trancheDisplayLabel,
  trancheSignedKey,
  updateTranchePackage,
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
  tranche: WithdrawalTrancheNum;
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
  const signedKey = trancheSignedKey(tranche);
  const trancheLabel = trancheDisplayLabel(tranche);
  const documentTitle = `Letter Request for Withdrawal (${trancheLabel} Tranche)`;
  const uploadedBy = user?.email ?? applicant.emailAddress ?? "applicant";

  const canEditSupplierEquipment = !readOnly;
  const canEditStaffWorkflow = !!isStaff && !readOnly;

  const [budgetPickerSupplierId, setBudgetPickerSupplierId] = useState<string | null>(
    null,
  );
  const [selectedBudgetIds, setSelectedBudgetIds] = useState<string[]>([]);
  const [letterNotice, setLetterNotice] = useState("");
  const [letterErrors, setLetterErrors] = useState<string[]>([]);

  const availableBudget = useMemo(
    () => availableProposalBudgetItems(applicant, form),
    [applicant, form],
  );

  const selectedSupplier = getSelectedSupplierBlock(pkg);
  const total = sumTrancheEquipment(pkg);
  const complete = isTrancheComplete(pkg, tranche);

  const persist = (next: LandBankForm) => {
    saveLandBankDraft(applicant.id, next);
  };

  const patchPkg = (patch: Partial<WithdrawalTranchePackage>) => {
    if (!canEditSupplierEquipment && !canEditStaffWorkflow) return;
    const staffOnlyKeys: (keyof WithdrawalTranchePackage)[] = [
      "letterDraft",
      "signedLetter",
      "quotations",
      "equipmentPhotos",
      "status",
    ];
    if (!canEditStaffWorkflow) {
      for (const key of staffOnlyKeys) {
        if (key in patch) return;
      }
    }
    persist(updateTranchePackage(form, tranche, patch));
  };

  const updateSuppliers = (suppliers: WithdrawalSupplierBlock[]) => {
    patchPkg({
      suppliers,
      selectedSupplierId:
        pkg.selectedSupplierId && suppliers.some((s) => s.id === pkg.selectedSupplierId)
          ? pkg.selectedSupplierId
          : suppliers[0]?.id ?? null,
    });
  };

  const patchSupplier = (
    supplierId: string,
    patch: Partial<WithdrawalSupplierBlock>,
  ) => {
    updateSuppliers(
      pkg.suppliers.map((s) => (s.id === supplierId ? { ...s, ...patch } : s)),
    );
  };

  const handleAddSupplier = () => {
    if (!canEditSupplierEquipment) return;
    const block = emptySupplierBlock();
    updateSuppliers([...pkg.suppliers, block]);
    setBudgetPickerSupplierId(block.id);
  };

  const handleRemoveSupplier = (supplierId: string) => {
    if (!canEditSupplierEquipment) return;
    const next = pkg.suppliers.filter((s) => s.id !== supplierId);
    updateSuppliers(next);
    if (budgetPickerSupplierId === supplierId) {
      setBudgetPickerSupplierId(null);
      setSelectedBudgetIds([]);
    }
  };

  const draftForLetter = (): WithdrawalLetterDraft => {
    const supplierName = selectedSupplier?.name ?? "";
    const base = pkg.letterDraft ?? emptyWithdrawalLetterDraft(applicant, supplierName);
    return {
      ...base,
      supplierName: supplierName || base.supplierName,
      firmName: base.firmName || applicant.enterpriseName,
    };
  };

  const handleAddSelectedBudget = (supplierId: string) => {
    if (!canEditSupplierEquipment || !selectedBudgetIds.length) return;
    const supplier = pkg.suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;
    const additions = availableBudget
      .filter((b) => selectedBudgetIds.includes(b.id))
      .map(budgetRowToWithdrawalEquipment);
    patchSupplier(supplierId, {
      equipment: [...supplier.equipment, ...additions],
    });
    setSelectedBudgetIds([]);
  };

  const handleAddEmptyRow = (supplierId: string) => {
    if (!canEditSupplierEquipment) return;
    const supplier = pkg.suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;
    const row: WithdrawalEquipmentRow = {
      id: newEquipmentId(),
      item: "",
      amount: "",
    };
    patchSupplier(supplierId, { equipment: [...supplier.equipment, row] });
  };

  const handleUpdateRow = (
    supplierId: string,
    rowId: string,
    field: "item" | "amount",
    value: string,
  ) => {
    if (!canEditSupplierEquipment) return;
    const supplier = pkg.suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;
    patchSupplier(supplierId, {
      equipment: supplier.equipment.map((r) =>
        r.id === rowId ? { ...r, [field]: value } : r,
      ),
    });
  };

  const handleDeleteRow = (supplierId: string, rowId: string) => {
    if (!canEditSupplierEquipment) return;
    const supplier = pkg.suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;
    patchSupplier(supplierId, {
      equipment: supplier.equipment.filter((r) => r.id !== rowId),
    });
  };

  const handleGenerate = () => {
    if (!canEditStaffWorkflow || !selectedSupplier) return;
    const draft = {
      ...draftForLetter(),
      supplierName: selectedSupplier.name,
      generatedAt: new Date().toISOString(),
    };
    const errors = validateWithdrawalLetterGenerate(pkg, draft);
    if (errors.length) {
      setLetterErrors(errors);
      setLetterNotice("");
      return;
    }
    setLetterErrors([]);
    patchPkg({
      letterDraft: draft,
      status: pkg.status === "draft" ? "draft" : pkg.status,
    });
    downloadWithdrawalRequestLetterPdf(
      draft,
      pkg,
      applicant.applicationId,
      selectedSupplier,
    );
    setLetterNotice("Letter generated — use print dialog to save as PDF.");
    setTimeout(() => setLetterNotice(""), 4000);
  };

  const handleMultiUpload = async (
    field: "quotations" | "equipmentPhotos",
    files: FileList | null,
  ) => {
    if (!files?.length || !canEditStaffWorkflow) return;
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
    if (!canEditStaffWorkflow) return;
    const list = [...(pkg[field] ?? [])];
    list.splice(index, 1);
    patchPkg({ [field]: list });
  };

  const showPreview =
    !!selectedSupplier?.name.trim() &&
    (selectedSupplier.equipment.some((r) => r.item.trim() || r.amount.trim()) ??
      false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600">
          {canEditSupplierEquipment
            ? `Add supplier(s) and equipment for this tranche${isStaff ? ", preview and generate the letter, email it to the cooperator for signature, then upload the signed copy" : ""}${tranche === 1 ? (isStaff ? " plus quotations and equipment photos" : "") : ""}.`
            : "View the withdrawal letter package prepared for this tranche."}
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

      {/* Supplier blocks */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-700">Suppliers &amp; equipment</span>
          <span className="text-xs font-semibold text-gray-600">
            Tranche total: {formatWithdrawalPhp(total)}
          </span>
        </div>

        {pkg.suppliers.length === 0 ? (
          <p className="text-sm text-gray-500 italic border border-dashed border-gray-200 rounded-lg p-4">
            No suppliers yet. Add a supplier and enter equipment lines for this tranche.
          </p>
        ) : (
          pkg.suppliers.map((supplier) => (
            <SupplierEquipmentCard
              key={supplier.id}
              supplier={supplier}
              canEdit={canEditSupplierEquipment}
              availableBudget={availableBudget}
              budgetPickerOpen={budgetPickerSupplierId === supplier.id}
              onToggleBudgetPicker={() =>
                setBudgetPickerSupplierId((id) =>
                  id === supplier.id ? null : supplier.id,
                )
              }
              selectedBudgetIds={selectedBudgetIds}
              onSelectedBudgetChange={setSelectedBudgetIds}
              onNameChange={(name) => patchSupplier(supplier.id, { name })}
              onRemove={() => handleRemoveSupplier(supplier.id)}
              onAddSelectedBudget={() => handleAddSelectedBudget(supplier.id)}
              onAddEmptyRow={() => handleAddEmptyRow(supplier.id)}
              onUpdateRow={(rowId, field, value) =>
                handleUpdateRow(supplier.id, rowId, field, value)
              }
              onDeleteRow={(rowId) => handleDeleteRow(supplier.id, rowId)}
            />
          ))
        )}

        {canEditSupplierEquipment && (
          <button
            type="button"
            onClick={handleAddSupplier}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
            Add supplier
          </button>
        )}
      </div>

      {/* Letter preview & generate (staff) */}
      {(canEditStaffWorkflow || showPreview) && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-sm text-gray-700">
            <FileText className="w-4 h-4 text-blue-600" />
            Letter preview
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

          {showPreview && selectedSupplier ? (
            <WithdrawalRequestLetterPreview
              draft={draftForLetter()}
              pkg={pkg}
              selectedSupplier={selectedSupplier}
              applicationId={applicant.applicationId}
              onPrint={canEditStaffWorkflow ? handleGenerate : undefined}
              showToolbar={canEditStaffWorkflow}
            />
          ) : (
            <p className="text-xs text-gray-500 italic">
              Select a supplier for the letter and add at least one equipment row to
              preview.
            </p>
          )}

          {canEditStaffWorkflow && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!showPreview}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: DOST_BLUE }}
              >
                <Download className="w-4 h-4" />
                Generate &amp; print letter (PDF)
              </button>
            </div>
          )}

          {pkg.letterDraft?.generatedAt && (
            <p className="text-[11px] text-gray-400">
              Last generated:{" "}
              {new Date(pkg.letterDraft.generatedAt).toLocaleString("en-PH")}
            </p>
          )}
        </div>
      )}

      {canEditStaffWorkflow && (
        <DocumentDeliveryPanel
          applicant={applicant}
          user={user}
          moduleKey={signedKey}
          documentTitle={documentTitle}
          sendTarget="client"
          readOnly={false}
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
      )}

      {!canEditStaffWorkflow && pkg.signedLetter && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-gray-700">Signed letter</p>
          <SubmittedFileActions
            fileName={pkg.signedLetter.fileName}
            mimeType={pkg.signedLetter.mimeType}
            dataUrl={pkg.signedLetter.dataUrl}
            fileId={pkg.signedLetter.fileId}
            applicantId={applicant.id}
          />
        </div>
      )}

      {tranche === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MultiDocUploadBlock
            title="Quotations / canvass"
            hint="Upload supplier quotations for equipment in this tranche."
            docs={pkg.quotations ?? []}
            inputId={`wd-quotes-t${tranche}`}
            readOnly={!canEditStaffWorkflow}
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
            readOnly={!canEditStaffWorkflow}
            applicantId={applicant.id}
            onUpload={(files) => handleMultiUpload("equipmentPhotos", files)}
            onRemove={(i) => handleRemoveMulti("equipmentPhotos", i)}
          />
        </div>
      )}
    </div>
  );
}

function SupplierEquipmentCard({
  supplier,
  canEdit,
  availableBudget,
  budgetPickerOpen,
  onToggleBudgetPicker,
  selectedBudgetIds,
  onSelectedBudgetChange,
  onNameChange,
  onRemove,
  onAddSelectedBudget,
  onAddEmptyRow,
  onUpdateRow,
  onDeleteRow,
}: {
  supplier: WithdrawalSupplierBlock;
  canEdit: boolean;
  availableBudget: ReturnType<typeof availableProposalBudgetItems>;
  budgetPickerOpen: boolean;
  onToggleBudgetPicker: () => void;
  selectedBudgetIds: string[];
  onSelectedBudgetChange: (ids: string[]) => void;
  onNameChange: (name: string) => void;
  onRemove: () => void;
  onAddSelectedBudget: () => void;
  onAddEmptyRow: () => void;
  onUpdateRow: (rowId: string, field: "item" | "amount", value: string) => void;
  onDeleteRow: (rowId: string) => void;
}) {
  const supplierTotal = sumWithdrawalEquipment(supplier.equipment);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={supplier.name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={!canEdit}
          placeholder="Supplier name (e.g. MCH COMMERCIAL)"
          className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 bg-white"
        />
        <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
          Subtotal: {formatWithdrawalPhp(supplierTotal)}
        </span>
        {canEdit && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
            title="Remove supplier"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {canEdit && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={onToggleBudgetPicker}
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              {budgetPickerOpen
                ? "Hide budget picker"
                : "Add from Project Proposal budget"}
            </button>
            {budgetPickerOpen && (
              <div className="space-y-2 bg-blue-50/60 border border-blue-100 rounded-lg p-3">
                {availableBudget.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">
                    No remaining budget lines available.
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
                            onSelectedBudgetChange(
                              e.target.checked
                                ? [...selectedBudgetIds, b.id]
                                : selectedBudgetIds.filter((id) => id !== b.id),
                            );
                          }}
                        />
                        <span className="min-w-0">
                          <span className="font-medium">{b.item}</span>
                          <span className="text-gray-500">
                            {" "}
                            — {b.setupShare || b.total || b.unitCost || "₱0"}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onAddSelectedBudget}
                    disabled={!selectedBudgetIds.length}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: DOST_BLUE }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add selected
                  </button>
                  <button
                    type="button"
                    onClick={onAddEmptyRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add blank row
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-2 font-semibold">Equipment / item</th>
                <th className="py-2 pr-2 font-semibold w-36">Amount</th>
                {canEdit && <th className="py-2 w-10" />}
              </tr>
            </thead>
            <tbody>
              {supplier.equipment.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-gray-400 italic">
                    No equipment rows for this supplier.
                  </td>
                </tr>
              ) : (
                supplier.equipment.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50">
                    <td className="py-1.5 pr-2">
                      <input
                        value={row.item}
                        onChange={(e) => onUpdateRow(row.id, "item", e.target.value)}
                        disabled={!canEdit}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 disabled:bg-gray-50"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        value={row.amount}
                        onChange={(e) => onUpdateRow(row.id, "amount", e.target.value)}
                        disabled={!canEdit}
                        placeholder="785000"
                        className="w-full border border-gray-200 rounded px-2 py-1.5 disabled:bg-gray-50"
                      />
                    </td>
                    {canEdit && (
                      <td className="py-1.5">
                        <button
                          type="button"
                          onClick={() => onDeleteRow(row.id)}
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
      </div>
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
              <span className="flex-1 min-w-0 font-medium truncate">{d.fileName}</span>
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
