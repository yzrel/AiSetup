/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official Form 005 in-page print. Renders PropertyTransferReceiptDocument via createRoot;
 * does not clone the on-screen preview.
 */

import { createRoot, type Root } from "react-dom/client";
import type { ProjectCloseOutForm } from "../api/types";
import { PropertyTransferReceiptDocument } from "../components/propertyTransferReceipt/PropertyTransferReceiptDocument";
import { PTR_TITLE } from "../constants/propertyTransferReceiptLayout";

const PRINT_BODY_CLASS = "property-transfer-receipt-printing";
const PRINT_ROOT_ID = "property-transfer-receipt-print-root";

export interface PrintPropertyTransferReceiptOptions {
  form: ProjectCloseOutForm;
  applicationId?: string;
}

export async function printPropertyTransferReceiptPdf(
  options: PrintPropertyTransferReceiptOptions,
) {
  const { form, applicationId } = options;
  const previousTitle = window.document.title;
  window.document.title = applicationId
    ? `SETUP-Form-005-${applicationId}`
    : PTR_TITLE;

  const printRoot = window.document.createElement("div");
  printRoot.id = PRINT_ROOT_ID;
  printRoot.className = "ptr-form-document ptr-form-print-surface";
  window.document.body.appendChild(printRoot);

  let reactRoot: Root | null = createRoot(printRoot);
  reactRoot.render(<PropertyTransferReceiptDocument form={form} />);

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

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.print();
    });
  });
}
