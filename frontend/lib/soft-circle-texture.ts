import * as THREE from "three";

let cached: THREE.Texture | null = null;

/** A small radial-gradient sprite so point particles read as soft glowing
 * dots instead of hard-edged squares (the default THREE.Points shape). */
export function getSoftCircleTexture(): THREE.Texture {
  if (cached) return cached;

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.7)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  cached = texture;
  return texture;
}
