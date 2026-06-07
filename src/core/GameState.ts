/* ----------------------------------------------------------------------
   GameState.ts — the four screens/modes the game can be in.

   A "state machine" just means the game is always in exactly ONE of these
   states, and input does different things depending on which. Keeping the
   states in one named object (instead of loose strings) prevents typos.
---------------------------------------------------------------------- */

export const GameState = {
  Start: "start", // title screen, waiting to begin
  Playing: "playing", // ball in play, physics running
  Paused: "paused", // frozen, overlay shown
  GameOver: "gameover", // out of lives, showing final score
} as const;

/** The type "one of the GameState values" (e.g. "playing"). */
export type GameState = (typeof GameState)[keyof typeof GameState];
