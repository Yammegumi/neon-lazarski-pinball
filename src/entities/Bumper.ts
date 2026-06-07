/* ----------------------------------------------------------------------
   Bumper.ts — a round "pop" bumper.

   When the ball touches a bumper it bounces off AND gets an extra outward
   shove (the boost, handled in collisions.ts), scores points, and the
   bumper flashes briefly. A short cooldown stops one touch from scoring
   many times across sub-steps/frames.
---------------------------------------------------------------------- */

import { Vector2 } from "../physics/Vector2.ts";
import { BUMPER, COLORS } from "../config/settings.ts";

export class Bumper {
  /** Flash brightness 0→1, fades out after a hit (purely visual). */
  flash = 0;
  /** Seconds remaining before this bumper may score again. */
  cooldown = 0;

  constructor(
    public pos: Vector2,
    public radius: number = BUMPER.radius,
    public points: number = BUMPER.points,
    public color: string = COLORS.amber,
  ) {}

  /** Called once per frame to fade the flash and tick down the cooldown. */
  update(dt: number): void {
    this.flash = Math.max(0, this.flash - dt * 4);
    this.cooldown = Math.max(0, this.cooldown - dt);
  }

  /** Register a scoring hit: light up and start the cooldown. */
  hit(): void {
    this.flash = 1;
    this.cooldown = BUMPER.cooldown;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Brighter glow while flashing.
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 18 + this.flash * 26;

    // Outer ring.
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner disc — whitens on impact.
    const g = ctx.createRadialGradient(
      this.pos.x,
      this.pos.y,
      2,
      this.pos.x,
      this.pos.y,
      this.radius,
    );
    const core = this.flash > 0 ? "#ffffff" : this.color;
    g.addColorStop(0, core);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.55 + this.flash * 0.45;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius - 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
