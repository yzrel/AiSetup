/**
 * Author: Yzrel Jade B. Eborde
 */

import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import type { FinancialProjectionSnapshot } from "../api/types";
import { FinancialProjectionDocument } from "../components/projectProposal/financialProjection/FinancialProjectionDocument";

const PRINT_BODY_CLASS = "financial-projection-printing";
const PRINT_ROOT_ID = "financial-projection-print-root";

/**
 * Renders the official projected FS at body level and prints in-page.
 * The wizard preview is not cloned.
 */
export async function printFinancialProjection(
  snapshot: FinancialProjectionSnapshot,
  applicationId?: string,
  frozenAt?: string,
): Promise<void> {
  const previousTitle = window.document.title;
  window.document.title = applicationId
    ? `Projected-FS-${applicationId}`
    : "Projected Financial Statements";

  const printRoot = window.document.createElement("div");
  printRoot.id = PRINT_ROOT_ID;
  window.document.body.appendChild(printRoot);

  let reactRoot: Root | null = createRoot(printRoot);
  flushSync(() => {
    reactRoot?.render(
      <FinancialProjectionDocument
        snapshot={snapshot}
        applicationId={applicationId}
        frozenAt={frozenAt}
      />,
    );
  });

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

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
  window.print();
  window.setTimeout(cleanup, 60_000);
}
