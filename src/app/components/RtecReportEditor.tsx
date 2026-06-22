/**
 * Author: Yzrel Jade B. Eborde
 */

import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type {
  RtecComplianceItem,
  RtecComplianceStatus,
  RtecReportForm,
} from "../api/types";
import { DOST_REGION_12_DIRECTOR_NAME } from "../constants/region12";
import { RTEC_DOST_BLUE } from "../utils/rtecReport";

interface RtecReportEditorProps {
  form: RtecReportForm;
  onChange: (form: RtecReportForm) => void;
  step: "compliance" | "evaluation" | "recommendation";
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
      {children}
    </label>
  );
}

function TextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
    />
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
    />
  );
}

function ComplianceStatusPicker({
  status,
  onChange,
}: {
  status: RtecComplianceStatus;
  onChange: (s: RtecComplianceStatus) => void;
}) {
  const options: { value: RtecComplianceStatus; label: string }[] = [
    { value: "complied", label: "Complied" },
    { value: "not_complied", label: "Not Complied" },
    { value: "na", label: "N/A" },
  ];
  return (
    <div className="flex flex-wrap gap-2 shrink-0">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
            status === opt.value
              ? "border-[#0C2461] bg-blue-50 text-[#0C2461]"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <input
            type="radio"
            name={`compliance-${opt.value}`}
            checked={status === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function ComplianceSection({
  items,
  onChange,
}: {
  items: RtecComplianceItem[];
  onChange: (items: RtecComplianceItem[]) => void;
}) {
  const setStatus = (id: string, status: RtecComplianceStatus) => {
    onChange(items.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Mark each requirement as Complied, Not Complied, or N/A. Six items are auto-suggested
        from uploaded documents when you sync from Project Proposal.
      </p>
      {items.map((item, i) => (
        <div
          key={item.id}
          className="border border-gray-200 rounded-xl p-4 bg-white space-y-3"
        >
          <p className="text-sm text-gray-800">
            <span className="font-bold text-gray-500 mr-2">{i + 1}.</span>
            {item.label}
          </p>
          <ComplianceStatusPicker
            status={item.status}
            onChange={(s) => setStatus(item.id, s)}
          />
        </div>
      ))}
    </div>
  );
}

export function RtecReportEditor({ form, onChange, step }: RtecReportEditorProps) {
  const patch = (partial: Partial<RtecReportForm>) => onChange({ ...form, ...partial });

  if (step === "compliance") {
    return (
      <ComplianceSection
        items={form.complianceItems}
        onChange={(complianceItems) => patch({ complianceItems })}
      />
    );
  }

  if (step === "evaluation") {
    return (
      <div className="space-y-6">
        <div>
          <FieldLabel>Financial ratio narrative (III.d)</FieldLabel>
          <TextArea
            value={form.ratioNarrative}
            onChange={(ratioNarrative) => patch({ ratioNarrative })}
            rows={5}
            placeholder="Summarize liquidity, ROI, and financial constraints…"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <FieldLabel>Technical constraints matrix (III.b.3)</FieldLabel>
            <button
              type="button"
              onClick={() =>
                patch({
                  constraintRows: [
                    ...form.constraintRows,
                    {
                      id: uid(),
                      processProblem: "",
                      proposedIntervention: "",
                      equipmentSkills: "",
                      impact: "",
                    },
                  ],
                })
              }
              className="flex items-center gap-1 text-xs font-semibold text-[#0C2461] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add row
            </button>
          </div>
          <div className="space-y-3">
            {form.constraintRows.map((row, ri) => (
              <div key={row.id} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-white">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500">Row {ri + 1}</span>
                  {form.constraintRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          constraintRows: form.constraintRows.filter((r) => r.id !== row.id),
                        })
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <TextArea
                  value={row.processProblem}
                  onChange={(v) =>
                    patch({
                      constraintRows: form.constraintRows.map((r) =>
                        r.id === row.id ? { ...r, processProblem: v } : r,
                      ),
                    })
                  }
                  rows={2}
                  placeholder="Process / existing practice / problem"
                />
                <TextArea
                  value={row.proposedIntervention}
                  onChange={(v) =>
                    patch({
                      constraintRows: form.constraintRows.map((r) =>
                        r.id === row.id ? { ...r, proposedIntervention: v } : r,
                      ),
                    })
                  }
                  rows={2}
                  placeholder="Proposed S&T intervention"
                />
                <TextArea
                  value={row.equipmentSkills}
                  onChange={(v) =>
                    patch({
                      constraintRows: form.constraintRows.map((r) =>
                        r.id === row.id ? { ...r, equipmentSkills: v } : r,
                      ),
                    })
                  }
                  rows={2}
                  placeholder="Equipment / skills upgrading"
                />
                <TextArea
                  value={row.impact}
                  onChange={(v) =>
                    patch({
                      constraintRows: form.constraintRows.map((r) =>
                        r.id === row.id ? { ...r, impact: v } : r,
                      ),
                    })
                  }
                  rows={2}
                  placeholder="Impact"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <FieldLabel>Equipment fabricators (III.b.5)</FieldLabel>
            <button
              type="button"
              onClick={() =>
                patch({
                  fabricatorRows: [
                    ...form.fabricatorRows,
                    { id: uid(), name: "", address: "", contactNo: "" },
                  ],
                })
              }
              className="flex items-center gap-1 text-xs font-semibold text-[#0C2461] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add fabricator
            </button>
          </div>
          <div className="space-y-3">
            {form.fabricatorRows.map((row, ri) => (
              <div key={row.id} className="grid sm:grid-cols-3 gap-2 border border-gray-200 rounded-xl p-3 bg-white">
                <div>
                  <FieldLabel>Name</FieldLabel>
                  <TextInput
                    value={row.name}
                    onChange={(v) =>
                      patch({
                        fabricatorRows: form.fabricatorRows.map((r) =>
                          r.id === row.id ? { ...r, name: v } : r,
                        ),
                      })
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Address</FieldLabel>
                  <TextInput
                    value={row.address}
                    onChange={(v) =>
                      patch({
                        fabricatorRows: form.fabricatorRows.map((r) =>
                          r.id === row.id ? { ...r, address: v } : r,
                        ),
                      })
                    }
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <FieldLabel>Contact No.</FieldLabel>
                    <TextInput
                      value={row.contactNo}
                      onChange={(v) =>
                        patch({
                          fabricatorRows: form.fabricatorRows.map((r) =>
                            r.id === row.id ? { ...r, contactNo: v } : r,
                          ),
                        })
                      }
                    />
                  </div>
                  {form.fabricatorRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          fabricatorRows: form.fabricatorRows.filter((r) => r.id !== row.id),
                        })
                      }
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel>IV. Recommendation (addressing TNA findings)</FieldLabel>
        <TextArea
          value={form.recommendation}
          onChange={(recommendation) => patch({ recommendation })}
          rows={8}
          placeholder="RTEC recommendation narrative…"
        />
      </div>

      <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-4">
        <p className="text-sm font-bold" style={{ color: RTEC_DOST_BLUE }}>
          Signatories
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>RTEC Chairperson</FieldLabel>
            <TextInput
              value={form.signatures.chairperson}
              onChange={(v) =>
                patch({ signatures: { ...form.signatures, chairperson: v } })
              }
            />
          </div>
          <div>
            <FieldLabel>Evaluation date</FieldLabel>
            <input
              type="date"
              value={form.signatures.evaluationDate}
              onChange={(e) =>
                patch({
                  signatures: { ...form.signatures, evaluationDate: e.target.value },
                })
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {(["member1", "member2", "member3"] as const).map((k, i) => (
            <div key={k}>
              <FieldLabel>Member {i + 1}</FieldLabel>
              <TextInput
                value={form.signatures[k]}
                onChange={(v) =>
                  patch({ signatures: { ...form.signatures, [k]: v } })
                }
              />
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>RPMO</FieldLabel>
            <TextInput
              value={form.signatures.rpmo}
              onChange={(v) =>
                patch({ signatures: { ...form.signatures, rpmo: v } })
              }
            />
          </div>
          <div>
            <FieldLabel>Regional Director</FieldLabel>
            <TextInput
              value={form.signatures.regionalDirector || DOST_REGION_12_DIRECTOR_NAME}
              onChange={(v) =>
                patch({ signatures: { ...form.signatures, regionalDirector: v } })
              }
              placeholder={DOST_REGION_12_DIRECTOR_NAME}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
