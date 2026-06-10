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
import { loadBoardLayout, SAVED_BOARD_KEY } from "./board/BoardLayout.ts";
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

// --- Create the game (after loading the editable board layout) --------
async function boot(): Promise<void> {
  const input = new Input();
  const layout = await loadBoardLayout(); // public/boards/board.json or default
  const game = new Game(input, audio, layout);

  // --- Leaderboard name entry ----------------------------------------
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
  nameInput.addEventListener("input", () => {
    nameInput.value = nameInput.value.toUpperCase().replace(/[^A-Z]/g, "");
  });

  // --- Secret: the Konami code opens the hidden board editor ----------
  // ↑ ↑ ↓ ↓ ← → ← → B A  (not shown anywhere in-game)
  const KONAMI = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA",
  ];
  const seq: string[] = [];
  window.addEventListener("keydown", (e) => {
    seq.push(e.code);
    if (seq.length > KONAMI.length) seq.shift();
    if (seq.length === KONAMI.length && KONAMI.every((k, i) => seq[i] === k)) {
      window.location.href = `${import.meta.env.BASE_URL}editor.html`;
    }
  });

  // --- Load a board locally: drag a board.json onto the window --------
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        const layout = JSON.parse(text);
        localStorage.setItem(SAVED_BOARD_KEY, text); // persist across reloads
        game.loadBoard(layout); // apply live
      } catch {
        alert("Nie udało się wczytać tej planszy (board.json).");
      }
    };
    reader.readAsText(file);
  });

  // --- Loop ----------------------------------------------------------
  const loop = new Loop(
    (dt) => game.update(dt),
    () => {
      game.render(ctx!);
      syncScreens(game.getView());
    },
  );
  loop.start();
}

void boot();

console.log("%c⚡ Neon Pinball — board loaded from board.json", "color:#00f0ff;font-weight:bold");
