import { Plus, Trash2 } from "lucide-react";
import type {
  Tna2DocumentResponse,
  Tna2EquipmentRow,
  Tna2Kpi,
} from "../api/types";

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50";
const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

interface TnaForm02EditorProps {
  document: Tna2DocumentResponse;
  onChange: (document: Tna2DocumentResponse) => void;
  onSave: () => void;
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      )}
    </div>
  );
}

function StringListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const update = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label className={labelCls}>{label}</label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <textarea
            rows={2}
            value={item}
            onChange={(e) => update(i, e.target.value)}
            className={`${inputCls} flex-1`}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#0C2461] hover:underline"
      >
        <Plus className="w-3.5 h-3.5" />
        Add item
      </button>
    </div>
  );
}

export function TnaForm02Editor({ document: doc, onChange, onSave }: TnaForm02EditorProps) {
  const patch = (partial: Partial<Tna2DocumentResponse>) =>
    onChange({ ...doc, ...partial });

  const patchProfile = (key: keyof Tna2DocumentResponse["enterpriseProfile"], value: string) =>
    onChange({
      ...doc,
      enterpriseProfile: { ...doc.enterpriseProfile, [key]: value },
    });

  const patchProcess = (partial: Partial<Tna2DocumentResponse["productionProcessAnalysis"]>) =>
    onChange({
      ...doc,
      productionProcessAnalysis: { ...doc.productionProcessAnalysis, ...partial },
    });

  const patchProductivity = (
    partial: Partial<Tna2DocumentResponse["productivityImprovement"]>,
  ) =>
    onChange({
      ...doc,
      productivityImprovement: { ...doc.productivityImprovement, ...partial },
    });

  const patchAssessor = (key: keyof Tna2DocumentResponse["assessor"], value: string) =>
    onChange({
      ...doc,
      assessor: { ...doc.assessor, [key]: value },
    });

  const updateEquipment = (index: number, row: Tna2EquipmentRow) => {
    const rows = [...doc.recommendedEquipment];
    rows[index] = row;
    patch({ recommendedEquipment: rows });
  };

  const updateKpi = (index: number, kpi: Tna2Kpi) => {
    const kpis = [...doc.productivityImprovement.kpis];
    kpis[index] = kpi;
    patchProductivity({ kpis });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-6 print:hidden">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-gray-800">Edit TNA Form 02</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Review and adjust AI-generated content before publishing to the applicant.
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-2 rounded-lg text-white text-sm font-bold shrink-0"
          style={{ background: "#0C2461" }}
        >
          Save draft
        </button>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">Document metadata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Document reference"
            value={doc.documentRef}
            onChange={(v) => patch({ documentRef: v })}
          />
          <Field
            label="Assessment date"
            value={doc.assessmentDate}
            onChange={(v) => patch({ assessmentDate: v })}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">I. Enterprise profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Enterprise name" value={doc.enterpriseProfile.enterpriseName ?? ""} onChange={(v) => patchProfile("enterpriseName", v)} />
          <Field label="Business type" value={doc.enterpriseProfile.businessType ?? ""} onChange={(v) => patchProfile("businessType", v)} />
          <Field label="Address" value={doc.enterpriseProfile.address ?? ""} onChange={(v) => patchProfile("address", v)} multiline />
          <Field label="Sector" value={doc.enterpriseProfile.sector ?? ""} onChange={(v) => patchProfile("sector", v)} />
          <Field label="Commodity" value={doc.enterpriseProfile.commodity ?? ""} onChange={(v) => patchProfile("commodity", v)} />
          <Field label="Main product" value={doc.enterpriseProfile.mainProduct ?? ""} onChange={(v) => patchProfile("mainProduct", v)} />
          <Field label="Employees" value={doc.enterpriseProfile.employees ?? ""} onChange={(v) => patchProfile("employees", v)} />
          <Field label="Contact person" value={doc.enterpriseProfile.contactPerson ?? ""} onChange={(v) => patchProfile("contactPerson", v)} />
          <Field label="Contact number" value={doc.enterpriseProfile.contactNumber ?? ""} onChange={(v) => patchProfile("contactNumber", v)} />
          <Field label="Email" value={doc.enterpriseProfile.emailAddress ?? ""} onChange={(v) => patchProfile("emailAddress", v)} />
        </div>
      </section>

      <StringListEditor
        label="II. Site validation findings"
        items={doc.siteValidationFindings}
        onChange={(items) => patch({ siteValidationFindings: items })}
      />

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">III. Production process analysis</h3>
        <Field
          label="Summary"
          value={doc.productionProcessAnalysis.summary ?? ""}
          onChange={(v) => patchProcess({ summary: v })}
          multiline
        />
        <StringListEditor
          label="Findings"
          items={doc.productionProcessAnalysis.findings}
          onChange={(findings) => patchProcess({ findings })}
        />
      </section>

      <StringListEditor
        label="IV. Technology gaps"
        items={doc.technologyGaps}
        onChange={(items) => patch({ technologyGaps: items })}
      />

      <StringListEditor
        label="V. Proposed interventions"
        items={doc.proposedInterventions}
        onChange={(items) => patch({ proposedInterventions: items })}
      />

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">VI. Recommended equipment</h3>
        {doc.recommendedEquipment.map((row, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-6 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <Field label="Name" value={row.name ?? ""} onChange={(v) => updateEquipment(i, { ...row, name: v })} />
            <Field label="Specifications" value={row.specifications ?? ""} onChange={(v) => updateEquipment(i, { ...row, specifications: v })} />
            <Field label="Qty" value={row.quantity ?? ""} onChange={(v) => updateEquipment(i, { ...row, quantity: v })} />
            <Field label="Est. cost" value={row.estimatedCost ?? ""} onChange={(v) => updateEquipment(i, { ...row, estimatedCost: v })} />
            <Field label="Priority" value={row.priority ?? ""} onChange={(v) => updateEquipment(i, { ...row, priority: v })} />
            <div className="flex items-end">
              <button
                type="button"
                onClick={() =>
                  patch({
                    recommendedEquipment: doc.recommendedEquipment.filter((_, j) => j !== i),
                  })
                }
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            patch({
              recommendedEquipment: [
                ...doc.recommendedEquipment,
                { name: "", specifications: "", quantity: "1", estimatedCost: "", priority: "Medium" },
              ],
            })
          }
          className="flex items-center gap-1.5 text-xs font-semibold text-[#0C2461] hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Add equipment row
        </button>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">VII. Productivity improvement</h3>
        {doc.productivityImprovement.kpis.map((kpi, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
            <Field label="KPI label" value={kpi.label ?? ""} onChange={(v) => updateKpi(i, { ...kpi, label: v })} />
            <Field label="Before" value={kpi.before ?? ""} onChange={(v) => updateKpi(i, { ...kpi, before: v })} />
            <Field label="After" value={kpi.after ?? ""} onChange={(v) => updateKpi(i, { ...kpi, after: v })} />
            <Field label="Change" value={kpi.change ?? ""} onChange={(v) => updateKpi(i, { ...kpi, change: v })} />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            patchProductivity({
              kpis: [
                ...doc.productivityImprovement.kpis,
                { label: "", before: "", after: "", change: "" },
              ],
            })
          }
          className="flex items-center gap-1.5 text-xs font-semibold text-[#0C2461] hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Add KPI
        </button>
        <StringListEditor
          label="Expected outcomes"
          items={doc.productivityImprovement.outcomes}
          onChange={(outcomes) => patchProductivity({ outcomes })}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">Assessor sign-off</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Name" value={doc.assessor.name ?? ""} onChange={(v) => patchAssessor("name", v)} />
          <Field label="Title" value={doc.assessor.title ?? ""} onChange={(v) => patchAssessor("title", v)} />
          <Field label="Office" value={doc.assessor.office ?? ""} onChange={(v) => patchAssessor("office", v)} />
        </div>
      </section>
    </div>
  );
}
