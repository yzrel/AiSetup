/**
 * Author: Yzrel Jade B. Eborde
 */

import { CheckCircle, ChevronRight } from "lucide-react";
import { AuthUser } from "../store/authStore";
import { isDemoModeActive } from "../utils/demoMode";
import { StaffApplicantBanner, StaffApplicantPicker } from "./StaffApplicantPicker";
import type { SetupFormKey } from "../constants/setupForms";
import { ModuleFormHeader } from "./ModuleFormHeader";
import {
  DOST_BLUE,
  DOST_MID,
  MODULE_ALERTS,
  MODULE_BODY,
  MODULE_HEADER,
  MODULE_INNER_BODY,
  MODULE_INSET,
  MODULE_SHELL,
  moduleStepPillClass,
} from "./moduleTheme";

export {
  ACTION_ROW,
  DOST_BLUE,
  DOST_LIGHT,
  DOST_MID,
  FORM_GRID_2,
  FORM_GRID_3,
  MODULE_ALERTS,
  MODULE_BODY,
  MODULE_BODY_MUTED,
  MODULE_BODY_TEXT,
  MODULE_BODY_TITLE,
  MODULE_HEADER,
  MODULE_HEADER_PICKER,
  MODULE_HEADER_SELECT,
  MODULE_INNER_BODY,
  MODULE_INSET,
  MODULE_PAGE,
  MODULE_SECTION_TITLE,
  MODULE_SHELL,
  moduleStepPillClass,
} from "./moduleTheme";

export interface ModuleStep {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface ModuleStepHeaderProps {
  steps: ModuleStep[];
  current: string;
  maxReached?: number;
  onStepClick?: (stepId: string) => void;
}

export function ModuleStepHeader({
  steps,
  current,
  maxReached = steps.length - 1,
  onStepClick,
}: ModuleStepHeaderProps) {
  const currentIdx = steps.findIndex((s) => s.id === current);
  const demoMode = isDemoModeActive();

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {steps.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const locked = i > maxReached;
        const clickable = !!onStepClick && (!locked || demoMode);

        const pill = (
          <div
            className={`${moduleStepPillClass({ active, done, locked })} ${
              clickable ? "cursor-pointer hover:bg-white/25" : ""
            }`}
          >
            {done ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-300" />
            ) : (
              s.icon ?? <span className="w-3.5 text-center font-bold">{i + 1}</span>
            )}
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </div>
        );

        return (
          <div key={s.id} className="flex items-center gap-1 shrink-0">
            {clickable ? (
              <button type="button" onClick={() => onStepClick(s.id)} className="border-0 bg-transparent p-0">
                {pill}
              </button>
            ) : (
              pill
            )}
            {i < steps.length - 1 && (
              <ChevronRight className="w-3 h-3 text-white/25 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface ModuleWorkflowLayoutProps {
  title?: string;
  subtitle: string;
  /** When set, header shows official form title with muted form number below */
  formKey?: SetupFormKey;
  showFormRef?: boolean;
  user?: AuthUser | null;
  steps?: ModuleStep[];
  currentStep?: string;
  maxReached?: number;
  onStepClick?: (stepId: string) => void;
  staffPickerLabel?: string;
  showStaffPicker?: boolean;
  maxWidth?: "4xl" | "5xl";
  headerExtra?: React.ReactNode;
  /** Status banners between header and step content (TNA1 / Project Proposal pattern) */
  alerts?: React.ReactNode;
  /** Optional extra bordered panel inside the body — off by default to match TNA1 */
  insetBody?: boolean;
  contentClassName?: string;
  children?: React.ReactNode;
}

export function ModuleWorkflowBody({
  children,
  className = MODULE_BODY,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={MODULE_INNER_BODY}>
      <div className={className}>{children}</div>
    </div>
  );
}

export function ModuleWorkflowLayout({
  title,
  subtitle,
  formKey,
  showFormRef = true,
  user,
  steps,
  currentStep,
  maxReached,
  onStepClick,
  staffPickerLabel = "Review applicant",
  showStaffPicker = true,
  maxWidth = "4xl",
  headerExtra,
  alerts,
  insetBody = false,
  contentClassName = MODULE_BODY,
  children,
}: ModuleWorkflowLayoutProps) {
  const widthClass = maxWidth === "5xl" ? "max-w-5xl" : "max-w-4xl";
  const hasBody = children != null && children !== false;

  return (
    <div className={`${widthClass} mx-auto space-y-5`}>
      <div className={MODULE_SHELL}>
        <div
          className={`${MODULE_HEADER} text-white`}
          style={{ background: `linear-gradient(135deg,${DOST_BLUE},${DOST_MID})` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-blue-800 font-black text-sm">ai</span>
            </div>
            <ModuleFormHeader
              title={title}
              subtitle={subtitle}
              formKey={formKey}
              showFormRef={showFormRef}
            />
          </div>

          {steps && steps.length > 0 && currentStep && (
            <ModuleStepHeader
              steps={steps}
              current={currentStep}
              maxReached={maxReached}
              onStepClick={onStepClick}
            />
          )}

          {showStaffPicker && (
            <StaffApplicantPicker user={user} label={staffPickerLabel} />
          )}

          {headerExtra && (
            <div className="mt-5 pt-4 border-t border-white/15">{headerExtra}</div>
          )}
        </div>

        <StaffApplicantBanner user={user} />

        {alerts && <div className={MODULE_ALERTS}>{alerts}</div>}

        {hasBody &&
          (insetBody ? (
            <div className={MODULE_INSET}>
              <ModuleWorkflowBody className={contentClassName}>{children}</ModuleWorkflowBody>
            </div>
          ) : (
            <div className={contentClassName}>{children}</div>
          ))}
      </div>
    </div>
  );
}
