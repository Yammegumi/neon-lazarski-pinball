/* ----------------------------------------------------------------------
   Game.ts — the whole game in one object.

   This class owns the board (walls, flippers, obstacles), the ball, the
   score and lives, and the current state (Start / Playing / Paused /
   GameOver). main.ts just wires it to the canvas and the loop.

   The state machine is the key idea:
   • handleInput()  decides state changes (start, pause, restart).
   • simulate()     runs the physics — but ONLY while Playing.
   So pausing is simply "stop calling simulate()", which freezes everything.
---------------------------------------------------------------------- */

import {
  BOARD,
  COLORS,
  PHYSICS,
  FLIPPER,
  BUMPER,
  SLINGSHOT,
  EFFECTS,
  POWERUP,
} from "../config/settings.ts";
import { Input } from "./Input.ts";
import { GameState } from "./GameState.ts";
import { Vector2 } from "../physics/Vector2.ts";
import { Ball } from "../entities/Ball.ts";
import { Wall } from "../entities/Wall.ts";
import { Flipper } from "../entities/Flipper.ts";
import { Bumper } from "../entities/Bumper.ts";
import { Target } from "../entities/Target.ts";
import { Slingshot } from "../entities/Slingshot.ts";
import { PowerUp } from "../entities/PowerUp.ts";
import { LaneKicker } from "../entities/LaneKicker.ts";
import type { BoardLayout } from "../board/BoardLayout.ts";
import { ScoreSystem } from "../systems/ScoreSystem.ts";
import { LivesSystem } from "../systems/LivesSystem.ts";
import { AudioManager } from "../systems/AudioManager.ts";
import { ParticleSystem } from "../systems/ParticleSystem.ts";
import { StatsSystem } from "../systems/Stats.ts";
import { Leaderboard } from "../systems/Leaderboard.ts";
import { loadBestScore, saveBestScore } from "../systems/Storage.ts";
import {
  collideBallWall,
  collideBallFlipper,
  collideBallCircle,
  collideBallSegment,
} from "../physics/collisions.ts";
import {
  drawBackground,
  drawGrid,
  drawScanlines,
  drawScore,
  drawLives,
  drawCombo,
  drawPowerup,
} from "../ui/render.ts";

const W = BOARD.width;
const H = BOARD.height;

export class Game {
  /** Current state. Starts on the title screen. */
  state: GameState = GameState.Start;

  readonly score = new ScoreSystem();
  readonly lives = new LivesSystem();

  /** Best score ever (persisted). Shown on the title + game over screens. */
  best = loadBestScore();
  /** True when the just-finished game beat the best score. */
  isNewBest = false;

  /** Lifetime player statistics and the local top-5 leaderboard. */
  readonly stats = new StatsSystem();
  readonly leaderboard = new Leaderboard();
  /** The score qualified for the leaderboard and is awaiting a name. */
  private pendingName = false;
  /** The player has already submitted their name for this game. */
  private nameEntered = false;

  /** Current screen-shake strength (px), decays over time. */
  private shake = 0;

  /** Seconds of slow motion left (0 = normal speed). */
  private slowmoTimer = 0;

  /** Collectible power-up tokens currently on the board. */
  private powerups: PowerUp[] = [];
  /** Countdown until the next random slow-mo token spawns. */
  private slowmoSpawnTimer = 0;

  /** Spark effects (bumper/target/slingshot hits, drains). */
  private particles = new ParticleSystem();

  // These come from the (re)loadable board layout — assigned in buildBoard().
  private walls!: Wall[];
  private bumpers!: Bumper[];
  private targets!: Target[];
  private slingshots!: Slingshot[];
  private laneKickers!: LaneKicker[];
  // Flippers are fixed (not part of the editable layout).
  private leftFlipper: Flipper;
  private rightFlipper: Flipper;
  private flippers: Flipper[];
  /** All balls currently in play (more than one during Multiball). */
  private balls: Ball[] = [];

