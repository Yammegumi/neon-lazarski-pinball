/* ----------------------------------------------------------------------
   ScoreSystem.ts — keeps the running score and the combo multiplier.

   COMBO: each hit within a short time window raises the multiplier, so
   fast chains of hits are worth far more. If you go too long without a
   hit, the combo resets. Points awarded = base points × current multiplier.
---------------------------------------------------------------------- */

import { COMBO } from "../config/settings.ts";

export class ScoreSystem {
  /** Current score for this game. */
  value = 0;

  /** How many hits are in the current chain (0 = no active combo). */
  combo = 0;
  /** Seconds left before the combo expires. */
  private comboTimer = 0;
  /** Points awarded by the most recent hit (for floating-text effects). */
  lastGain = 0;

  /** Current score multiplier (x1 up to the configured maximum). */
  get multiplier(): number {
    return Math.min(Math.max(this.combo, 1), COMBO.maxMultiplier);
  }

  /** 0–1 fraction of the combo window remaining (for the HUD timer bar). */
  get comboFraction(): number {
    return COMBO.window > 0 ? this.comboTimer / COMBO.window : 0;
  }

  /** Register a scoring hit: bump the combo, award base × multiplier. */
  registerHit(basePoints: number): number {
    this.combo++;
    this.comboTimer = COMBO.window;
    const gained = basePoints * this.multiplier;
    this.value += gained;
    this.lastGain = gained;
    return gained;
  }

  /** Tick the combo timer; reset the combo if the window runs out. */
  update(dt: number): void {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
  }

  /** Back to zero — called when a new game starts. */
  reset(): void {
    this.value = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.lastGain = 0;
  }
}
