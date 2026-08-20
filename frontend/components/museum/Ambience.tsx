"use client";
/* eslint-disable react-hooks/purity --
   one-time randomized particle scatter computed in useMemo — a stable
   layout seed, not reactive render state. */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { LevelData } from "@/lib/level";
import type { ParticleStyle } from "@/lib/themes";
import { getSoftCircleTexture } from "@/lib/soft-circle-texture";

const PARTICLE_COUNT = 200;
const STAR_COUNT = 260;

const PARTICLE_LOOK: Record<ParticleStyle, { color: string; size: number; opacity: number; direction: 1 | -1; speed: [number, number] }> = {
  dust: { color: "#ffe9c0", size: 0.014, opacity: 0.45, direction: 1, speed: [0.05, 0.15] },
  petals: { color: "#f2a9c4", size: 0.026, opacity: 0.6, direction: -1, speed: [0.15, 0.35] },
  embers: { color: "#ff9d4d", size: 0.016, opacity: 0.55, direction: 1, speed: [0.1, 0.28] },
};

export default function Ambience({ level, style, starry }: { level: LevelData; style: ParticleStyle; starry: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const totalDepth = level.totalDepth - level.lobby.zStart;
  const look = PARTICLE_LOOK[style];
  const sprite = useMemo(() => (typeof document !== "undefined" ? getSoftCircleTexture() : null), []);

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 3.8 + 0.3;
      positions[i * 3 + 2] = level.lobby.zStart + Math.random() * totalDepth;
      speeds[i] = look.speed[0] + Math.random() * (look.speed[1] - look.speed[0]);
    }
    return { positions, speeds };
  }, [level.lobby.zStart, totalDepth, look.speed]);

  const starPositions = useMemo(() => {
    if (!starry) return null;
    const arr = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = 7 + Math.random() * 4;
      arr[i * 3 + 2] = level.lobby.zStart + Math.random() * totalDepth;
    }
    return arr;
  }, [starry, level.lobby.zStart, totalDepth]);

  useFrame((_, delta) => {
    const geom = pointsRef.current?.geometry;
    if (!geom) return;
    const arr = geom.attributes.position.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3 + 1] += speeds[i] * delta * look.direction;
      if (look.direction > 0 && arr[i * 3 + 1] > 4.2) arr[i * 3 + 1] = 0.2;
      if (look.direction < 0 && arr[i * 3 + 1] < 0.1) arr[i * 3 + 1] = 4.0;
    }
    geom.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={look.color}
          size={look.size}
          map={sprite ?? undefined}
          transparent
          opacity={look.opacity}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {starPositions && (
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color="#eaf3ff"
            size={0.045}
            map={sprite ?? undefined}
            transparent
            opacity={0.85}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}
