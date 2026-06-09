/* ----------------------------------------------------------------------
   collisions.ts — collision detection + response.

   In pinball, the ball is always a CIRCLE, and the things it hits are
   LINE SEGMENTS (walls, flippers) or other CIRCLES (bumpers). This file
   handles circle-vs-segment, which covers the board walls in Stage 1.

   The two jobs of a collision are:
     1. DETECT   — is the ball touching the wall?
     2. RESPOND  — push it out and bounce its velocity off the surface.
---------------------------------------------------------------------- */

import { Vector2 } from "./Vector2.ts";
import { PHYSICS } from "../config/settings.ts";
import type { Ball } from "../entities/Ball.ts";
import type { Wall } from "../entities/Wall.ts";
import type { Flipper } from "../entities/Flipper.ts";

/**
 * Find the point on segment A→B that is closest to point P.
 * We project P onto the line, then clamp to stay between the endpoints.
 */
export function closestPointOnSegment(p: Vector2, a: Vector2, b: Vector2): Vector2 {
  const ab = b.sub(a); // direction of the segment
  const lengthSq = ab.dot(ab);
  if (lengthSq === 0) return a.clone(); // segment is a single point

  // t = how far along the segment the projection lands (0 = A, 1 = B).
  let t = p.sub(a).dot(ab) / lengthSq;
  t = Math.max(0, Math.min(1, t)); // clamp to the segment
  return a.add(ab.scale(t));
}

/**
 * Generic ball-vs-segment bounce. Used by walls (thickness 0, boost 0) and
 * slingshots (thicker, with a boost that adds extra outward speed).
 * Returns true if a collision happened (handy for sound/score).
 */
export function collideBallSegment(
  ball: Ball,
  a: Vector2,
  b: Vector2,
  thickness: number,
  boost: number,
  /** If given, the segment only reacts on this side (its "front"); the ball
   *  passes through from behind. Used to make slingshots one-sided. */
  front?: Vector2,
): boolean {
  const closest = closestPointOnSegment(ball.pos, a, b);

  // Vector from the contact point to the ball's center.
  const toBall = ball.pos.sub(closest);

  // Directional: ignore hits coming from behind the front face.
  if (front && toBall.dot(front) < 0) return false;

  const distance = toBall.length();

  const minDistance = ball.radius + thickness;
  if (distance > minDistance) return false; // no overlap → no collision

  // Surface normal: direction to push the ball out. (Fallback if exactly on.)
  const normal = distance === 0 ? new Vector2(0, -1) : toBall.normalize();

  // 1. POSITIONAL CORRECTION — lift the ball back to the surface so it never
  //    sinks into or tunnels through the segment.
  ball.pos = ball.pos.add(normal.scale(minDistance - distance));

  // 2. VELOCITY RESPONSE — reflect velocity across the surface normal.
  //    Reflection formula:  v' = v - (1 + e)(v · n) n
  //    Only bounce if the ball is actually moving INTO the surface.
  const velAlongNormal = ball.vel.dot(normal);
  if (velAlongNormal < 0) {
    ball.vel = ball.vel.sub(normal.scale((1 + PHYSICS.restitution) * velAlongNormal));
  }

  // 3. BOOST — slingshots kick the ball away with extra speed.
  if (boost > 0) ball.vel = ball.vel.add(normal.scale(boost));

  return true;
}

/** Ball vs. wall — a plain segment bounce (no thickness, no boost). */
export function collideBallWall(ball: Ball, wall: Wall): boolean {
  return collideBallSegment(ball, wall.a, wall.b, 0, 0);
}

/**
 * Generic ball-vs-circle bounce. Used by bumpers (with boost) and targets.
 * Returns true if a collision happened.
 */
export function collideBallCircle(
  ball: Ball,
  center: Vector2,
  radius: number,
  boost: number,
): boolean {
  const toBall = ball.pos.sub(center);
  const distance = toBall.length();

  const minDistance = ball.radius + radius;
  if (distance > minDistance) return false;

  const normal = distance === 0 ? new Vector2(0, -1) : toBall.normalize();

  // Push out, reflect, and (for bumpers) add the outward "pop".
  ball.pos = ball.pos.add(normal.scale(minDistance - distance));
  const velAlongNormal = ball.vel.dot(normal);
  if (velAlongNormal < 0) {
    ball.vel = ball.vel.sub(normal.scale((1 + PHYSICS.restitution) * velAlongNormal));
  }
  if (boost > 0) ball.vel = ball.vel.add(normal.scale(boost));

  return true;
}

/**
 * Ball vs. flipper. Same idea as a wall, but the flipper SURFACE is moving
 * (it's rotating). We bounce the ball relative to that moving surface, which
 * naturally adds a "kick" when the flipper is swinging up into the ball.
 */
export function collideBallFlipper(ball: Ball, flipper: Flipper): boolean {
  const tip = flipper.tip();
  const closest = closestPointOnSegment(ball.pos, flipper.pivot, tip);

  const toBall = ball.pos.sub(closest);
  const distance = toBall.length();

  // The flipper is a thick bar, so the ball collides at radius + half-thickness.
  const minDistance = ball.radius + flipper.thickness;
  if (distance > minDistance) return false;

  const normal = distance === 0 ? new Vector2(0, -1) : toBall.normalize();

  // Push the ball out to the bar's surface.
  const penetration = minDistance - distance;
  ball.pos = ball.pos.add(normal.scale(penetration));

  // Velocity of the flipper's surface at the contact point.
  // A point rotating about the pivot with angular velocity ω moves with
  // velocity  ω × r , which in 2D is  ω * (-r.y, r.x).
  const r = closest.sub(flipper.pivot);
  const surfaceVel = new Vector2(-r.y, r.x).scale(flipper.angularVelocity);

  // Bounce the ball's velocity RELATIVE to the moving surface, then add the
  // surface velocity back. This is what flings the ball up the board.
  const relVel = ball.vel.sub(surfaceVel);
  const relAlongNormal = relVel.dot(normal);
  if (relAlongNormal < 0) {
    const bounce = normal.scale((1 + PHYSICS.restitution) * relAlongNormal);
    ball.vel = relVel.sub(bounce).add(surfaceVel);
  }

  return true;
}
