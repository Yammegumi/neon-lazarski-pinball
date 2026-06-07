/* ----------------------------------------------------------------------
   Flipper.ts — a rotating flipper bar.

   A flipper pivots around a fixed point. When its key is held it swings
   from `restAngle` to `activeAngle`; when released it springs back. We
   track the angular velocity (how fast it's rotating) because a moving
   flipper should KICK the ball — that's what launches it back up the board.

   Geometry: the bar is the segment from `pivot` to `tip()`, where
     tip = pivot + length * (cos angle, sin angle).
---------------------------------------------------------------------- */

import { Vector2 } from "../physics/Vector2.ts";
import { FLIPPER, COLORS } from "../config/settings.ts";

export class Flipper {
  /** Current angle (radians). Starts at rest. */
  private angle: number;
  /** Rotation speed this step (radians/sec) — drives the kick. */
  angularVelocity = 0;

  constructor(
    public pivot: Vector2,
    public restAngle: number,
    public activeAngle: number,
    public color: string = COLORS.magenta,
  ) {
    this.angle = restAngle;
  }

  /** The far end of the flipper, based on its current angle. */
  tip(): Vector2 {
    return this.pivot.add(
      new Vector2(Math.cos(this.angle), Math.sin(this.angle)).scale(FLIPPER.length),
    );
  }

  /** Collision half-thickness (so the ball bounces off the bar, not a line). */
  get thickness(): number {
    return FLIPPER.thickness;
  }

  /**
   * Swing toward the target angle (active if pressed, else rest).
   * We move at a fixed flipSpeed and never overshoot the target, then
   * record how far we actually turned as the angular velocity.
   */
  update(dt: number, pressed: boolean): void {
    const target = pressed ? this.activeAngle : this.restAngle;
    const previous = this.angle;

    const maxStep = FLIPPER.flipSpeed * dt; // furthest we may turn this step
    const diff = target - this.angle;

    if (Math.abs(diff) <= maxStep) {
      this.angle = target; // close enough — snap to target
    } else {
      this.angle += Math.sign(diff) * maxStep;
    }

    this.angularVelocity = (this.angle - previous) / dt;
  }

  /** Draw the flipper as a glowing rounded neon bar with a pivot knob. */
  render(ctx: CanvasRenderingContext2D): void {
    const tip = this.tip();
    ctx.save();
    ctx.lineCap = "round";
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 16;

    // Glow pass (wide, faint).
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = FLIPPER.thickness * 2 + 6;
    this.strokeBar(ctx, tip);

    // Core pass (bright).
    ctx.globalAlpha = 1;
    ctx.lineWidth = FLIPPER.thickness * 2;
    ctx.strokeStyle = "#ffffff";
    this.strokeBar(ctx, tip);

    // Pivot knob.
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.pivot.x, this.pivot.y, FLIPPER.thickness + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private strokeBar(ctx: CanvasRenderingContext2D, tip: Vector2): void {
    ctx.beginPath();
    ctx.moveTo(this.pivot.x, this.pivot.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
  }
}
