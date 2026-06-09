/* ----------------------------------------------------------------------
   ParticleSystem.ts — manages all the live spark particles.

   The game asks for a "burst" of sparks at a point (e.g. where the ball
   hit a bumper); this system creates them, updates them each frame, drops
   dead ones, and draws them all with additive glow.
---------------------------------------------------------------------- */

import { Vector2 } from "../physics/Vector2.ts";
import { Particle } from "../entities/Particle.ts";
import { PARTICLES } from "../config/settings.ts";

export class ParticleSystem {
  private particles: Particle[] = [];

  /** Spawn a ring of sparks flying outward from `pos`. */
  burst(pos: Vector2, color: string, count = 12, speed = 200): void {
    for (let i = 0; i < count; i++) {
      // Random direction, random speed, random life — gives a lively spray.
      const angle = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.6);
      const vel = new Vector2(Math.cos(angle) * s, Math.sin(angle) * s);
      const life = 0.3 + Math.random() * 0.4;
      this.particles.push(new Particle(pos.clone(), vel, life, life, color, 2 + Math.random() * 2));
    }
    // Stay under the safety cap by discarding the oldest if needed.
    if (this.particles.length > PARTICLES.maxCount) {
      this.particles.splice(0, this.particles.length - PARTICLES.maxCount);
    }
  }

  update(dt: number): void {
    for (const p of this.particles) p.update(dt);
    // Keep only the ones still alive.
    this.particles = this.particles.filter((p) => p.alive);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.particles.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter"; // additive → glowing sparks
    for (const p of this.particles) p.render(ctx);
    ctx.restore();
  }

  /** Remove all particles (e.g. when a new game starts). */
  clear(): void {
    this.particles = [];
  }
}
