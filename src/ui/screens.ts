/* ----------------------------------------------------------------------
   screens.ts — shows/hides the HTML overlay screens.

   The game logic stays in TypeScript; this file is the thin bridge that
   makes the matching <section> visible for the current game state and
   fills in the final score on the Game Over screen.
---------------------------------------------------------------------- */

import { GameState } from "../core/GameState.ts";

// Grab the overlay elements once.
const startScreen = document.getElementById("screen-start")!;
const pauseScreen = document.getElementById("screen-pause")!;
const gameOverScreen = document.getElementById("screen-gameover")!;
const finalScoreEl = document.getElementById("final-score")!;
const bestStartEl = document.getElementById("best-start")!;
const bestOverEl = document.getElementById("best-over")!;
const newBestEl = document.getElementById("new-best")!;

/** Show `el` only when `show` is true (toggles the .hidden CSS class). */
function toggle(el: HTMLElement, show: boolean): void {
  el.classList.toggle("hidden", !show);
}

/**
 * Make the overlays match the current game state. Safe to call every frame
 * (toggling a class is cheap and idempotent). During Playing, all overlays
 * are hidden so you see the board.
 */
export function syncScreens(
  state: GameState,
  finalScore: number,
  best: number,
  isNewBest: boolean,
): void {
  toggle(startScreen, state === GameState.Start);
  toggle(pauseScreen, state === GameState.Paused);

  const gameOver = state === GameState.GameOver;
  toggle(gameOverScreen, gameOver);

  // Keep the best-score read-outs current.
  bestStartEl.textContent = best.toLocaleString();
  bestOverEl.textContent = best.toLocaleString();

  if (gameOver) {
    finalScoreEl.textContent = finalScore.toLocaleString();
    toggle(newBestEl, isNewBest); // celebrate a new record
  }
}