  constructor(
    private input: Input,
    private audio: AudioManager,
    /** Walls / bumpers / targets come from here (editable via the editor →
     *  public/boards/board.json). Flippers, slingshots and power-up spawns
     *  are still fixed in code below. */
    layout: BoardLayout,
  ) {
    // --- Flippers: a "V" with a drain gap between the tips (fixed). ---
    const SWING = 0.44; // ~25°
    this.leftFlipper = new Flipper(new Vector2(250, 958), SWING, -SWING);
    this.rightFlipper = new Flipper(new Vector2(W - 250, 958), Math.PI - SWING, Math.PI + SWING);
    this.flippers = [this.leftFlipper, this.rightFlipper];

    // Everything else (walls, bumpers, targets, slingshots, kickers) comes
    // from the editable layout — and can be swapped at runtime via loadBoard().
    this.buildBoard(layout);
  }

  /** (Re)build all the editable elements from a board layout. */
  private buildBoard(layout: BoardLayout): void {
    this.walls = layout.walls.map(
      (w) => new Wall(new Vector2(w.a[0], w.a[1]), new Vector2(w.b[0], w.b[1])),
    );
    this.bumpers = layout.bumpers.map((b) => new Bumper(new Vector2(b.pos[0], b.pos[1])));
    this.targets = layout.targets.map((t) => new Target(new Vector2(t.pos[0], t.pos[1])));
    this.slingshots = (layout.slingshots ?? []).map((s) => {
      const a = new Vector2(s.a[0], s.a[1]);
      const b = new Vector2(s.b[0], s.b[1]);
      const front = s.front ? new Vector2(s.front[0], s.front[1]) : this.frontTowardCenter(a, b);
      return new Slingshot(a, b, front);
    });
    this.laneKickers = (layout.kickers ?? []).map(
      (k) => new LaneKicker(new Vector2(k.pos[0], k.pos[1]), new Vector2(k.dir[0], k.dir[1])),
    );
  }

  /** Swap in a new board layout live, and return to the title screen. */
  loadBoard(layout: BoardLayout): void {
    this.buildBoard(layout);
    this.state = GameState.Start;
    this.balls = [];
    this.powerups = [];
  }

  /** Perpendicular to segment a→b, pointing toward the board centre. Used to
   *  give one-sided obstacles (slingshots) a "front" facing the play field. */
  private frontTowardCenter(a: Vector2, b: Vector2): Vector2 {
    const dir = b.sub(a);
    let normal = new Vector2(-dir.y, dir.x).normalize();
    const mid = a.add(b).scale(0.5);
    const toCenter = new Vector2(W / 2, H / 2).sub(mid);
    if (normal.dot(toCenter) < 0) normal = normal.scale(-1);
    return normal;
  }

  // --------------------------------------------------------------------
  // State transitions
  // --------------------------------------------------------------------

  /** Begin a fresh game: reset score/lives/targets and launch the ball. */
  private startGame(): void {
    this.score.reset();
    this.lives.reset();
    this.isNewBest = false;
    this.pendingName = false;
    this.nameEntered = false;
    this.slowmoTimer = 0;
    this.powerups = [];
    this.slowmoSpawnTimer = POWERUP.slowmoFirstSpawn;
    for (const t of this.targets) t.active = true;
    this.particles.clear();
    this.launchBall();
    this.state = GameState.Playing;
    this.audio.play("gameStart");
  }

  /** Put a single new ball into play from the top, with a small random nudge. */
  private launchBall(): void {
    this.balls = [
      new Ball(
        new Vector2(W / 2 + (Math.random() * 120 - 60), 90),
        new Vector2(Math.random() * 160 - 80, 0),
      ),
    ];
  }

  /** All balls drained: spend a life, then either re-launch or end the game. */
  private loseBall(): void {
    this.lives.lose();
    if (this.lives.isEmpty) {
      this.endGame();
    } else {
      this.audio.play("lifeLost");
      this.launchBall();
    }
  }

