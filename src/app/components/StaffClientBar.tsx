/**
 * Author: Yzrel Jade B. Eborde
 */

import { Building2, FolderOpen, X } from "lucide-react";
import { AuthUser, AdminView } from "../store/authStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import {
  getOfficeName,
  resolveApplicantOfficeId,
  resolveApplicantProvince,
} from "../utils/provincialOffice";
import { StaffApplicantCombobox } from "./StaffApplicantCombobox";

interface StaffClientBarProps {
  user: AuthUser;
  onNavigate: (view: AdminView) => void;
  onOpenClients?: () => void;
}

export function StaffClientBar({
  user,
  onNavigate,
  onOpenClients,
}: StaffClientBarProps) {
  const {
    applicant,
    scopedApplicants,
    selectedApplicantId,
    setSelectedApplicantId,
    clearSelection,
    hasSelection,
  } = useStaffApplicant(user);

  if (!applicant && scopedApplicants.length === 0) return null;

  const province = applicant ? resolveApplicantProvince(applicant) : "";
  const office = applicant
    ? getOfficeName(resolveApplicantOfficeId(applicant))
    : "";

  return (
    <div className="bg-[#0C2461]/95 text-white px-3 sm:px-4 py-2 flex flex-wrap items-center gap-2 text-sm border-b border-white/10 shrink-0 w-full min-w-0">
      <div className="flex items-center gap-2 min-w-0 flex-1 basis-40">
        <Building2 className="w-4 h-4 shrink-0 text-[#00AEEF]" />
        <span className="font-semibold text-white/80 shrink-0">
          Active cooperator:
        </span>
        {hasSelection && applicant ? (
          <span className="font-bold truncate">{applicant.enterpriseName}</span>
        ) : (
          <span className="text-white/60 italic truncate">None selected</span>
        )}
      </div>

      {applicant && (
        <span className="text-[11px] text-white/50 hidden xl:inline truncate min-w-0 max-w-[16rem]">
          {applicant.applicationId}
          {province ? ` · ${province}` : ""}
          {office ? ` · ${office.replace(" Provincial Office", " PSTO")}` : ""}
        </span>
      )}

      <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto sm:flex-1 sm:ml-auto sm:max-w-xl">
        <StaffApplicantCombobox
          applicants={scopedApplicants}
          value={selectedApplicantId}
          onChange={setSelectedApplicantId}
          placeholder="Switch cooperator…"
          showApplicationId
          variant="bar"
          className="min-w-0 flex-1"
        />

        {onOpenClients && (
          <button
            type="button"
            onClick={onOpenClients}
            title="Open case file"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 shrink-0 whitespace-nowrap"
          >
            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Open case file</span>
            <span className="sm:hidden">Case file</span>
          </button>
        )}

        {hasSelection && (
          <button
            type="button"
            onClick={clearSelection}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 shrink-0"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
