import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const assets = join(__dirname, "..", "public", "assets");

function isBackground(r, g, b) {
  return Math.max(r, g, b) < 10;
}

function isWhiteish(r, g, b) {
  const max = Math.max(r, g, b);
  return (
    max > 90 &&
    r > 70 &&
    g > 70 &&
    b > 70 &&
    Math.abs(r - g) < 45 &&
    Math.abs(g - b) < 45
  );
}

/** White / colored content on black → transparent PNG for dark page sections */
async function blackToTransparent(input, output) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const alpha = Math.max(r, g, b);

    if (alpha < 8) {
      pixels[i + 3] = 0;
      continue;
    }

    pixels[i] = Math.min(255, Math.round((r * 255) / alpha));
    pixels[i + 1] = Math.min(255, Math.round((g * 255) / alpha));
    pixels[i + 2] = Math.min(255, Math.round((b * 255) / alpha));
    pixels[i + 3] = alpha;
  }

  await writePng(pixels, info, output);
}

/** Same logo with transparent background + dark text for white page sections */
async function blackToTransparentLight(input, output) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const textR = 28;
  const textG = 36;
  const textB = 52;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    if (isBackground(r, g, b)) {
      pixels[i + 3] = 0;
      continue;
    }

    const max = Math.max(r, g, b);

    if (isWhiteish(r, g, b)) {
      pixels[i] = textR;
      pixels[i + 1] = textG;
      pixels[i + 2] = textB;
      pixels[i + 3] = max;
      continue;
    }

    if (max < 95) {
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = Math.min(255, max + 40);
      continue;
    }

    pixels[i] = Math.min(255, Math.round((r * 255) / max));
    pixels[i + 1] = Math.min(255, Math.round((g * 255) / max));
    pixels[i + 2] = Math.min(255, Math.round((b * 255) / max));
    pixels[i + 3] = max;
  }

  await writePng(pixels, info, output);
}

async function writePng(pixels, info, output) {
  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(output);

  console.log(`Wrote ${output}`);
}

await blackToTransparent(
  join(assets, "dost-logo-horizontal.png"),
  join(assets, "dost-logo-horizontal-transparent.png"),
);

await blackToTransparentLight(
  join(assets, "dost-logo-horizontal.png"),
  join(assets, "dost-logo-horizontal-light.png"),
);
