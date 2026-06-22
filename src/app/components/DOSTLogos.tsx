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

/** Source mark asset: 759×814px — four-circle graphic ends ~697px (caption below). */
const MARK_SRC_W = 759;
const MARK_SRC_H = 814;
const MARK_GRAPHIC_H = 697;
const MARK_DISPLAY_HEIGHT_RATIO = MARK_GRAPHIC_H / MARK_SRC_W;

function DOSTMarkGraphic({
  size,
  className = "",
}: {
  size: number;
  className?: string;
}) {
  const width = size;
  const height = size * MARK_DISPLAY_HEIGHT_RATIO;

  return (
    <div
      className={`overflow-hidden shrink-0 ${className}`}
      style={{ width, height }}
    >
      <img
        src={DOST_LOGO_MARK}
        alt=""
        aria-hidden
        className="block max-w-none select-none"
        style={{
          width,
          height: width * (MARK_SRC_H / MARK_SRC_W),
        }}
        decoding="async"
        draggable={false}
      />
    </div>
  );
}

export function DOSTMark({
  size = 48,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const height = size * MARK_DISPLAY_HEIGHT_RATIO;

  return (
    <div
      className={`shrink-0 ${className}`}
      style={{ width: size, height }}
      role="img"
      aria-label="DOST"
    >
      <DOSTMarkGraphic size={size} />
    </div>
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
  /** "dark" = white text on dark backgrounds; "light" = dark text on light backgrounds */
  surface?: "dark" | "light" | "original";
}) {
  const resolvedSurface =
    surface ?? (onDark ? "dark" : "light");

  const isLight = resolvedSurface === "light";
  const republicClass = isLight
    ? "text-[#0C2461]/85"
    : "text-white/90";
  const departmentClass = isLight ? "text-[#0C2461]" : "text-white";
  const dividerClass = isLight ? "bg-[#0C2461]/70" : "bg-white/90";

  const markSize = Math.round(height);
  const republicSize = Math.max(7, Math.round(height * 0.1125));
  const departmentSize = Math.max(10, Math.round(height * 0.2));
  const gap = Math.max(10, Math.round(height * 0.18));

  return (
    <div
      className={`inline-flex items-center min-w-0 ${className}`}
      style={{ gap }}
      role="img"
      aria-label="Department of Science and Technology — Republic of the Philippines"
    >
      <DOSTMarkGraphic size={markSize} />
      <div
        className="flex flex-col justify-center min-w-0 text-left"
        style={{ maxWidth: height * 4.2 }}
      >
        <p
          className={`font-serif uppercase leading-none tracking-[0.14em] ${republicClass}`}
          style={{ fontSize: republicSize }}
        >
          Republic of the Philippines
        </p>
        <div
          className={`${dividerClass} shrink-0`}
          style={{
            height: 1,
            width: "100%",
            marginTop: Math.round(height * 0.07),
            marginBottom: Math.round(height * 0.07),
          }}
        />
        <p
          className={`font-serif font-semibold leading-tight ${departmentClass}`}
          style={{ fontSize: departmentSize }}
        >
          Department of Science and Technology
        </p>
      </div>
    </div>
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
