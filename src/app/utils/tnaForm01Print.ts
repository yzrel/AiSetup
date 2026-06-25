/**
 * Author: Yzrel Jade B. Eborde
 */

const PRINT_BODY_CLASS = "tna-form-01-printing";
const PRINT_ROOT_ID = "tna-form-01-print-root";
const PRINT_SURFACE_CLASS = "tna-form-01-print-surface";
const PREVIEW_ID = "tna-form-01-preview";

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
 * Clones the on-screen preview to a body-level print root so print CSS can hide
 * the app shell without hiding ancestor nodes of the form.
 */
export function printTnaForm01Pdf(applicationId?: string) {
  const el = document.getElementById(PREVIEW_ID);
  if (!el) {
    window.print();
    return;
  }

  const previousTitle = document.title;
  if (applicationId) {
    document.title = `DOST-TNA-Form-01-${applicationId}`;
  }

  const printRoot = document.createElement("div");
  printRoot.id = PRINT_ROOT_ID;

  const clone = el.cloneNode(true) as HTMLElement;
  clone.id = PREVIEW_ID;
  clone.classList.add(PRINT_SURFACE_CLASS);
  clone.querySelectorAll(".tna-screen-only, .tna-print-hidden").forEach((node) => node.remove());

  printRoot.appendChild(clone);
  document.body.appendChild(printRoot);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    printRoot.remove();
    document.body.classList.remove(PRINT_BODY_CLASS);
    document.title = previousTitle;
    window.removeEventListener("afterprint", cleanup);
    printMedia.removeEventListener("change", onPrintMediaChange);
  };

  const onPrintMediaChange = (event: MediaQueryListEvent) => {
    if (!event.matches) {
      window.setTimeout(cleanup, 0);
    }
  };

  const printMedia = window.matchMedia("print");

  document.body.classList.add(PRINT_BODY_CLASS);
  window.addEventListener("afterprint", cleanup);
  printMedia.addEventListener("change", onPrintMediaChange);

  void waitForImages(clone).then(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  });
}
