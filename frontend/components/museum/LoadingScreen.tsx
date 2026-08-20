"use client";

import { useProgress } from "@react-three/drei";

/** Masks the gap while ~68 real photo textures decode, instead of a blank canvas. */
export default function LoadingScreen() {
  const { active, progress } = useProgress();

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-45 flex flex-col items-center justify-center bg-[#0d0908] text-center">
      <p className="font-serif text-xl text-amber-100/90">Preparing the gallery…</p>
      <div className="mt-4 h-0.5 w-48 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-amber-200/70 transition-all duration-200" style={{ width: `${Math.max(6, progress)}%` }} />
      </div>
    </div>
  );
}
