// Generates tasteful placeholder SVG "photos" for each room so the museum
// is fully explorable before real photos are dropped in. Run with:
//   node scripts/generate-placeholders.mjs
// Real photos simply replace files under public/photos/<room>/ later —
// no code changes needed as long as filenames/paths in data/fallback-museum.ts
// (or public/data/museum.json from the ML pipeline) are updated to match.

import { mkdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = path.join(__dirname, "..", "public", "photos");

const ROOMS = [
  { id: "beginning", label: "The Beginning", from: "#f4d9c6", to: "#d9a679", count: 5 },
  { id: "adventures", label: "Adventures", from: "#7fb8b0", to: "#2c5f5a", count: 6 },
  { id: "favorite-moments", label: "Favorite Moments", from: "#f2b8a2", to: "#c8654a", count: 6 },
  { id: "little-things", label: "Little Things", from: "#c9d6a8", to: "#7c9463", count: 5 },
  { id: "birthday", label: "Birthday", from: "#f6d9e6", to: "#a5335c", count: 1 },
];

function heartPath(cx, cy, s) {
  return `M ${cx} ${cy + s * 0.3}
    C ${cx - s} ${cy - s * 0.6}, ${cx - s * 1.6} ${cy + s * 0.5}, ${cx} ${cy + s * 1.6}
    C ${cx + s * 1.6} ${cy + s * 0.5}, ${cx + s} ${cy - s * 0.6}, ${cx} ${cy + s * 0.3} Z`;
}

function makeSvg({ label, index, from, to }) {
  const w = 900;
  const h = 700;
  const gid = `g-${label.replace(/\s+/g, "-")}-${index}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#${gid})"/>
  <rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="3"/>
  <path d="${heartPath(w / 2, h / 2 - 40, 46)}" fill="rgba(255,255,255,0.85)"/>
  <text x="50%" y="${h / 2 + 90}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="40" fill="rgba(255,255,255,0.95)" letter-spacing="2">${label}</text>
  <text x="50%" y="${h / 2 + 140}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="24" fill="rgba(255,255,255,0.7)">Photo ${index}</text>
</svg>`;
}

for (const room of ROOMS) {
  const dir = path.join(OUT_ROOT, room.id);
  mkdirSync(dir, { recursive: true });
  for (let i = 1; i <= room.count; i++) {
    const svg = makeSvg({ label: room.label, index: i, from: room.from, to: room.to });
    writeFileSync(path.join(dir, `${i}.svg`), svg, "utf-8");
  }
  console.log(`Generated ${room.count} placeholder(s) for ${room.id}`);
}
