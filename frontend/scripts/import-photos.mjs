// Imports real photos from ../sam into public/photos/gallery/, reading each
// JPEG's real dimensions (tiny hand-rolled SOF-marker parser — no deps) so
// frames can be sized to the correct aspect ratio instead of being stretched.
// Writes frontend/data/gallery-photos.json for fallback-museum.ts to import.
// Run with: node scripts/import-photos.mjs

import { readdirSync, statSync, readFileSync, copyFileSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, "..", "..", "sam");
const OUT_DIR = path.join(__dirname, "..", "public", "photos", "gallery");
const OUT_JSON = path.join(__dirname, "..", "data", "gallery-photos.json");

const IMAGE_EXTS = new Set([".jpg", ".jpeg"]);

// Target frame footprint in meters. Long side normalized to MAX_DIM, short
// side follows the real aspect ratio, clamped so nothing is absurdly thin/wide.
const MAX_DIM = 1.45;
const MIN_DIM = 0.85;
const MAX_RATIO_DIM = 2.1; // cap for extreme panoramas

function readJpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null; // not a JPEG
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    // SOF0..SOF15 (excluding DHT/JPG/DAC markers) carry width/height
    const isSOF =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    const length = buf.readUInt16BE(offset + 2);
    if (isSOF) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height };
    }
    offset += 2 + length;
  }
  return null;
}

function frameDims(width, height) {
  const aspect = width / height;
  let w, h;
  if (aspect >= 1) {
    w = MAX_DIM;
    h = MAX_DIM / aspect;
    if (h < MIN_DIM) {
      h = MIN_DIM;
      w = Math.min(MIN_DIM * aspect, MAX_RATIO_DIM);
    }
  } else {
    h = MAX_DIM;
    w = MAX_DIM * aspect;
    if (w < MIN_DIM) {
      w = MIN_DIM;
      h = Math.min(MIN_DIM / aspect, MAX_RATIO_DIM);
    }
  }
  return { w: Math.round(w * 100) / 100, h: Math.round(h * 100) / 100 };
}

function main() {
  if (!statSync(SRC_DIR, { throwIfNoEntry: false })) {
    console.error(`No source folder found at ${SRC_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(SRC_DIR)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .map((f) => ({ f, mtime: statSync(path.join(SRC_DIR, f)).mtime.getTime() }))
    .sort((a, b) => a.mtime - b.mtime)
    .map((x) => x.f);

  if (files.length === 0) {
    console.error(`No .jpg photos found in ${SRC_DIR}`);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const photos = [];
  let skipped = 0;

  files.forEach((file, i) => {
    const srcPath = path.join(SRC_DIR, file);
    const buf = readFileSync(srcPath);
    const size = readJpegSize(buf);
    if (!size || !size.width || !size.height) {
      console.warn(`Skipping ${file}: couldn't read JPEG dimensions`);
      skipped++;
      return;
    }
    const id = `photo-${String(i + 1).padStart(3, "0")}`;
    const outName = `${id}.jpg`;
    copyFileSync(srcPath, path.join(OUT_DIR, outName));
    const { w, h } = frameDims(size.width, size.height);
    photos.push({
      id,
      src: `/photos/gallery/${outName}`,
      caption: "✏️ Add a memory for this photo.",
      width: w,
      height: h,
    });
  });

  mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(photos, null, 2), "utf-8");

  console.log(`Imported ${photos.length} photo(s) into ${OUT_DIR}`);
  if (skipped) console.log(`Skipped ${skipped} file(s) that couldn't be read`);
  console.log(`Wrote ${OUT_JSON}`);
}

main();
