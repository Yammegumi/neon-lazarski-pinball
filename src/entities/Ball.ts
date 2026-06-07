/* ----------------------------------------------------------------------
   Ball.ts — the pinball itself.

   The ball owns its position and velocity. Each fixed update it:
     1. accelerates downward from gravity,
     2. caps its speed (so it can't tunnel through thin walls),
     3. moves by velocity × dt.
   Collisions with walls are handled separately in collisions.ts.
---------------------------------------------------------------------- */

import { Vector2 } from "../physics/Vector2.ts";
import { PHYSICS, BALL, COLORS } from "../config/settings.ts";

export class Ball {
  pos: Vector2;
  vel: Vector2;
  radius: number;

  /** Recent positions (oldest first) used to draw a fading motion trail. */
  private trail: Vector2[] = [];

  constructor(pos: Vector2, vel: Vector2 = new Vector2(0, 0), radius: number = BALL.radius) {
    this.pos = pos;
    this.vel = vel;
    this.radius = radius;
  }

  /** Record the current position for the trail. Call once per frame. */
  pushTrail(): void {
    this.trail.push(this.pos.clone());
    if (this.trail.length > BALL.trailLength) this.trail.shift();
  }

  /** Wipe the trail (e.g. when a new ball is launched). */
  clearTrail(): void {
    this.trail = [];
  }

  /** Apply gravity to the velocity and cap the speed.
   *  Called once per fixed step, BEFORE moving. */
  integrate(dt: number): void {
    // Gravity pulls the ball down (acceleration → velocity).
    this.vel = this.vel.add(new Vector2(0, PHYSICS.gravity).scale(dt));

    // Cap the speed. Combined with sub-stepping in the game loop, this
    // guarantees the ball never moves more than its radius in one sub-step,
    // which prevents it from "tunneling" straight through a wall.
    const speed = this.vel.length();
    if (speed > PHYSICS.maxSpeed) {
      this.vel = this.vel.normalize().scale(PHYSICS.maxSpeed);
    }
  }

  /** Move the ball by velocity × dt (position update only).
   *  The game loop calls this in small sub-steps and checks collisions
   *  after each one — see main.ts. */
  move(dt: number): void {
    this.pos = this.pos.add(this.vel.scale(dt));
  }

  /** Draw the ball: a fading trail, then an outer glow + bright core. */
  render(ctx: CanvasRenderingContext2D): void {
    // Trail first, so the ball draws on top. Additive blending makes the
    // overlapping circles glow like a light streak.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = COLORS.cyan;
    for (let i = 0; i < this.trail.length; i++) {
      const t = (i + 1) / this.trail.length; // 0 (old) → 1 (recent)
      ctx.globalAlpha = t * 0.35;
      ctx.beginPath();
      ctx.arc(this.trail[i].x, this.trail[i].y, this.radius * (0.3 + 0.6 * t), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();

    // Outer neon glow.
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 22;

    // Radial gradient: white-hot center → cyan edge, for a 3D sphere look.
    const g = ctx.createRadialGradient(
      this.pos.x - this.radius * 0.3,
      this.pos.y - this.radius * 0.3,
      this.radius * 0.1,
      this.pos.x,
      this.pos.y,
      this.radius,
    );
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.4, COLORS.cyan);
    g.addColorStop(1, "#0066aa");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
