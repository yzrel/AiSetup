/**
 * Author: Yzrel Jade B. Eborde
 */

/** Official DOST image assets */

export const DOST_LOGO_MARK = "/assets/dost-logo-mark.png";
export const DOST_LOGO_HORIZONTAL = "/assets/dost-logo-horizontal.png";
export const DOST_LOGO_HORIZONTAL_TRANSPARENT =
  "/assets/dost-logo-horizontal-transparent.png";
export const DOST_LOGO_HORIZONTAL_LIGHT =
  "/assets/dost-logo-horizontal-light.png";

export function DOSTMark({
  size = 48,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={DOST_LOGO_MARK}
      alt="DOST"
      className={`object-contain shrink-0 ${className}`}
      style={{ height: size, width: "auto" }}
    />
  );
}

export function DOSTHorizontalLogo({
  height = 64,
  className = "",
  onDark = true,
  surface,
}: {
  height?: number;
  className?: string;
  /** @deprecated use surface="dark" | "light" */
  onDark?: boolean;
  /** "dark" = white text on transparent; "light" = dark text on transparent; "original" = black box fallback */
  surface?: "dark" | "light" | "original";
}) {
  const resolvedSurface =
    surface ?? (onDark ? "dark" : "light");

  const src =
    resolvedSurface === "light"
      ? DOST_LOGO_HORIZONTAL_LIGHT
      : resolvedSurface === "original"
        ? DOST_LOGO_HORIZONTAL
        : DOST_LOGO_HORIZONTAL_TRANSPARENT;

  return (
    <img
      src={src}
      alt="Department of Science and Technology — Republic of the Philippines"
      className={`object-contain shrink-0 ${className}`}
      style={{ height, width: "auto" }}
      decoding="async"
    />
  );
}

export function DOSTNavBrand({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <DOSTMark size={36} />
      <div className="leading-none min-w-0">
        <p
          className={`text-[8px] font-semibold tracking-wide uppercase truncate ${
            variant === "light" ? "text-white/70" : "text-gray-500"
          }`}
        >
          DOST Region XII
        </p>
        <div className="flex items-center gap-0.5 mt-0.5">
          <span
            className={`font-black text-[15px] ${
              variant === "light" ? "text-white" : "text-[#0C2461]"
            }`}
          >
            ai
          </span>
          <span className="font-black text-[15px] text-[#00AEEF]">SETUP</span>
        </div>
      </div>
    </div>
  );
}
