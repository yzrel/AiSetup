/**
 * Author: Yzrel Jade B. Eborde
 *
 * TNA Form 01 — Step 4: Production Problems, Concerns & Marketing.
 */

import { MODULE_BODY } from "../moduleTheme";
import type { Tna1StepContext } from "./stepContext";
import {
  DOST_BLUE,
  InfoBanner,
  inputCls,
  labelCls,
  ReadonlyField,
  sectionTitle,
} from "./tna1Ui";

export function ConcernsStep({ ctx }: { ctx: Tna1StepContext }) {
  const { form, set, setStep, goToStep } = ctx;

  return (
    <div className={MODULE_BODY}>
      <InfoBanner icon="⚠️" color="amber" title="Production Problems, Concerns & Marketing"
        text="Review operational details from Benchmark Information and complete marketing and packaging compliance." />

      <div>
        <h2 className={sectionTitle}>🔧 Production Summary</h2>
        <ReadonlyField label="Production Problems and Concerns (from Benchmark)" value={form.productionProblemsConcerns || "—"} />
        <div className="mt-4 space-y-4">
          <ReadonlyField
            label="Production Plan"
            value={form.productionPlan || "—"}
          />
          <ReadonlyField
            label="Production Plan Attachment"
            value={form.productionPlanFileName || "No file uploaded"}
          />
          <ReadonlyField label="Plant Lay-Out" value={form.plantLayoutFileName || "No file uploaded"} />
          <ReadonlyField
            label="Process Flow"
            value={
              form.processFlowMode === "attachment"
                ? form.processFlowFileName || "No file uploaded"
                : form.processFlow || "—"
            }
          />
        </div>
        <button
          type="button"
          onClick={() => goToStep("benchmark")}
          className="text-xs text-[#0C2461] font-semibold hover:underline mt-2"
        >
          ← Edit in Benchmark Information
        </button>
      </div>

      <div>
        <h2 className={sectionTitle}>📣 Marketing</h2>
        <div className="space-y-3">
          {[
            { label: "Marketing Plan",          key: "marketingPlan" },
            { label: "Market Outlets and Number", key: "marketOutlets" },
            { label: "Promotional Strategies",  key: "promotionalStrategies" },
            { label: "Market Competitors",      key: "marketCompetitors" },
          ].map(item => (
            <div key={item.key}>
              <label className={labelCls}>{item.label}</label>
              <textarea rows={2} value={form[item.key]} onChange={e => set(item.key, e.target.value)} className={inputCls} />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className={labelCls}>Packaging Compliance</label>
          <p className="text-xs text-gray-400 mb-3">Indicate compliance status and provide remarks for each packaging requirement.</p>
          <div className="space-y-3">
            {[
              { label: "Nutrition Evaluation", key: "packNutrition", remarksKey: "packNutritionRemarks" },
              { label: "Bar Code", key: "packBarcode", remarksKey: "packBarcodeRemarks" },
              { label: "Product Label", key: "packLabel", remarksKey: "packLabelRemarks" },
              { label: "Expiry Date", key: "packExpiry", remarksKey: "packExpiryRemarks" },
            ].map(item => (
              <div key={item.key} className={`p-4 rounded-xl border transition-all ${
                form[item.key] ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100"
              }`}>
                <label className="flex items-center gap-3 cursor-pointer mb-2">
                  <input type="checkbox" checked={!!form[item.key]} onChange={e => set(item.key, e.target.checked)}
                    className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-800 font-semibold">{item.label}</span>
                </label>
                <input
                  value={form[item.remarksKey]}
                  onChange={e => set(item.remarksKey, e.target.value)}
                  className={inputCls}
                  placeholder={`Remarks for ${item.label.toLowerCase()}…`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setStep("benchmark")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">← Back</button>
        <button onClick={() => goToStep("finance-hr")}
          className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
          style={{ background: DOST_BLUE }}>
          Continue to Finance & HR →
        </button>
      </div>
    </div>
  );
}
