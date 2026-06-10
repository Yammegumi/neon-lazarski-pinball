/* ----------------------------------------------------------------------
   settings.ts — all tunable values live in ONE place.
   Gameplay designers (you!) tweak numbers here without hunting through
   the codebase. Stage 0 only needs the canvas size and colors; physics
   and scoring values get added in later stages.
---------------------------------------------------------------------- */

/** Internal resolution of the game board, in logical pixels.
 *  Tall portrait shape, like a real pinball cabinet. Widened from the
 *  original 540×960 to give room for lanes and open ball travel. */
export const BOARD = {
  width: 720,
  height: 1100,
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

/** Lane kicker — always active. When the ball is over it, it's fired in the
 *  kicker's set direction (the direction is editable per-kicker). */
export const KICKER = {
  radius: 26, // detection zone around the kicker (px)
  kickSpeed: 1350, // how hard it fires the ball
} as const;

/** Combo system: chain hits quickly to raise the score multiplier. */
export const COMBO = {
  /** Seconds after a hit before the combo resets to zero. */
  window: 1.2,
  /** Highest multiplier the combo can reach. */
  maxMultiplier: 5,
} as const;

/** Spark particle effects. */
export const PARTICLES = {
  gravity: 320, // px/s² — sparks fall a little after bursting
  maxCount: 320, // safety cap on total live particles
} as const;

/** Power-ups. They appear as collectible TOKENS on the board — the ball
 *  must hit a token to trigger the effect. */
export const POWERUP = {
  /** Multiball: how many EXTRA balls to add when collected. */
  multiballCount: 2,
  /** Slow motion: time runs at this fraction of normal speed... */
  slowmoFactor: 0.4,
  /** ...for this many (real) seconds. */
  slowmoDuration: 5,

  /** Collectible token appearance + lifetime. */
  tokenRadius: 15,
  tokenLife: 14, // seconds a token stays on the board before fading away
  collectBonus: 100, // points for grabbing a token

  /** A slow-mo token first appears after this long, then every interval. */
  slowmoFirstSpawn: 7,
  slowmoSpawnInterval: 13,
} as const;

