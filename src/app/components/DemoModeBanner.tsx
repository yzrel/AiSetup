/**
 * Author: Yzrel Jade B. Eborde
 */

import { useEffect, useState } from "react";
import { demoModeStore } from "../store/demoModeStore";

export function DemoModeBanner({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [demoMode, setDemoMode] = useState(demoModeStore.isEnabled());

  useEffect(
    () => demoModeStore.subscribe(() => setDemoMode(demoModeStore.isEnabled())),
    [],
  );

  if (!demoMode) return null;

  return (
    <div
      className={`bg-amber-50 border border-amber-200 text-amber-900 ${
        compact ? "rounded-xl px-3 py-2 text-xs" : "rounded-lg px-4 py-2.5 text-sm"
      } flex flex-wrap items-center justify-between gap-2`}
    >
      <span>
        Demo mode: restrictions bypassed
        {compact ? "" : " (warnings still shown)"}
      </span>
      <button
        type="button"
        onClick={() => demoModeStore.setEnabled(false)}
        className="text-xs font-semibold text-amber-800 hover:underline shrink-0"
      >
        Turn off
      </button>
    </div>
  );
}
