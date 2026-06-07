/* ----------------------------------------------------------------------
   ScoreSystem.ts — keeps the running score.

   Tiny on purpose. Keeping the score in its own class (instead of a loose
   variable in main.ts) means later stages can add combos, multipliers, and
   "best score" saving here without touching the rest of the game.
---------------------------------------------------------------------- */

export class ScoreSystem {
  /** Current score for this game. */
  value = 0;

  /** Add points (e.g. from a bumper or target). */
  add(points: number): void {
    this.value += points;
  }

  /** Back to zero — called when a new game starts. */
  reset(): void {
    this.value = 0;
  }
}
