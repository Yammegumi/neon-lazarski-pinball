/* ----------------------------------------------------------------------
   LivesSystem.ts — tracks how many balls the player has left.

   Lose a life each time the ball drains. When none remain, the game ends.
---------------------------------------------------------------------- */

import { GAME } from "../config/settings.ts";

export class LivesSystem {
  /** Lives remaining right now. */
  count: number;

  constructor(public max: number = GAME.startingLives) {
    this.count = max;
  }

  /** Refill to the maximum — called when a new game starts. */
  reset(): void {
    this.count = this.max;
  }

  /** Lose one life (never goes below zero). */
  lose(): void {
    this.count = Math.max(0, this.count - 1);
  }

  /** True when the player has run out of lives. */
  get isEmpty(): boolean {
    return this.count <= 0;
  }
}
