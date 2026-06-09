/* ----------------------------------------------------------------------
   PowerUp.ts — a collectible power-up token on the board.

   A token sits at a position with a glowing, pulsing icon. The ball
   "collects" it by overlapping it (handled in Game). Each token has a
   limited life and fades out if not grabbed in time.

   Two kinds:
   • "multiball" — cyan, drawn with three dots (more balls).
   • "slowmo"    — lime, drawn as a little clock.
---------------------------------------------------------------------- */

import { Vector2 } from "../physics/Vector2.ts";
import { COLORS, POWERUP } from "../config/settings.ts";

export type PowerUpType = "multiball" | "slowmo";

export class PowerUp {
  /** False once collected — stops it being collected twice / drawn. */
  active = true;
  /** Seconds of life left before it fades and despawns. */
  life = POWERUP.tokenLife;
  /** Animation phase for the pulse, randomized so tokens aren't in sync. */
  private phase = Math.random() * Math.PI * 2;

  constructor(
    public type: PowerUpType,
    public pos: Vector2,
    public radius: number = POWERUP.tokenRadius,
  ) {}

  /** Still on the board (not collected, still has life)? */
  get alive(): boolean {
    return this.active && this.life > 0;
  }

  /** Cyan for multiball, lime for slow motion. */
  get color(): string {
    return this.type === "multiball" ? COLORS.cyan : COLORS.lime;
  }

  update(dt: number): void {
    this.life -= dt;
    this.phase += dt * 4;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const pulse = 1 + Math.sin(this.phase) * 0.14;
    const r = this.radius * pulse;
    const fade = Math.min(1, this.life); // fade out in the final second

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 16;
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = 3;

    // Outer pulsing ring.
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, r, 0, Math.PI * 2);
    ctx.stroke();

    if (this.type === "multiball") {
      // Three little balls.
      for (const [dx, dy] of [
        [-4, -3],
        [4, -3],
        [0, 4],
      ]) {
        ctx.beginPath();
        ctx.arc(this.pos.x + dx, this.pos.y + dy, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // A small clock: inner circle + two hands.
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, r * 0.45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.pos.x, this.pos.y);
      ctx.lineTo(this.pos.x, this.pos.y - r * 0.35);
      ctx.moveTo(this.pos.x, this.pos.y);
      ctx.lineTo(this.pos.x + r * 0.26, this.pos.y);
      ctx.stroke();
    }

    ctx.restore();
  }
}
