/**
 * Author: Yzrel Jade B. Eborde
 */

import { useEffect, useState } from "react";
import { FileText, Printer } from "lucide-react";
import { applicantStore } from "../store/applicantStore";
import {
  buildMoaAnnexDBody,
  getMoaAnnexDForm,
  saveMoaAnnexDDraft,
} from "../utils/moaAnnexD";
import type { MoaAnnexDForm } from "../api/types";

interface MoaAnnexDEditorProps {
  applicantId: string;
  readOnly?: boolean;
}

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400";

export function MoaAnnexDEditor({ applicantId, readOnly }: MoaAnnexDEditorProps) {
  const applicant = applicantStore.getById(applicantId);
  const [form, setForm] = useState<MoaAnnexDForm>(() => getMoaAnnexDForm(applicant ?? null));

  useEffect(() => {
    setForm(getMoaAnnexDForm(applicantStore.getById(applicantId) ?? null));
  }, [applicantId]);

  const patch = (partial: Partial<MoaAnnexDForm>) => {
    const next = { ...form, ...partial };
    setForm(next);
    saveMoaAnnexDDraft(applicantId, next, applicantStore);
  };

  const printMoa = () => {
    const body = buildMoaAnnexDBody(form);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>SETUP Annex D — MOA</title>
      <style>body{font-family:Georgia,serif;font-size:12px;line-height:1.6;padding:24px;max-width:720px;margin:0 auto}
      h1{text-align:center;font-size:14px} p{margin:12px 0;text-align:justify}</style></head><body>
      <h1>MEMORANDUM OF AGREEMENT<br/>Regional Guidelines on SETUP (Revision 3.0) — Annex D</h1>
      ${body.map((p) => `<p>${p}</p>`).join("")}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-4 border border-gray-200 rounded-xl p-5 bg-gray-50/50">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Annex D — Pro-forma MOA Draft
        </h3>
        <button
          type="button"
          onClick={printMoa}
          className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <Printer className="w-3.5 h-3.5" /> Print MOA
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500">Project title</label>
          <input
            className={inputCls}
            value={form.projectTitle}
            disabled={readOnly}
            onChange={(e) => patch({ projectTitle: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500">Approved amount</label>
          <input
            className={inputCls}
            value={form.approvedAmount}
            disabled={readOnly}
            onChange={(e) => patch({ approvedAmount: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500">Refund term</label>
          <input
            className={inputCls}
            value={form.refundTermYears}
            disabled={readOnly}
            onChange={(e) => patch({ refundTermYears: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500">Project duration (months)</label>
          <input
            className={inputCls}
            value={form.projectDurationMonths}
            disabled={readOnly}
            onChange={(e) => patch({ projectDurationMonths: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500">Special provisions</label>
        <textarea
          className={inputCls}
          rows={3}
          disabled={readOnly}
          value={form.specialProvisions}
          onChange={(e) => patch({ specialProvisions: e.target.value })}
        />
      </div>

      <div className="text-xs text-gray-600 space-y-2 bg-white border border-gray-100 rounded-lg p-4 max-h-48 overflow-y-auto">
        {buildMoaAnnexDBody(form).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
