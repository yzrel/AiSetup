/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official Annex C Proforma MOA in-page print.
 * Renders MoaAnnexCDocument via createRoot — do not clone the preview DOM.
 */

import { createRoot, type Root } from "react-dom/client";
import type { Applicant } from "../store/applicantStore";
import type { MoaAnnexCForm } from "../api/types";
import { MoaAnnexCDocument } from "../components/moaAnnexC/MoaAnnexCDocument";
import { MOA_PAGE_MARGIN_MM } from "../constants/moaAnnexCLayout";
import { buildMoaAnnexPacketContext } from "./moaAnnexPacket";

const PRINT_BODY_CLASS = "moa-annex-c-printing";
const PRINT_ROOT_ID = "moa-annex-c-print-root";
const PRINT_PAGE_STYLE_ID = "moa-annex-c-print-page-style";

/**
 * Renders the official Proforma MOA (Annex C) at body level and prints in-page.
 * The on-screen preview is not modified or cloned.
 */
export async function printMoaAnnexCPdf(
  form: MoaAnnexCForm,
  applicationId?: string,
  applicant?: Applicant | null,
) {
  const previousTitle = window.document.title;
  window.document.title = applicationId
    ? `SETUP-Annex-C-MOA-${applicationId}`
    : "SETUP Annex C — Proforma MOA";

  const printRoot = window.document.createElement("div");
  printRoot.id = PRINT_ROOT_ID;
  printRoot.className = "moa-form-document";
  window.document.body.appendChild(printRoot);

  /* Override global print.css @page { margin: 12mm } for this print only. */
  const pageStyle = window.document.createElement("style");
  pageStyle.id = PRINT_PAGE_STYLE_ID;
  pageStyle.textContent = `@page { size: A4 portrait; margin: ${MOA_PAGE_MARGIN_MM}mm; }`;
  window.document.head.appendChild(pageStyle);

  let reactRoot: Root | null = createRoot(printRoot);
  const packet = buildMoaAnnexPacketContext(applicant ?? null, form);
  reactRoot.render(<MoaAnnexCDocument form={form} packet={packet} />);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    reactRoot?.unmount();
    reactRoot = null;
    printRoot.remove();
    window.document.getElementById(PRINT_PAGE_STYLE_ID)?.remove();
    window.document.body.classList.remove(PRINT_BODY_CLASS);
    window.document.title = previousTitle;
    window.removeEventListener("afterprint", cleanup);
    printMedia.removeEventListener("change", onPrintMediaChange);
  };

  const onPrintMediaChange = (event: MediaQueryListEvent) => {
    if (!event.matches) cleanup();
  };

  const printMedia = window.matchMedia("print");
  printMedia.addEventListener("change", onPrintMediaChange);
  window.addEventListener("afterprint", cleanup);

  window.document.body.classList.add(PRINT_BODY_CLASS);

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  window.print();
}
