/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official TNA Form 01 in-page print. Renders TnaForm01Document via createRoot;
 * does not clone the on-screen preview.
 */

import { createRoot, type Root } from "react-dom/client";
import {
  TnaForm01Document,
  type TnaForm01Tables,
} from "../components/tnaForm01/TnaForm01Document";
import {
  hydrateStoredFileDataUrls,
  type StoredFileRef,
} from "./storedFilePreview";

const PRINT_BODY_CLASS = "tna-form-01-printing";
const PRINT_ROOT_ID = "tna-form-01-print-root";

export interface PrintTnaForm01Options {
  form: Record<string, unknown>;
  tables: TnaForm01Tables;
  applicantId?: string;
  applicationId?: string;
}

const ATTACHMENT_FIELDS = [
  {
    prefix: "productionPlan",
    moduleKey: "tna1-productionPlan",
  },
  {
    prefix: "plantLayout",
    moduleKey: "tna1-plantLayout",
  },
  {
    prefix: "processFlow",
    moduleKey: "tna1-processFlow",
  },
] as const;

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

function str(form: Record<string, unknown>, key: string): string {
  const v = form[key];
  return v == null ? "" : String(v);
}

async function hydrateFormAttachments(
  form: Record<string, unknown>,
  applicantId?: string,
): Promise<{ form: Record<string, unknown>; revoke: () => void }> {
  const refs: (StoredFileRef & { prefix: string })[] = ATTACHMENT_FIELDS.map((field) => ({
    prefix: field.prefix,
    moduleKey: field.moduleKey,
    dataUrl: str(form, `${field.prefix}FileData`) || undefined,
    fileId: str(form, `${field.prefix}FileId`) || undefined,
    fileName: str(form, `${field.prefix}FileName`) || undefined,
    mimeType: str(form, `${field.prefix}FileMime`) || undefined,
  }));

  const { items, revoke } = await hydrateStoredFileDataUrls(applicantId, refs);
  const next = { ...form };
  for (const item of items) {
    if (item.dataUrl) {
      next[`${item.prefix}FileData`] = item.dataUrl;
    }
  }
  return { form: next, revoke };
}

export async function printTnaForm01Pdf(options: PrintTnaForm01Options) {
  const { tables, applicantId, applicationId } = options;
  const previousTitle = window.document.title;
  window.document.title = applicationId
    ? `DOST-TNA-Form-01-${applicationId}`
    : "DOST TNA FORM 01 - Application for Technology Needs Assessment";

  const { form, revoke } = await hydrateFormAttachments(options.form, applicantId);

  const printRoot = window.document.createElement("div");
  printRoot.id = PRINT_ROOT_ID;
  printRoot.className = "tna-form-document tna-form-01-print-surface";
  window.document.body.appendChild(printRoot);

  let reactRoot: Root | null = createRoot(printRoot);
  reactRoot.render(
    <TnaForm01Document form={form} tables={tables} applicantId={applicantId} />,
  );

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    reactRoot?.unmount();
    reactRoot = null;
    printRoot.remove();
    revoke();
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
