/* ----------------------------------------------------------------------
   Loop.ts — the heartbeat of the game.

   We use a FIXED-TIMESTEP loop. Why? Physics simulations become unstable
   and behave differently on fast vs. slow machines if you step them by a
   variable "delta time". A fixed step (e.g. 60 updates/second) makes the
   ball behave identically everywhere. Rendering still happens as often as
   the browser allows (requestAnimationFrame).

   Usage:
     const loop = new Loop(
       (dt) => game.update(dt),   // called at a fixed rate
       () => game.render()        // called once per animation frame
     );
     loop.start();
---------------------------------------------------------------------- */

/** How many physics updates per second. 60 is standard and smooth. */
const UPDATES_PER_SECOND = 60;
const FIXED_DT = 1 / UPDATES_PER_SECOND; // seconds per update (~0.0167)

/** Safety cap: if the tab was backgrounded and a huge time gap occurs,
 *  don't try to catch up with hundreds of steps (the "spiral of death"). */
const MAX_FRAME_TIME = 0.25; // seconds

export class Loop {
  private update: (dt: number) => void;
  private render: () => void;

  private running = false;
  private lastTime = 0;
  private accumulator = 0;

  constructor(update: (dt: number) => void, render: () => void) {
    this.update = update;
    this.render = render;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
  }

  /** Arrow function so `this` stays bound when passed to rAF. */
  private tick = (now: number): void => {
    if (!this.running) return;

    // Convert milliseconds → seconds and clamp big gaps.
    let frameTime = (now - this.lastTime) / 1000;
    if (frameTime > MAX_FRAME_TIME) frameTime = MAX_FRAME_TIME;
    this.lastTime = now;

    // Run as many fixed-size physics steps as fit into the elapsed time.
    this.accumulator += frameTime;
    while (this.accumulator >= FIXED_DT) {
      this.update(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }

    // Draw the current state once.
    this.render();

    requestAnimationFrame(this.tick);
  };
}
