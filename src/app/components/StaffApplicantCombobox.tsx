/**
 * Author: Yzrel Jade B. Eborde
 *
 * Searchable staff client picker — dropdown + type-to-filter.
 * Plain DOM + portal (no Radix/cmdk) so it works inside MODULE_SHELL overflow-hidden.
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import type { Applicant } from "../store/applicantStore";
import { cn } from "./ui/utils";
import { MODULE_HEADER_SELECT } from "./moduleTheme";

export type StaffApplicantComboboxVariant = "module" | "bar";

interface StaffApplicantComboboxProps {
  applicants: Applicant[];
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  showApplicationId?: boolean;
  allowClear?: boolean;
  variant?: StaffApplicantComboboxVariant;
  className?: string;
  emptyLabel?: string;
}

function formatApplicantLabel(
  applicant: Applicant,
  showApplicationId: boolean,
): string {
  const name = applicant.enterpriseName?.trim() || "Untitled enterprise";
  if (!showApplicationId || !applicant.applicationId) return name;
  return `${name} — ${applicant.applicationId}`;
}

function matchesQuery(applicant: Applicant, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    applicant.enterpriseName,
    applicant.applicationId,
    applicant.applicantName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function StaffApplicantCombobox({
  applicants,
  value,
  onChange,
  placeholder = "Select enterprise…",
  showApplicationId = false,
  allowClear = false,
  variant = "module",
  className,
  emptyLabel = "No clients found.",
}: StaffApplicantComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});

  const selected = useMemo(
    () => applicants.find((a) => a.id === value) ?? null,
    [applicants, value],
  );

  const filtered = useMemo(
    () => applicants.filter((a) => matchesQuery(a, query)),
    [applicants, query],
  );

  const triggerLabel = selected
    ? formatApplicantLabel(selected, showApplicationId)
    : placeholder;

  const isBar = variant === "bar";

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const pick = useCallback(
    (id: string | null) => {
      onChange(id);
      close();
    },
    [onChange, close],
  );

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 4;
    const maxWidth = Math.min(Math.max(rect.width, 288), window.innerWidth - 24);
    const left = Math.min(
      Math.max(12, rect.left),
      window.innerWidth - maxWidth - 12,
    );
    const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
    const spaceAbove = rect.top - gap - 12;
    const preferBelow = spaceBelow >= 180 || spaceBelow >= spaceAbove;
    const maxHeight = Math.min(320, preferBelow ? spaceBelow : spaceAbove);

    setPanelStyle({
      position: "fixed",
      left,
      width: maxWidth,
      zIndex: 400,
      maxHeight: Math.max(160, maxHeight),
      ...(preferBelow
        ? { top: rect.bottom + gap }
        : { bottom: window.innerHeight - rect.top + gap }),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    const onResize = () => updatePanelPosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, close]);

  const panel =
    open &&
    createPortal(
      <div
        ref={panelRef}
        id={listId}
        role="listbox"
        style={panelStyle}
        className="rounded-lg border border-gray-200 bg-white text-gray-900 shadow-lg overflow-hidden flex flex-col"
      >
        <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 shrink-0">
          <Search className="size-4 shrink-0 text-gray-400" aria-hidden />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search client name or LOI…"
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-gray-400"
            aria-label="Search clients"
          />
        </div>
        <ul className="overflow-y-auto overscroll-contain py-1 min-h-0 flex-1">
          {allowClear && (
            <li>
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50"
                onClick={() => pick(null)}
              >
                Clear selection
              </button>
            </li>
          )}
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-sm text-gray-500">{emptyLabel}</li>
          ) : (
            filtered.map((applicant) => {
              const label = formatApplicantLabel(applicant, showApplicationId);
              const isSelected = applicant.id === value;
              return (
                <li key={applicant.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm hover:bg-gray-50",
                      isSelected && "bg-gray-100 font-medium",
                    )}
                    onClick={() => pick(applicant.id)}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{label}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>,
      document.body,
    );

  return (
    <div ref={rootRef} className={cn("relative w-full min-w-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        onClick={() => {
          if (open) {
            close();
          } else {
            setOpen(true);
          }
        }}
        className={cn(
          "inline-flex w-full items-center justify-between gap-2 font-normal min-h-10 h-auto py-2 px-3 rounded-lg border text-left",
          isBar
            ? "bg-white/10 hover:bg-white/15 border-white/20 text-white text-xs font-medium"
            : cn(MODULE_HEADER_SELECT, "hover:bg-white"),
        )}
      >
        <span className="truncate flex-1 min-w-0">{triggerLabel}</span>
        <ChevronsUpDown
          className={cn(
            "size-4 shrink-0 opacity-60",
            isBar && "text-white/70",
          )}
          aria-hidden
        />
      </button>
      {panel}
    </div>
  );
}
