/**
 * Author: Yzrel Jade B. Eborde
 *
 * Annex C — Schedule of Activities Gantt for the bound Proforma MOA packet.
 */

import type { MoaAnnexCForm } from "../../api/types";
import { ScheduleGanttTable } from "../projectProposal/ScheduleGanttTable";

interface MoaAnnexCScheduleTableProps {
  form: MoaAnnexCForm;
  scheduleTable: string[][];
}

export function MoaAnnexCScheduleTable({
  form,
  scheduleTable,
}: MoaAnnexCScheduleTableProps) {
  const repName =
    form.cooperatorSignatoryName.trim() ||
    form.representativeName.trim() ||
    form.enterpriseName.trim();

  return (
    <div className="moa-form-annex-sheet">
      <p className="moa-form-annex-cover">
        Project Title: &quot;{form.projectTitle.trim() || "______"}&quot;
      </p>
      <p className="moa-form-annex-cover">
        Cooperator: {form.enterpriseName.trim() || "______"}
      </p>
      {repName ? (
        <p className="moa-form-annex-cover">{repName}</p>
      ) : null}

      <div className="moa-form-annex-gantt">
        <ScheduleGanttTable rows={scheduleTable} weeksPerMonth={1} />
      </div>
    </div>
  );
}
