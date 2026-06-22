/**
 * Author: Yzrel Jade B. Eborde
 */

import type { PisOngoingFiling } from "../api/types";
import { PIS_DOST_BLUE } from "../utils/projectInformationSheet";

interface PisOngoingPreviewProps {
  filing: PisOngoingFiling;
  applicationId?: string;
}

export function PisOngoingPreview({ filing, applicationId }: PisOngoingPreviewProps) {
  return (
    <div
      id={`pis-ongoing-preview-${filing.id}`}
      className="bg-white border border-gray-200 rounded-xl p-6 text-xs"
    >
      <h1 className="text-center font-black text-sm mb-4" style={{ color: PIS_DOST_BLUE }}>
        PROJECT INFORMATION SHEET (FORM 009)
        <br />
        <span className="text-xs font-semibold">Ongoing Monitoring Report</span>
      </h1>

      <table className="w-full mb-4">
        <tbody>
          <tr>
            <td className="font-semibold w-1/3">Reporting period</td>
            <td>{filing.periodLabel || "—"}</td>
          </tr>
          <tr>
            <td className="font-semibold">Semester</td>
            <td>
              {filing.semester === "1"
                ? "1st Semester (January–June)"
                : filing.semester === "2"
                  ? "2nd Semester (July–December)"
                  : "—"}
            </td>
          </tr>
          <tr>
            <td className="font-semibold">Project code</td>
            <td>{filing.projectCode || "—"}</td>
          </tr>
          <tr>
            <td className="font-semibold">Project title</td>
            <td>{filing.projectTitle || "—"}</td>
          </tr>
          <tr>
            <td className="font-semibold">Firm name</td>
            <td>{filing.firmName || "—"}</td>
          </tr>
          <tr>
            <td className="font-semibold">Owner / manager</td>
            <td>{filing.ownerName || "—"}</td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ color: PIS_DOST_BLUE }}>Assets (Php)</h2>
      <table className="w-full mb-4">
        <thead>
          <tr>
            <th>Land</th>
            <th>Building</th>
            <th>Equipment</th>
            <th>Working capital</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{filing.assetsLand || "—"}</td>
            <td>{filing.assetsBuilding || "—"}</td>
            <td>{filing.assetsEquipment || "—"}</td>
            <td>{filing.assetsWorkingCapital || "—"}</td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ color: PIS_DOST_BLUE }}>Employment</h2>
      <table className="w-full mb-4">
        <thead>
          <tr>
            <th></th>
            <th>Male</th>
            <th>Female</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Direct</td>
            <td>{filing.employmentDirectMale || "—"}</td>
            <td>{filing.employmentDirectFemale || "—"}</td>
          </tr>
          <tr>
            <td>Indirect</td>
            <td>{filing.employmentIndirectMale || "—"}</td>
            <td>{filing.employmentIndirectFemale || "—"}</td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ color: PIS_DOST_BLUE }}>Production &amp; Sales</h2>
      <table className="w-full mb-4">
        <tbody>
          <tr>
            <td className="font-semibold w-1/3">Production volume (local)</td>
            <td>{filing.productionVolumeLocal || "—"}</td>
          </tr>
          <tr>
            <td className="font-semibold">Production volume (export)</td>
            <td>{filing.productionVolumeExport || "—"}</td>
          </tr>
          <tr>
            <td className="font-semibold">Production details</td>
            <td>{filing.productionDetails || "—"}</td>
          </tr>
          <tr>
            <td className="font-semibold">Gross sales (local)</td>
            <td>{filing.grossSalesLocal || "—"}</td>
          </tr>
          <tr>
            <td className="font-semibold">Gross sales (export)</td>
            <td>{filing.grossSalesExport || "—"}</td>
          </tr>
          <tr>
            <td className="font-semibold">Export destinations</td>
            <td>{filing.exportDestinations || "—"}</td>
          </tr>
        </tbody>
      </table>

      {filing.dostAssistance.length > 0 && (
        <>
          <h2 style={{ color: PIS_DOST_BLUE }}>DOST Assistance</h2>
          <ul className="list-disc list-inside mb-4">
            {filing.dostAssistance.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Prepared by: {filing.preparedBy || "—"} · Filed:{" "}
        {filing.filedAt ? new Date(filing.filedAt).toLocaleDateString() : "—"}
        {applicationId && ` · ${applicationId}`}
      </p>
    </div>
  );
}
