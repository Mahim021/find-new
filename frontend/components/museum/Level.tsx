"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import type { LevelData } from "@/lib/level";
import type { WorldTheme } from "@/lib/themes";

const TRIM_COLORS: Record<WorldTheme["frame"], string> = {
  gold: "#c9a54a",
  driftwood: "#8fae8f",
  darkwood: "#a9773f",
};

export default function Level({ level, theme }: { level: LevelData; theme: WorldTheme }) {
  const ceilingY = theme.ceiling === "starry" ? 11 : undefined;
  const ceilingColor = theme.ceiling === "starry" ? "#050a09" : darken(theme.accentColor, 0.4);

  return (
    <group>
      {level.floors.map((f) => (
        <mesh key={f.id} position={f.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={f.size} />
          {theme.floorReflective ? (
            <MeshReflectorMaterial
              color={theme.floorColor}
              blur={[300, 100]}
              resolution={1024}
              mixBlur={1}
              mixStrength={35}
              roughness={0.9}
              depthScale={1}
              minDepthThreshold={0.85}
              metalness={0.4}
              mirror={0.4}
            />
          ) : (
            <meshStandardMaterial color={theme.floorColor} roughness={0.85} metalness={0.02} />
          )}
        </mesh>
      ))}

      {level.ceilings.map((c) => (
        <mesh
          key={c.id}
          position={ceilingY ? [c.position[0], ceilingY, c.position[2]] : c.position}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={theme.ceiling === "starry" ? [c.size[0] * 1.4, c.size[1]] : c.size} />
          <meshStandardMaterial color={ceilingColor} roughness={0.95} />
        </mesh>
      ))}

      {level.wallVisuals.map((w, i) => (
        <group key={i}>
          <mesh position={w.position}>
            <boxGeometry args={w.size} />
            <meshStandardMaterial color={theme.wallColor} roughness={0.85} />
          </mesh>
          {/* Baseboard trim for a museum-gallery feel */}
          <mesh position={[w.position[0], 0.12, w.position[2]]}>
            <boxGeometry args={[w.size[0] + 0.02, 0.24, w.size[2] + 0.02]} />
            <meshStandardMaterial color={TRIM_COLORS[theme.frame]} roughness={0.6} metalness={0.15} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function darken(hex: string, factor: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
