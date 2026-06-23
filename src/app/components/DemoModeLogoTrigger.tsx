/**
 * Author: Yzrel Jade B. Eborde
 */

import { useRef, useState, type ReactNode } from "react";
import { demoModeStore } from "../store/demoModeStore";

const DEMO_CLICKS_REQUIRED = 5;
const DEMO_CLICK_WINDOW_MS = 1500;

export function DemoModeLogoTrigger({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const clickTimestamps = useRef<number[]>([]);
  const [, setTick] = useState(0);

  const handleClick = () => {
    const now = Date.now();
    clickTimestamps.current.push(now);
    while (
      clickTimestamps.current.length > 0 &&
      now - clickTimestamps.current[0] > DEMO_CLICK_WINDOW_MS
    ) {
      clickTimestamps.current.shift();
    }
    if (clickTimestamps.current.length >= DEMO_CLICKS_REQUIRED) {
      clickTimestamps.current = [];
      demoModeStore.toggle();
    }
    setTick((t) => t + 1);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`border-0 bg-transparent p-0 cursor-default text-left ${className}`}
      aria-label="DOST logo"
    >
      {children}
    </button>
  );
}
