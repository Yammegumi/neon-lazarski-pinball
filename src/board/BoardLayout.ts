/* ----------------------------------------------------------------------
   BoardLayout.ts — the data format for an editable board.

   The board's WALLS, BUMPERS and TARGETS are described here as plain data
   (coordinates), so they can be designed in the standalone editor
   (tools/board-editor.html), exported to public/boards/board.json, and
   loaded by the game. Flippers, slingshots and power-up spawns stay fixed
   in Game.ts for now.

   Coordinates are in the same 720×1100 logical space as the game.
---------------------------------------------------------------------- */

export interface WallData {
  a: [number, number];
  b: [number, number];
}
export interface PointData {
  pos: [number, number];
}
/** Slingshot: a segment with a "front" direction (the side it bounces). */
export interface SlingshotData {
  a: [number, number];
  b: [number, number];
  front: [number, number];
}
/** Always-on kicker: a position and the direction it fires the ball. */
export interface KickerData {
  pos: [number, number];
  dir: [number, number];
}

export interface BoardLayout {
  version: number;
  walls: WallData[];
  bumpers: PointData[];
  targets: PointData[];
  slingshots?: SlingshotData[];
  kickers?: KickerData[];
}

/** Built-in fallback board (the current "Open Speedway"). Used if
 *  public/boards/board.json is missing or invalid, so the game always runs. */
export const DEFAULT_BOARD: BoardLayout = {
  version: 1,
  walls: [
    { a: [16, 16], b: [704, 16] }, // top
    { a: [16, 16], b: [16, 800] }, // left
    { a: [704, 16], b: [704, 800] }, // right
    { a: [16, 800], b: [250, 958] }, // left funnel
    { a: [704, 800], b: [470, 958] }, // right funnel
  ],
  bumpers: [{ pos: [165, 300] }, { pos: [555, 300] }, { pos: [210, 470] }, { pos: [510, 470] }],
  targets: [{ pos: [140, 160] }, { pos: [215, 160] }, { pos: [505, 160] }, { pos: [580, 160] }],
  slingshots: [
    { a: [85, 715], b: [150, 785], front: [0.73, -0.68] },
    { a: [635, 715], b: [570, 785], front: [-0.73, -0.68] },
  ],
  kickers: [],
};

/** Minimal shape check so a malformed file falls back to the default. */
function isValidLayout(data: unknown): data is BoardLayout {
  const l = data as BoardLayout;
  return (
    !!l &&
    Array.isArray(l.walls) &&
    Array.isArray(l.bumpers) &&
    Array.isArray(l.targets) &&
    l.walls.every((w) => Array.isArray(w.a) && Array.isArray(w.b)) &&
    l.bumpers.every((b) => Array.isArray(b.pos)) &&
    l.targets.every((t) => Array.isArray(t.pos))
  );
}

/** Key under which a custom board (from the editor / drag-drop) is saved. */
export const SAVED_BOARD_KEY = "neon-pinball-board";

/**
 * Load the board, in priority order:
 *   1. a custom board saved in LocalStorage (editor "Save & Play" / drag-drop),
 *   2. public/boards/board.json,
 *   3. the built-in default.
 */
export async function loadBoardLayout(): Promise<BoardLayout> {
  // 1. Custom board the player loaded locally.
  try {
    const saved = localStorage.getItem(SAVED_BOARD_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      if (isValidLayout(data)) return data;
    }
  } catch {
    // ignore and fall through
  }

  // 2. The shipped board file.
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}boards/board.json`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (isValidLayout(data)) return data;
      console.warn("board.json is invalid — using the default board.");
    }
  } catch {
    // No file / network error — fall back silently.
  }

  // 3. Built-in default.
  return DEFAULT_BOARD;
}
