import test from "node:test";
import assert from "node:assert/strict";
import { cancelDialogScope, settleDialog } from "../src/lib/pending-dialog.mjs";

function fixture(scopeKey = "1:admin") {
  const results = [];
  const holder = { current: { id: 3, scopeKey, resolve: (value) => results.push(value) } };
  return { holder, results };
}
test("losing authority or switching account cancels an outstanding confirmation", () => {
  for (const next of ["1:public", "2:admin"]) {
    const f = fixture(); assert.equal(cancelDialogScope(f.holder, next), true);
    assert.deepEqual(f.results, [null]); assert.equal(f.holder.current, null);
    assert.equal(settleDialog(f.holder, 3, "1:admin", true), false);
  }
});
test("same-scope renders do not cancel the user's pending dialog", () => {
  const f = fixture(); assert.equal(cancelDialogScope(f.holder, "1:admin"), false); assert.deepEqual(f.results, []);
});
test("an old dialog event cannot confirm a newer request or another account's operation", () => {
  const f = fixture(); assert.equal(settleDialog(f.holder, 2, "1:admin", true), false);
  assert.equal(settleDialog(f.holder, 3, "2:admin", true), false); assert.deepEqual(f.results, []);
});
test("a matching confirmation resolves exactly once", () => {
  const f = fixture(); assert.equal(settleDialog(f.holder, 3, "1:admin", true), true);
  assert.equal(settleDialog(f.holder, 3, "1:admin", true), false); assert.deepEqual(f.results, [true]);
});
