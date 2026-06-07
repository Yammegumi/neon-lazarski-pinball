/* ----------------------------------------------------------------------
   Input.ts — keyboard handling.

   Two kinds of input:
   • HELD keys (flippers) — we ask "is it down right now?" every frame.
   • JUST-PRESSED keys (Enter, Pause) — we want them to fire ONCE per press,
     not repeatedly while held. These are "consumed" by the game each frame.
---------------------------------------------------------------------- */

export class Input {
  /** Keys currently held down. */
  private held = new Set<string>();
  /** Keys that went down THIS frame (cleared each frame by endFrame()). */
  private justPressed = new Set<string>();

  constructor() {
    window.addEventListener("keydown", (e) => {
      // Only count as "just pressed" on the first event, not OS key-repeat.
      if (!this.held.has(e.code)) this.justPressed.add(e.code);
      this.held.add(e.code);
      // Stop arrow keys / space from scrolling the page.
      if (["ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => {
      this.held.delete(e.code);
    });
  }

  /** Left flipper: Left Arrow or A. */
  isLeftFlipper(): boolean {
    return this.held.has("ArrowLeft") || this.held.has("KeyA");
  }

  /** Right flipper: Right Arrow or D. */
  isRightFlipper(): boolean {
    return this.held.has("ArrowRight") || this.held.has("KeyD");
  }

  /**
   * Returns true ONCE if any of the given keys was pressed this frame, and
   * "uses up" that press so it won't trigger again. Used for menu actions.
   */
  consumePressed(...codes: string[]): boolean {
    for (const code of codes) {
      if (this.justPressed.has(code)) {
        this.justPressed.delete(code);
        return true;
      }
    }
    return false;
  }

  /** Clear one-shot presses. Call once at the end of each update frame. */
  endFrame(): void {
    this.justPressed.clear();
  }
}
