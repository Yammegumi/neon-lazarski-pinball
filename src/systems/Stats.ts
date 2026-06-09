/* ----------------------------------------------------------------------
   Stats.ts — lifetime player statistics, saved in LocalStorage.

   These accumulate across every game ever played on this browser:
   games played, total points scored, best combo reached, and how many
   bumpers / targets have been hit. Shown on the title screen.
---------------------------------------------------------------------- */

export interface PlayerStats {
  gamesPlayed: number;
  totalScore: number; // sum of every game's score
  bestCombo: number; // highest multiplier ever reached
  bumperHits: number;
  targetsHit: number;
}

const KEY = "neon-pinball-stats";

const DEFAULTS: PlayerStats = {
  gamesPlayed: 0,
  totalScore: 0,
  bestCombo: 0,
  bumperHits: 0,
  targetsHit: 0,
};

export class StatsSystem {
  stats: PlayerStats;

  constructor() {
    this.stats = this.load();
  }

  /** Counters that change during play (kept in memory, saved at game end). */
  recordBumperHit(): void {
    this.stats.bumperHits++;
  }
  recordTargetHit(): void {
    this.stats.targetsHit++;
  }
  recordCombo(multiplier: number): void {
    if (multiplier > this.stats.bestCombo) this.stats.bestCombo = multiplier;
  }

  /** Called when a game ends: bump games + total score, then persist. */
  recordGameEnd(score: number): void {
    this.stats.gamesPlayed++;
    this.stats.totalScore += score;
    this.save();
  }

  private load(): PlayerStats {
    try {
      const raw = localStorage.getItem(KEY);
      // Merge with DEFAULTS so older saves missing a field still work.
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    } catch {
      return { ...DEFAULTS };
    }
  }

  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.stats));
    } catch {
      // Storage unavailable — stats just won't persist.
    }
  }
}
