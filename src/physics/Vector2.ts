/* ----------------------------------------------------------------------
   Vector2.ts — a simple 2D vector (x, y).

   Almost everything in the game is a vector: the ball's position, its
   velocity, gravity, and the surface normals it bounces off. Having one
   small, well-tested class for vector math keeps the physics code short
   and readable.

   Design note: most methods return a NEW Vector2 instead of changing the
   current one (they are "immutable"). This avoids subtle bugs where two
   things accidentally share and modify the same vector.
---------------------------------------------------------------------- */

export class Vector2 {
  constructor(
    public x: number,
    public y: number,
  ) {}

  /** a + b */
  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  /** a - b */
  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  /** Multiply by a number (e.g. velocity * dt). */
  scale(s: number): Vector2 {
    return new Vector2(this.x * s, this.y * s);
  }

  /** Dot product — used to project one vector onto another.
   *  Key to collision response (how much of the velocity points into a wall). */
  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  /** Length of the vector (e.g. the ball's speed). */
  length(): number {
    return Math.hypot(this.x, this.y);
  }

  /** A unit-length (length 1) vector pointing the same way.
   *  Returns (0,0) for a zero vector to avoid dividing by zero. */
  normalize(): Vector2 {
    const len = this.length();
    if (len === 0) return new Vector2(0, 0);
    return new Vector2(this.x / len, this.y / len);
  }

  /** Make an independent copy. */
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }
}
