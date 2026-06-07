/* ----------------------------------------------------------------------
   Wall.ts — a straight wall segment the ball can bounce off.

   A wall is just two points (a → b). The collision math in collisions.ts
   treats it as a line segment. Visually it's drawn as a glowing neon tube.
---------------------------------------------------------------------- */

import { Vector2 } from "../physics/Vector2.ts";
import { COLORS } from "../config/settings.ts";

export class Wall {
  constructor(
    public a: Vector2,
    public b: Vector2,
    /** Neon color of the wall (defaults to cyan). */
    public color: string = COLORS.cyan,
  ) {}

  /** Draw the wall as a glowing tube: a thick faint stroke under a
   *  thin bright one. This two-pass trick is what makes it look "neon". */
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.lineCap = "round";
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 16;

    // Pass 1: wide, semi-transparent glow.
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 8;
    this.stroke(ctx);

    // Pass 2: thin, solid bright core.
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    this.stroke(ctx);

    ctx.restore();
  }

  private stroke(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(this.a.x, this.a.y);
    ctx.lineTo(this.b.x, this.b.y);
    ctx.stroke();
  }
}
