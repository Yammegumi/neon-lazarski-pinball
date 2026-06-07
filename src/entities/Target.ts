/* ----------------------------------------------------------------------
   Target.ts — a small target that switches OFF when hit.

   Classic pinball drop targets: hit one and it goes down (here, it stops
   scoring and dims). When every target in a group is down, the game can
   reset them all (handled in main.ts) for another pass — a simple,
   satisfying objective.
---------------------------------------------------------------------- */

import { Vector2 } from "../physics/Vector2.ts";
import { TARGET, COLORS } from "../config/settings.ts";

export class Target {
  /** True = still standing and scorable. False = knocked down. */
  active = true;

  constructor(
    public pos: Vector2,
    public radius: number = TARGET.radius,
    public points: number = TARGET.points,
    public color: string = COLORS.lime,
  ) {}

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(Math.PI / 4); // draw the square as a diamond

    if (this.active) {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
    } else {
      // Knocked down: faint hollow outline so you can see it's been hit.
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
    }

    ctx.restore();
  }
}
