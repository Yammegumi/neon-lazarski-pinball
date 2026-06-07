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

import { BOARD, PHYSICS, FLIPPER, BUMPER, SLINGSHOT, EFFECTS } from "../config/settings.ts";
import { Input } from "./Input.ts";
import { GameState } from "./GameState.ts";
import { Vector2 } from "../physics/Vector2.ts";
import { Ball } from "../entities/Ball.ts";
import { Wall } from "../entities/Wall.ts";
import { Flipper } from "../entities/Flipper.ts";
import { Bumper } from "../entities/Bumper.ts";
import { Target } from "../entities/Target.ts";
import { Slingshot } from "../entities/Slingshot.ts";
import { ScoreSystem } from "../systems/ScoreSystem.ts";
import { LivesSystem } from "../systems/LivesSystem.ts";
import { AudioManager } from "../systems/AudioManager.ts";
import { loadBestScore, saveBestScore } from "../systems/Storage.ts";
import {
  collideBallWall,
  collideBallFlipper,
  collideBallCircle,
  collideBallSegment,
} from "../physics/collisions.ts";
import { drawBackground, drawGrid, drawScanlines, drawScore, drawLives } from "../ui/render.ts";

const W = BOARD.width;
const H = BOARD.height;
const M = 16; // wall margin from the canvas edge

export class Game {
  /** Current state. Starts on the title screen. */
  state: GameState = GameState.Start;

  readonly score = new ScoreSystem();
  readonly lives = new LivesSystem();

  /** Best score ever (persisted). Shown on the title + game over screens. */
  best = loadBestScore();
  /** True when the just-finished game beat the best score. */
  isNewBest = false;

  /** Current screen-shake strength (px), decays over time. */
  private shake = 0;

  private walls: Wall[];
  private leftFlipper: Flipper;
  private rightFlipper: Flipper;
  private flippers: Flipper[];
  private bumpers: Bumper[];
  private targets: Target[];
  private slingshots: Slingshot[];
  private ball: Ball;

  constructor(
    private input: Input,
    private audio: AudioManager,
  ) {
    // --- Board walls. Verticals down each side, then angled lower walls
    //     that funnel the ball toward the flippers. The gap between the
    //     flipper tips at the bottom is the DRAIN (where a ball is lost). ---
    this.walls = [
      new Wall(new Vector2(M, M), new Vector2(W - M, M)), // top
      new Wall(new Vector2(M, M), new Vector2(M, 700)), // left
      new Wall(new Vector2(W - M, M), new Vector2(W - M, 700)), // right
      new Wall(new Vector2(M, 700), new Vector2(160, 812)), // left funnel
      new Wall(new Vector2(W - M, 700), new Vector2(W - 160, 812)), // right funnel
    ];

    // --- Flippers: a "V" with a drain gap between the tips. ---
    const SWING = 0.44; // ~25°
    this.leftFlipper = new Flipper(new Vector2(160, 812), SWING, -SWING);
    this.rightFlipper = new Flipper(new Vector2(W - 160, 812), Math.PI - SWING, Math.PI + SWING);
    this.flippers = [this.leftFlipper, this.rightFlipper];

    // --- Obstacles. ---
    this.bumpers = [
      new Bumper(new Vector2(W / 2, 250)),
      new Bumper(new Vector2(W / 2 - 95, 340)),
      new Bumper(new Vector2(W / 2 + 95, 340)),
    ];
    this.targets = [0, 1, 2, 3].map((i) => new Target(new Vector2(150 + i * 80, 150)));
    this.slingshots = [
      new Slingshot(new Vector2(85, 715), new Vector2(150, 785)), // left
      new Slingshot(new Vector2(W - 85, 715), new Vector2(W - 150, 785)), // right
    ];

    // Ball starts parked off-screen (invisible) until the first launch.
    this.ball = new Ball(new Vector2(W / 2, -100));
  }

  // --------------------------------------------------------------------
  // State transitions
  // --------------------------------------------------------------------

  /** Begin a fresh game: reset score/lives/targets and launch the ball. */
  private startGame(): void {
    this.score.reset();
    this.lives.reset();
    this.isNewBest = false;
    for (const t of this.targets) t.active = true;
    this.launchBall();
    this.state = GameState.Playing;
    this.audio.play("gameStart");
  }

