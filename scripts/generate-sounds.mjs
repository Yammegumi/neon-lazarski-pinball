/* ----------------------------------------------------------------------
   generate-sounds.mjs — creates the game's sound-effect .wav files.

   Run with:  node scripts/generate-sounds.mjs
   Output goes to public/sounds/ (served by Vite, bundled on build).

   These are simple synthesized blips (royalty-free / CC0). To use richer
   audio instead, replace the files in public/sounds/ with CC0 samples of
   the SAME filename (e.g. from kenney.nl) — no code changes needed.
---------------------------------------------------------------------- */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RATE = 44100;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sounds");

// --- Tiny synthesis helpers ------------------------------------------

/** A waveform sample for a given phase (radians). */
function osc(type, phase) {
  switch (type) {
    case "square":
      return Math.sin(phase) >= 0 ? 1 : -1;
    case "saw":
      return ((phase / Math.PI) % 2) - 1;
    case "triangle":
      return Math.asin(Math.sin(phase)) * (2 / Math.PI);
    default:
      return Math.sin(phase); // sine
  }
}

/**
 * Generate a tone with an attack + exponential decay envelope. Supports a
 * linear pitch glide from `freq` to `freqEnd` (for sweeps / boings).
 */
function tone({ freq, freqEnd = freq, dur, type = "sine", vol = 0.5, attack = 0.005 }) {
  const n = Math.floor(RATE * dur);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    const f = freq + (freqEnd - freq) * p;
    phase += (2 * Math.PI * f) / RATE;
    const env = Math.min(i / RATE / attack, 1) * Math.pow(1 - p, 2);
    out[i] = osc(type, phase) * env * vol;
  }
  return out;
}

/** A short burst of filtered noise (for snaps / impacts). */
function noise({ dur, vol = 0.3 }) {
  const n = Math.floor(RATE * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = i / n;
    out[i] = (Math.random() * 2 - 1) * Math.pow(1 - p, 3) * vol;
  }
  return out;
}

/** Play sounds one after another. */
function sequence(...parts) {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Float32Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** Mix sounds on top of each other (same start time). */
function mix(...parts) {
  const total = Math.max(...parts.map((p) => p.length));
  const out = new Float32Array(total);
  for (const p of parts) for (let i = 0; i < p.length; i++) out[i] += p[i];
  return out;
}

/** Encode float samples (-1..1) to a 16-bit mono WAV buffer. */
function encodeWav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 0x7fff), 44 + i * 2);
  }
  return buf;
}

// --- The sound set ----------------------------------------------------
const sounds = {
  // Soft "tok" when the ball hits a wall.
  bounce: tone({ freq: 200, freqEnd: 150, dur: 0.07, type: "sine", vol: 0.35 }),
  // Bumper "boing": a quick downward pitch pop.
  bumper: tone({ freq: 540, freqEnd: 360, dur: 0.13, type: "triangle", vol: 0.45 }),
  // Drop-target blip.
  target: tone({ freq: 760, freqEnd: 900, dur: 0.08, type: "square", vol: 0.3 }),
  // Slingshot snap: noise + a short tone.
  slingshot: mix(
    noise({ dur: 0.06, vol: 0.35 }),
    tone({ freq: 320, dur: 0.08, type: "triangle", vol: 0.3 }),
  ),
  // Coin-like score chime (two rising notes).
  score: sequence(
    tone({ freq: 880, dur: 0.07, type: "square", vol: 0.3 }),
    tone({ freq: 1320, dur: 0.1, type: "square", vol: 0.3 }),
  ),
  // Sad descending tone when a life is lost.
  lifeLost: tone({ freq: 440, freqEnd: 150, dur: 0.4, type: "triangle", vol: 0.4 }),
  // Rising sweep at game start.
  gameStart: tone({ freq: 220, freqEnd: 660, dur: 0.3, type: "sawtooth", vol: 0.35 }),
  // Descending arpeggio at game over.
  gameOver: sequence(
    tone({ freq: 440, dur: 0.16, type: "triangle", vol: 0.4 }),
    tone({ freq: 330, dur: 0.16, type: "triangle", vol: 0.4 }),
    tone({ freq: 220, dur: 0.28, type: "triangle", vol: 0.4 }),
  ),
  // Soft UI click for pause.
  pause: tone({ freq: 600, dur: 0.05, type: "sine", vol: 0.25 }),
};

// --- Write the files --------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });
for (const [name, samples] of Object.entries(sounds)) {
  const file = join(OUT_DIR, `${name}.wav`);
  writeFileSync(file, encodeWav(samples));
  console.log(`wrote ${file} (${(samples.length / RATE).toFixed(2)}s)`);
}
console.log("Done — generated", Object.keys(sounds).length, "sounds.");
