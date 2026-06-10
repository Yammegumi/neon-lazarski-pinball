/* ----------------------------------------------------------------------
   LaneKicker.ts — a simple, always-on kicker.

   When the ball passes over it, the ball is fired off in the kicker's set
   direction. No gate, no cooldown — it just always kicks. The direction is
   editable per-kicker (the board editor draws an arrow for it).
---------------------------------------------------------------------- */

import { Vector2 } from "../physics/Vector2.ts";
import { COLORS, KICKER } from "../config/settings.ts";
import type { Ball } from "./Ball.ts";

export class LaneKicker {
  constructor(
    public pos: Vector2,
    /** Unit direction the kicker fires the ball. */
    public kickDir: Vector2,
  ) {}

  /** Fire the ball in the kick direction if it's over the kicker. */
  tryKick(ball: Ball): boolean {
    if (ball.pos.sub(this.pos).length() > KICKER.radius + ball.radius) return false;
    ball.vel = this.kickDir.normalize().scale(KICKER.kickSpeed);
    return true;
  }

  /** A glowing arrow pointing the way it kicks. */
  render(ctx: CanvasRenderingContext2D): void {
    const dir = this.kickDir.normalize();
    const tip = this.pos.add(dir.scale(28));
    const perp = new Vector2(-dir.y, dir.x);

    ctx.save();
    ctx.strokeStyle = COLORS.lime;
    ctx.fillStyle = COLORS.lime;
    ctx.shadowColor = COLORS.lime;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    // shaft
    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();

    // arrowhead
    const back = tip.sub(dir.scale(11));
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(back.x + perp.x * 7, back.y + perp.y * 7);
    ctx.lineTo(back.x - perp.x * 7, back.y - perp.y * 7);
    ctx.closePath();
    ctx.fill();

    // base dot
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
