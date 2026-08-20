"use client";

// Tiny procedural ambience: a few soft, detuned sine pads with a slow LFO on
// gain, used when no real music file is present at /public/audio/ambient.mp3.
// This keeps the museum feeling alive without requiring an audio asset.
// Must be created/resumed from within a user-gesture call stack (browser
// autoplay policy), so `init()` is called synchronously from the "Enter the
// Museum" button's onClick.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let started = false;

const PAD_FREQS = [130.81, 164.81, 196.0, 261.63]; // soft C major-ish pad

export function initAmbientAudio() {
  if (ctx) return;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  ctx = new AudioCtx();

  masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(ctx.destination);

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.06;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.015;
  lfo.connect(lfoGain);
  lfoGain.connect(masterGain.gain);
  lfo.start();

  PAD_FREQS.forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.detune.value = (i % 2 === 0 ? 1 : -1) * 4;
    const gain = ctx!.createGain();
    gain.gain.value = 0.045 / (i + 1);
    osc.connect(gain);
    gain.connect(masterGain!);
    osc.start();
  });
}

export function startAmbientAudio() {
  if (!ctx || !masterGain) return;
  if (ctx.state === "suspended") ctx.resume();
  started = true;
  masterGain.gain.cancelScheduledValues(ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2);
}

export function stopAmbientAudio() {
  if (!ctx || !masterGain) return;
  started = false;
  masterGain.gain.cancelScheduledValues(ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
}

export function isAmbientStarted() {
  return started;
}
