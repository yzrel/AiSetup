/**
 * Author: Yzrel Jade B. Eborde
 */

import { Plus, Sparkles, Trash2 } from "lucide-react";

export const aiAssistInputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50";

export const aiAssistLabelCls =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide";

function AiAssistButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-violet-700 bg-violet-50 border border-violet-200 px-2 py-1 rounded-lg hover:bg-violet-100 disabled:opacity-50 shrink-0"
    >
      <Sparkles className="w-3 h-3" />
      {loading ? "Generating…" : "AI Assist"}
    </button>
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
  onAiSuggest?: () => void;
  aiLoading?: boolean;
  minHeight?: string;
  hint?: string;
  inputClassName?: string;
  labelClassName?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className={labelClassName}>{label}</label>
        {onAiSuggest && <AiAssistButton onClick={onAiSuggest} loading={aiLoading} />}
      </div>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      <textarea
        className={`${inputClassName} ${minHeight}`}
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
  onAiSuggest?: () => void;
  aiLoading?: boolean;
  hint?: string;
  placeholders?: string[];
  inputClassName?: string;
  labelClassName?: string;
  multiline?: boolean;
}) {
  const Input = multiline ? "textarea" : "input";
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className={labelClassName}>{label}</label>
        {onAiSuggest && <AiAssistButton onClick={onAiSuggest} loading={aiLoading} />}
      </div>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input
              className={`${inputClassName} flex-1 ${multiline ? "min-h-[60px]" : ""}`}
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
