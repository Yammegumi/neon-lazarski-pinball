/* ----------------------------------------------------------------------
   Storage.ts — saves the best score in the browser's LocalStorage.

   LocalStorage persists across page reloads and browser restarts, so the
   high score survives. We wrap it in try/catch because some browsers
   (e.g. private mode) can throw when storage is unavailable.
---------------------------------------------------------------------- */

const BEST_SCORE_KEY = "neon-pinball-best-score";

/** Read the saved best score (0 if none saved or storage unavailable). */
export function loadBestScore(): number {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    const value = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

/** Save a new best score. Silently ignores storage errors. */
export function saveBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // Storage unavailable — best score just won't persist this session.
  }
}
