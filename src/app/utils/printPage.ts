/**
 * Author: Yzrel Jade B. Eborde
 *
 * Shared A4 page sizing for printable documents across aiSETUP.
 */

/** ISO 216 A4 dimensions */
export const A4_WIDTH = "210mm";
export const A4_HEIGHT = "297mm";

/** Default print margins (all sides) */
export const A4_MARGIN_DEFAULT = "12mm";

/** Slightly wider side margins for formal letters */
export const A4_MARGIN_LETTER = "15mm 15mm 20mm 15mm";

/** TNA Form 01 named page — full A4 sheets; margins via .tna-form-page padding */
export const TNA_FORM_01_PAGE_NAME = "tna-form-01";

/** Pre-Implementation PIS */
export const A4_MARGIN_PRE_PIS = "12mm 12mm 18mm 12mm";

/** RTEC evaluation report */
export const A4_MARGIN_RTEC = "15mm 15mm 22mm 15mm";

/** CSS @page rule — use at the start of every print stylesheet */
export function a4PageRule(margin: string = A4_MARGIN_DEFAULT): string {
  return `@page { size: A4 portrait; margin: ${margin}; }`;
}

/** Named @page rule — scopes margins to specific pages (e.g. TNA Form 01) */
export function a4NamedPageRule(
  name: string,
  margin: string = A4_MARGIN_DEFAULT,
): string {
  return `@page ${name} { size: A4 portrait; margin: ${margin}; }`;
}

/** Base print document styles shared by popup print windows */
export function a4PrintDocumentBase(): string {
  return `
    ${a4PageRule()}
    html, body {
      width: ${A4_WIDTH};
      max-width: ${A4_WIDTH};
      margin: 0 auto;
      padding: 0;
    }
  `;
}

/** Screen preview: one A4 sheet (before printing) */
export const A4_PREVIEW_CLASS = "print-a4-sheet";

export function getA4PreviewSheetStyles(): string {
  return `
    .${A4_PREVIEW_CLASS} {
      width: ${A4_WIDTH};
      min-height: ${A4_HEIGHT};
      max-width: 100%;
      margin-left: auto;
      margin-right: auto;
      background: #fff;
      box-sizing: border-box;
    }
  `;
}
