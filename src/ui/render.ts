/* ----------------------------------------------------------------------
   render.ts — neon drawing helpers.

   This file holds reusable Canvas drawing functions. In Stage 0 it draws
   the background (gradient + grid + scanlines) and a small FPS counter so
   we can confirm the loop is alive. Later stages add glow helpers used by
   the ball, flippers, bumpers, etc.

   The "neon" look comes from two tricks:
     1. ctx.shadowBlur + shadowColor  → soft glow around strokes.
     2. drawing a thick faint stroke under a thin bright one → tube light.
---------------------------------------------------------------------- */

import { BOARD, COLORS, GRID } from "../config/settings.ts";

/** Fill the board with the dark synthwave gradient. */
export function drawBackground(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, BOARD.height);
  gradient.addColorStop(0, COLORS.bgTop);
  gradient.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, BOARD.width, BOARD.height);
}

/** Faint grid of glowing lines — the classic arcade backdrop. */
export function drawGrid(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = GRID.lineWidth;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 4;
  ctx.globalAlpha = 0.5;

  ctx.beginPath();
  for (let x = 0; x <= BOARD.width; x += GRID.spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, BOARD.height);
  }
  for (let y = 0; y <= BOARD.height; y += GRID.spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(BOARD.width, y);
  }
  ctx.stroke();
  ctx.restore();
}

/** Subtle horizontal scanlines for a CRT-arcade feel. */
export function drawScanlines(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = "#000000";
  for (let y = 0; y < BOARD.height; y += 3) {
    ctx.fillRect(0, y, BOARD.width, 1);
  }
  ctx.restore();
}

/** Score read-out (top-right). A full HUD comes in Stage 4; this is the
 *  minimal version so we can watch points climb in Stage 3. */
export function drawScore(ctx: CanvasRenderingContext2D, score: number): void {
  ctx.save();
  ctx.fillStyle = COLORS.text;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 10;
  ctx.font = "700 26px Orbitron, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(score.toLocaleString(), BOARD.width - 16, 34);
  ctx.restore();
}

/** Remaining lives, drawn as small glowing balls in the top-left HUD. */
export function drawLives(ctx: CanvasRenderingContext2D, count: number): void {
  ctx.save();
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 10;
  ctx.fillStyle = COLORS.cyan;
  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    ctx.arc(22 + i * 26, 26, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
