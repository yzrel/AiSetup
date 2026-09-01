/**
 * Author: Yzrel Jade B. Eborde
 *
 * TNA Form 01 — Step 1: Enterprise Identification and General Agreements.
 */

import { MODULE_BODY } from "../moduleTheme";
import { formatFormMention } from "../../constants/setupForms";
import {
  TNA_FORM_01_GENERAL_AGREEMENTS,
  TNA_FORM_01_UNDERTAKING,
} from "../../constants/tnaForm01Layout";
import { allowWhenDemo } from "../../utils/demoMode";
import type { Tna1StepContext } from "./stepContext";
import {
  ClauseCheck,
  DOST_BLUE,
  InfoBanner,
  inputCls,
  labelCls,
  sectionTitle,
} from "./tna1Ui";

export function IdentificationStep({ ctx }: { ctx: Tna1StepContext }) {
  const { applicant, user, isStaff, form, set, saveTnaDraft, goToStep, allGA, docs } = ctx;
  const flaggedDocs = docs.filter((d) => d.flagged);
  const showRevisionPanel =
    !!applicant &&
    !isStaff &&
    !applicant.moduleData?.tna1?.submitted &&
    flaggedDocs.length > 0;

  return (
    <div className={MODULE_BODY}>
      <InfoBanner icon="📋" color="blue"
        title={formatFormMention("tna01")}
        text="Please fill out all sections accurately. Your registration data is pre-filled where available. Progress is saved automatically as you continue." />

      {!applicant && user && !isStaff && (
        <InfoBanner icon="⚠️" color="amber"
          title="No application record linked"
          text="We could not find your enterprise record. Complete registration first, then return to this form." />
      )}

      {showRevisionPanel && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-red-800">
            Revisions requested by DOST staff
          </p>
          <p className="text-xs text-red-700">
            Please review the flagged items below, update your {formatFormMention("tna01")}, and resubmit.
          </p>
          <ul className="space-y-1.5 mt-2">
            {flaggedDocs.map((d) => (
              <li key={d.id} className="text-xs text-red-700 flex gap-2">
                <span className="text-red-400">•</span>
                <span>
                  <strong>{d.name}</strong>
                  {d.remark ? ` — ${d.remark}` : ""}
                </span>
              </li>
            ))}
          </ul>
          {typeof applicant?.moduleData?.tna1?.staffNotes === "string" &&
            applicant.moduleData.tna1.staffNotes.trim() && (
              <p className="text-xs text-red-700 mt-2">
                <strong>Staff notes:</strong> {applicant.moduleData.tna1.staffNotes}
              </p>
            )}
        </div>
      )}

      {applicant && !isStaff && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-xs text-gray-600">
            Application: <span className="font-mono font-semibold">{applicant.applicationId}</span>
            {applicant.moduleData?.tna1?.submitted && (
              <span className="ml-2 text-emerald-700 font-semibold">· Submitted</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => saveTnaDraft(false)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#0C2461] text-white hover:opacity-90"
          >
            Save draft
          </button>
        </div>
      )}

      {/* Enterprise ID table */}
      <div>
        <h2 className={sectionTitle}>🏭 Enterprise Identification</h2>
        <div className="border border-gray-200 rounded-xl overflow-hidden text-sm">
          {/* Name row */}
          <div className="flex flex-col md:grid md:grid-cols-[minmax(140px,180px)_1fr] border-b border-gray-100">
            <div className="bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600 md:flex md:items-center md:border-r md:border-gray-100 shrink-0">
              Name of Enterprise <span className="text-red-500 ml-1">*</span>
            </div>
            <div className="p-2 sm:p-1.5">
              <input value={form.enterpriseName} onChange={e => set("enterpriseName", e.target.value)} className={`${inputCls} w-full`} />
            </div>
          </div>
          {/* Contact + Position */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-100">
            <div className="flex flex-col md:grid md:grid-cols-[minmax(120px,130px)_1fr] border-b md:border-b-0 md:border-r border-gray-100">
              <div className="bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600 md:flex md:items-center md:border-r md:border-gray-100 shrink-0">
                Contact Person <span className="text-red-500 ml-1">*</span>
              </div>
              <div className="p-2 sm:p-1.5">
                <input value={form.contactPerson} onChange={e => set("contactPerson", e.target.value)} className={`${inputCls} w-full`} />
              </div>
            </div>
            <div className="flex flex-col md:grid md:grid-cols-[minmax(130px,150px)_1fr]">
              <div className="bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600 md:flex md:items-center md:border-r md:border-gray-100 shrink-0">
                Position in Enterprise
              </div>
              <div className="p-2 sm:p-1.5">
                <input value={form.position} onChange={e => set("position", e.target.value)} className={`${inputCls} w-full`} />
              </div>
            </div>
          </div>
          {/* Office + Factory addresses */}
          {[
            { label: "Office Address", keyAddr: "officeAddress", keyTel: "officeTel", keyFax: "officeFax", keyEmail: "officeEmail" },
            { label: "Factory Address", keyAddr: "factoryAddress", keyTel: "factoryTel", keyFax: "factoryFax", keyEmail: "factoryEmail" },
          ].map((row, i) => (
            <div key={i} className="border-b border-gray-100 last:border-0">
              {/* Mobile: stacked fields */}
              <div className="md:hidden p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-700 bg-gray-50 -mx-4 px-4 py-2 border-b border-gray-100">
                  {row.label}
                </p>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Address</label>
                  <input value={form[row.keyAddr]} onChange={e => set(row.keyAddr, e.target.value)} className={`${inputCls} w-full`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tel. No.</label>
                    <input value={form[row.keyTel]} onChange={e => set(row.keyTel, e.target.value)} className={`${inputCls} w-full`} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Fax No.</label>
                    <input value={form[row.keyFax]} onChange={e => set(row.keyFax, e.target.value)} className={`${inputCls} w-full`} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">E-mail Address</label>
                  <input value={form[row.keyEmail]} onChange={e => set(row.keyEmail, e.target.value)} className={`${inputCls} w-full`} type="email" />
                </div>
              </div>
              {/* Desktop: table row */}
              <div className="hidden md:grid md:grid-cols-[minmax(140px,180px)_1fr_1fr_1fr]">
                <div className="bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600 flex items-center border-r border-gray-100">
                  {row.label}
                </div>
                <div className="p-1.5 border-r border-gray-100 min-w-0">
                  <div className="text-xs text-gray-400 mb-1">Address</div>
                  <input value={form[row.keyAddr]} onChange={e => set(row.keyAddr, e.target.value)} className={`${inputCls} w-full`} />
                </div>
                <div className="p-1.5 border-r border-gray-100 min-w-0">
                  <div className="text-xs text-gray-400 mb-1">Tel. No.</div>
                  <input value={form[row.keyTel]} onChange={e => set(row.keyTel, e.target.value)} className={`${inputCls} w-full`} />
                  <div className="text-xs text-gray-400 mb-1 mt-2">Fax No.</div>
                  <input value={form[row.keyFax]} onChange={e => set(row.keyFax, e.target.value)} className={`${inputCls} w-full`} />
                </div>
                <div className="p-1.5 min-w-0">
                  <div className="text-xs text-gray-400 mb-1">E-mail Address</div>
                  <input value={form[row.keyEmail]} onChange={e => set(row.keyEmail, e.target.value)} className={`${inputCls} w-full`} type="email" />
                </div>
              </div>
            </div>
          ))}
          {/* Website */}
          <div className="flex flex-col md:grid md:grid-cols-[minmax(140px,180px)_1fr]">
            <div className="bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600 md:flex md:items-center md:border-r md:border-gray-100 shrink-0">
              Website
            </div>
            <div className="p-2 sm:p-1.5">
              <input value={form.website} onChange={e => set("website", e.target.value)} className={`${inputCls} w-full`} placeholder="https://" />
            </div>
          </div>
        </div>
      </div>

      {/* General Agreements */}
      <div>
        <h2 className={sectionTitle}>📜 General Agreements</h2>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-3 text-sm text-blue-900 leading-relaxed mb-4">
          {TNA_FORM_01_GENERAL_AGREEMENTS.map((text, i) => (
            <ClauseCheck key={i}
              checked={form[`agreeGA${i+1}`]}
              onChange={v => set(`agreeGA${i+1}`, v)}
              title={`${i+1}. ${text}`}
              text={``}/>
          ))}
        </div>

        {/* Undertaking */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Undertaking</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            {TNA_FORM_01_UNDERTAKING}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Signature over Printed Name <span className="text-red-500">*</span></label>

              <input value={form.undertakingName} onChange={e => set("undertakingName", e.target.value)}
                className={inputCls} placeholder="Print full name" />
            </div>
            <div>
              <label className={labelCls}>Position in Enterprise</label>
              <input value={form.undertakingPosition} onChange={e => set("undertakingPosition", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.undertakingDate} onChange={e => set("undertakingDate", e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => goToStep("attachment-a")} disabled={!allowWhenDemo(allGA && !!form.enterpriseName && !!form.contactPerson)}
        className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
        style={{ background: DOST_BLUE }}>
        Continue to Enterprise Profile →
      </button>
    </div>
  );
}
