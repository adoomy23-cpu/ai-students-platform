import test from "node:test";
import assert from "node:assert/strict";
import { bindDisclosureDismissal } from "../src/lib/disclosure.mjs";

function fixture() {
  const listeners = new Map(); let closed = 0, focused = 0;
  const target = { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name); } };
  const cleanup = bindDisclosureDismissal(target, { contains: (node) => node === "inside", dismiss: () => closed++, restoreFocus: () => focused++ });
  return { listeners, cleanup, counts: () => ({ closed, focused }) };
}
test("Escape dismisses the navigation and returns focus to its trigger", () => {
  const f = fixture(); f.listeners.get("keydown")({ key: "Escape" });
  assert.deepEqual(f.counts(), { closed: 1, focused: 1 }); f.cleanup();
});
test("pointer interaction inside the navigation does not dismiss it", () => {
  const f = fixture(); f.listeners.get("pointerdown")({ target: "inside" });
  assert.deepEqual(f.counts(), { closed: 0, focused: 0 }); f.cleanup();
});
test("outside interaction dismisses without stealing the destination's focus", () => {
  const f = fixture(); f.listeners.get("pointerdown")({ target: "outside" });
  assert.deepEqual(f.counts(), { closed: 1, focused: 0 }); f.cleanup();
});
test("other keys preserve normal keyboard navigation and cleanup removes both handlers", () => {
  const f = fixture(); for (const key of ["Tab", "Enter", "ArrowDown"]) f.listeners.get("keydown")({ key });
  assert.deepEqual(f.counts(), { closed: 0, focused: 0 }); f.cleanup(); assert.equal(f.listeners.size, 0);
});
