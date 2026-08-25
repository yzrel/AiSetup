/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official Form 006 in-page print. Renders InventoryOfEquipmentDocument via createRoot;
 * does not clone the on-screen preview.
 */

import { createRoot, type Root } from "react-dom/client";
import type { ProjectCloseOutForm } from "../api/types";
import { InventoryOfEquipmentDocument } from "../components/inventoryOfEquipment/InventoryOfEquipmentDocument";
import { IOE_TITLE } from "../constants/inventoryOfEquipmentLayout";

const PRINT_BODY_CLASS = "inventory-of-equipment-printing";
const PRINT_ROOT_ID = "inventory-of-equipment-print-root";

export interface PrintInventoryOfEquipmentOptions {
  form: ProjectCloseOutForm;
  applicationId?: string;
}

export async function printInventoryOfEquipmentPdf(
  options: PrintInventoryOfEquipmentOptions,
) {
  const { form, applicationId } = options;
  const previousTitle = window.document.title;
  window.document.title = applicationId
    ? `SETUP-Form-006-${applicationId}`
    : IOE_TITLE;

  const printRoot = window.document.createElement("div");
  printRoot.id = PRINT_ROOT_ID;
  printRoot.className = "ioe-form-document ioe-form-print-surface";
  window.document.body.appendChild(printRoot);

  let reactRoot: Root | null = createRoot(printRoot);
  reactRoot.render(<InventoryOfEquipmentDocument form={form} />);

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
