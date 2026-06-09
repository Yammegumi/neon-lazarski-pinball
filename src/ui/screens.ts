/* ----------------------------------------------------------------------
   screens.ts — shows/hides the HTML overlay screens and fills in their
   dynamic content (best score, leaderboard, stats, name entry).

   The game logic stays in TypeScript; this file is the thin bridge to the
   DOM. syncScreens() is called every frame with a snapshot of game state.
---------------------------------------------------------------------- */

import { GameState } from "../core/GameState.ts";
import type { ScoreEntry } from "../systems/Leaderboard.ts";
import type { PlayerStats } from "../systems/Stats.ts";

/** Everything the overlays need to render (from Game.getView()). */
export interface ScreenView {
  state: GameState;
  score: number;
  best: number;
  isNewBest: boolean;
  awaitingName: boolean;
  leaderboard: ScoreEntry[];
  stats: PlayerStats;
}

// Grab the overlay elements once.
const startScreen = document.getElementById("screen-start")!;
const pauseScreen = document.getElementById("screen-pause")!;
const gameOverScreen = document.getElementById("screen-gameover")!;
const finalScoreEl = document.getElementById("final-score")!;
const bestStartEl = document.getElementById("best-start")!;
const newBestEl = document.getElementById("new-best")!;
const leaderboardStartEl = document.getElementById("leaderboard-start")!;
const leaderboardOverEl = document.getElementById("leaderboard-over")!;
const statsStartEl = document.getElementById("stats-start")!;
const nameEntryEl = document.getElementById("name-entry")!;
const gameOverPromptEl = document.getElementById("gameover-prompt")!;
const nameInputEl = document.getElementById("name-input") as HTMLInputElement;

/** Show `el` only when `show` is true (toggles the .hidden CSS class). */
function toggle(el: HTMLElement, show: boolean): void {
  el.classList.toggle("hidden", !show);
}

/** Fill a <ol> with leaderboard rows (or an empty-state message). */
function renderLeaderboard(el: HTMLElement, entries: ScoreEntry[]): void {
  if (entries.length === 0) {
    el.innerHTML = `<li class="empty">No scores yet — be the first!</li>`;
    return;
  }
  el.innerHTML = entries
    .map(
      (e, i) =>
        `<li><span class="rank">${i + 1}</span><span class="nm">${e.name}</span>` +
        `<span class="sc">${e.score.toLocaleString()}</span></li>`,
    )
    .join("");
}

// Track the name-entry visibility so we focus the input only on the
// rising edge (when it first appears), not every frame.
let wasAwaitingName = false;

/** Make the overlays match the current game state. Safe to call each frame. */
export function syncScreens(view: ScreenView): void {
  toggle(startScreen, view.state === GameState.Start);
  toggle(pauseScreen, view.state === GameState.Paused);
  const gameOver = view.state === GameState.GameOver;
  toggle(gameOverScreen, gameOver);

  // Best-score read-out on the title screen (the leaderboard shows the
  // top scores on the Game Over screen).
  bestStartEl.textContent = view.best.toLocaleString();

  // Leaderboard + lifetime stats on the title screen.
  renderLeaderboard(leaderboardStartEl, view.leaderboard);
  const s = view.stats;
  statsStartEl.textContent =
    `Games ${s.gamesPlayed} · Total ${s.totalScore.toLocaleString()} · ` +
    `Best combo ×${s.bestCombo} · Bumpers ${s.bumperHits}`;

  if (gameOver) {
    finalScoreEl.textContent = view.score.toLocaleString();
    toggle(newBestEl, view.isNewBest);
    renderLeaderboard(leaderboardOverEl, view.leaderboard);

    // Name entry replaces the restart prompt while awaiting initials.
    toggle(nameEntryEl, view.awaitingName);
    toggle(gameOverPromptEl, !view.awaitingName);
    if (view.awaitingName && !wasAwaitingName) {
      nameInputEl.value = "";
      nameInputEl.focus();
    }
  }
  wasAwaitingName = view.awaitingName;
}
