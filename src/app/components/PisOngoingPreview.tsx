/**
 * Author: Yzrel Jade B. Eborde
 */

import type { PisOngoingFiling } from "../api/types";
import {
  FORM_009_ASSISTANCE_OPTIONS,
  FORM_009_FOOTER,
  FORM_009_TITLE,
} from "../constants/pisFormLayout";
import { PIS_DOST_BLUE } from "../utils/projectInformationSheet";
import { PreviewFieldRow, PreviewTable } from "./PreviewLayout";
import { PisEmploymentMatrixPreview } from "./PisEmploymentMatrixFields";

interface PisOngoingPreviewProps {
  filing: PisOngoingFiling;
  applicationId?: string;
}

function Field({ label, value }: { label: string; value?: string }) {
  return <PreviewFieldRow label={label} value={value} className="text-xs" />;
}

export function PisOngoingPreview({ filing, applicationId }: PisOngoingPreviewProps) {
  const semesterLabel =
    filing.semester === "1"
      ? "1st Semester (January–June)"
      : filing.semester === "2"
        ? "2nd Semester (July–December)"
        : "—";

  const assistanceLabels = FORM_009_ASSISTANCE_OPTIONS.filter((o) =>
    filing.dostAssistance.includes(o.id),
  ).map((o) => o.label);

  const firmChanged = [
    filing.firmName,
    filing.ownerName,
    filing.ownerSex,
    filing.ownerBirthday,
    filing.orgType,
    filing.businessAddress,
    filing.landline,
    filing.fax,
    filing.mobilePhone,
    filing.email,
  ].some((v) => v?.trim());

  return (
    <div
      id={`pis-ongoing-preview-${filing.id}`}
      className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 text-xs"
    >
      <h1 className="text-center font-black text-sm mb-1" style={{ color: PIS_DOST_BLUE }}>
        {FORM_009_TITLE}
      </h1>
      <p className="text-center text-xs mb-4">
        For the Period: {filing.periodLabel || semesterLabel}
      </p>

      <div className="space-y-0 mb-3">
        <Field label="Project Title" value={filing.projectTitle} />
        <Field label="Project Code" value={filing.projectCode} />
        <Field label="Semester" value={semesterLabel} />
      </div>

      {firmChanged && (
        <>
          <h2 style={{ color: PIS_DOST_BLUE }}>
            Firm details (changes from Pre-PIS only)
          </h2>
          <div className="space-y-0 mb-3">
            <Field label="Name of Firm" value={filing.firmName} />
            <Field label="Owner / Contact Person" value={filing.ownerName} />
            <Field label="Sex" value={filing.ownerSex} />
            <Field label="Birthday" value={filing.ownerBirthday} />
            <Field label="Type of Organization" value={filing.orgType} />
            <Field label="Business Address" value={filing.businessAddress} />
            <Field label="Landline" value={filing.landline} />
            <Field label="Fax" value={filing.fax} />
            <Field label="Mobile phone" value={filing.mobilePhone} />
            <Field label="Email address" value={filing.email} />
          </div>
        </>
      )}

      <h2 style={{ color: PIS_DOST_BLUE }}>Total Assets</h2>
      <PreviewTable
        className="mb-3"
        columns={[
          { key: "land", header: "Land", mobileLabel: "Land" },
          { key: "building", header: "Building", mobileLabel: "Building" },
          { key: "equipment", header: "Equipment", mobileLabel: "Equipment" },
          { key: "wc", header: "Working Capital", mobileLabel: "Working Capital" },
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

      <h2 style={{ color: PIS_DOST_BLUE }}>Total Employment Generated</h2>
      <PisEmploymentMatrixPreview employment={filing.employment} />

      <h2 style={{ color: PIS_DOST_BLUE }}>Total Volume of Production</h2>
      <div className="space-y-0 mb-3">
        <Field label="Local" value={filing.productionVolumeLocal} />
        <Field label="Export" value={filing.productionVolumeExport} />
        <Field label="Details" value={filing.productionDetails} />
      </div>

      <h2 style={{ color: PIS_DOST_BLUE }}>Total Gross Sales (₱)</h2>
      <div className="space-y-0 mb-3">
        <Field label="Local (₱)" value={filing.grossSalesLocal} />
        <Field label="Export (₱)" value={filing.grossSalesExport} />
        <Field label="Country/ies of destination" value={filing.exportDestinations} />
      </div>

      <h2 style={{ color: PIS_DOST_BLUE }}>Assistance obtained from DOST</h2>
      {assistanceLabels.length > 0 ? (
        <ul className="list-disc list-inside mb-2">
          {assistanceLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      ) : (
        <p className="mb-2">—</p>
      )}
      {filing.assistanceSpecify && (
        <Field label="Specify" value={filing.assistanceSpecify} />
      )}

      <p className="text-xs text-gray-600 mt-4">
        Prepared by (PSTD/CASTD/CSTD): {filing.preparedBy || "—"} · Filed:{" "}
        {filing.filedAt ? new Date(filing.filedAt).toLocaleDateString() : "—"}
        {applicationId && ` · ${applicationId}`}
      </p>
      <div className="pis-footer mt-4 text-[8px] text-center text-gray-500 border-t border-gray-200 pt-2">
        {FORM_009_FOOTER}
      </div>
    </div>
  );
}
