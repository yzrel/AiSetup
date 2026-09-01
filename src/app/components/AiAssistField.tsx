/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { AI_ASSIST_INSTRUCTION_MAX } from "../utils/aiAssist";

export { AI_ASSIST_INSTRUCTION_MAX };

export const aiAssistInputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50";

export const aiAssistLabelCls =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide";

export type AiAssistSuggestHandler = (userInstruction?: string) => void;

export function AiAssistControls({
  onAiSuggest,
  loading,
}: {
  onAiSuggest: AiAssistSuggestHandler;
  loading?: boolean;
}) {
  const [instruction, setInstruction] = useState("");

  return (
    <div className="flex flex-col gap-1 min-w-0 w-full max-w-full">
      <span className="text-[10px] font-semibold text-violet-700 tracking-wide">
        Extra instructions for AI
      </span>
      <div className="flex items-center gap-2 min-w-0 w-full">
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value.slice(0, AI_ASSIST_INSTRUCTION_MAX))}
          disabled={loading}
          maxLength={AI_ASSIST_INSTRUCTION_MAX}
          rows={1}
          placeholder="e.g. focus on packaging, keep it short…"
          aria-label="Extra instructions for AI"
          className="box-border min-w-0 flex-1 max-w-full h-8 min-h-8 max-h-48 resize-y overflow-y-auto border border-violet-200 rounded-lg px-2.5 py-0 text-xs leading-8 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => {
            const trimmed = instruction.trim();
            onAiSuggest(trimmed || undefined);
          }}
          disabled={loading}
          className="box-border h-8 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-violet-700 bg-violet-50 border border-violet-200 px-2.5 rounded-lg hover:bg-violet-100 disabled:opacity-50 shrink-0"
        >
          <Sparkles className="w-3 h-3" />
          {loading ? "Generating…" : "AI Assist"}
        </button>
      </div>
    </div>
  );
}

function AiAssistHeader({
  label,
  labelClassName,
  onAiSuggest,
  aiLoading,
}: {
  label: string;
  labelClassName: string;
  onAiSuggest?: AiAssistSuggestHandler;
  aiLoading?: boolean;
}) {
  if (!onAiSuggest) {
    return (
      <div className="mb-1.5">
        <label className={labelClassName}>{label}</label>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 mb-1.5 min-w-0 w-full">
      <label className={labelClassName}>{label}</label>
      <AiAssistControls onAiSuggest={onAiSuggest} loading={aiLoading} />
    </div>
  );
}

export function AiAssistTextarea({
  label,
  value,
  onChange,
  onAiSuggest,
  aiLoading,
  minHeight = "min-h-[80px]",
  hint,
  inputClassName = aiAssistInputCls,
  labelClassName = aiAssistLabelCls,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAiSuggest?: AiAssistSuggestHandler;
  aiLoading?: boolean;
  minHeight?: string;
  hint?: string;
  inputClassName?: string;
  labelClassName?: string;
}) {
  return (
    <div className="min-w-0 w-full max-w-full">
      <AiAssistHeader
        label={label}
        labelClassName={labelClassName}
        onAiSuggest={onAiSuggest}
        aiLoading={aiLoading}
      />
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      <textarea
        className={`${inputClassName} ${minHeight} max-w-full`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function AiAssistStringList({
  label,
  items,
  onChange,
  onAiSuggest,
  aiLoading,
  hint,
  placeholders,
  inputClassName = aiAssistInputCls,
  labelClassName = aiAssistLabelCls,
  multiline = false,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  onAiSuggest?: AiAssistSuggestHandler;
  aiLoading?: boolean;
  hint?: string;
  placeholders?: string[];
  inputClassName?: string;
  labelClassName?: string;
  multiline?: boolean;
}) {
  const Input = multiline ? "textarea" : "input";
  return (
    <div className="min-w-0 w-full max-w-full">
      <AiAssistHeader
        label={label}
        labelClassName={labelClassName}
        onAiSuggest={onAiSuggest}
        aiLoading={aiLoading}
      />
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      <div className="space-y-2 min-w-0">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 min-w-0">
            <Input
              className={`${inputClassName} flex-1 min-w-0 ${multiline ? "min-h-[60px]" : ""}`}
              value={item}
              rows={multiline ? 2 : undefined}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholders?.[i] ?? `Item ${i + 1}`}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="p-2 text-red-400 hover:text-red-600 shrink-0"
              aria-label="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="flex items-center gap-1 text-xs text-[#0C2461] font-semibold hover:underline"
        >
          <Plus className="w-3 h-3" /> Add row
        </button>
      </div>
    </div>
  );
}

export function AiAssistNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="text-xs text-violet-700 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
      {message}
    </p>
  );
}
