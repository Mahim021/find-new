"use client";

import { useEffect, useState } from "react";
import { useMuseumStore } from "@/lib/store";
import type { LevelData } from "@/lib/level";

export default function Hud({ level }: { level: LevelData }) {
  const hasEntered = useMuseumStore((s) => s.hasEntered);
  const isLocked = useMuseumStore((s) => s.isLocked);
  const hoveredKey = useMuseumStore((s) => s.hoveredKey);
  const selectedPhoto = useMuseumStore((s) => s.selectedPhoto);
  const openNote = useMuseumStore((s) => s.openNote);
  const currentRoomId = useMuseumStore((s) => s.currentRoomId);
  const musicOn = useMuseumStore((s) => s.musicOn);
  const toggleMusic = useMuseumStore((s) => s.toggleMusic);
  const setHasEntered = useMuseumStore((s) => s.setHasEntered);
  const collectedCount = useMuseumStore((s) => s.collectedHearts.size);
  const totalHearts = useMuseumStore((s) => s.totalHearts);

  const paused = !!selectedPhoto || !!openNote;
  const hoveredKind = hoveredKey?.split(":")[0];

  const [roomToast, setRoomToast] = useState<string | null>(null);

  // Timed toast tied to an external event (room change), not derived render
  // state — the setState + cleanup timer pairing here is the intended effect
  // shape, not a render-mirroring anti-pattern.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!hasEntered) return;
    const room = level.rooms.find((r) => r.id === currentRoomId);
    if (room) {
      setRoomToast(room.name);
      const t = setTimeout(() => setRoomToast(null), 3200);
      return () => clearTimeout(t);
    } else {
      setRoomToast(null);
    }
  }, [currentRoomId, hasEntered, level.rooms]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!hasEntered) return null;

  function changeWorld() {
    if (document.pointerLockElement) document.exitPointerLock();
    setHasEntered(false);
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none">
      {/* Crosshair */}
      {isLocked && !paused && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className={`h-2 w-2 rounded-full border transition-all ${
              hoveredKey ? "scale-150 border-amber-200 bg-amber-200/70" : "border-white/70 bg-white/20"
            }`}
          />
        </div>
      )}

      {/* Interaction prompt */}
      {isLocked && hoveredKey && !paused && (
        <div className="absolute left-1/2 top-[58%] -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-sm tracking-wide text-white/90 backdrop-blur-sm">
          {hoveredKind === "collectible" ? "Click to collect" : "Click to view"}
        </div>
      )}

      {/* Room name toast */}
      {roomToast && (
        <div className="absolute left-1/2 top-10 -translate-x-1/2 animate-[fadeIn_0.4s_ease] rounded-sm bg-black/40 px-6 py-2 text-center backdrop-blur-sm">
          <p className="font-serif text-xl tracking-[0.15em] text-amber-100">{roomToast}</p>
        </div>
      )}

      {/* Click-to-look hint */}
      {!isLocked && !paused && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-black/55 px-6 py-3 text-center text-white/90 backdrop-blur-sm">
          <p className="font-medium">Click to look around</p>
          <p className="mt-1 text-xs text-white/60">WASD to walk · Mouse to look · Click a photo or heart to open it</p>
        </div>
      )}

      {/* Hearts found counter */}
      {totalHearts > 0 && (
        <div className="pointer-events-none absolute right-5 top-5 rounded-full bg-black/40 px-3 py-1.5 text-xs text-amber-100/90 backdrop-blur-sm">
          💛 {collectedCount} / {totalHearts}
        </div>
      )}

      {/* Music + world toggles */}
      <div className="pointer-events-auto absolute bottom-5 right-5 flex gap-2">
        <button
          onClick={changeWorld}
          className="rounded-full bg-black/40 px-3 py-2 text-xs text-white/80 backdrop-blur-sm transition hover:bg-black/60"
        >
          🌙 Change World
        </button>
        <button
          onClick={toggleMusic}
          className="rounded-full bg-black/40 px-3 py-2 text-xs text-white/80 backdrop-blur-sm transition hover:bg-black/60"
          aria-label="Toggle music"
        >
          {musicOn ? "♪ Music On" : "♪ Music Off"}
        </button>
      </div>
    </div>
  );
}
