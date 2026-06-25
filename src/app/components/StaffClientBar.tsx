/**
 * Author: Yzrel Jade B. Eborde
 */

import { Building2, ChevronDown, X } from "lucide-react";
import { Applicant } from "../store/applicantStore";
import { AuthUser, AdminView } from "../store/authStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import {
  getOfficeName,
  resolveApplicantOfficeId,
  resolveApplicantProvince,
} from "../utils/provincialOffice";

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
    <div className="bg-[#0C2461]/95 text-white px-3 sm:px-4 py-2 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 text-sm border-b border-white/10">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Building2 className="w-4 h-4 shrink-0 text-[#00AEEF]" />
        <span className="font-semibold text-white/80">Active client:</span>
        {hasSelection && applicant ? (
          <span className="font-bold truncate max-w-[200px] sm:max-w-xs">
            {applicant.enterpriseName}
          </span>
        ) : (
          <span className="text-white/60 italic">None selected</span>
        )}
      </div>

      {applicant && (
        <span className="text-[11px] text-white/50 hidden md:inline">
          {applicant.applicationId}
          {province ? ` · ${province}` : ""}
          {office ? ` · ${office.replace(" Provincial Office", " PSTO")}` : ""}
        </span>
      )}

      <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
        <div className="relative">
          <select
            value={applicant?.id ?? ""}
            onChange={(e) => {
              const id = e.target.value || null;
              setSelectedApplicantId(id);
            }}
            className="appearance-none bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium pl-3 pr-8 py-1.5 rounded-lg focus:outline-none w-full sm:max-w-[220px]"
          >
            <option value="" className="text-gray-900">
              Switch client...
            </option>
            {scopedApplicants.map((a: Applicant) => (
              <option key={a.id} value={a.id} className="text-gray-900">
                {a.enterpriseName}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/60" />
        </div>

        {onOpenClients && (
          <button
            type="button"
            onClick={onOpenClients}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
          >
            Open case file
          </button>
        )}

        {hasSelection && (
          <button
            type="button"
            onClick={clearSelection}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
