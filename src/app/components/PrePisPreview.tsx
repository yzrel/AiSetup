/**
 * Author: Yzrel Jade B. Eborde
 */

import { Printer } from "lucide-react";
import type { PrePisDraftForm } from "../api/types";
import {
  FORM_008_ASSISTANCE_OPTIONS,
  FORM_008_FOOTER,
  FORM_008_TITLE,
} from "../constants/pisFormLayout";
import { PIS_DOST_BLUE } from "../utils/projectInformationSheet";
import { PreviewFieldRow, PreviewTable, PreviewToolbar } from "./PreviewLayout";
import { PisEmploymentMatrixPreview } from "./PisEmploymentMatrixFields";

interface PrePisPreviewProps {
  draft: PrePisDraftForm;
  applicationId?: string;
  onPrint?: () => void;
  showToolbar?: boolean;
}

function Field({ label, value }: { label: string; value?: string }) {
  return <PreviewFieldRow label={label} value={value} className="text-xs" />;
}

export function PrePisPreview({
  draft,
  applicationId,
  onPrint,
  showToolbar = true,
}: PrePisPreviewProps) {
  const assistanceLabels = FORM_008_ASSISTANCE_OPTIONS.filter((o) =>
    draft.dostAssistance.includes(o.id),
  ).map((o) => o.label);

  return (
    <div>
      {showToolbar && onPrint && (
        <PreviewToolbar className="justify-end mb-3">
          <button
            type="button"
            onClick={onPrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg bg-[#0C2461] text-white"
          >
            <Printer className="w-4 h-4" />
            Print for MOA signing day
          </button>
        </PreviewToolbar>
      )}

      <div
        id="pre-pis-preview"
        className="print-a4-sheet bg-white border border-gray-200 rounded-xl p-4 sm:p-6 text-xs"
      >
        <h1 className="text-center font-black text-sm mb-1" style={{ color: PIS_DOST_BLUE }}>
          {FORM_008_TITLE}
        </h1>
        {draft.periodLabel && (
          <p className="text-center text-xs mb-4">For the Period: {draft.periodLabel}</p>
        )}

        <div className="space-y-0 mb-3">
          <Field label="Project Title" value={draft.projectTitle} />
          <Field label="Project Code" value={draft.projectCode} />
          <Field label="Name of Firm" value={draft.firmName} />
          <Field label="Owner / Contact Person" value={draft.ownerName} />
          <Field label="Sex" value={draft.ownerSex} />
          <Field label="Birthday" value={draft.ownerBirthday} />
          <Field label="Type of Organization / Enterprise" value={draft.orgType} />
          <Field label="Business Address" value={draft.businessAddress} />
          <Field label="Landline" value={draft.landline} />
          <Field label="Fax" value={draft.fax} />
          <Field label="Mobile Phone" value={draft.mobilePhone} />
          <Field label="Email address" value={draft.email} />
          <Field label="Year Firm Established" value={draft.yearEstablished} />
          <Field
            label="Date SETUP Assistance Approved"
            value={draft.dateAssistanceApproved}
          />
        </div>

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
              draft.assetsLand || "—",
              draft.assetsBuilding || "—",
              draft.assetsEquipment || "—",
              draft.assetsWorkingCapital || "—",
            ],
          ]}
        />

        <h2 style={{ color: PIS_DOST_BLUE }}>Total Employment Generated</h2>
        <PisEmploymentMatrixPreview employment={draft.employment} />

        <h2 style={{ color: PIS_DOST_BLUE }}>Total Volume of Production</h2>
        <div className="space-y-0 mb-3">
          <Field label="Local" value={draft.productionVolumeLocal} />
          <Field label="Export" value={draft.productionVolumeExport} />
          <Field label="Details / unit of measurement" value={draft.productionDetails} />
        </div>

        <h2 style={{ color: PIS_DOST_BLUE }}>Total Gross Sales (₱)</h2>
        <div className="space-y-0 mb-3">
          <Field label="Local (₱)" value={draft.grossSalesLocal} />
          <Field label="Export (₱)" value={draft.grossSalesExport} />
          <Field label="Country/ies of destination" value={draft.exportDestinations} />
        </div>

        <h2 style={{ color: PIS_DOST_BLUE }}>
          Assistance obtained from DOST (Pre-Implementation)
        </h2>
        {assistanceLabels.length > 0 ? (
          <ul className="list-disc list-inside mb-2">
            {assistanceLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        ) : (
          <p className="mb-2">—</p>
        )}
        {draft.assistanceSpecify && (
          <Field label="Specify" value={draft.assistanceSpecify} />
        )}

        <p className="mt-6 text-xs">
          <strong>Prepared by (Proponent):</strong> {draft.preparedBy || "—"}
          {draft.datePrepared ? ` · ${draft.datePrepared}` : ""}
        </p>

        <div className="pis-footer">
          {FORM_008_FOOTER}
          {applicationId && ` · ${applicationId}`}
        </div>
      </div>
    </div>
  );
}
