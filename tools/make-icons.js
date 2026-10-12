/* Generate PNG app icons from icon.svg / icon-maskable.svg at every size the
 * Windows build, Android launcher and web manifest need. */
"use strict";
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");

async function main() {
  const svg = path.join(ROOT, "icon.svg");
  const maskable = path.join(ROOT, "icon-maskable.svg");

  // plain app icon: every square size used by the Windows build and PWA
  for (const size of [16, 24, 32, 48, 64, 96, 128, 192, 256, 512]) {
    await sharp(svg, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(path.join(ROOT, `icon-${size}.png`));
  }
  console.log("icon-*.png written (16..512)");

  // Android adaptive icon foregrounds + legacy launcher PNGs
  const androidRes = path.join(ROOT, "android", "app", "src", "main", "res");
  const dens = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [d, size] of Object.entries(dens)) {
    const dir = path.join(androidRes, `mipmap-${d}`);
    await sharp(maskable, { density: 300 }).resize(size, size).png()
      .toFile(path.join(dir, "ic_launcher.png"));
  }
  console.log("android mipmap ic_launcher.png written");

  // Play Store / manifest 512 + 192 maskable
  await sharp(maskable, { density: 300 }).resize(512, 512).png()
    .toFile(path.join(ROOT, "icon-maskable-512.png"));
  console.log("icon-maskable-512.png written");
}

main().catch((e) => { console.error(e); process.exit(1); });
