/**
 * Author: Yzrel Jade B. Eborde
 *
 * Staff editor for SETUP Form 002 — RTEC Report.
 * Section order and fields follow Form 002 - RTEC Report.docx (Annex A-2).
 * Edits stay on the RTEC draft (proposalSnapshot + RTEC-native fields); do not write back to Form 001.
 */

import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type {
  ProjectProposalForm,
  ProjectProposalRiskRow,
  RtecComplianceItem,
  RtecComplianceStatus,
  RtecReportForm,
} from "../api/types";
import { DOST_REGION_12_DIRECTOR_NAME } from "../constants/region12";
import {
  RTEC_OFFICIAL_COMPLIANCE_IDS,
  RTEC_OFFICIAL_COMPLIANCE_ITEMS,
  RTEC_SECTION_I,
  RTEC_SECTION_II,
  RTEC_SECTION_III,
  RTEC_SECTION_IV,
  RTEC_SUBSECTION_COMPANY,
  RTEC_SUBSECTION_EXPECTED,
  RTEC_SUBSECTION_FINANCIAL,
  RTEC_SUBSECTION_MANAGEMENT,
  RTEC_SUBSECTION_MARKETING,
  RTEC_SUBSECTION_OBJECTIVES,
  RTEC_SUBSECTION_RISK,
  RTEC_SUBSECTION_TECHNICAL,
  RTEC_SUBSECTION_WASTE,
  RTEC_TECH_CONSTRAINTS,
  RTEC_TECH_EXISTING_EQUIPMENT,
  RTEC_TECH_FABRICATORS,
  RTEC_TECH_INTERVENTION_COST,
  RTEC_TECH_MATERIAL_BALANCE,
  RTEC_TECH_PLANT_LAYOUT,
  RTEC_TECH_PROCESS_FLOW,
  RTEC_TECH_PRODUCTION_PROCESS,
} from "../constants/rtecReportLayout";
import { RTEC_COMPLIANCE_ITEMS, RTEC_DOST_BLUE } from "../utils/rtecReport";

