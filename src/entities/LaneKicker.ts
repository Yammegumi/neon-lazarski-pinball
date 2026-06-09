/* ----------------------------------------------------------------------
   LaneKicker.ts — an always-on outlane kicker with a timed gate.

   The kicker itself is ALWAYS active: a ball that reaches it is fired back
   up the lane. Access is controlled by a GATE line just above it:

     • OPEN   (dotted) — the ball passes through and reaches the kicker.
     • ARMING (dotted) — for a few seconds right after a save (still passable).
     • CLOSED (solid)  — a wall: the ball can't reach the kicker, it's
                         deflected inward toward the centre drain. Lasts ~90s.

   So you get one save, then the gate locks the lane for a while. The gate's
   collision (when CLOSED) is handled in Game; this class owns the state.
---------------------------------------------------------------------- */

import { Vector2 } from "../physics/Vector2.ts";
import { COLORS, KICKER } from "../config/settings.ts";
import type { Ball } from "./Ball.ts";

type GateState = "open" | "arming" | "closed";
const GATE_PURPLE = "#a020ff";

export class LaneKicker {
  private state: GateState = "open";
  private timer = 0;

  constructor(
    public pos: Vector2,
    /** Direction it fires the ball (up the lane) when the gate is open. */
    public kickDir: Vector2,
    /** Direction it shoves the ball (inward-down → drain) when gate is solid. */
    public divertDir: Vector2,
    /** Endpoints of the gate line above the kicker. */
    public gateA: Vector2,
    public gateB: Vector2,
  ) {}

  reset(): void {
    this.state = "open";
    this.timer = 0;
  }

  /** True only while the gate is solid (Game then collides the ball with it). */
  get gateClosed(): boolean {
    return this.state === "closed";
  }

  update(dt: number): void {
    if (this.state === "arming") {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.state = "closed";
        this.timer = KICKER.gateClosedTime;
      }
    } else if (this.state === "closed") {
      this.timer -= dt;
      if (this.timer <= 0) this.state = "open";
    }
  }

  /** Called when a ball is at the kicker. If the gate is passable it fires
   *  the ball up the lane (a SAVE, returns true). If the gate is solid it
   *  instead shoves the ball inward-and-down so it drains (returns false). */
  tryKick(ball: Ball): boolean {
    if (ball.pos.sub(this.pos).length() > KICKER.radius + ball.radius) return false;

    if (this.state === "closed") {
      // Gate solid → divert inward toward the centre drain (no save).
      ball.vel = this.divertDir.normalize().scale(KICKER.divertSpeed);
      return false;
    }

    // Gate passable → strong save up the lane.
    ball.vel = this.kickDir.normalize().scale(KICKER.kickSpeed);
    if (this.state === "open") {
      this.state = "arming";
      this.timer = KICKER.gateArmDelay;
    }
    return true;
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Kicker arrow — always active (bright green).
    const s = 13;
    ctx.save();
    ctx.fillStyle = COLORS.lime;
    ctx.shadowColor = COLORS.lime;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y - s);
    ctx.lineTo(this.pos.x + s, this.pos.y + s);
    ctx.lineTo(this.pos.x - s, this.pos.y + s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Gate line: dotted when passable, solid when it's blocking the lane.
    ctx.save();
    ctx.strokeStyle = GATE_PURPLE;
    ctx.shadowColor = GATE_PURPLE;
    ctx.shadowBlur = 12;
    ctx.lineCap = "round";
    if (this.state === "closed") {
      ctx.lineWidth = 6; // solid, thick = blocking
    } else {
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.6;
      ctx.setLineDash([5, 8]); // dotted = passable
    }
    ctx.beginPath();
    ctx.moveTo(this.gateA.x, this.gateA.y);
    ctx.lineTo(this.gateB.x, this.gateB.y);
    ctx.stroke();
    ctx.restore();
  }
}
