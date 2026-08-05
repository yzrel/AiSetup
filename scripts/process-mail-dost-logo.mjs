/**
 * Knock out the baked-in navy gradient behind the mail DOST logo
 * so it sits flush on MailHtmlLayout HEADER_BG.
 */
import sharp from "sharp";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mailDir = join(
  __dirname,
  "..",
  "backend",
  "src",
  "main",
  "resources",
  "mail",
);
const output = join(mailDir, "dost-logo-horizontal-light.png");
const sourceOrig = join(mailDir, "dost-logo-horizontal-light.orig.png");
const input = existsSync(sourceOrig) ? sourceOrig : output;

function isNavyBackground(r, g, b) {
  // Observed edge blues ~#36497C … #455786
  if (b < 95 || b > 170) return false;
  if (r < 30 || r > 100) return false;
  if (g < 45 || g > 120) return false;
  if (b - r < 35) return false;
  // Exclude bright cyan emblem quadrants
  if (g > 140 || b > 200) return false;
  // Exclude near-white text
  if (r > 160 && g > 160 && b > 160) return false;
  return true;
}

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixels = new Uint8Array(data);
let cleared = 0;
for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];
  if (isNavyBackground(r, g, b)) {
    pixels[i + 3] = 0;
    cleared += 1;
  }
}

await sharp(pixels, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(
  `Wrote ${output} (cleared ${cleared} bg pixels of ${info.width * info.height})`,
);
