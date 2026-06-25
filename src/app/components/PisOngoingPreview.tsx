/**
 * Author: Yzrel Jade B. Eborde
 */

import type { PisOngoingFiling } from "../api/types";
import { PIS_DOST_BLUE } from "../utils/projectInformationSheet";
import { PreviewFieldRow, PreviewTable } from "./PreviewLayout";

interface PisOngoingPreviewProps {
  filing: PisOngoingFiling;
  applicationId?: string;
}

export function PisOngoingPreview({ filing, applicationId }: PisOngoingPreviewProps) {
  const semesterLabel =
    filing.semester === "1"
      ? "1st Semester (January–June)"
      : filing.semester === "2"
        ? "2nd Semester (July–December)"
        : "—";

  return (
    <div
      id={`pis-ongoing-preview-${filing.id}`}
      className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 text-xs"
    >
      <h1 className="text-center font-black text-sm mb-4" style={{ color: PIS_DOST_BLUE }}>
        PROJECT INFORMATION SHEET (FORM 009)
        <br />
        <span className="text-xs font-semibold">Ongoing Monitoring Report</span>
      </h1>

      <div className="space-y-0 mb-4">
        <PreviewFieldRow label="Reporting period" value={filing.periodLabel} className="text-xs" />
        <PreviewFieldRow label="Semester" value={semesterLabel} className="text-xs" />
        <PreviewFieldRow label="Project code" value={filing.projectCode} className="text-xs" />
        <PreviewFieldRow label="Project title" value={filing.projectTitle} className="text-xs" />
        <PreviewFieldRow label="Firm name" value={filing.firmName} className="text-xs" />
        <PreviewFieldRow label="Owner / manager" value={filing.ownerName} className="text-xs" />
      </div>

      <h2 style={{ color: PIS_DOST_BLUE }}>Assets (Php)</h2>
      <PreviewTable
        className="mb-4"
        columns={[
          { key: "land", header: "Land", mobileLabel: "Land" },
          { key: "building", header: "Building", mobileLabel: "Building" },
          { key: "equipment", header: "Equipment", mobileLabel: "Equipment" },
          { key: "wc", header: "Working capital", mobileLabel: "Working capital" },
        ]}
        rows={[
          [
            filing.assetsLand || "—",
            filing.assetsBuilding || "—",
            filing.assetsEquipment || "—",
            filing.assetsWorkingCapital || "—",
          ],
        ]}
      />

      <h2 style={{ color: PIS_DOST_BLUE }}>Employment</h2>
      <PreviewTable
        className="mb-4"
        columns={[
          { key: "type", header: "Type", mobileLabel: "Type" },
          { key: "male", header: "Male", mobileLabel: "Male" },
          { key: "female", header: "Female", mobileLabel: "Female" },
        ]}
        rows={[
          [
            "Direct",
            filing.employmentDirectMale || "—",
            filing.employmentDirectFemale || "—",
          ],
          [
            "Indirect",
            filing.employmentIndirectMale || "—",
            filing.employmentIndirectFemale || "—",
          ],
        ]}
      />

      <h2 style={{ color: PIS_DOST_BLUE }}>Production &amp; Sales</h2>
      <div className="space-y-0 mb-4">
        <PreviewFieldRow label="Production volume (local)" value={filing.productionVolumeLocal} className="text-xs" />
        <PreviewFieldRow label="Production volume (export)" value={filing.productionVolumeExport} className="text-xs" />
        <PreviewFieldRow label="Production details" value={filing.productionDetails} className="text-xs" />
        <PreviewFieldRow label="Gross sales (local)" value={filing.grossSalesLocal} className="text-xs" />
        <PreviewFieldRow label="Gross sales (export)" value={filing.grossSalesExport} className="text-xs" />
        <PreviewFieldRow label="Export destinations" value={filing.exportDestinations} className="text-xs" />
      </div>

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
