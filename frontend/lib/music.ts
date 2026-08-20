"use client";

import { initAmbientAudio } from "./ambient-audio";

let realAudioEl: HTMLAudioElement | null = null;

export function registerRealAudioElement(el: HTMLAudioElement | null) {
  realAudioEl = el;
}

/** Must be called synchronously from a user-gesture handler (click) to satisfy
 * browser autoplay policy — primes both the real <audio> element (if a real
 * music file exists at /audio/ambient.mp3) and the procedural ambient pad. */
export function primeAudio() {
  initAmbientAudio();
  if (realAudioEl) {
    realAudioEl.play().catch(() => {});
  }
}