interface RtecReportEditorProps {
  form: RtecReportForm;
  onChange: (form: RtecReportForm) => void;
  step: "compliance" | "evaluation" | "recommendation" | "all";
  onSave?: () => void;
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

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-bold text-[#0C2461]">{children}</h3>;
}

function SubTitle({ children }: { children: ReactNode }) {
  return <h4 className="text-xs font-bold text-gray-700 mt-2">{children}</h4>;
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

function StringListEditor({
  label,
  items,
  onChange,
  placeholder = "Add item…",
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const list = items.length ? items : [""];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel>{label}</FieldLabel>
        <button
          type="button"
          onClick={() => onChange([...list, ""])}
          className="flex items-center gap-1 text-xs font-semibold text-[#0C2461] hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>
      {list.map((item, i) => (
        <div key={i} className="flex gap-2">
          <TextInput
            value={item}
            onChange={(v) => {
              const next = [...list];
              next[i] = v;
              onChange(next);
            }}
            placeholder={placeholder}
          />
          {list.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(list.filter((_, j) => j !== i))}
              className="text-red-500 hover:text-red-700 p-2 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function ComplianceStatusPicker({
  itemId,
  status,
  onChange,
}: {
  itemId: string;
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
            name={`compliance-${itemId}`}
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

function ComplianceList({
  items,
  onChange,
  startIndex = 1,
}: {
  items: RtecComplianceItem[];
  onChange: (id: string, status: RtecComplianceStatus) => void;
  startIndex?: number;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={item.id}
          className="border border-gray-200 rounded-xl p-4 bg-white space-y-3"
        >
          <p className="text-sm text-gray-800">
            <span className="font-bold text-gray-500 mr-2">{startIndex + i}.</span>
            {item.label}
          </p>
          <ComplianceStatusPicker
            itemId={item.id}
            status={item.status}
            onChange={(s) => onChange(item.id, s)}
          />
        </div>
      ))}
    </div>
  );
}

function asRowList<T>(value: T[] | T | undefined | null): T[] {
  if (Array.isArray(value)) return value;
  if (value) return [value];
  return [];
}

const PORTAL_EXTRA_IDS = new Set([
  "supplier-unavailability-affidavit",
  "ecc",
  "fda-certificate",
]);

function mergeOfficialComplianceLabels(
  items: RtecComplianceItem[],
): RtecComplianceItem[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return RTEC_OFFICIAL_COMPLIANCE_ITEMS.map((official) => {
    const saved = byId.get(official.id);
    return {
      id: official.id,
      label: official.label,
      status: (saved?.status ?? "") as RtecComplianceStatus,
    };
  });
}

function portalExtraItems(items: RtecComplianceItem[]): RtecComplianceItem[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return RTEC_COMPLIANCE_ITEMS.filter((item) => PORTAL_EXTRA_IDS.has(item.id)).map(
    (meta) => {
      const saved = byId.get(meta.id);
      return {
        id: meta.id,
        label: meta.label,
        status: (saved?.status ?? "") as RtecComplianceStatus,
      };
    },
  );
}

export function RtecReportEditor({
  form,
  onChange,
  step,
  onSave,
}: RtecReportEditorProps) {
  const formSafe: RtecReportForm = {
    ...form,
    constraintRows: asRowList(form.constraintRows),
    fabricatorRows: asRowList(form.fabricatorRows),
    complianceItems: asRowList(form.complianceItems),
    attachmentRefs: asRowList(form.attachmentRefs),
    proposalSnapshot: form.proposalSnapshot,
  };
  const pp = formSafe.proposalSnapshot;
  const riskRows = asRowList(pp.riskRows);
  const costTable = asRowList(pp.interventionCostTable).map((row) =>
    Array.isArray(row) ? row : [""],
  );
  const strategies = asRowList(pp.marketStrategies).map(String);
  const specificObjectives = asRowList(pp.specificObjectives).map(String);
  const expectedOutputs = asRowList(pp.expectedOutputBullets).map(String);

  const patch = (partial: Partial<RtecReportForm>) =>
    onChange({ ...formSafe, ...partial });

  const patchPp = (partial: Partial<ProjectProposalForm>) =>
    patch({ proposalSnapshot: { ...pp, ...partial } });

  const setComplianceStatus = (id: string, status: RtecComplianceStatus) => {
    const existing = formSafe.complianceItems;
    const has = existing.some((item) => item.id === id);
    const next = has
      ? existing.map((item) => (item.id === id ? { ...item, status } : item))
      : [
          ...existing,
          {
            id,
            label:
              RTEC_COMPLIANCE_ITEMS.find((c) => c.id === id)?.label ??
              RTEC_OFFICIAL_COMPLIANCE_ITEMS.find((c) => c.id === id)?.label ??
              id,
            status,
          },
        ];
    patch({ complianceItems: next });
  };

  const officialItems = mergeOfficialComplianceLabels(formSafe.complianceItems);
  const extraItems = portalExtraItems(formSafe.complianceItems);
  const plantLayout = formSafe.attachmentRefs.find((a) => a.kind === "plantLayout");

  const showCover = step === "all";
  const showBrief = step === "all";
  const showCompliance = step === "compliance" || step === "all";
  const showEvaluation = step === "evaluation" || step === "all";
  const showRecommendation = step === "recommendation" || step === "all";

  return (
    <div className="space-y-8 print:hidden">
      {step === "all" && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">Edit RTEC Report</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Fields follow SETUP Form 002 (Annex A-2). Changes save to the RTEC draft and
              appear on Preview / PDF. Sync from Project Proposal only fills blank fields.
            </p>
          </div>
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 text-sm font-bold hover:bg-gray-50"
            >
              Save draft
            </button>
          )}
        </div>
      )}

      {showCover && (
        <section className="space-y-4">
          <SectionTitle>Cover</SectionTitle>
          <div className="grid sm:grid-cols-1 gap-3">
            <div>
              <FieldLabel>Project Title</FieldLabel>
              <TextArea
                value={pp.projectTitle}
                onChange={(projectTitle) => patchPp({ projectTitle })}
                rows={2}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Proponent</FieldLabel>
                <TextInput
                  value={pp.proponentName || pp.firmName}
                  onChange={(proponentName) => patchPp({ proponentName })}
                />
              </div>
              <div>
                <FieldLabel>Contact Person</FieldLabel>
                <TextInput
                  value={pp.contactPerson}
                  onChange={(contactPerson) => patchPp({ contactPerson })}
                />
              </div>
            </div>
          </div>
          <div>
            <FieldLabel>Project Cost</FieldLabel>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <FieldLabel>Proponent</FieldLabel>
                <TextInput
                  value={formSafe.projectCostProponent}
                  onChange={(projectCostProponent) => patch({ projectCostProponent })}
                />
              </div>
              <div>
                <FieldLabel>DOST-SETUP</FieldLabel>
                <TextInput
                  value={formSafe.projectCostSetup}
                  onChange={(projectCostSetup) => patch({ projectCostSetup })}
                />
              </div>
              <div>
                <FieldLabel>DOST-LGIA</FieldLabel>
                <TextInput
                  value={formSafe.projectCostLgia}
                  onChange={(projectCostLgia) => patch({ projectCostLgia })}
                />
              </div>
              <div>
                <FieldLabel>Total</FieldLabel>
                <TextInput
                  value={formSafe.projectCostTotal}
                  onChange={(projectCostTotal) => patch({ projectCostTotal })}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {showBrief && (
        <section className="space-y-4">
          <SectionTitle>{RTEC_SECTION_I}</SectionTitle>
          <SubTitle>{RTEC_SUBSECTION_COMPANY}</SubTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Name of Firm</FieldLabel>
              <TextInput
                value={pp.firmName}
                onChange={(firmName) => patchPp({ firmName })}
              />
            </div>
            <div>
              <FieldLabel>Contact No.</FieldLabel>
              <TextInput
                value={pp.contactNumber}
                onChange={(contactNumber) => patchPp({ contactNumber })}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Address</FieldLabel>
              <TextInput
                value={pp.firmAddress}
                onChange={(firmAddress) => patchPp({ firmAddress })}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Contact Person</FieldLabel>
              <TextInput
                value={pp.contactPerson}
                onChange={(contactPerson) => patchPp({ contactPerson })}
              />
            </div>
          </div>

          <SubTitle>{RTEC_SUBSECTION_OBJECTIVES}</SubTitle>
          <div>
            <FieldLabel>General Objective</FieldLabel>
            <TextArea
              value={pp.generalObjective}
              onChange={(generalObjective) => patchPp({ generalObjective })}
              rows={4}
            />
          </div>
          <StringListEditor
            label="Specific Objectives"
            items={specificObjectives}
            onChange={(specificObjectives) => patchPp({ specificObjectives })}
          />

          <SubTitle>{RTEC_SUBSECTION_EXPECTED}</SubTitle>
          <StringListEditor
            label="Expected Outputs / Impacts"
            items={expectedOutputs}
            onChange={(expectedOutputBullets) => patchPp({ expectedOutputBullets })}
          />
        </section>
      )}

      {showCompliance && (
        <section className="space-y-4">
          <SectionTitle>{RTEC_SECTION_II}</SectionTitle>
          <p className="text-sm text-gray-600">
            Official Form 002 checklist (14 Word rows). Mark Complied, Not Complied, or N/A.
            N/A leaves both print tick cells empty.
          </p>
          <ComplianceList
            items={officialItems}
            onChange={setComplianceStatus}
          />
          {extraItems.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <SubTitle>Additional portal checks</SubTitle>
              <p className="text-xs text-gray-500">
                These stay in the staff workflow but are not printed on Form 002.
              </p>
              <ComplianceList
                items={extraItems}
                onChange={setComplianceStatus}
                startIndex={RTEC_OFFICIAL_COMPLIANCE_IDS.length + 1}
              />
            </div>
          )}
        </section>
      )}

      {showEvaluation && (
        <section className="space-y-6">
          <SectionTitle>{RTEC_SECTION_III}</SectionTitle>

          <div className="space-y-3">
            <SubTitle>{RTEC_SUBSECTION_MANAGEMENT}</SubTitle>
            <div>
              <FieldLabel>Skills and expertise</FieldLabel>
              <TextArea
                value={pp.skillsExpertise}
                onChange={(skillsExpertise) => patchPp({ skillsExpertise })}
                rows={4}
              />
            </div>
            <div>
              <FieldLabel>Compensation notes</FieldLabel>
              <TextArea
                value={pp.compensation}
                onChange={(compensation) => patchPp({ compensation })}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <SubTitle>{RTEC_SUBSECTION_TECHNICAL}</SubTitle>
            <p className="text-xs font-semibold text-gray-600">
              {RTEC_TECH_PRODUCTION_PROCESS}
            </p>
            <div>
              <FieldLabel>{RTEC_TECH_PROCESS_FLOW}</FieldLabel>
              <TextArea
                value={pp.productionProcess}
                onChange={(productionProcess) => patchPp({ productionProcess })}
                rows={4}
              />
            </div>
            <div>
              <FieldLabel>{RTEC_TECH_MATERIAL_BALANCE}</FieldLabel>
              <TextArea
                value={pp.materialBalance}
                onChange={(materialBalance) => patchPp({ materialBalance })}
                rows={4}
              />
            </div>
            <div>
              <FieldLabel>{RTEC_TECH_EXISTING_EQUIPMENT}</FieldLabel>
              <TextArea
                value={pp.equipmentNarrative}
                onChange={(equipmentNarrative) => patchPp({ equipmentNarrative })}
                rows={4}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>{RTEC_TECH_CONSTRAINTS}</FieldLabel>
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      constraintRows: [
                        ...formSafe.constraintRows,
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
                {formSafe.constraintRows.map((row, ri) => (
                  <div
                    key={row.id}
                    className="border border-gray-200 rounded-xl p-3 space-y-2 bg-white"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500">
                        Row {ri + 1}
                      </span>
                      {formSafe.constraintRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            patch({
                              constraintRows: formSafe.constraintRows.filter(
                                (r) => r.id !== row.id,
                              ),
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
                          constraintRows: formSafe.constraintRows.map((r) =>
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
                          constraintRows: formSafe.constraintRows.map((r) =>
                            r.id === row.id
                              ? { ...r, proposedIntervention: v }
                              : r,
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
                          constraintRows: formSafe.constraintRows.map((r) =>
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
                          constraintRows: formSafe.constraintRows.map((r) =>
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
              <FieldLabel>{RTEC_TECH_PLANT_LAYOUT}</FieldLabel>
              <p className="text-sm text-gray-600 border border-dashed border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                {plantLayout?.fileName
                  ? `On file: ${plantLayout.fileName}`
                  : "No plant layout attached — upload via Project Proposal / TNA Form 01, then Sync."}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>{RTEC_TECH_INTERVENTION_COST}</FieldLabel>
                <button
                  type="button"
                  onClick={() =>
                    patchPp({
                      interventionCostTable: [...costTable, ["", "", "", ""]],
                    })
                  }
                  className="flex items-center gap-1 text-xs font-semibold text-[#0C2461] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add row
                </button>
              </div>
              <div className="space-y-3">
                {(costTable.length ? costTable : [["", "", "", ""]]).map(
                  (row, ri) => (
                    <div
                      key={ri}
                      className="grid sm:grid-cols-4 gap-2 border border-gray-200 rounded-xl p-3 bg-white"
                    >
                      <div className="sm:col-span-1">
                        <FieldLabel>Equipment / Spec</FieldLabel>
                        <TextInput
                          value={row[0] ?? ""}
                          onChange={(v) => {
                            const next = costTable.length
                              ? costTable.map((r) => [...r])
                              : [["", "", "", ""]];
                            next[ri] = [v, next[ri][1] ?? "", next[ri][2] ?? "", next[ri][3] ?? ""];
                            patchPp({ interventionCostTable: next });
                          }}
                        />
                      </div>
                      <div>
                        <FieldLabel>Qty</FieldLabel>
                        <TextInput
                          value={row[1] ?? ""}
                          onChange={(v) => {
                            const next = costTable.length
                              ? costTable.map((r) => [...r])
                              : [["", "", "", ""]];
                            next[ri] = [next[ri][0] ?? "", v, next[ri][2] ?? "", next[ri][3] ?? ""];
                            patchPp({ interventionCostTable: next });
                          }}
                        />
                      </div>
                      <div>
                        <FieldLabel>Unit Cost</FieldLabel>
                        <TextInput
                          value={row[2] ?? ""}
                          onChange={(v) => {
                            const next = costTable.length
                              ? costTable.map((r) => [...r])
                              : [["", "", "", ""]];
                            next[ri] = [next[ri][0] ?? "", next[ri][1] ?? "", v, next[ri][3] ?? ""];
                            patchPp({ interventionCostTable: next });
                          }}
                        />
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <FieldLabel>Total Cost</FieldLabel>
                          <TextInput
                            value={row[3] ?? ""}
                            onChange={(v) => {
                              const next = costTable.length
                                ? costTable.map((r) => [...r])
                                : [["", "", "", ""]];
                              next[ri] = [
                                next[ri][0] ?? "",
                                next[ri][1] ?? "",
                                next[ri][2] ?? "",
                                v,
                              ];
                              patchPp({ interventionCostTable: next });
                            }}
                          />
                        </div>
                        {costTable.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              patchPp({
                                interventionCostTable: costTable.filter(
                                  (_, j) => j !== ri,
                                ),
                              })
                            }
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>{RTEC_TECH_FABRICATORS}</FieldLabel>
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      fabricatorRows: [
                        ...formSafe.fabricatorRows,
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
                {formSafe.fabricatorRows.map((row) => (
                  <div
                    key={row.id}
                    className="grid sm:grid-cols-2 gap-2 border border-gray-200 rounded-xl p-3 bg-white"
                  >
                    <div>
                      <FieldLabel>Name</FieldLabel>
                      <TextInput
                        value={row.name}
                        onChange={(v) =>
                          patch({
                            fabricatorRows: formSafe.fabricatorRows.map((r) =>
                              r.id === row.id ? { ...r, name: v } : r,
                            ),
                          })
                        }
                      />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <FieldLabel>Address</FieldLabel>
                        <TextInput
                          value={row.address}
                          onChange={(v) =>
                            patch({
                              fabricatorRows: formSafe.fabricatorRows.map((r) =>
                                r.id === row.id ? { ...r, address: v } : r,
                              ),
                            })
                          }
                        />
                      </div>
                      {formSafe.fabricatorRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            patch({
                              fabricatorRows: formSafe.fabricatorRows.filter(
                                (r) => r.id !== row.id,
                              ),
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

          <div className="space-y-3">
            <SubTitle>{RTEC_SUBSECTION_MARKETING}</SubTitle>
            <div>
              <FieldLabel>Market situation</FieldLabel>
              <TextArea
                value={pp.marketSituation}
                onChange={(marketSituation) => patchPp({ marketSituation })}
                rows={3}
              />
            </div>
            <div>
              <FieldLabel>Product demand / supply</FieldLabel>
              <TextArea
                value={pp.productDemandSupply}
                onChange={(productDemandSupply) =>
                  patchPp({ productDemandSupply })
                }
                rows={3}
              />
            </div>
            <div>
              <FieldLabel>Existing marketing problems</FieldLabel>
              <TextArea
                value={pp.existingMarketingProblems}
                onChange={(existingMarketingProblems) =>
                  patchPp({ existingMarketingProblems })
                }
                rows={3}
              />
            </div>
            <StringListEditor
              label="Market plans / strategies"
              items={strategies}
              onChange={(marketStrategies) => patchPp({ marketStrategies })}
            />
          </div>

          <div>
            <SubTitle>{RTEC_SUBSECTION_FINANCIAL}</SubTitle>
            <FieldLabel>Financial ratio narrative</FieldLabel>
            <TextArea
              value={formSafe.ratioNarrative}
              onChange={(ratioNarrative) => patch({ ratioNarrative })}
              rows={5}
              placeholder="Summarize liquidity, ROI, and financial constraints…"
            />
          </div>

          <div>
            <SubTitle>{RTEC_SUBSECTION_WASTE}</SubTitle>
            <TextArea
              value={pp.wasteManagement}
              onChange={(wasteManagement) => patchPp({ wasteManagement })}
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SubTitle>{RTEC_SUBSECTION_RISK}</SubTitle>
              <button
                type="button"
                onClick={() =>
                  patchPp({
                    riskRows: [
                      ...riskRows,
                      {
                        id: uid(),
                        objective: "",
                        risk: "",
                        assumption: "",
                        plan: "",
                      },
                    ],
                  })
                }
                className="flex items-center gap-1 text-xs font-semibold text-[#0C2461] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add risk row
              </button>
            </div>
            {(riskRows.length
              ? riskRows
              : [
                  {
                    id: "draft-risk-0",
                    objective: "",
                    risk: "",
                    assumption: "",
                    plan: "",
                  } satisfies ProjectProposalRiskRow,
                ]
            ).map((row) => (
              <div
                key={row.id}
                className="border border-gray-200 rounded-xl p-3 space-y-2 bg-white"
              >
                <div className="flex justify-end">
                  {riskRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        patchPp({
                          riskRows: riskRows.filter((r) => r.id !== row.id),
                        })
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <TextArea
                  value={row.objective}
                  onChange={(objective) => {
                    const base = riskRows.length ? riskRows : [{ ...row }];
                    patchPp({
                      riskRows: base.map((r) =>
                        r.id === row.id ? { ...r, objective } : r,
                      ),
                    });
                  }}
                  rows={2}
                  placeholder="Objective"
                />
                <TextArea
                  value={row.risk}
                  onChange={(risk) => {
                    const base = riskRows.length ? riskRows : [{ ...row }];
                    patchPp({
                      riskRows: base.map((r) =>
                        r.id === row.id ? { ...r, risk } : r,
                      ),
                    });
                  }}
                  rows={2}
                  placeholder="Risk"
                />
                <TextArea
                  value={row.assumption}
                  onChange={(assumption) => {
                    const base = riskRows.length ? riskRows : [{ ...row }];
                    patchPp({
                      riskRows: base.map((r) =>
                        r.id === row.id ? { ...r, assumption } : r,
                      ),
                    });
                  }}
                  rows={2}
                  placeholder="Assumption"
                />
                <TextArea
                  value={row.plan}
                  onChange={(plan) => {
                    const base = riskRows.length ? riskRows : [{ ...row }];
                    patchPp({
                      riskRows: base.map((r) =>
                        r.id === row.id ? { ...r, plan } : r,
                      ),
                    });
                  }}
                  rows={2}
                  placeholder="Management plan"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {showRecommendation && (
        <section className="space-y-6">
          <SectionTitle>{RTEC_SECTION_IV}</SectionTitle>
          <div>
            <FieldLabel>Recommendation (addressing TNA findings)</FieldLabel>
            <TextArea
              value={formSafe.recommendation}
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
                  value={formSafe.signatures.chairperson}
                  onChange={(v) =>
                    patch({
                      signatures: { ...formSafe.signatures, chairperson: v },
                    })
                  }
                />
              </div>
              <div>
                <FieldLabel>Evaluation date (editor only)</FieldLabel>
                <input
                  type="date"
                  value={formSafe.signatures.evaluationDate}
                  onChange={(e) =>
                    patch({
                      signatures: {
                        ...formSafe.signatures,
                        evaluationDate: e.target.value,
                      },
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
                    value={formSafe.signatures[k]}
                    onChange={(v) =>
                      patch({
                        signatures: { ...formSafe.signatures, [k]: v },
                      })
                    }
                  />
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>RPMO</FieldLabel>
                <TextInput
                  value={formSafe.signatures.rpmo}
                  onChange={(v) =>
                    patch({ signatures: { ...formSafe.signatures, rpmo: v } })
                  }
                />
              </div>
              <div>
                <FieldLabel>Regional Director</FieldLabel>
                <TextInput
                  value={
                    formSafe.signatures.regionalDirector ||
                    DOST_REGION_12_DIRECTOR_NAME
                  }
                  onChange={(v) =>
                    patch({
                      signatures: {
                        ...formSafe.signatures,
                        regionalDirector: v,
                      },
                    })
                  }
                  placeholder={DOST_REGION_12_DIRECTOR_NAME}
                />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
