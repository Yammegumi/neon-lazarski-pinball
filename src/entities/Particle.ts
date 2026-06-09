/* ----------------------------------------------------------------------
   Particle.ts — a single short-lived spark.

   Particles are tiny glowing dots flung out when the ball hits something.
   Each has a velocity, a colour, and a life that counts down; as it ages
   it slows, falls a little, shrinks, and fades out.
---------------------------------------------------------------------- */

import { Vector2 } from "../physics/Vector2.ts";
import { PARTICLES } from "../config/settings.ts";

export class Particle {
  constructor(
    public pos: Vector2,
    public vel: Vector2,
    /** Remaining life in seconds. */
    public life: number,
    /** Starting life, used to compute the fade (life / maxLife). */
    public maxLife: number,
    public color: string,
    public size: number,
  ) {}

  /** True while the particle still has life left. */
  get alive(): boolean {
    return this.life > 0;
  }

  update(dt: number): void {
    this.vel = this.vel.add(new Vector2(0, PARTICLES.gravity).scale(dt)); // gentle fall
    this.vel = this.vel.scale(0.92); // air drag, so sparks slow down
    this.pos = this.pos.add(this.vel.scale(dt));
    this.life -= dt;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const fade = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = fade;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size * fade, 0, Math.PI * 2);
    ctx.fill();
  }
}
