/**
 * Author: Yzrel Jade B. Eborde
 */

import { DOSTMark } from "./DOSTLogos";

export type DostLogoLoaderVariant = "fullscreen" | "overlay" | "inline";

interface DostLogoLoaderProps {
  variant?: DostLogoLoaderVariant;
  /** Accessible status text (visually muted under the mark). */
  label?: string;
  /** Mark display width in px (graphic is cropped; department caption is never shown). */
  size?: number;
  className?: string;
}

const DEFAULT_SIZE: Record<DostLogoLoaderVariant, number> = {
  fullscreen: 88,
  overlay: 72,
  inline: 40,
};

function MarkSpinner({ size }: { size: number }) {
  return (
    <div
      className="dost-logo-loader__spin relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <div className="dost-logo-loader__pulse">
        <DOSTMark size={size} />
      </div>
    </div>
  );
}

/**
 * Branded DOST mark loader (four-circle graphic only — caption cropped via DOSTMark).
 */
export function DostLogoLoader({
  variant = "inline",
  label = "Loading…",
  size,
  className = "",
}: DostLogoLoaderProps) {
  const markSize = size ?? DEFAULT_SIZE[variant];

  const core = (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
    >
      <MarkSpinner size={markSize} />
      {label ? (
        <p className="text-sm text-gray-500 text-center max-w-[16rem]">{label}</p>
      ) : null}
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <div className="fixed inset-0 z-[200] bg-[#EEF2F7] flex items-center justify-center p-6">
        {core}
        <DostLogoLoaderStyles />
      </div>
    );
  }

  if (variant === "overlay") {
    // Fixed to the viewport so the mark stays centered while the page scrolls.
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#EEF2F7]/85 backdrop-blur-[1px]">
        {core}
        <DostLogoLoaderStyles />
      </div>
    );
  }

  return (
    <>
      {core}
      <DostLogoLoaderStyles />
    </>
  );
}

/** Inject once per mount; keyframes are idempotent. */
function DostLogoLoaderStyles() {
  return (
    <style>{`
      @keyframes dost-mark-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes dost-mark-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(0.94); opacity: 0.88; }
      }
      @keyframes dost-mark-fade {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.65; }
      }
      .dost-logo-loader__spin {
        animation: dost-mark-spin 1.6s linear infinite;
      }
      .dost-logo-loader__pulse {
        animation: dost-mark-pulse 1.2s ease-in-out infinite;
        transform-origin: center center;
      }
      @media (prefers-reduced-motion: reduce) {
        .dost-logo-loader__spin {
          animation: none;
        }
        .dost-logo-loader__pulse {
          animation: dost-mark-fade 1.4s ease-in-out infinite;
        }
      }
    `}</style>
  );
}
