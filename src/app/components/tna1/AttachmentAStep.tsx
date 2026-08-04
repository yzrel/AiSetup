/**
 * Author: Yzrel Jade B. Eborde
 *
 * TNA Form 01 — Step 2: Attachment A, Enterprise Profile.
 */

import { MODULE_BODY } from "../moduleTheme";
import { AiAssistTextarea } from "../AiAssistField";
import { PrioritySectorSelect } from "../PrioritySectorSelect";
import { allowWhenDemo } from "../../utils/demoMode";
import type { Tna1StepContext } from "./stepContext";
import { DOST_BLUE, InfoBanner, inputCls, labelCls } from "./tna1Ui";

export function AttachmentAStep({ ctx }: { ctx: Tna1StepContext }) {
  const { form, set, tnaAi, setStep, goToStep } = ctx;

  return (
    <div className={MODULE_BODY}>
      <InfoBanner icon="📎" color="blue" title="Attachment A — Enterprise Profile"
        text="Provide detailed background information about your enterprise. All fields marked * are required." />

      <div>
        <div className="bg-blue-900 text-white px-4 py-2.5 rounded-t-xl flex items-center gap-2 text-sm font-bold">
          <span>📎</span> ATTACHMENT A — Enterprise Profile
        </div>
        <div className="border border-t-0 border-gray-200 rounded-b-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name of Enterprise <span className="text-red-500">*</span></label>
              <input value={form.enterpriseName} onChange={e => set("enterpriseName", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Production Site / Location</label>
              <input value={form.productionSite} onChange={e => set("productionSite", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Business Permit No.</label>
              <input value={form.businessPermitNo} onChange={e => set("businessPermitNo", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Year Registered</label>
              <input type="number" value={form.yearRegistered} onChange={e => set("yearRegistered", e.target.value)} className={inputCls} />
            </div>
          </div>
          <AiAssistTextarea
            label="Brief Enterprise Background"
            value={form.enterpriseBackground}
            onChange={(enterpriseBackground) => set("enterpriseBackground", enterpriseBackground)}
            inputClassName={inputCls}
            labelClassName={labelCls}
            minHeight="min-h-[80px]"
            {...tnaAi("enterpriseBackground", (v) => set("enterpriseBackground", v))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Year Established</label>
              <input type="number" value={form.yearEstablished} onChange={e => set("yearEstablished", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Initial Capitalization (PHP)</label>
              <input value={form.initialCapital} onChange={e => set("initialCapital", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Enterprise Registration No.</label>
              <input value={form.registrationNo} onChange={e => set("registrationNo", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Present Capitalization (PHP)</label>
              <input value={form.presentCapital} onChange={e => set("presentCapital", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Classification According to Capital <span className="text-red-500">*</span></label>
              <select value={form.capitalClassification} onChange={e => set("capitalClassification", e.target.value)} className={inputCls}>
                <option value="">Select MSME classification…</option>
                <option value="Micro">Micro — assets up to ₱3,000,000</option>
                <option value="Small">Small — assets ₱3,000,001 to ₱15,000,000</option>
                <option value="Medium">Medium — assets ₱15,000,001 to ₱100,000,000</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Type of Organization <span className="text-red-500">*</span></label>
              <select value={form.organizationType} onChange={e => set("organizationType", e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                <option>Sole Proprietorship (DTI)</option>
                <option>Partnership (SEC)</option>
                <option>Corporation (SEC)</option>
                <option>One Person Corporation (SEC)</option>
                <option>Cooperative (CDA)</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Classification by Employment <span className="text-red-500">*</span></label>
              <select value={form.employmentClass} onChange={e => set("employmentClass", e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                <option>Micro (1–9 employees)</option>
                <option>Small (10–99 employees)</option>
                <option>Medium (100–199 employees)</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Number of Employees <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Male</span>
                <input type="number" min="0" value={form.employeesMale} onChange={e => set("employeesMale", e.target.value)} className={inputCls} placeholder="0" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Female</span>
                <input type="number" min="0" value={form.employeesFemale} onChange={e => set("employeesFemale", e.target.value)} className={inputCls} placeholder="0" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Indirect Workers</span>
                <input type="number" min="0" value={form.employeesIndirect} onChange={e => set("employeesIndirect", e.target.value)} className={inputCls} placeholder="0" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Contract Workers</span>
                <input type="number" min="0" value={form.employeesContract} onChange={e => set("employeesContract", e.target.value)} className={inputCls} placeholder="0" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Per TNA Form 01 — report direct employees (M/F) and indirect/contract workers separately.</p>
          </div>

          <AiAssistTextarea
            label="Gender and Development (GAD) — Participation and Involvement"
            value={form.genderInvolvement ?? ""}
            onChange={(genderInvolvement) => set("genderInvolvement", genderInvolvement)}
            inputClassName={inputCls}
            labelClassName={labelCls}
            minHeight="min-h-[100px]"
            {...tnaAi("genderInvolvement", (v) => set("genderInvolvement", v))}
          />
          <p className="text-xs text-gray-400 -mt-2">
            Describe how women and men participate in the enterprise. AI Assist drafts from Male/Female employee counts (DOST GAD / sex-disaggregated reporting).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Sector <span className="text-red-500">*</span></label>
              <PrioritySectorSelect
                required
                value={form.sector}
                onChange={(value) => set("sector", value)}
                className={inputCls}
                placeholder="Select business sector"
              />
            </div>
            <div>
              <label className={labelCls}>Commodity <span className="text-red-500">*</span></label>
              <input value={form.commodity} onChange={e => set("commodity", e.target.value)} className={inputCls} placeholder="e.g. Cassava-based products" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Specific Product / Service Offered <span className="text-red-500">*</span></label>
            <textarea rows={2} value={form.mainProduct} onChange={e => set("mainProduct", e.target.value)} className={inputCls} />
          </div>
          <AiAssistTextarea
            label="Reasons Why Assistance is Being Sought *"
            value={form.reasonsForAssistance}
            onChange={(reasonsForAssistance) => set("reasonsForAssistance", reasonsForAssistance)}
            inputClassName={inputCls}
            labelClassName={labelCls}
            minHeight="min-h-[80px]"
            {...tnaAi("reasonsForAssistance", (v) => set("reasonsForAssistance", v))}
          />

          {/* Consultations */}
          <div>
            <label className={labelCls}>Have you consulted any other individual/organization for assistance?</label>
            <div className="flex gap-6 mb-3">
              {["Yes","No"].map(opt => (
                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="consulted" value={opt}
                    checked={form.consultedOther === opt} onChange={() => set("consultedOther", opt)}
                    className="w-4 h-4 text-blue-600" />
                  {opt}
                </label>
              ))}
            </div>
            {form.consultedOther === "Yes" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <label className={labelCls}>Which company / agency?</label>
                  <input value={form.consultedAgency} onChange={e => set("consultedAgency", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Type of assistance sought</label>
                  <input value={form.assistanceType} onChange={e => set("assistanceType", e.target.value)} className={inputCls} />
                </div>
              </div>
            )}
            {form.consultedOther === "No" && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <label className={labelCls}>Why not?</label>
                <input value={form.whyNotConsulted} onChange={e => set("whyNotConsulted", e.target.value)} className={inputCls} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Enterprise's Plan for the Next 5 Years</label>
              <textarea rows={2} value={form.plan5Years} onChange={e => set("plan5Years", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Enterprise's Plan for the Next 10 Years</label>
              <textarea rows={2} value={form.plan10Years} onChange={e => set("plan10Years", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Current Agreements and Alliances</label>
            <textarea rows={2} value={form.agreements} onChange={e => set("agreements", e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setStep("identification")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">← Back</button>
        <button onClick={() => goToStep("benchmark")} disabled={!allowWhenDemo(!!form.sector && !!form.commodity && !!form.mainProduct && !!form.reasonsForAssistance && !!form.organizationType && !!form.capitalClassification)}
          className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
          style={{ background: DOST_BLUE }}>
          Continue to Benchmark Information →
        </button>
      </div>
    </div>
  );
}
