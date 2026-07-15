/**
 * Author: Yzrel Jade B. Eborde
 *
 * TNA Form 01 — Step 5: Finance & Human Resources plus signatures.
 */

import { MODULE_BODY } from "../moduleTheme";
import { AiAssistTextarea } from "../AiAssistField";
import type { Tna1StepContext } from "./stepContext";
import { DOST_BLUE, InfoBanner, inputCls, labelCls, sectionTitle } from "./tna1Ui";

export function FinanceHrStep({ ctx }: { ctx: Tna1StepContext }) {
  const { form, set, tnaAi, setStep, goToStep } = ctx;

  return (
    <div className={MODULE_BODY}>
      <InfoBanner icon="💼" color="blue" title="Finance & Human Resources"
        text="Provide financial and HR information to complete your application profile." />

      <div>
        <h2 className={sectionTitle}>💰 Finance</h2>
        <div className="space-y-3">
          {[
            { label: "Cash Flow or Other Related Documents", key: "cashFlow" },
            { label: "Source(s) of Capital / Credit",        key: "capitalSource" },
            { label: "Accounting System",                     key: "accountingSystem" },
          ].map(item => (
            <div key={item.key}>
              <label className={labelCls}>{item.label}</label>
              <textarea rows={2} value={form[item.key]} onChange={e => set(item.key, e.target.value)} className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className={sectionTitle}>👥 Human Resources</h2>
        <div className="space-y-3">
          {[
            { label: "Hiring and Criteria",         key: "hiringCriteria" },
            { label: "Incentives to Employees",     key: "employeeIncentives" },
            { label: "Training and Development",    key: "trainingDevelopment" },
            { label: "Safety Measures Practiced",   key: "safetyMeasures" },
            { label: "Other Employee Welfare",      key: "employeeWelfare" },
          ].map(item => (
            <div key={item.key}>
              <label className={labelCls}>{item.label}</label>
              <textarea rows={2} value={form[item.key]} onChange={e => set(item.key, e.target.value)} className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className={sectionTitle}>📝 Other Concerns</h2>
        <AiAssistTextarea
          label="Other Concerns"
          value={form.otherConcerns}
          onChange={(otherConcerns) => set("otherConcerns", otherConcerns)}
          inputClassName={inputCls}
          labelClassName={labelCls}
          minHeight="min-h-[80px]"
          hint="Any other concerns or relevant information"
          {...tnaAi("otherConcerns", (v) => set("otherConcerns", v))}
        />
      </div>

      {/* Signatures */}
      <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Prepared by:</p>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Validated by:</p>

          <label className={`${labelCls} min-h-[3.25rem] flex items-end mb-1`}>
            Printed Name and Signature of Owner / Chair / Representative
          </label>
          <label className={`${labelCls} min-h-[3.25rem] flex items-end mb-1`}>
            Printed Name and Signature of PSTD / CASTD / CSTD
          </label>

          <input
            type="text"
            value={form.undertakingName}
            onChange={(e) => set("undertakingName", e.target.value)}
            className={inputCls}
            placeholder="Type printed name"
          />
          <input
            type="text"
            value={form.validatedByName}
            onChange={(e) => set("validatedByName", e.target.value)}
            className={inputCls}
            placeholder="Type printed name"
          />

          <label className={labelCls}>Date</label>
          <label className={labelCls}>Date</label>

          <input
            type="date"
            value={form.preparedDate}
            onChange={(e) => set("preparedDate", e.target.value)}
            className={inputCls}
          />
          <input
            type="date"
            value={form.validatedDate}
            onChange={(e) => set("validatedDate", e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="sm:hidden space-y-6">
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Prepared by:</p>
            <label className={labelCls}>Printed Name and Signature of Owner / Chair / Representative</label>
            <input
              type="text"
              value={form.undertakingName}
              onChange={(e) => set("undertakingName", e.target.value)}
              className={inputCls}
              placeholder="Type printed name"
            />
            <label className={`${labelCls} mt-3`}>Date</label>
            <input
              type="date"
              value={form.preparedDate}
              onChange={(e) => set("preparedDate", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Validated by:</p>
            <label className={labelCls}>Printed Name and Signature of PSTD / CASTD / CSTD</label>
            <input
              type="text"
              value={form.validatedByName}
              onChange={(e) => set("validatedByName", e.target.value)}
              className={inputCls}
              placeholder="Type printed name"
            />
            <label className={`${labelCls} mt-3`}>Date</label>
            <input
              type="date"
              value={form.validatedDate}
              onChange={(e) => set("validatedDate", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setStep("concerns")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">← Back</button>
        <button onClick={() => goToStep("validation")}
          className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
          style={{ background: DOST_BLUE }}>
          Proceed to Validation →
        </button>
      </div>
    </div>
  );
}
