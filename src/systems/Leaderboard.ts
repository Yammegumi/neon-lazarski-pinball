/* ----------------------------------------------------------------------
   Leaderboard.ts — a local top-5 high-score table, saved in LocalStorage.

   Each entry is a 3-letter name (arcade style) and a score. When a game
   ends with a qualifying score, the player is asked for their initials and
   the entry is inserted in sorted order.
---------------------------------------------------------------------- */

export interface ScoreEntry {
  name: string;
  score: number;
}

const KEY = "neon-pinball-leaderboard";
const SIZE = 5; // keep the top 5

export class Leaderboard {
  entries: ScoreEntry[];

  constructor() {
    this.entries = this.load();
  }

  /** Would this score make it onto the board? */
  qualifies(score: number): boolean {
    if (score <= 0) return false;
    if (this.entries.length < SIZE) return true;
    return score > this.entries[this.entries.length - 1].score;
  }

  /** Add a score, keep the list sorted + trimmed, and persist. */
  add(name: string, score: number): void {
    // Sanitize to 1–3 uppercase letters; default if empty.
    const clean = (name || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "AAA";
    this.entries.push({ name: clean, score });
    this.entries.sort((a, b) => b.score - a.score);
    this.entries = this.entries.slice(0, SIZE);
    this.save();
  }

  private load(): ScoreEntry[] {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((e) => typeof e?.name === "string" && typeof e?.score === "number")
        .slice(0, SIZE);
    } catch {
      return [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.entries));
    } catch {
      // Storage unavailable — leaderboard just won't persist.
    }
  }
}
