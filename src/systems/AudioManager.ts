/* ----------------------------------------------------------------------
   AudioManager.ts — loads and plays sound effects.

   Uses the Web Audio API (not <audio> tags) because pinball fires many
   short, overlapping sounds — Web Audio can play the same buffer many
   times at once with no lag.

   Browser rule: audio can't start until the user interacts with the page.
   So the AudioContext begins "suspended" and we call unlock() on the first
   key press / click to resume it. play() simply does nothing until then.
---------------------------------------------------------------------- */

/** Names of every sound — keeps play() calls type-checked (no typos). */
export type SoundName =
  | "bounce"
  | "bumper"
  | "target"
  | "slingshot"
  | "score"
  | "lifeLost"
  | "gameStart"
  | "gameOver"
  | "pause";

export class AudioManager {
  private ctx: AudioContext;
  private master: GainNode;
  private buffers = new Map<SoundName, AudioBuffer>();

  constructor(volume = 0.6) {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = volume;
    this.master.connect(this.ctx.destination);
  }

  /** Fetch + decode every sound. Files live in public/sounds/<name>.wav.
   *  Missing or undecodable files are skipped (the game still runs silent). */
  async loadAll(names: SoundName[]): Promise<void> {
    const base = import.meta.env.BASE_URL; // handles the GitHub Pages subpath
    await Promise.all(
      names.map(async (name) => {
        try {
          const res = await fetch(`${base}sounds/${name}.wav`);
          const data = await res.arrayBuffer();
          this.buffers.set(name, await this.ctx.decodeAudioData(data));
        } catch {
          // Ignore — that sound just won't play.
        }
      }),
    );
  }

  /** Resume the audio context. Call once, from a user gesture. */
  unlock(): void {
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  /** Play a loaded sound. No-op if audio is still locked or not loaded. */
  play(name: SoundName, volume = 1): void {
    const buffer = this.buffers.get(name);
    if (!buffer || this.ctx.state !== "running") return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.master);
    source.start();
  }
}
