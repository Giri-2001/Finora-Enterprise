import test from "node:test";
import assert from "node:assert/strict";
import {
  bindFinoraServerWalletBusinessLifecycle as bind,
  invalidateFinoraServerWalletForBusinessTransition as invalidate,
} from "../../dist-electron/control/finoraServerWalletBusinessLifecycle.js";

test("business transition clears only the exact bound Owner", () => {
  const owner = {};
  const other = {};
  let calls = 0;
  const release = bind(owner, () => calls++);
  invalidate(other);
  assert.equal(calls, 0);
  invalidate(owner);
  assert.equal(calls, 1);
  release();
});

test("two windows cannot clear each other's wallet", () => {
  const first = {};
  const second = {};
  const calls = [0, 0];
  const releaseFirst = bind(first, () => calls[0]++);
  const releaseSecond = bind(second, () => calls[1]++);
  invalidate(first);
  assert.deepEqual(calls, [1, 0]);
  invalidate(second);
  assert.deepEqual(calls, [1, 1]);
  releaseFirst();
  releaseSecond();
});

test("duplicate binding cannot replace the working callback", () => {
  const owner = {};
  let calls = 0;
  const release = bind(owner, () => calls++);
  assert.throws(() => bind(owner, () => {
    throw new Error("Replacement must not run");
  }));
  invalidate(owner);
  assert.equal(calls, 1);
  release();
});

test("disposal is idempotent and stale disposal preserves a new binding", () => {
  const owner = {};
  let oldCalls = 0;
  let newCalls = 0;
  const releaseOld = bind(owner, () => oldCalls++);
  releaseOld();
  invalidate(owner);
  assert.equal(oldCalls, 0);
  const releaseNew = bind(owner, () => newCalls++);
  releaseOld();
  invalidate(owner);
  assert.equal(newCalls, 1);
  releaseNew();
  invalidate(owner);
  assert.equal(newCalls, 1);
});

test("invalid binding dependencies are rejected", () => {
  assert.throws(() => bind(null, () => {}));
  assert.throws(() => bind("owner", () => {}));
  assert.throws(() => bind({}, null));
});
