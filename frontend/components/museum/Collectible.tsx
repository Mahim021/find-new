"use client";
/* eslint-disable react-hooks/purity --
   a per-instance random spin offset, seeded once via useRef — a stable
   layout seed, not reactive render state. */

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getHeartGeometry } from "@/lib/heart-geometry";
import { useMuseumStore } from "@/lib/store";
import type { HeartSpec } from "@/lib/collectibles";

export default function Collectible({ heart, glowColor }: { heart: HeartSpec; glowColor: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const registerInteractable = useMuseumStore((s) => s.registerInteractable);
  const unregisterInteractable = useMuseumStore((s) => s.unregisterInteractable);
  const collected = useMuseumStore((s) => s.collectedHearts.has(heart.id));
  const hoveredKey = useMuseumStore((s) => s.hoveredKey);
  const key = `collectible:${heart.id}`;
  const isHovered = hoveredKey === key;
  const spinOffset = useRef(Math.random() * Math.PI * 2).current;

  useEffect(() => {
    if (collected) {
      unregisterInteractable(key);
      return;
    }
    if (groupRef.current) {
      groupRef.current.userData.kind = "collectible";
      groupRef.current.userData.id = heart.id;
      registerInteractable(key, groupRef.current);
    }
    return () => unregisterInteractable(key);
  }, [collected, key, heart.id, registerInteractable, unregisterInteractable]);

  useFrame(({ clock }) => {
    if (!groupRef.current || collected) return;
    const t = clock.getElapsedTime() + spinOffset;
    groupRef.current.position.y = heart.position[1] + Math.sin(t * 1.4) * 0.12;
    groupRef.current.rotation.y = t * 0.8;
    const s = isHovered ? 1.35 : 1;
    groupRef.current.scale.setScalar(s);
  });

  if (collected) return null;

  return (
    <group ref={groupRef} position={heart.position}>
      <mesh geometry={getHeartGeometry()}>
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.1} roughness={0.3} />
      </mesh>
      <pointLight color={glowColor} intensity={1.6} distance={2.2} decay={2} />
    </group>
  );
}
