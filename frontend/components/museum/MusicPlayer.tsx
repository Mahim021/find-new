"use client";

import { useEffect, useRef, useState } from "react";
import { useMuseumStore } from "@/lib/store";
import { registerRealAudioElement } from "@/lib/music";
import { startAmbientAudio, stopAmbientAudio } from "@/lib/ambient-audio";

/**
 * Prefers a real music file at /audio/ambient.mp3 if present (drop one in to
 * upgrade the experience); otherwise falls back to a soft procedural pad so
 * the museum always has some ambience.
 */
export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [fileAvailable, setFileAvailable] = useState<boolean | null>(null);
  const hasEntered = useMuseumStore((s) => s.hasEntered);
  const musicOn = useMuseumStore((s) => s.musicOn);

  useEffect(() => {
    registerRealAudioElement(audioRef.current);
    fetch("/audio/ambient.mp3", { method: "HEAD" })
      .then((res) => setFileAvailable(res.ok))
      .catch(() => setFileAvailable(false));
    return () => registerRealAudioElement(null);
  }, []);

  useEffect(() => {
    if (!hasEntered || fileAvailable === null) return;

    if (fileAvailable) {
      const el = audioRef.current;
      if (!el) return;
      el.volume = 0.35;
      if (musicOn) el.play().catch(() => {});
      else el.pause();
    } else {
      if (musicOn) startAmbientAudio();
      else stopAmbientAudio();
    }
  }, [hasEntered, musicOn, fileAvailable]);

  return <audio ref={audioRef} src="/audio/ambient.mp3" loop onError={() => setFileAvailable(false)} className="hidden" />;
}