  // --------------------------------------------------------------------
  // Power-ups (collectible tokens — the ball must hit one to trigger it)
  // --------------------------------------------------------------------

  /** Drop a multiball token at top-centre, between the two target banks. */
  private spawnMultiballToken(): void {
    // Only one multiball token on the board at a time.
    if (this.powerups.some((p) => p.active && p.type === "multiball")) return;
    this.powerups.push(new PowerUp("multiball", new Vector2(W / 2, 150)));
  }

  /** Drop a slow-mo token at a random open spot in the mid-lower board. */
  private spawnSlowmoToken(): void {
    if (this.powerups.some((p) => p.active && p.type === "slowmo")) return;
    const x = 80 + Math.random() * (W - 160);
    const y = 450 + Math.random() * 280;
    this.powerups.push(new PowerUp("slowmo", new Vector2(x, y)));
  }

  /** Ball touched a token: trigger its effect, score, sparks, and remove it. */
  private collectPowerup(token: PowerUp, at: Vector2): void {
    token.active = false;
    this.score.registerHit(POWERUP.collectBonus);
    this.audio.play("powerup");
    this.particles.burst(at, token.color, 20);
    if (token.type === "multiball") this.activateMultiball();
    else this.activateSlowmo();
  }

  /** Multiball: add extra balls at the first ball's position, fired upward. */
  private activateMultiball(): void {
    if (this.balls.length === 0) return;
    const origin = this.balls[0].pos.clone();
    for (let i = 0; i < POWERUP.multiballCount; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2; // mostly upward
      const speed = 300 + Math.random() * 160;
      this.balls.push(
        new Ball(origin.clone(), new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed)),
      );
    }
  }

  /** Slow motion: run time at a fraction of normal for a few seconds. */
  private activateSlowmo(): void {
    this.slowmoTimer = POWERUP.slowmoDuration;
  }

  /** No lives left: record best score + stats, and go to Game Over. */
  private endGame(): void {
    this.isNewBest = this.score.value > this.best;
    if (this.isNewBest) {
      this.best = this.score.value;
      saveBestScore(this.best);
    }
    // Lifetime stats + leaderboard qualification.
    this.stats.recordGameEnd(this.score.value);
    this.pendingName = this.leaderboard.qualifies(this.score.value);
    this.nameEntered = false;

    this.state = GameState.GameOver;
    this.audio.play("gameOver");
  }

  /** True while the Game Over screen is waiting for the player's initials. */
  get awaitingName(): boolean {
    return this.pendingName && !this.nameEntered;
  }

  /** Called by the name-entry input (see main.ts) to record a high score. */
  submitName(name: string): void {
    if (!this.awaitingName) return;
    this.leaderboard.add(name, this.score.value);
    this.nameEntered = true;
  }

  /** Snapshot of everything the overlay screens need to display. */
  getView() {
    return {
      state: this.state,
      score: this.score.value,
      best: this.best,
      isNewBest: this.isNewBest,
      awaitingName: this.awaitingName,
      leaderboard: this.leaderboard.entries,
      stats: this.stats.stats,
    };
  }

  // --------------------------------------------------------------------
  // Per-frame update
  // --------------------------------------------------------------------

  update(dt: number): void {
    this.handleInput();
    if (this.state === GameState.Playing) {
      // The slow-mo timer counts down in REAL time, but the simulation runs
      // on a SCALED dt — so during slow motion everything (ball, flippers,
      // timers) moves slower together, while the effect still ends on time.
      if (this.slowmoTimer > 0) this.slowmoTimer = Math.max(0, this.slowmoTimer - dt);
      const timeScale = this.slowmoTimer > 0 ? POWERUP.slowmoFactor : 1;
      this.simulate(dt * timeScale);
    }
    // Screen-shake settles over time, in every state.
    this.shake = Math.max(0, this.shake - EFFECTS.shakeDecay * dt);
    this.input.endFrame(); // clear one-shot key presses
  }

  /** Menu/state keys. What each key does depends on the current state. */
  private handleInput(): void {
    switch (this.state) {
      case GameState.Start:
        if (this.input.consumePressed("Enter", "Space")) this.startGame();
        break;
      case GameState.Playing:
        if (this.input.consumePressed("KeyP", "Escape")) {
          this.state = GameState.Paused;
          this.audio.play("pause");
        }
        break;
      case GameState.Paused:
        if (this.input.consumePressed("KeyP", "Escape")) {
          this.state = GameState.Playing;
          this.audio.play("pause");
        }
        break;
      case GameState.GameOver:
        // While a high score is being named, the DOM input handles keys —
        // don't let Enter restart until the name is submitted.
        if (this.awaitingName) break;
        if (this.input.consumePressed("Enter", "Space")) this.startGame();
        break;
    }
  }

  /** The physics + scoring step (only runs while Playing). */
  private simulate(dt: number): void {
    // Tick obstacle timers, the combo window, the particles, and tokens.
    for (const bumper of this.bumpers) bumper.update(dt);
    for (const sling of this.slingshots) sling.update(dt);
    this.score.update(dt);
    this.particles.update(dt);
    for (const p of this.powerups) p.update(dt);

    // Periodically drop a slow-mo token at a random spot.
    this.slowmoSpawnTimer -= dt;
    if (this.slowmoSpawnTimer <= 0) {
      this.spawnSlowmoToken();
      this.slowmoSpawnTimer = POWERUP.slowmoSpawnInterval;
    }

    // Gravity once per ball; velocities then constant across sub-steps.
    for (const ball of this.balls) ball.integrate(dt);

    // Sub-steps sized by whichever moves furthest — the FASTEST ball or a
    // flipper tip — so nothing can tunnel past anything in one move.
    let maxBallDist = 0;
    for (const ball of this.balls) maxBallDist = Math.max(maxBallDist, ball.vel.length() * dt);
    const flipperTipDist = FLIPPER.flipSpeed * FLIPPER.length * dt;
    const subSteps = Math.max(
      1,
      Math.ceil(Math.max(maxBallDist, flipperTipDist) / PHYSICS.maxSubStep),
    );
    const subDt = dt / subSteps;

    const leftDown = this.input.isLeftFlipper();
    const rightDown = this.input.isRightFlipper();

    // Play the bounce sound at most once per frame (a single bounce would
    // otherwise buzz across sub-steps / multiple balls).
    let wallHit = false;

    for (let s = 0; s < subSteps; s++) {
      this.leftFlipper.update(subDt, leftDown);
      this.rightFlipper.update(subDt, rightDown);
      for (const ball of this.balls) {
        ball.move(subDt);
        if (this.collideBall(ball)) wallHit = true;
      }
    }

    if (wallHit) this.audio.play("bounce");

    // Record one trail point per ball, per frame (not per sub-step).
    for (const ball of this.balls) ball.pushTrail();

    // Clear the whole target row → bonus, chime, and a MULTIBALL token spawns
    // near the targets for the player to grab.
    if (this.targets.every((t) => !t.active)) {
      for (const target of this.targets) target.active = true;
      this.score.registerHit(200); // bonus, also benefits from the combo
      this.audio.play("score");
      this.spawnMultiballToken();
    }

    // Remove collected / expired tokens.
    this.powerups = this.powerups.filter((p) => p.alive);

    // DRAIN: drop any ball that fell off the bottom (red sparks each).
    const hadBalls = this.balls.length > 0;
    this.balls = this.balls.filter((ball) => {
      if (ball.pos.y - ball.radius > H) {
        this.particles.burst(new Vector2(ball.pos.x, H), COLORS.danger, 16, 240);
        return false;
      }
      return true;
    });
    // Losing the LAST ball costs a life.
    if (hadBalls && this.balls.length === 0) this.loseBall();
  }

  /**
   * Resolve one ball against every collider, scoring/effects included.
   * Returns true if it hit a wall (so the caller can play one bounce sound).
   */
  private collideBall(ball: Ball): boolean {
    let wallHit = false;
    for (const wall of this.walls) {
      if (collideBallWall(ball, wall)) wallHit = true;
    }
    for (const flipper of this.flippers) collideBallFlipper(ball, flipper);

    for (const bumper of this.bumpers) {
      if (collideBallCircle(ball, bumper.pos, bumper.radius, BUMPER.boost)) {
        if (bumper.cooldown <= 0) {
          this.score.registerHit(bumper.points);
          this.stats.recordBumperHit();
          this.stats.recordCombo(this.score.multiplier);
          bumper.hit();
          this.audio.play("bumper");
          this.shake = Math.min(EFFECTS.shakeMax, this.shake + EFFECTS.shakeOnBumper);
          this.particles.burst(ball.pos, COLORS.amber, 14);
        }
      }
    }
    for (const sling of this.slingshots) {
      if (collideBallSegment(ball, sling.a, sling.b, SLINGSHOT.thickness, SLINGSHOT.boost, sling.front)) {
        if (sling.cooldown <= 0) {
          this.score.registerHit(sling.points);
          this.stats.recordCombo(this.score.multiplier);
          sling.hit();
          this.audio.play("slingshot");
          this.particles.burst(ball.pos, COLORS.magenta, 10);
        }
      }
    }
    for (const target of this.targets) {
      if (target.active && collideBallCircle(ball, target.pos, target.radius, 0)) {
        target.active = false;
        this.score.registerHit(target.points);
        this.stats.recordTargetHit();
        this.stats.recordCombo(this.score.multiplier);
        this.audio.play("target");
        this.particles.burst(ball.pos, COLORS.lime, 10);
      }
    }

    // Power-up tokens are PICKUPS: overlap collects them (no bounce).
    for (const token of this.powerups) {
      if (token.active && ball.pos.sub(token.pos).length() < ball.radius + token.radius) {
        this.collectPowerup(token, ball.pos.clone());
      }
    }

    // Lane kickers (always on) — fire the ball in their direction.
    for (const kicker of this.laneKickers) {
      if (kicker.tryKick(ball)) {
        this.audio.play("powerup");
        this.particles.burst(ball.pos.clone(), COLORS.lime, 14);
      }
    }

    return wallHit;
  }

  // --------------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------------

  render(ctx: CanvasRenderingContext2D): void {
    // Background fills the whole canvas first (drawn WITHOUT shake) so the
    // shake offset never reveals a gap at the edges.
    drawBackground(ctx);

    // Apply screen-shake to the board + entities only (HUD stays steady).
    const dx = this.shake ? (Math.random() * 2 - 1) * this.shake : 0;
    const dy = this.shake ? (Math.random() * 2 - 1) * this.shake : 0;
    ctx.save();
    ctx.translate(dx, dy);

    drawGrid(ctx);
    for (const wall of this.walls) wall.render(ctx);
    for (const target of this.targets) target.render(ctx);
    for (const sling of this.slingshots) sling.render(ctx);
    for (const bumper of this.bumpers) bumper.render(ctx);
    for (const kicker of this.laneKickers) kicker.render(ctx);
    for (const token of this.powerups) token.render(ctx);
    for (const flipper of this.flippers) flipper.render(ctx);
    for (const ball of this.balls) ball.render(ctx); // 1+ during Multiball
    this.particles.render(ctx);

    ctx.restore();

    drawScanlines(ctx);

    // HUD only while a game is in progress.
    if (this.state === GameState.Playing || this.state === GameState.Paused) {
      drawScore(ctx, this.score.value);
      drawLives(ctx, this.lives.count);
      drawCombo(ctx, this.score.multiplier, this.score.comboFraction);
      const slowmoFraction = this.slowmoTimer / POWERUP.slowmoDuration;
      drawPowerup(ctx, "SLOW-MO", slowmoFraction);
    }
  }
}
