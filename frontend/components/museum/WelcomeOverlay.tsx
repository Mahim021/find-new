"use client";

import { useState } from "react";
import { useMuseumStore } from "@/lib/store";
import { primeAudio } from "@/lib/music";
import { WORLD_THEMES, type WorldThemeId } from "@/lib/themes";
import type { MuseumMeta } from "@/lib/types";

export default function WelcomeOverlay({ meta }: { meta: MuseumMeta }) {
  const hasEntered = useMuseumStore((s) => s.hasEntered);
  const worldTheme = useMuseumStore((s) => s.worldTheme);
  const setWorldTheme = useMuseumStore((s) => s.setWorldTheme);
  const setHasEntered = useMuseumStore((s) => s.setHasEntered);
  // Returning via "Change World" skips straight to the picker.
  const [step, setStep] = useState<"welcome" | "picker">(worldTheme ? "picker" : "welcome");

  function handleChoose(id: WorldThemeId) {
    primeAudio();
    setWorldTheme(id);
    setHasEntered(true);
  }

  if (hasEntered) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-y-auto bg-linear-to-b from-[#1a1210] via-[#241612] to-[#120b09] px-6 py-10 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_50%_20%,#6b3b2a_0%,transparent_60%)]" />

      {step === "welcome" ? (
        <>
          <p className="relative z-10 mb-3 text-xs uppercase tracking-[0.4em] text-amber-200/70">
            Happy Birthday, {meta.recipientName}
          </p>
          <h1 className="relative z-10 max-w-2xl font-serif text-4xl leading-tight text-amber-50 sm:text-5xl">
            {meta.title}
          </h1>
          <p className="relative z-10 mt-4 max-w-xl text-sm text-amber-100/70 sm:text-base">{meta.subtitle}</p>
          <p className="relative z-10 mx-auto mt-6 max-w-md text-sm leading-relaxed text-amber-100/60">
            {meta.welcomeMessage}
          </p>

          <button
            onClick={() => setStep("picker")}
            className="relative z-10 mt-10 rounded-full border border-amber-200/40 bg-amber-100/10 px-8 py-3 text-sm uppercase tracking-[0.2em] text-amber-100 transition hover:bg-amber-100/20"
          >
            Continue
          </button>
        </>
      ) : (
        <>
          <p className="relative z-10 mb-2 text-xs uppercase tracking-[0.4em] text-amber-200/70">Choose Tonight&apos;s World</p>
          <h2 className="relative z-10 mb-8 font-serif text-3xl text-amber-50">How should the museum feel?</h2>

          <div className="relative z-10 grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-3">
            {Object.values(WORLD_THEMES).map((t) => (
              <button
                key={t.id}
                onClick={() => handleChoose(t.id)}
                className="group flex flex-col items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-5 text-center transition hover:-translate-y-1 hover:border-amber-200/40 hover:bg-black/30"
              >
                <div
                  className="h-20 w-full rounded-md shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
                />
                <p className="font-serif text-lg text-amber-50">{t.label}</p>
                <p className="text-xs leading-relaxed text-amber-100/60">{t.tagline}</p>
              </button>
            ))}
          </div>

          <p className="relative z-10 mt-8 text-xs text-amber-100/40">
            You can change this anytime from inside the museum. WASD to walk · Mouse to look · Click a photo to view it
          </p>
        </>
      )}
    </div>
  );
}