  /** Drop a new ball into play from the top, with a small random nudge. */
  private launchBall(): void {
    this.ball.pos = new Vector2(W / 2 + (Math.random() * 120 - 60), 90);
    this.ball.vel = new Vector2(Math.random() * 160 - 80, 0);
    this.ball.clearTrail(); // no streak from the old position
  }

  /** Ball was lost: spend a life, then either re-launch or end the game. */
  private drain(): void {
    this.lives.lose();
    if (this.lives.isEmpty) {
      this.endGame();
    } else {
      this.audio.play("lifeLost");
      this.launchBall();
    }
  }

  /** No lives left: record a new best score (if any) and go to Game Over. */
  private endGame(): void {
    this.isNewBest = this.score.value > this.best;
    if (this.isNewBest) {
      this.best = this.score.value;
      saveBestScore(this.best);
    }
    this.state = GameState.GameOver;
    this.audio.play("gameOver");
  }

  // --------------------------------------------------------------------
  // Per-frame update
  // --------------------------------------------------------------------

  update(dt: number): void {
    this.handleInput();
    if (this.state === GameState.Playing) this.simulate(dt);
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
        if (this.input.consumePressed("Enter", "Space")) this.startGame();
        break;
    }
  }

  /** The physics + scoring step (only runs while Playing). */
  private simulate(dt: number): void {
    // Tick obstacle timers (flash fade + scoring cooldown).
    for (const bumper of this.bumpers) bumper.update(dt);
    for (const sling of this.slingshots) sling.update(dt);

    // Gravity once; velocity then constant across the sub-steps below.
    this.ball.integrate(dt);

    // Sub-steps sized by whichever moves furthest (ball or flipper tip),
    // so neither can tunnel past the other in one move.
    const ballDist = this.ball.vel.length() * dt;
    const flipperTipDist = FLIPPER.flipSpeed * FLIPPER.length * dt;
    const subSteps = Math.max(1, Math.ceil(Math.max(ballDist, flipperTipDist) / PHYSICS.maxSubStep));
    const subDt = dt / subSteps;

    const leftDown = this.input.isLeftFlipper();
    const rightDown = this.input.isRightFlipper();

    // Only play the bounce sound once per frame even if several sub-steps
    // touch a wall — otherwise a single bounce would buzz.
    let wallHit = false;

    for (let s = 0; s < subSteps; s++) {
      this.leftFlipper.update(subDt, leftDown);
      this.rightFlipper.update(subDt, rightDown);
      this.ball.move(subDt);

      for (const wall of this.walls) {
        if (collideBallWall(this.ball, wall)) wallHit = true;
      }
      for (const flipper of this.flippers) collideBallFlipper(this.ball, flipper);

      for (const bumper of this.bumpers) {
        if (collideBallCircle(this.ball, bumper.pos, bumper.radius, BUMPER.boost)) {
          if (bumper.cooldown <= 0) {
            this.score.add(bumper.points);
            bumper.hit();
            this.audio.play("bumper");
            this.shake = Math.min(EFFECTS.shakeMax, this.shake + EFFECTS.shakeOnBumper);
          }
        }
      }
      for (const sling of this.slingshots) {
        if (collideBallSegment(this.ball, sling.a, sling.b, SLINGSHOT.thickness, SLINGSHOT.boost)) {
          if (sling.cooldown <= 0) {
            this.score.add(sling.points);
            sling.hit();
            this.audio.play("slingshot");
          }
        }
      }
      for (const target of this.targets) {
        if (target.active && collideBallCircle(this.ball, target.pos, target.radius, 0)) {
          target.active = false;
          this.score.add(target.points);
          this.audio.play("target");
        }
      }
    }

    if (wallHit) this.audio.play("bounce");

    // Record one trail point per frame (not per sub-step).
    this.ball.pushTrail();

    // Stand all targets back up once the whole row is down (plays a chime).
    if (this.targets.every((t) => !t.active)) {
      for (const target of this.targets) target.active = true;
      this.audio.play("score");
    }

    // DRAIN: the ball fell past the flippers and off the bottom.
    if (this.ball.pos.y - this.ball.radius > H) this.drain();
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
    for (const flipper of this.flippers) flipper.render(ctx);
    this.ball.render(ctx); // off-screen when not in play → invisible

    ctx.restore();

    drawScanlines(ctx);

    // HUD only while a game is in progress.
    if (this.state === GameState.Playing || this.state === GameState.Paused) {
      drawScore(ctx, this.score.value);
      drawLives(ctx, this.lives.count);
    }
  }
}
