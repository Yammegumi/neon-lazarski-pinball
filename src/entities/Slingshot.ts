/* ----------------------------------------------------------------------
   Slingshot.ts — an angled kicker beside a flipper.

   A slingshot is a segment (a → b). When the ball hits it, it bounces
   off WITH a boost (handled in collisions.ts), so the ball is flung back
   into play and scores a few points. Like the bumper, it flashes and has
   a short cooldown to avoid double-scoring.
---------------------------------------------------------------------- */

import { Vector2 } from "../physics/Vector2.ts";
import { SLINGSHOT, COLORS } from "../config/settings.ts";

export class Slingshot {
  flash = 0;
  cooldown = 0;

  constructor(
    public a: Vector2,
    public b: Vector2,
    public points: number = SLINGSHOT.points,
    public color: string = COLORS.magenta,
  ) {}

  update(dt: number): void {
    this.flash = Math.max(0, this.flash - dt * 4);
    this.cooldown = Math.max(0, this.cooldown - dt);
  }

  hit(): void {
    this.flash = 1;
    this.cooldown = SLINGSHOT.cooldown;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.lineCap = "round";
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 14 + this.flash * 24;

    // Glow pass.
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = 0.4 + this.flash * 0.4;
    ctx.lineWidth = SLINGSHOT.thickness * 2 + 6;
    this.stroke(ctx);

    // Bright core (whitens on hit).
    ctx.globalAlpha = 1;
    ctx.lineWidth = SLINGSHOT.thickness * 2;
    ctx.strokeStyle = this.flash > 0 ? "#ffffff" : this.color;
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
