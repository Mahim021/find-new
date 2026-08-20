"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import type { LevelData } from "@/lib/level";
import type { WorldTheme } from "@/lib/themes";
import Level from "./Level";
import Lighting from "./Lighting";
import Ambience from "./Ambience";
import Player from "./Player";
import FramedPhoto from "./FramedPhoto";
import Centerpiece from "./Centerpiece";
import Collectible from "./Collectible";

export default function Scene({ level, theme }: { level: LevelData; theme: WorldTheme }) {
  return (
    <Canvas
      shadows={false}
      camera={{ fov: 68, near: 0.05, far: 60, position: level.spawn }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.75]}
    >
      <color attach="background" args={[theme.background]} />
      <fog attach="fog" args={[theme.fog, 8, 28]} />

      <Suspense fallback={null}>
        <Level level={level} theme={theme} />
        <Lighting level={level} theme={theme} />
        <Ambience level={level} style={theme.particles} starry={theme.ceiling === "starry"} />
        <Centerpiece style={theme.centerpiece} position={level.centerpiece} accentColor={theme.accentColor} lightColor={theme.lightColor} />
        {level.photos.map((photo) => (
          <FramedPhoto key={photo.id} photo={photo} frameStyle={theme.frame} />
        ))}
        {level.hearts.map((heart) => (
          <Collectible key={heart.id} heart={heart} glowColor={theme.accentColor} />
        ))}
        <Player level={level} />
      </Suspense>

      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.65} luminanceSmoothing={0.3} intensity={0.6} mipmapBlur radius={0.5} />
        <Vignette eskil={false} offset={0.15} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
