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
  "powerup",
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

// --- Leaderboard name entry ------------------------------------------
// The initials <input> is kept separate from the game's keyboard input:
// stopPropagation() prevents these keystrokes from reaching the global
// key handler (so typing "AAA" doesn't flip flippers / restart).
const nameInput = document.getElementById("name-input") as HTMLInputElement;
nameInput.addEventListener("keydown", (e) => {
  e.stopPropagation();
  if (e.key === "Enter") {
    game.submitName(nameInput.value);
    nameInput.value = "";
  }
});
// Force uppercase letters only as the player types.
nameInput.addEventListener("input", () => {
  nameInput.value = nameInput.value.toUpperCase().replace(/[^A-Z]/g, "");
});

// --- Loop -------------------------------------------------------------
const loop = new Loop(
  (dt) => game.update(dt),
  () => {
    game.render(ctx!);
    // Show the right overlay with all its dynamic content.
    syncScreens(game.getView());
  },
);
loop.start();

console.log("%c⚡ Neon Pinball — Stage 9 (power-ups)", "color:#00f0ff;font-weight:bold");
