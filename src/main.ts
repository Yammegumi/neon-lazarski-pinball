/* ----------------------------------------------------------------------
   main.ts — application entry point.

   Stage 4: a complete game loop. main.ts is now small — it just sets up
   the canvas, creates the Game (which owns all the gameplay), runs the
   fixed-timestep loop, and keeps the HTML overlay screens in sync with
   the game state. All the logic lives in core/Game.ts.
---------------------------------------------------------------------- */

import "./style.css";
import { BOARD } from "./config/settings.ts";
import { Loop } from "./core/Loop.ts";
import { Input } from "./core/Input.ts";
import { Game } from "./core/Game.ts";
import { AudioManager, type SoundName } from "./systems/AudioManager.ts";
import { syncScreens } from "./ui/screens.ts";

// --- Canvas setup -----------------------------------------------------
const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Canvas element #game not found in index.html");

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2D canvas context not available in this browser");

/** Render at the board's logical resolution but scaled for the device
 *  pixel ratio, so the neon edges stay sharp. */
function setupCanvasResolution(): void {
  const dpr = window.devicePixelRatio || 1;
  canvas!.width = BOARD.width * dpr;
  canvas!.height = BOARD.height * dpr;
  ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
}
setupCanvasResolution();
window.addEventListener("resize", setupCanvasResolution);

// --- Audio ------------------------------------------------------------
const audio = new AudioManager();
const SOUNDS: SoundName[] = [
  "bounce",
  "bumper",
  "target",
  "slingshot",
  "score",
  "lifeLost",
  "gameStart",
  "gameOver",
  "pause",
];
void audio.loadAll(SOUNDS); // load in the background

// Browsers block audio until the user interacts — unlock on first input.
function unlockAudio(): void {
  audio.unlock();
  window.removeEventListener("keydown", unlockAudio);
  window.removeEventListener("pointerdown", unlockAudio);
}
window.addEventListener("keydown", unlockAudio);
window.addEventListener("pointerdown", unlockAudio);

// --- Create the game --------------------------------------------------
const input = new Input();
const game = new Game(input, audio);

// --- Loop -------------------------------------------------------------
const loop = new Loop(
  (dt) => game.update(dt),
  () => {
    game.render(ctx!);
    // Show the right overlay, with best score + new-best flag.
    syncScreens(game.state, game.score.value, game.best, game.isNewBest);
  },
);
loop.start();

console.log("%c⚡ Neon Pinball — Stage 5 (audio + best score) — MVP complete", "color:#00f0ff;font-weight:bold");
