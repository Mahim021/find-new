"use client";

import { useMemo } from "react";
import type { LevelData } from "@/lib/level";
import type { WorldTheme } from "@/lib/themes";

// Three.js point lights are physically-based (candela), so room-scale
// distances need much larger raw numbers than the 1.0-ish theme values
// authored in the data — this multiplier keeps the data file readable
// while producing usable game-like brightness.
const INTENSITY_SCALE = 11;

export default function Lighting({ level, theme }: { level: LevelData; theme: WorldTheme }) {
  const roomLights = useMemo(() => {
    return level.rooms.flatMap((room) => {
      const count = Math.max(1, Math.round((room.zEnd - room.zStart) / 7));
      const step = (room.zEnd - room.zStart) / (count + 1);
      return Array.from({ length: count }, (_, i) => ({
        key: `${room.id}-light-${i}`,
        position: [0, room.height - 0.5, room.zStart + step * (i + 1)] as [number, number, number],
        isFinal: room.isFinal,
      }));
    });
  }, [level.rooms]);

  return (
    <group>
      <hemisphereLight args={["#fff3df", "#241d18", 0.8]} />

      <pointLight
        position={[0, 4, level.lobby.zStart + 3]}
        color={theme.lightColor}
        intensity={10}
        distance={12}
        decay={2}
      />

      {roomLights.map((l) => (
        <pointLight
          key={l.key}
          position={l.position}
          color={theme.lightColor}
          intensity={(l.isFinal ? theme.lightIntensity * 1.6 : theme.lightIntensity) * INTENSITY_SCALE}
          distance={l.isFinal ? 18 : 13}
          decay={2}
        />
      ))}
    </group>
  );
}
