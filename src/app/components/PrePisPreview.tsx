/**
 * Author: Yzrel Jade B. Eborde
 */

import { Printer } from "lucide-react";
import type { PrePisDraftForm } from "../api/types";
import { PIS_DOST_BLUE } from "../utils/projectInformationSheet";

interface PrePisPreviewProps {
  draft: PrePisDraftForm;
  applicationId?: string;
  onPrint?: () => void;
  showToolbar?: boolean;
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <tr>
      <td className="font-semibold text-gray-600 w-1/3">{label}</td>
      <td>{value?.trim() || "—"}</td>
    </tr>
  );
}

export function PrePisPreview({
  draft,
  applicationId,
  onPrint,
  showToolbar = true,
}: PrePisPreviewProps) {
  return (
    <div>
      {showToolbar && onPrint && (
        <div className="flex justify-end print:hidden mb-3">
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-[#0C2461] text-white"
          >
            <Printer className="w-4 h-4" />
            Print for MOA signing day
          </button>
        </div>
      )}

      <div id="pre-pis-preview" className="bg-white border border-gray-200 rounded-xl p-6 text-xs">
        <h1 className="text-center font-black text-sm mb-4" style={{ color: PIS_DOST_BLUE }}>
          PROJECT INFORMATION SHEET
          <br />
          <span className="text-xs font-semibold">(FOR ASSISTANCE LEVEL - LAB AND NON-LAB PROJECTS)</span>
        </h1>

        <div className="meta-grid text-xs mb-4">
          <div><span className="font-semibold">LAB:</span> {draft.labName}</div>
          <div><span className="font-semibold">Project Title:</span> {draft.projectTitle}</div>
          <div><span className="font-semibold">DOST Personnel In-Charge:</span> {draft.dostPersonnelInCharge}</div>
          <div><span className="font-semibold">DOST Input:</span> {draft.dostInput}</div>
          <div><span className="font-semibold">Cooperator&apos;s Input:</span> {draft.cooperatorInput}</div>
          <div><span className="font-semibold">Date prepared:</span> {draft.datePrepared}</div>
          <div><span className="font-semibold">Status:</span> {draft.status}</div>
        </div>

        <h2 style={{ color: PIS_DOST_BLUE }}>I. Implementing Agency</h2>
        <h3>1.1 Name of Organization</h3>
        <table className="w-full mb-3">
          <tbody>
            <Field label="Name of Organization" value={draft.organizationName} />
            <Field label="Address" value={draft.organizationAddress} />
            <Field label="Type of Organization" value={draft.orgType} />
            <Field label="Nature of business" value={draft.natureOfBusiness} />
            <Field label="Sectors" value={draft.sectors} />
            <Field label="Year established" value={draft.yearEstablished} />
            <Field label="Classification" value={draft.classification} />
          </tbody>
        </table>

        <h3>1.2 Main products/services, technology employed, production capacity</h3>
        <table className="w-full mb-3">
          <tbody>
            <Field label="Main products/services" value={draft.mainProducts} />
            <Field label="Technology employed" value={draft.technologyEmployed} />
            <Field label="Production capacity" value={draft.productionCapacity} />
            <Field label="Standards/Certifications" value={draft.standardsCertifications} />
          </tbody>
        </table>

        <h3>1.3 Person In-Charge, staff complement, contact</h3>
        <table className="w-full mb-3">
          <tbody>
            <Field label="Person In-Charge" value={draft.personInCharge} />
            <Field label="Staff complement" value={draft.staffComplement} />
            <Field label="Contact numbers" value={draft.contactNumbers} />
          </tbody>
        </table>

        <h2 style={{ color: PIS_DOST_BLUE }}>II. Core Project Information</h2>
        <table className="w-full mb-3">
          <tbody>
            <Field label="2.1 Title" value={draft.projectTitle} />
            <Field label="Brief Description" value={draft.briefDescription} />
            <Field label="Implementing Agency" value={draft.implementingAgency} />
          </tbody>
        </table>
        <table className="w-full mb-3">
          <thead>
            <tr>
              <th>Cost</th>
              <th>LGU</th>
              <th>DOST</th>
              <th>Cooperators</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Amount</td>
              <td>{draft.costLgu || "—"}</td>
              <td>{draft.costDost || "—"}</td>
              <td>{draft.costCooperators || "—"}</td>
              <td>{draft.costTotal || "—"}</td>
            </tr>
          </tbody>
        </table>
        <p className="font-semibold mb-1">2.2 Objectives</p>
        <p><strong>General:</strong> {draft.generalObjective || "—"}</p>
        <p className="font-semibold mt-2">Specific:</p>
        <ul className="list-disc list-inside">
          {draft.specificObjectives.filter((s) => s.trim()).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        <p className="mt-2"><strong>Methodology:</strong> {draft.methodology || "—"}</p>
        <p><strong>Beneficiaries:</strong> {draft.beneficiaries || "—"}</p>

        <p className="font-semibold mt-3 mb-1">2.3 Expected Outputs</p>
        <ul className="list-disc list-inside text-xs">
          <li>Final Product/Service: {draft.expectedOutputs.finalProduct || "—"}</li>
          <li>Publication: {draft.expectedOutputs.publication || "—"}</li>
          <li>Policy: {draft.expectedOutputs.policy || "—"}</li>
          <li>People Services: {draft.expectedOutputs.peopleServices || "—"}</li>
          <li>Partnership: {draft.expectedOutputs.partnership || "—"}</li>
          <li>Economic: {draft.expectedOutputs.economic || "—"}</li>
          <li>Others: {draft.expectedOutputs.others || "—"}</li>
        </ul>

        <p className="font-semibold mt-3">2.5 Schedule / Location</p>
        <table className="w-full mb-2">
          <tbody>
            <Field label="Pre-implementation" value={draft.schedulePreImplementation} />
            <Field label="Implementation" value={draft.scheduleImplementation} />
            <Field label="Operation" value={draft.scheduleOperation} />
            <Field label="Location" value={draft.projectLocation} />
          </tbody>
        </table>

        <div className="pis-footer">
          Regional Guidelines on SETUP (Revision 3.0) Annex E: SETUP Form 008 — Pre-Implementation PIS — Page 1 of 2
          {applicationId && ` · ${applicationId}`}
        </div>

        <div className="pis-page-break mt-8">
          <h2 style={{ color: PIS_DOST_BLUE }}>III. Gender and Development (GAD)</h2>
          <table className="w-full mb-4">
            <thead>
              <tr>
                <th>Gender issues</th>
                <th>GAD objectives</th>
                <th>GAD activities</th>
              </tr>
            </thead>
            <tbody>
              {draft.gadRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.genderIssues || "—"}</td>
                  <td>{row.gadObjectives || "—"}</td>
                  <td>{row.gadActivities || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pis-footer">
            Regional Guidelines on SETUP (Revision 3.0) Annex E: SETUP Form 008 — Pre-Implementation PIS — Page 2 of 2
          </div>
        </div>
      </div>
    </div>
  );
}
