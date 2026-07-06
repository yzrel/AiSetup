/**
 * Author: Yzrel Jade B. Eborde
 */

import { Plus, Trash2 } from "lucide-react";
import type {
  Tna2DocumentResponse,
  Tna2EquipmentRow,
  Tna2FindingSection,
  Tna2InterventionRow,
  Tna2Kpi,
} from "../api/types";
import { PrioritySectorSelect } from "./PrioritySectorSelect";
import { useAiFieldSuggest } from "../utils/aiAssist";
import { normalizeFindingsByArea } from "../utils/tnaForm02";
import {
  AiAssistNotice,
  AiAssistStringList,
  AiAssistTextarea,
  aiAssistInputCls,
  aiAssistLabelCls,
} from "./AiAssistField";

const inputCls = aiAssistInputCls;
const labelCls = aiAssistLabelCls + " mb-1";

interface TnaForm02EditorProps {
  document: Tna2DocumentResponse;
  onChange: (document: Tna2DocumentResponse) => void;
  onSave: () => void;
  aiContext?: Record<string, unknown>;
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  onAiSuggest,
  aiLoading,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  onAiSuggest?: () => void;
  aiLoading?: boolean;
}) {
  if (multiline && onAiSuggest) {
    return (
      <AiAssistTextarea
        label={label}
        value={value}
        onChange={onChange}
        onAiSuggest={onAiSuggest}
        aiLoading={aiLoading}
        inputClassName={inputCls}
        labelClassName={labelCls}
        minHeight="min-h-[80px]"
      />
    );
  }

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
  onAiSuggest,
  aiLoading,
  multiline = true,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  onAiSuggest?: () => void;
  aiLoading?: boolean;
  multiline?: boolean;
}) {
  if (onAiSuggest) {
    return (
      <AiAssistStringList
        label={label}
        items={items}
        onChange={onChange}
        onAiSuggest={onAiSuggest}
        aiLoading={aiLoading}
        inputClassName={inputCls}
        labelClassName={labelCls}
        multiline={multiline}
      />
    );
  }

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

export function TnaForm02Editor({
  document: doc,
  onChange,
  onSave,
  aiContext,
}: TnaForm02EditorProps) {
  const { bind: bindAi, notice: aiNotice } = useAiFieldSuggest("tna2");

  const ai = (field: string, apply: (value: string | string[]) => void) => {
    if (!aiContext) return {};
    return bindAi(field, aiContext, apply);
  };

  const patch = (partial: Partial<Tna2DocumentResponse>) =>
    onChange({ ...doc, ...partial });

  const findingsByArea = normalizeFindingsByArea(doc.findingsByArea);

  const patchSubsection = (
    sectionIndex: number,
    subsectionId: string,
    content: string,
  ) => {
    const rows: Tna2FindingSection[] = findingsByArea.map((section, i) => {
      if (i !== sectionIndex) return section;
      return {
        ...section,
        subsections: (section.subsections ?? []).map((sub) =>
          sub.id === subsectionId ? { ...sub, content } : sub,
        ),
      };
    });
    patch({ findingsByArea: rows });
  };

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

  const patchAttestedBy = (
    key: keyof NonNullable<Tna2DocumentResponse["attestedBy"]>,
    value: string,
  ) =>
    onChange({
      ...doc,
      attestedBy: { ...(doc.attestedBy ?? {}), [key]: value },
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
    <div className="space-y-6 print:hidden">
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

      <AiAssistNotice message={aiNotice} />

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
        <h3 className="text-sm font-bold text-gray-700">Summary of Assessment</h3>
        <Field
          label="Background"
          value={doc.background ?? ""}
          onChange={(v) => patch({ background: v })}
          multiline
          {...ai("background", (value) =>
            patch({ background: Array.isArray(value) ? value.join("\n") : value }),
          )}
        />
        <Field
          label="Methodology"
          value={doc.methodology ?? ""}
          onChange={(v) => patch({ methodology: v })}
          multiline
          {...ai("methodology", (value) =>
            patch({ methodology: Array.isArray(value) ? value.join("\n") : value }),
          )}
        />
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase">
            Summary of findings by area
          </p>
          {findingsByArea.map((section, sectionIndex) => (
            <div
              key={section.title}
              className="border border-gray-100 rounded-lg p-3 space-y-3"
            >
              <p className="text-sm font-bold text-gray-800">{section.title}</p>
              {(section.subsections ?? []).map((sub) => (
                <Field
                  key={sub.id}
                  label={sub.label}
                  value={sub.content}
                  onChange={(content) =>
                    patchSubsection(sectionIndex, sub.id, content)
                  }
                  multiline
                />
              ))}
            </div>
          ))}
        </div>
        <Field
          label="Other observations"
          value={doc.otherObservations ?? ""}
          onChange={(v) => patch({ otherObservations: v })}
          multiline
        />
        <Field
          label="Conclusions"
          value={doc.conclusions ?? ""}
          onChange={(v) => patch({ conclusions: v })}
          multiline
        />
        <StringListEditor
          label="Recommendations"
          items={doc.recommendations ?? []}
          onChange={(recommendations) => patch({ recommendations })}
        />
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase">Intervention table</p>
          {(doc.interventionRows?.length
            ? doc.interventionRows
            : [{ problem: "", intervention: "", equipment: "", impact: "" }]
          ).map((row, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-gray-100 rounded-lg p-3">
              {(
                [
                  ["problem", "Problem / existing practice"],
                  ["intervention", "Proposed S&T intervention"],
                  ["equipment", "Equipment / skills upgrading"],
                  ["impact", "Impact"],
                ] as const
              ).map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  value={row[key]}
                  onChange={(v) => {
                    const rows: Tna2InterventionRow[] = [
                      ...(doc.interventionRows?.length
                        ? doc.interventionRows
                        : [{ problem: "", intervention: "", equipment: "", impact: "" }]),
                    ];
                    rows[i] = { ...rows[i], [key]: v };
                    patch({ interventionRows: rows });
                  }}
                  multiline
                />
              ))}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patch({
                interventionRows: [
                  ...(doc.interventionRows ?? []),
                  { problem: "", intervention: "", equipment: "", impact: "" },
                ],
              })
            }
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0C2461] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Add intervention row
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">Enterprise profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Enterprise name" value={doc.enterpriseProfile.enterpriseName ?? ""} onChange={(v) => patchProfile("enterpriseName", v)} />
          <Field label="Business type" value={doc.enterpriseProfile.businessType ?? ""} onChange={(v) => patchProfile("businessType", v)} />
          <Field label="Address" value={doc.enterpriseProfile.address ?? ""} onChange={(v) => patchProfile("address", v)} multiline />
          <div>
            <label className={labelCls}>Sector</label>
            <PrioritySectorSelect
              value={doc.enterpriseProfile.sector ?? ""}
              onChange={(v) => patchProfile("sector", v)}
              className={inputCls}
            />
          </div>
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
        {...ai("siteValidationFindings", (value) =>
          patch({ siteValidationFindings: Array.isArray(value) ? value : [value] }),
        )}
      />

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">III. Production process analysis</h3>
        <Field
          label="Summary"
          value={doc.productionProcessAnalysis.summary ?? ""}
          onChange={(v) => patchProcess({ summary: v })}
          multiline
          {...ai("processSummary", (value) =>
            patchProcess({ summary: Array.isArray(value) ? value.join("\n") : value }),
          )}
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
          {...ai("expectedOutput", (value) =>
            patchProductivity({
              outcomes: Array.isArray(value) ? value : [value],
            }),
          )}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">Reported by (TNA Team Leader)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Name" value={doc.assessor.name ?? ""} onChange={(v) => patchAssessor("name", v)} />
          <Field label="Title" value={doc.assessor.title ?? ""} onChange={(v) => patchAssessor("title", v)} />
          <Field label="Office" value={doc.assessor.office ?? ""} onChange={(v) => patchAssessor("office", v)} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">Attested by (ARD)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field
            label="Name"
            value={doc.attestedBy?.name ?? ""}
            onChange={(v) => patchAttestedBy("name", v)}
          />
          <Field
            label="Title"
            value={doc.attestedBy?.title ?? "Assistant Regional Director"}
            onChange={(v) => patchAttestedBy("title", v)}
          />
          <Field
            label="Office"
            value={doc.attestedBy?.office ?? ""}
            onChange={(v) => patchAttestedBy("office", v)}
          />
        </div>
      </section>
    </div>
  );
}
