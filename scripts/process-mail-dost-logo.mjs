/**
 * Build the transactional-mail DOST header logo from the same asset the
 * LandingPage uses (`public/assets/dost-logo-mark.png` via DOSTHorizontalLogo):
 * black circles, cyan quadrants, white centre X, plus the white wordmark.
 *
 * The source mark already has a transparent background with opaque black
 * circles, so its alpha is kept verbatim — clearing black here would delete
 * the circles and leave a bare pinwheel on MailHtmlLayout HEADER_BG.
 */
import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const markSrc = join(root, "public", "assets", "dost-logo-mark.png");
const output = join(
  root,
  "backend",
  "src",
  "main",
  "resources",
  "mail",
  "dost-logo-horizontal-light.png",
);

/** Matches DOSTLogos.tsx — crop in the gap below the four-circle graphic (caption starts at 697). */
const MARK_SRC_W = 759;
const MARK_GRAPHIC_H = 680;

/** 2× the ~160px display height so clients that scale the img stay crisp. */
const MARK_H = 160;
const MARK_W = Math.round(MARK_H * (MARK_SRC_W / MARK_GRAPHIC_H));
const GAP = Math.round(MARK_H * 0.18);
const REPUBLIC_PX = Math.round(MARK_H * 0.1125);
const REPUBLIC_TRACKING = REPUBLIC_PX * 0.14;
const DEPT_PX = Math.round(MARK_H * 0.2);
const SERIF = "Georgia, 'Times New Roman', Times, serif";

const REPUBLIC_TEXT = "REPUBLIC OF THE PHILIPPINES";
const DEPT_TEXT = "Department of Science and Technology";

/** Tight content box of non-transparent pixels. */
async function alphaBounds(pngBuffer) {
  const { data, info } = await sharp(pngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function svg(width, height, body) {
  return Buffer.from(
    `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`,
  );
}

const mark = await sharp(markSrc)
  .extract({ left: 0, top: 0, width: MARK_SRC_W, height: MARK_GRAPHIC_H })
  .resize(MARK_W, MARK_H, { fit: "fill" })
  .png()
  .toBuffer();

// Measure the wordmark so the rule under "Republic of the Philippines"
// spans the department line, as it does on the LandingPage.
const measureW = MARK_H * 6;
const measureH = DEPT_PX * 3;
const deptProbe = await sharp(
  svg(
    measureW,
    measureH,
    `<text x="0" y="${DEPT_PX * 1.5}" fill="#ffffff" font-family="${SERIF}" font-size="${DEPT_PX}" font-weight="600">${DEPT_TEXT}</text>`,
  ),
)
  .png()
  .toBuffer();
const deptBounds = await alphaBounds(deptProbe);
const textW = deptBounds.maxX + 1;

const PAD = 4;
const canvasH = MARK_H + PAD * 2;
const canvasW = PAD + MARK_W + GAP + textW + PAD;
const textLeft = PAD + MARK_W + GAP;
const ruleY = Math.round(canvasH / 2);
const republicBaseline = ruleY - Math.round(MARK_H * 0.07) - 2;
const deptBaseline = ruleY + Math.round(MARK_H * 0.07) + DEPT_PX;

const wordmark = svg(
  canvasW,
  canvasH,
  `
  <text x="${textLeft}" y="${republicBaseline}" fill="#ffffff" fill-opacity="0.9"
        font-family="${SERIF}" font-size="${REPUBLIC_PX}"
        letter-spacing="${REPUBLIC_TRACKING}">${REPUBLIC_TEXT}</text>
  <rect x="${textLeft}" y="${ruleY}" width="${textW}" height="1.5" fill="#ffffff" fill-opacity="0.9"/>
  <text x="${textLeft}" y="${deptBaseline}" fill="#ffffff"
        font-family="${SERIF}" font-size="${DEPT_PX}" font-weight="600">${DEPT_TEXT}</text>
`,
);

const composed = await sharp({
  create: {
    width: canvasW,
    height: canvasH,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    { input: mark, left: PAD, top: PAD },
    { input: wordmark, left: 0, top: 0 },
  ])
  .png()
  .toBuffer();

const bounds = await alphaBounds(composed);
await sharp(composed)
  .extract({
    left: Math.max(0, bounds.minX - PAD),
    top: Math.max(0, bounds.minY - PAD),
    width: Math.min(canvasW, bounds.width + PAD * 2),
    height: Math.min(canvasH, bounds.height + PAD * 2),
  })
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(
  `Wrote ${output} (${bounds.width + PAD * 2}×${bounds.height + PAD * 2}, transparent background)`,
);
