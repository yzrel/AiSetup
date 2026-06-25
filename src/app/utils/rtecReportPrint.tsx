/**
 * Author: Yzrel Jade B. Eborde
 */

import { createRoot, type Root } from "react-dom/client";
import type { RtecReportForm } from "../api/types";
import { RtecReportDocument } from "../components/rtecReport/RtecReportDocument";

const PRINT_BODY_CLASS = "rtec-report-printing";
const PRINT_ROOT_ID = "rtec-report-print-root";

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  if (images.length === 0) return Promise.resolve();

  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  ).then(() => undefined);
}

/**
 * Renders the official SETUP Form 002 RTEC Report at body level and prints in-page.
 * The on-screen preview is not modified or cloned.
 */
export function printRtecReportPdf(form: RtecReportForm, applicationId?: string) {
  const previousTitle = window.document.title;
  window.document.title = applicationId
    ? `SETUP-Form-002-RTEC-${applicationId}`
    : "SETUP Form 002 — RTEC Report";

  const printRoot = window.document.createElement("div");
  printRoot.id = PRINT_ROOT_ID;
  window.document.body.appendChild(printRoot);

  let reactRoot: Root | null = createRoot(printRoot);
  reactRoot.render(<RtecReportDocument form={form} />);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    reactRoot?.unmount();
    reactRoot = null;
    printRoot.remove();
    window.document.body.classList.remove(PRINT_BODY_CLASS);
    window.document.title = previousTitle;
    window.removeEventListener("afterprint", cleanup);
    printMedia.removeEventListener("change", onPrintMediaChange);
  };

  const onPrintMediaChange = (event: MediaQueryListEvent) => {
    if (!event.matches) {
      window.setTimeout(cleanup, 0);
    }
  };

  const printMedia = window.matchMedia("print");

  window.document.body.classList.add(PRINT_BODY_CLASS);
  window.addEventListener("afterprint", cleanup);
  printMedia.addEventListener("change", onPrintMediaChange);

  void waitForImages(printRoot).then(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  });
}
