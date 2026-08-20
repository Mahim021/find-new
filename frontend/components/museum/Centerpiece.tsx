"use client";
/* eslint-disable react-hooks/purity --
   the tree's blossom scatter uses Math.random() as a one-time layout seed
   in useMemo — a stable layout seed, not reactive render state. */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CenterpieceStyle } from "@/lib/themes";

export default function Centerpiece({
  style,
  position,
  accentColor,
  lightColor,
}: {
  style: CenterpieceStyle;
  position: [number, number, number];
  accentColor: string;
  lightColor: string;
}) {
  if (style === "chandelier") return <Chandelier position={position} accentColor={accentColor} lightColor={lightColor} />;
  if (style === "tree") return <WishTree position={position} accentColor={accentColor} lightColor={lightColor} />;
  return <Fireplace position={position} accentColor={accentColor} lightColor={lightColor} />;
}

function Chandelier({
  position,
  accentColor,
  lightColor,
}: {
  position: [number, number, number];
  accentColor: string;
  lightColor: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRadius = 0.9;
  const crystals = useMemo(
    () => Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2),
    []
  );

  useFrame(({ clock }) => {
    if (groupRef.current) groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.15) * 0.15;
  });

  return (
    <group position={[position[0], 5.1, position[2]]}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
        <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.3} />
      </mesh>
      <group ref={groupRef}>
        <mesh>
          <torusGeometry args={[ringRadius, 0.04, 8, 32]} />
          <meshStandardMaterial color={accentColor} metalness={0.85} roughness={0.25} />
        </mesh>
        {crystals.map((angle, i) => (
          <mesh key={i} position={[Math.cos(angle) * ringRadius, -0.15, Math.sin(angle) * ringRadius]}>
            <octahedronGeometry args={[0.08]} />
            <meshStandardMaterial color={lightColor} emissive={lightColor} emissiveIntensity={1.8} roughness={0.1} />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, -0.1, 0]} color={lightColor} intensity={22} distance={16} decay={2} />
    </group>
  );
}

function WishTree({
  position,
  lightColor,
}: {
  position: [number, number, number];
  accentColor: string;
  lightColor: string;
}) {
  const blossoms = useMemo(
    () =>
      Array.from({ length: 22 }, () => {
        const r = 1.4 + Math.random() * 0.7;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.6;
        return [r * Math.sin(phi) * Math.cos(theta), 3.4 + r * Math.cos(phi) * 0.6, r * Math.sin(phi) * Math.sin(theta)] as [
          number,
          number,
          number,
        ];
      }),
    []
  );

  return (
    <group position={position}>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.14, 0.22, 3.2, 8]} />
        <meshStandardMaterial color="#4a3222" roughness={0.9} />
      </mesh>
      {blossoms.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.075, 8, 8]} />
          <meshStandardMaterial color={lightColor} emissive={lightColor} emissiveIntensity={0.45} roughness={0.4} />
        </mesh>
      ))}
      <pointLight position={[0, 3.6, 0]} color={lightColor} intensity={10} distance={14} decay={2} />
    </group>
  );
}

function Fireplace({
  position,
  accentColor,
  lightColor,
}: {
  position: [number, number, number];
  accentColor: string;
  lightColor: string;
}) {
  const flameRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (flameRef.current) {
      flameRef.current.intensity = 14 + Math.sin(clock.getElapsedTime() * 8) * 2 + Math.random() * 1.5;
    }
  });

  // Symmetric on both Z faces so it reads as a proper hearth from whichever
  // direction it's approached (the hall is walked both ways).
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.6, 1, 0.7]} />
        <meshStandardMaterial color="#241814" roughness={0.9} />
      </mesh>
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh position={[0, 0.5, side * 0.37]}>
            <boxGeometry args={[1.9, 1.3, 0.08]} />
            <meshStandardMaterial color={accentColor} metalness={0.3} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.35, side * 0.34]}>
            <coneGeometry args={[0.24, 0.5, 10]} />
            <meshStandardMaterial color={lightColor} emissive={lightColor} emissiveIntensity={1.6} roughness={0.3} />
          </mesh>
        </group>
      ))}
      <pointLight ref={flameRef} position={[0, 0.6, 0]} color={lightColor} intensity={14} distance={9} decay={2} />
    </group>
  );
}
