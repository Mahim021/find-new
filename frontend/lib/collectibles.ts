import type { RoomBounds } from "./level";

export interface HeartSpec {
  id: string;
  position: [number, number, number];
  note: string;
}

// Deterministic PRNG (mulberry32) so the scatter is stable across renders
// instead of relying on Math.random() during a render-adjacent computation.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Scatters collectible hearts through the open floor of the gallery room. */
export function generateHearts(galleryRoom: RoomBounds, notes: string[]): HeartSpec[] {
  const rand = mulberry32(1337);
  const count = notes.length;
  const margin = 2.2; // stay clear of the wall-mounted photo bands
  const usableWidth = galleryRoom.width - margin * 2;
  const usableDepth = galleryRoom.zEnd - galleryRoom.zStart - margin * 2;

  // Evenly spread along Z in `count` bands so hearts are found gradually
  // while walking the hall, with a little randomness within each band.
  const bandSize = usableDepth / count;

  return notes.map((note, i) => {
    const bandStart = galleryRoom.zStart + margin + bandSize * i;
    const z = bandStart + rand() * bandSize;
    const x = -usableWidth / 2 + rand() * usableWidth;
    const y = 1.3 + rand() * 1.1;
    return { id: `heart-${i}`, position: [x, y, z], note };
  });
}
