/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState } from "react";
import {
  Upload,
  CheckCircle,
  FileText,
  Edit2,
  Plus,
  Trash2,
  Camera,
  Receipt,
  Package,
  ClipboardList,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  Calendar,
  User,
  Tag,
  Banknote,
  BarChart2,
  Archive,
  RefreshCw,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UploadedFile {
  id: string;
  name: string;
  size?: string;
  uploadedAt: string;
  amount?: string;
  status: "uploaded" | "processing" | "verified";
}

interface ProcurementItem {
  id: string;
  description: string;
  supplier: string;
  purchaseDate: string;
  quantity: number;
  totalCost: string;
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function StatusPill({
  label,
  color,
}: {
  label: string;
  color: "green" | "amber" | "blue" | "gray";
}) {
  const colors = {
    green: "bg-green-100 text-green-700 border-green-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${colors[color]}`}
    >
      {label}
    </span>
  );
}

function ProgressBar({
  label,
  color = "green",
}: {
  label: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 mb-5">
      <FileText className="w-4 h-4 text-blue-500" />
      <span className="text-sm font-semibold text-gray-700 flex-1">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full w-3/5" />
        </div>
        <StatusPill label={label} color="green" />
      </div>
    </div>
  );
}

function SectionDivider({
  number,
  title,
  action,
}: {
  number: number;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3 mt-5">
      <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
          {number}
        </span>
        {title}
      </h3>
      {action}
    </div>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────

function UploadZone({
  label,
  files,
  onUpload,
}: {
  label: string;
  files: UploadedFile[];
  onUpload: (name: string) => void;
}) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const f = e.target.files?.[0];
    if (f) onUpload(f.name);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        id={`upload-${label}`}
        className="hidden"
        onChange={handleChange}
      />
      <label
        htmlFor={`upload-${label}`}
        className="flex items-center justify-center gap-2 w-full max-w-xs py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors"
      >
        <Camera className="w-4 h-4" />
        {label}
      </label>
      {files.map((f) => (
        <div
          key={f.id}
          className="flex items-center gap-2 text-xs text-gray-600 border border-gray-100 rounded-lg px-3 py-2 bg-gray-50"
        >
          <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="flex-1 truncate font-medium">
            {f.name}
          </span>
          {f.size && (
            <span className="text-gray-400">{f.size}</span>
          )}
          <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
          <span className="text-green-600 font-medium">
            Uploaded
          </span>
          <span className="text-gray-400">{f.uploadedAt}</span>
          {f.amount && (
            <span className="font-semibold text-gray-800 ml-1">
              {f.amount}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 14: Procurement
// ═══════════════════════════════════════════════════════════════════════════════

function Module14() {
  const [procFiles, setProcFiles] = useState<UploadedFile[]>([
    {
      id: "1",
      name: "OR_Water Heater Supplier.pdf",
      uploadedAt: "Today",
      status: "uploaded",
    },
    {
      id: "2",
      name: "Invoice_Tank2024.jpg",
      uploadedAt: "Today",
      status: "uploaded",
    },
  ]);

  const [detailFiles, setDetailFiles] = useState<
    UploadedFile[]
  >([
    {
      id: "3",
      name: "OR_Water Heater Supplier.pdf",
      size: "1.05 MB",
      uploadedAt: "Today",
      amount: "₱1,860,000",
      status: "uploaded",
    },
  ]);

  const [items, setItems] = useState<ProcurementItem[]>([
    {
      id: "1",
      description: "Water Heater Supplier.pdf",
      supplier: "XTZ Innovations",
      purchaseDate: "May 7, 2024",
      quantity: 2,
      totalCost: "₱160,000",
    },
  ]);

  const [editingId, setEditingId] = useState<string | null>(
    null,
  );

  const addItem = () => {
    const newItem: ProcurementItem = {
      id: Date.now().toString(),
      description: "",
      supplier: "",
      purchaseDate: "",
      quantity: 1,
      totalCost: "",
    };
    setItems((p) => [...p, newItem]);
    setEditingId(newItem.id);
  };

  const removeItem = (id: string) =>
    setItems((p) => p.filter((i) => i.id !== id));

  const updateItem = (
    id: string,
    field: keyof ProcurementItem,
    value: string | number,
  ) => {
    setItems((p) =>
      p.map((i) =>
        i.id === id ? { ...i, [field]: value } : i,
      ),
    );
  };

  const handleUpload =
    (
      setter: React.Dispatch<
        React.SetStateAction<UploadedFile[]>
      >,
    ) =>
    (name: string) => {
      setter((p) => [
        ...p,
        {
          id: Date.now().toString(),
          name,
          uploadedAt: "Today",
          status: "uploaded",
        },
      ]);
    };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-blue-600 text-white px-5 py-3 font-semibold text-sm flex items-center gap-2">
        <Package className="w-4 h-4" />
        Module 14 — Procurement (Submission of Official
        Receipts)
      </div>

      <div className="p-5">
        <ProgressBar label="Procurement in Progress" />

        {/* ── Section 1: Upload Documents ── */}
        <SectionDivider
          number={1}
          title="Upload Procurement Documents"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Left: description */}
          <div>
            <p className="text-sm text-gray-600 mb-3">
              The system should allow the cooperator to upload
              procurement-related documents or proof of
              purchase.
            </p>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Required upload; may include:
            </p>
            <ul className="space-y-1.5 mb-4">
              {[
                "Official Receipts (OR)",
                "Sales Invoices",
                "Delivery receipts",
                "Supplier quotations, if applicable",
                "Photos of purchased equipment",
              ].map((r) => (
                <li
                  key={r}
                  className="flex items-center gap-2 text-xs text-gray-700"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              These Documents serve as the basis for financial
              liquidation, and project monitoring.
            </div>
          </div>

          {/* Right: illustration + upload */}
          <div className="flex flex-col gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg h-32 flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto shadow">
                  <Receipt className="w-7 h-7 text-blue-600" />
                </div>
                <p className="text-xs text-blue-600 font-medium mt-1">
                  Procurement Docs
                </p>
              </div>
            </div>
            <UploadZone
              label="Upload Procurement Document"
              files={procFiles}
              onUpload={handleUpload(setProcFiles)}
            />
          </div>
        </div>

        {/* Detail files row */}
        <div className="space-y-1 mb-4">
          {detailFiles.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="flex-1 font-medium text-gray-800">
                {f.name}
              </span>
              {f.size && (
                <span className="text-gray-400">
                  {f.size} ·
                </span>
              )}
              <span className="text-green-600 font-medium">
                Uploaded {f.uploadedAt}
              </span>
              {f.amount && (
                <span className="font-bold text-gray-800 ml-2">
                  {f.amount}
                </span>
              )}
              <button className="ml-auto flex items-center gap-1 bg-blue-600 text-white rounded px-2 py-0.5 hover:bg-blue-700 transition-colors">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            </div>
          ))}
          <div className="text-xs text-gray-400 px-1">
            OD_News &nbsp;·&nbsp; Takaal 🗂️
          </div>
        </div>

        {/* ── Section 2: Enter Details ── */}
        <SectionDivider
          number={2}
          title="Enter Procurement Details"
          action={
            <button
              onClick={addItem}
              className="flex items-center gap-1.5 text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          }
        />

        <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[
                  "Item Description",
                  "Supplier",
                  "Purchase Date",
                  "Quantity",
                  "Total Cost",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2.5 text-gray-600 font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) =>
                editingId === item.id ? (
                  <tr key={item.id} className="bg-blue-50">
                    {(
                      [
                        "description",
                        "supplier",
                        "purchaseDate",
                      ] as const
                    ).map((f) => (
                      <td
                        key={f}
                        className="px-2 py-1.5 border-b border-gray-100"
                      >
                        <input
                          value={item[f] as string}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              f,
                              e.target.value,
                            )
                          }
                          className="w-full border border-blue-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1.5 border-b border-gray-100">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "quantity",
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="w-16 border border-blue-300 rounded px-2 py-1 text-xs focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5 border-b border-gray-100">
                      <input
                        value={item.totalCost}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "totalCost",
                            e.target.value,
                          )
                        }
                        className="w-24 border border-blue-300 rounded px-2 py-1 text-xs focus:outline-none"
                        placeholder="₱0"
                      />
                    </td>
                    <td className="px-2 py-1.5 border-b border-gray-100">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs bg-green-600 text-white rounded px-2 py-0.5 hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-xs bg-red-100 text-red-600 rounded px-2 py-0.5 hover:bg-red-200"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <td className="px-3 py-2.5 font-medium text-gray-800">
                      {item.description || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">
                      {item.supplier || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">
                      {item.purchaseDate || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-gray-800">
                      {item.totalCost || "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingId(item.id)}
                          className="flex items-center gap-1 text-xs bg-blue-600 text-white rounded px-2 py-0.5 hover:bg-blue-700 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-xs bg-red-50 text-red-500 border border-red-100 rounded px-1.5 py-0.5 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        {/* Reviewer row */}
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-xs text-gray-600">
          <div className="w-7 h-7 bg-blue-200 rounded-full flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-medium text-gray-800">
            Etavet Job Simaren
          </span>
          <span className="text-gray-400">·</span>
          <span>ViGhesiplay</span>
          <CheckCircle className="w-3.5 h-3.5 text-green-500 ml-1" />
          <span className="text-gray-500">
            Procamagos at procurests are revolcesciae fiuetiure
            IDRAThractial receipts
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 15: Liquidation
// ═══════════════════════════════════════════════════════════════════════════════

function Module15() {
  const [liqFiles, setLiqFiles] = useState<UploadedFile[]>([
    {
      id: "1",
      name: "Water Heater Tonat hosal (Pic) 0004",
      uploadedAt: "Today",
      status: "uploaded",
    },
  ]);

  const [rightFiles] = useState([
    {
      id: "1",
      name: "Liquidation Report, documentation.file",
      status: "review",
      badge: "Error review momoarued",
    },
    {
      id: "2",
      name: "Invoices Price",
      amount: "₱P.807,000",
      date: "Today",
      badge: "Edit",
    },
    {
      id: "3",
      name: "Success Payment",
      amount: "₱P.810,5000",
      badge: "Off:FA",
    },
  ]);

  const handleUpload = (name: string) => {
    setLiqFiles((p) => [
      ...p,
      {
        id: Date.now().toString(),
        name,
        uploadedAt: "Today",
        status: "uploaded",
      },
    ]);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-blue-600 text-white px-5 py-3 font-semibold text-sm flex items-center gap-2">
        <BarChart2 className="w-4 h-4" />
        Module 15 — Liquidation (Financial Report and Equipment
        Documentation)
      </div>

      <div className="p-5">
        <ProgressBar label="Liquidation Required" />

        {/* ── Section 1: Upload Liquidation Documents ── */}
        <SectionDivider
          number={1}
          title="Upload Liquidation Documents"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left */}
          <div>
            <ul className="space-y-1.5 mb-4">
              {[
                "Official Receipts (OR)",
                "Sales invoices",
                "Delivery receipts",
                "Photos of purchased, if applicable",
              ].map((r) => (
                <li
                  key={r}
                  className="flex items-center gap-2 text-xs text-gray-700"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>

            {/* Uploaded files list */}
            <div className="space-y-1 mb-3">
              {liqFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-100 rounded px-2 py-1.5"
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded"
                  />
                  <span className="flex-1 font-medium text-gray-700 truncate">
                    {f.name}
                  </span>
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                </div>
              ))}
            </div>

            {/* Upload button */}
            <input
              type="file"
              id="liq-upload"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f.name);
                e.target.value = "";
              }}
            />
            <label
              htmlFor="liq-upload"
              className="flex items-center justify-center gap-2 w-full max-w-xs py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors"
            >
              <Camera className="w-4 h-4" />
              Upload Liquidation Document
            </label>
          </div>

          {/* Right: illustration + file cards */}
          <div className="flex flex-col gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg h-28 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow">
                  <ClipboardList className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-xs text-blue-600 font-medium mt-1">
                  Liquidation Report
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              {rightFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="flex-1 truncate text-gray-700">
                    {f.name}
                  </span>
                  {f.amount && (
                    <span className="font-semibold text-gray-800">
                      {f.amount}
                    </span>
                  )}
                  {f.date && (
                    <span className="text-gray-400">
                      {f.date}
                    </span>
                  )}
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      f.badge === "Edit"
                        ? "bg-blue-600 text-white"
                        : f.badge?.startsWith("Error")
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    {f.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-xs text-blue-700">
          <span className="font-semibold">Tip:</span> Click
          "Upload Procurement Document" to add receipts,
          invoices, and photos. Keep all uploaded documents as
          resalibles, realibles.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 16: Untagging of Account
// ═══════════════════════════════════════════════════════════════════════════════

function Module16() {
  const [untagged, setUntagged] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-blue-600 text-white px-5 py-3 font-semibold text-sm flex items-center gap-2">
        <Tag className="w-4 h-4" />
        Module 16 — Untagging of Account
      </div>

      <div className="p-5">
        <p className="text-sm text-gray-600 mb-5">
          Start the account untagging procedure to mark the
          completion of your SETUP project financial activities.
          This signals that all procurement, liquidation, and
          fund usage have been accounted for.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Status card */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <p className="font-semibold text-sm text-gray-700">
              Untagging Status
            </p>

            <div className="space-y-2 text-xs">
              {[
                { label: "Procurement Submitted", done: true },
                {
                  label: "Liquidation Report Filed",
                  done: true,
                },
                { label: "Equipment Documented", done: true },
                {
                  label: "Final Financial Report",
                  done: false,
                },
                { label: "Account Untagged", done: untagged },
              ].map((step) => (
                <div
                  key={step.label}
                  className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-green-500" : "bg-gray-200"}`}
                  >
                    {step.done && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span
                    className={
                      step.done
                        ? "text-gray-800 font-medium"
                        : "text-gray-400"
                    }
                  >
                    {step.label}
                  </span>
                  <span className="ml-auto">
                    {step.done ? (
                      <StatusPill label="Done" color="green" />
                    ) : (
                      <StatusPill
                        label="Pending"
                        color="amber"
                      />
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action card */}
          <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 mb-0.5">
                    Before Untagging
                  </p>
                  <p className="text-xs text-amber-700">
                    Ensure all liquidation documents have been
                    submitted and verified by your DOST
                    provincial office before proceeding with
                    account untagging.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-gray-700">
                <Banknote className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  Approved Amount: <strong>₱2,000,000</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                <span>
                  Total Disbursed: <strong>₱1,960,000</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Archive className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  Remaining Balance: <strong>₱40,000</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => setUntagged(true)}
              className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-lg transition-colors ${
                untagged
                  ? "bg-green-700 text-white cursor-default"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {untagged ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {untagged
                ? "Account Successfully Untagged"
                : "Proceed with Account Untagging"}
            </button>

            {untagged && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                Account has been untagged. Your SETUP project is
                now marked as complete.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

interface ProcurementAndLiquidationProps {
  onSubmitSuccess?: () => void;
}

export function ProcurementAndLiquidation({ onSubmitSuccess }: ProcurementAndLiquidationProps = {}) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Module 14 Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            <span className="text-gray-400 font-normal">
              
            </span>{" "}
            Procurement{" "}
            <span className="text-lg font-normal text-gray-500">
              (Submission of Official Receipts)
            </span>
          </h1>
          <p className="text-gray-500 text-sm max-w-3xl">
            After the authorized withdrawal of SETUP funds, the
            cooperator proceeds with the procurement of approved
            equipment, machinery, or materials as indicated in
            the SETUP project proposal.
          </p>
          <p className="text-gray-500 text-sm mt-1 max-w-3xl">
            This module records and verifies all procurement
            transactions to ensure that SETUP funds are utilized
            strictly for approved project components.
          </p>
        </div>
        <Module14 />

        {/* Module 15 Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            <span className="text-gray-400 font-normal">
              
            </span>{" "}
            Liquidation{" "}
            <span className="text-lg font-normal text-gray-500">
              (Financial Report and Equipment Documentation)
            </span>
          </h1>
          <p className="text-gray-500 text-sm max-w-3xl">
            Start completing all purchases, please submit your
            liquidation report and equipment documentation for
            verification.
          </p>
        </div>
        <Module15 />

        {/* Module 16 Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            <span className="text-gray-400 font-normal">
              
            </span>{" "}
            Untagging of Account
          </h1>
          <p className="text-gray-500 text-sm max-w-3xl">
            Start the account untagging procedure to mark the
            completion of your SETUP project financial
            activities.
          </p>
        </div>
        <Module16 />
        {onSubmitSuccess && (
          <div className="print:hidden pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onSubmitSuccess}
              className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
              style={{ background: "#0C2461" }}
            >
              Continue — Project Complete →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}