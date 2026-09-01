/**
 * Author: Yzrel Jade B. Eborde
 *
 * Shared Edit / Preview toggle and Print buttons for official document modules.
 */

import { Eye, Pencil, Printer } from "lucide-react";
import { cn } from "./ui/utils";
import { DOST_BLUE } from "./moduleTheme";

const TOGGLE_CLASS =
  "w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#0C2461]/30 text-[#0C2461] text-sm font-semibold hover:bg-blue-50";

const PRINT_CLASS =
  "w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40";

const EDIT_CLASS =
  "w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg border border-[#0C2461]/30 text-[#0C2461] hover:bg-blue-50";

export interface EditPreviewToggleButtonProps {
  isPreview: boolean;
  onToggle: () => void;
  editLabel?: string;
  previewLabel?: string;
  className?: string;
}

export function EditPreviewToggleButton({
  isPreview,
  onToggle,
  editLabel = "Edit",
  previewLabel = "Preview",
  className,
}: EditPreviewToggleButtonProps) {
  return (
    <button type="button" onClick={onToggle} className={cn(TOGGLE_CLASS, className)}>
      {isPreview ? (
        <>
          <Pencil className="w-4 h-4" />
          {editLabel}
        </>
      ) : (
        <>
          <Eye className="w-4 h-4" />
          {previewLabel}
        </>
      )}
    </button>
  );
}

export interface DocumentPrintButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function DocumentPrintButton({
  onClick,
  disabled = false,
  label = "Print / Save as PDF",
  className,
}: DocumentPrintButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(PRINT_CLASS, className)}
      style={{ background: DOST_BLUE }}
    >
      <Printer className="w-4 h-4" />
      {label}
    </button>
  );
}

export interface DocumentEditButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function DocumentEditButton({
  onClick,
  label = "Edit",
  className,
}: DocumentEditButtonProps) {
  return (
    <button type="button" onClick={onClick} className={cn(EDIT_CLASS, className)}>
      <Pencil className="w-4 h-4" />
      {label}
    </button>
  );
}
