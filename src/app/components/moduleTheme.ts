/**
 * Shared module shell, header, and body styling for SETUP workflow screens.
 */

export const DOST_BLUE = "#0C2461";
export const DOST_MID = "#1a3a7a";
export const DOST_LIGHT = "#00AEEF";
export const MODULE_SHELL =
  "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden";

/** Outer page padding for module screens */
export const MODULE_PAGE =
  "px-3 sm:px-4 md:px-6 py-4 sm:py-6";

/** Blue gradient header padding */
export const MODULE_HEADER = "p-4 sm:p-6";

/** Inner body panel padding */
export const MODULE_BODY = "p-4 sm:p-6 space-y-4 sm:space-y-6";

/** Two-column form field grid */
export const FORM_GRID_2 = "grid grid-cols-1 sm:grid-cols-2 gap-4";

/** Three-column form field grid */
export const FORM_GRID_3 =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";

/** Action button toolbars */
export const ACTION_ROW =
  "flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center";

/** Alerts strip below header */
export const MODULE_ALERTS = "mx-4 sm:mx-6 mt-4 space-y-3";

/** Inset body wrapper */
export const MODULE_INSET = "px-4 sm:px-6 pb-4 sm:pb-6";

/** Bordered inner content panel below the blue header */
export const MODULE_INNER_BODY =
  "border border-gray-200 rounded-xl overflow-hidden bg-white";

/** Staff applicant picker container on the blue header */
export const MODULE_HEADER_PICKER =
  "mt-4 p-3 bg-white/10 rounded-xl border border-white/20";

/** Select control on the blue header — always white field, dark text */
export const MODULE_HEADER_SELECT =
  "w-full text-sm rounded-lg px-3 py-2 bg-white text-gray-900 border border-white/30 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/40";

export const MODULE_HEADER_LABEL =
  "text-[10px] font-bold uppercase tracking-wide text-white/70 block mb-1.5";

export const MODULE_HEADER_HINT = "text-[10px] text-white/60 mt-1.5";

/** Body text hierarchy inside white panels */
export const MODULE_BODY_TITLE = "font-semibold text-gray-800";
export const MODULE_BODY_TEXT = "text-sm text-gray-700";
export const MODULE_BODY_MUTED = "text-sm text-gray-500";
export const MODULE_SECTION_TITLE =
  "text-base font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4";

export function moduleStepPillClass({
  active,
  done,
  locked = false,
}: {
  active: boolean;
  done: boolean;
  locked?: boolean;
}): string {
  const base =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border";

  if (active) {
    return `${base} bg-white text-blue-900 shadow-sm border-white`;
  }
  if (done) {
    return `${base} bg-white/20 text-white border-white/25`;
  }
  if (locked) {
    return `${base} bg-white/5 text-white/35 border-white/10`;
  }
  return `${base} bg-white/10 text-white/75 border-white/25`;
}
