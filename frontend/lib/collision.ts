import type { WallBox } from "./level";
import { PLAYER_RADIUS } from "./level";

/**
 * Resolves a proposed (x, z) move against a list of thin wall AABBs using
 * per-axis sweeping, which gives natural wall-sliding without needing a
 * full physics engine: try X alone, keep it only if clear; same for Z.
 */
export function resolveMove(
  currentX: number,
  currentZ: number,
  desiredX: number,
  desiredZ: number,
  walls: WallBox[]
): { x: number; z: number } {
  let x = currentX;
  let z = currentZ;

  if (!collides(desiredX, z, walls)) {
    x = desiredX;
  }
  if (!collides(x, desiredZ, walls)) {
    z = desiredZ;
  }

  return { x, z };
}

function collides(x: number, z: number, walls: WallBox[]): boolean {
  const r = PLAYER_RADIUS;
  for (const w of walls) {
    if (x > w.minX - r && x < w.maxX + r && z > w.minZ - r && z < w.maxZ + r) {
      return true;
    }
  }
  return false;
}
