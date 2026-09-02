/**
 * Author: Yzrel Jade B. Eborde
 *
 * In-page printing for HTML-string documents. Replaces the legacy popup
 * `window.open` + `document.write` path (popup blockers, freeze risk with
 * long forms) with the same `#…-print-root` + `window.print()` approach used
 * by the React-rendered official forms (LOI, TNA, RTEC, Project Proposal).
 */

const PRINT_ROOT_ID = "aisetup-html-print-root";
const PRINT_BODY_CLASS = "aisetup-html-printing";

/** Minimal HTML escaping for user-entered values interpolated into documents. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
 * Prints an HTML fragment in-page: mounts it at body level (hidden on
 * screen), hides the app chrome during print, and cleans up afterwards.
 *
 * `styles` are injected inside `@media print` only, so `@page` rules and
 * `body { … }` typography written for the old popup documents keep working
 * without restyling the app on screen.
 */
export function printHtmlDocument(
  title: string,
  bodyHtml: string,
  styles = "",
): void {
  const doc = window.document;
  doc.getElementById(PRINT_ROOT_ID)?.remove();

  const previousTitle = doc.title;
  doc.title = title;

  const printRoot = doc.createElement("div");
  printRoot.id = PRINT_ROOT_ID;

  const styleEl = doc.createElement("style");
  styleEl.textContent = `
    #${PRINT_ROOT_ID} { display: none; }
    @media print {
      body.${PRINT_BODY_CLASS} > *:not(#${PRINT_ROOT_ID}) { display: none !important; }
      #${PRINT_ROOT_ID} {
        display: block !important;
        visibility: visible !important;
        position: static !important;
        overflow: visible !important;
        height: auto !important;
        max-height: none !important;
        color: #111 !important;
      }
      #${PRINT_ROOT_ID} * {
        visibility: visible !important;
        color: #111 !important;
      }
      ${styles}
    }
  `;
  printRoot.appendChild(styleEl);

  const content = doc.createElement("div");
  content.innerHTML = bodyHtml;
  printRoot.appendChild(content);
  doc.body.appendChild(printRoot);

  let cleaned = false;
  const printMedia = window.matchMedia("print");

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    printRoot.remove();
    doc.body.classList.remove(PRINT_BODY_CLASS);
    doc.title = previousTitle;
    window.removeEventListener("afterprint", cleanup);
    printMedia.removeEventListener("change", onPrintMediaChange);
  };

  const onPrintMediaChange = (event: MediaQueryListEvent) => {
    if (!event.matches) {
      window.setTimeout(cleanup, 0);
    }
  };

  doc.body.classList.add(PRINT_BODY_CLASS);
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
