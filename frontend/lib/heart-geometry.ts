import * as THREE from "three";

let cached: THREE.ExtrudeGeometry | null = null;

/** A small extruded heart silhouette, built once and reused for every collectible. */
export function getHeartGeometry(): THREE.ExtrudeGeometry {
  if (cached) return cached;

  const shape = new THREE.Shape();
  shape.moveTo(0, -0.12);
  shape.bezierCurveTo(0, -0.08, -0.03, 0.03, -0.11, 0.03);
  shape.bezierCurveTo(-0.2, 0.03, -0.2, -0.08, -0.11, -0.15);
  shape.bezierCurveTo(-0.06, -0.19, 0, -0.17, 0, -0.12);
  shape.bezierCurveTo(0, -0.17, 0.06, -0.19, 0.11, -0.15);
  shape.bezierCurveTo(0.2, -0.08, 0.2, 0.03, 0.11, 0.03);
  shape.bezierCurveTo(0.03, 0.03, 0, -0.08, 0, -0.12);

  cached = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 });
  cached.center();
  cached.rotateX(Math.PI); // point downward
  return cached;
}
