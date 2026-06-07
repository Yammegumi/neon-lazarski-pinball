/* ----------------------------------------------------------------------
   settings.ts — all tunable values live in ONE place.
   Gameplay designers (you!) tweak numbers here without hunting through
   the codebase. Stage 0 only needs the canvas size and colors; physics
   and scoring values get added in later stages.
---------------------------------------------------------------------- */

/** Internal resolution of the game board, in logical pixels.
 *  Tall portrait shape, like a real pinball cabinet (9:16). */
export const BOARD = {
  width: 540,
  height: 960,
} as const;

/** Neon color palette used by the canvas renderer. */
export const COLORS = {
  bgTop: "#0a0a1a",
  bgBottom: "#1a0a2e",
  grid: "#2a2a4a",
  cyan: "#00f0ff",
  magenta: "#ff2bd6",
  lime: "#39ff14",
  amber: "#ffb000",
  danger: "#ff0040",
  text: "#e8f8ff",
} as const;

/** Visual settings for the background grid. */
export const GRID = {
  spacing: 45, // distance between grid lines (logical px)
  lineWidth: 1,
} as const;

/** Physics tuning. Units are logical pixels and seconds.
 *  These are the dials you turn to make the ball "feel" right. */
export const PHYSICS = {
  /** Downward acceleration (px per second²). Higher = ball falls faster. */
  gravity: 1400,
  /** Bounciness: fraction of speed kept after a bounce (0–1).
   *  1 = perfectly bouncy forever, 0 = sticks to the wall. */
  restitution: 0.85,
  /** Speed cap (px/s) so the ball can never tunnel through thin walls. */
  maxSpeed: 1700,
  /** Max distance (px) the ball may move per collision sub-step. Smaller
   *  than the ball radius so a fast ball can't skip past a wall in one move. */
  maxSubStep: 5,
} as const;

/** Ball appearance + size. */
export const BALL = {
  radius: 11,
  /** How many past positions to keep for the motion trail. */
  trailLength: 14,
} as const;

/** Visual "juice" — small effects that make hits feel good. */
export const EFFECTS = {
  shakeOnBumper: 5, // screen-shake added when a bumper is hit (px)
  shakeMax: 11, // cap so rapid hits don't go wild
  shakeDecay: 45, // how fast the shake settles (px per second)
} as const;

/** Flipper geometry + feel. Angles are in radians (canvas Y points DOWN,
 *  so a positive angle tips the flipper downward on screen). */
export const FLIPPER = {
  length: 92, // pivot → tip distance (px)
  thickness: 7, // half-width of the bar for collision + drawing (px)
  /** How fast the flipper swings between rest and active (radians/sec).
   *  High = snappy, real-pinball response. */
  flipSpeed: 28,
} as const;

/** Round bumpers — the classic pinball "pop" that flings the ball away. */
export const BUMPER = {
  radius: 26,
  boost: 330, // extra outward speed added on hit (px/s) — the "pop"
  points: 100,
  cooldown: 0.1, // seconds before it can score again (stops double-counting)
} as const;

/** Small targets that switch off when hit and respawn once all are down. */
export const TARGET = {
  radius: 11,
  points: 50,
} as const;

/** Slingshots — angled kickers beside the flippers that bounce + boost. */
export const SLINGSHOT = {
  thickness: 6,
  boost: 260,
  points: 30,
  cooldown: 0.1,
} as const;

/** Overall game rules. */
export const GAME = {
  startingLives: 3,
} as const;

