/**
 * Author: Yzrel Jade B. Eborde
 *
 * TNA Form 01 — Step 3: Benchmark Information (production and supply chain).
 */

import { MODULE_BODY } from "../moduleTheme";
import { AiAssistTextarea } from "../AiAssistField";
import { EditableTableResponsive } from "../ui/editable-table-responsive";
import type { Tna1StepContext } from "./stepContext";
import {
  DOST_BLUE,
  FileAttachmentField,
  InfoBanner,
  inputCls,
  labelCls,
  sectionTitle,
} from "./tna1Ui";

export function BenchmarkStep({ ctx }: { ctx: Tna1StepContext }) {
  const { form, set, tables, setT, tnaAi, setStep, goToStep } = ctx;

  return (
    <div className={MODULE_BODY}>
      <InfoBanner icon="📊" color="blue" title="Benchmark Information — Production & Supply Chain"
        text="Enter details about your raw materials, production output, and existing equipment. Click '+ Add Row' to add more entries." />

      <div>
        <h2 className={sectionTitle}>🌿 Raw Materials</h2>
        <EditableTableResponsive
          columns={["Raw Material","Source","Unit Cost (PHP)","Volume Used / Year"]}
          rows={tables.rawMaterials}
          onChange={rows => setT("rawMaterials", rows)}
          onAddRow={() => setT("rawMaterials", [...tables.rawMaterials, ["","","",""]])}
        />
      </div>
      <div>
        <h2 className={sectionTitle}>🏭 Production</h2>
        <EditableTableResponsive
          columns={["Product","Volume of Production / Year","Unit Cost of Production (PHP)","Annual Cost of Production (PHP)"]}
          rows={tables.production}
          onChange={rows => setT("production", rows)}
          onAddRow={() => setT("production", [...tables.production, ["","","",""]])}
        />
      </div>
      <div>
        <h2 className={sectionTitle}>⚙️ Existing Functional Production Equipment</h2>
        <EditableTableResponsive
          columns={["Type of Equipment","Specifications","Capacity","No. of Units","Year Acquired"]}
          rows={tables.equipment}
          onChange={rows => setT("equipment", rows)}
          onAddRow={() => setT("equipment", [...tables.equipment, ["","","","",""]])}
        />
      </div>

      <div>
        <h2 className={sectionTitle}>🔧 Production Problems and Concerns</h2>
        <AiAssistTextarea
          label="Production Problems and Concerns"
          value={form.productionProblemsConcerns}
          onChange={(productionProblemsConcerns) => set("productionProblemsConcerns", productionProblemsConcerns)}
          inputClassName={inputCls}
          labelClassName={labelCls}
          minHeight="min-h-[80px]"
          hint="Summarize key production issues identified during benchmarking (per TNA Form 01)."
          {...tnaAi("productionProblemsConcerns", (v) => set("productionProblemsConcerns", v))}
        />
        <div className="space-y-3 mt-4">
          {[
            { label: "Production Waste Management System", key: "wasteManagement" },
            { label: "Inventory System", key: "inventorySystem" },
            { label: "Maintenance Program", key: "maintenanceProgram" },
            { label: "cGMP / HACCP Activities", key: "cgmpHaccp" },
            { label: "Supplies / Purchasing System", key: "purchasingSystem" },
          ].map(item => (
            <div key={item.key}>
              <label className={labelCls}>{item.label}</label>
              <textarea rows={2} value={form[item.key]} onChange={e => set(item.key, e.target.value)}
                className={inputCls} placeholder={`Describe your ${item.label.toLowerCase()}…`} />
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <AiAssistTextarea
            label="Production Plan"
            value={form.productionPlan}
            onChange={(productionPlan) => set("productionPlan", productionPlan)}
            inputClassName={inputCls}
            labelClassName={labelCls}
            minHeight="min-h-[80px]"
            hint="Narrative from Letter of Intent notes (editable). Provide text and/or attach the production plan document."
            {...tnaAi("productionPlan", (v) => set("productionPlan", v))}
          />
          <FileAttachmentField
            label="Production Plan Attachment"
            fileName={form.productionPlanFileName}
            applicantId={ctx.applicant?.id}
            moduleKey="tna1-productionPlan"
            onFile={(name, data) => {
              set("productionPlanFileName", name);
              set("productionPlanFileData", data);
            }}
            hint="Prefilled from Letter of Intent when available. You may replace or clear the file."
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          />
        </div>
      </div>

      <div>
        <h2 className={sectionTitle}>📐 Plant Lay-Out</h2>
        <FileAttachmentField
          label="Plant Lay-Out"
          fileName={form.plantLayoutFileName}
          applicantId={ctx.applicant?.id}
          moduleKey="tna1-plantLayout"
          onFile={(name, data) => {
            set("plantLayoutFileName", name);
            set("plantLayoutFileData", data);
          }}
          hint="Upload floor plan or plant layout diagram (required attachment per TNA Form 01)."
        />
      </div>

      <div>
        <h2 className={sectionTitle}>🔄 Process Flow</h2>
        <p className="text-xs text-gray-400 mb-2">Enter as text description or upload a diagram.</p>
        <div className="flex gap-4 mb-3">
          {(["text", "attachment"] as const).map((mode) => (
            <label key={mode} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="processFlowMode"
                checked={form.processFlowMode === mode}
                onChange={() => set("processFlowMode", mode)}
                className="w-4 h-4 text-blue-600"
              />
              {mode === "text" ? "Text description" : "File attachment"}
            </label>
          ))}
        </div>
        {form.processFlowMode === "text" ? (
          <AiAssistTextarea
            label="Process Flow"
            value={form.processFlow}
            onChange={(processFlow) => set("processFlow", processFlow)}
            inputClassName={inputCls}
            labelClassName={labelCls}
            minHeight="min-h-[100px]"
            hint="Describe the production process flow step by step"
            {...tnaAi("processFlow", (v) => set("processFlow", v))}
          />
        ) : (
          <FileAttachmentField
            label=""
            fileName={form.processFlowFileName}
            applicantId={ctx.applicant?.id}
            moduleKey="tna1-processFlow"
            onFile={(name, data) => {
              set("processFlowFileName", name);
              set("processFlowFileData", data);
            }}
          />
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={() => setStep("attachment-a")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">← Back</button>
        <button onClick={() => goToStep("concerns")}
          className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
          style={{ background: DOST_BLUE }}>
          Continue to Problems & Marketing →
        </button>
      </div>
    </div>
  );
}
