import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  registerFinoraServerWalletIpc,
  FINORA_SERVER_WALLET_CHANNELS as channels,
} from "../../dist-electron/control/finoraServerWalletIpcRegistration.js";

const entry = path.resolve("synthetic-owner/index.html");
const url = pathToFileURL(entry).href;
const credentials = { username: "fixture.owner", password: "synthetic", securityCode: "synthetic" };
const date = "2026-10-10T12:00:00.000Z";

function fixture() {
  const owner = new EventEmitter();
  owner.mainFrame = { url };
  owner.isDestroyed = () => false;
  owner.getURL = () => url;

  const handlers = new Map();
  const ipc = {
    handle(channel, handler) {
      if (handlers.has(channel)) throw new Error("duplicate");
      handlers.set(channel, handler);
    },
    removeHandler(channel) { handlers.delete(channel); },
  };

  let clears = 0;
  let calls = 0;
  const service = {
    clearLocal() { clears++; },
    async signIn() {
      calls++;
      return { success: true, data: { expiresAt: date } };
    },
    async enroll() {
      calls++;
      return { success: true, data: { keyId: "test-key", enrolledAt: date } };
    },
    async balance() {
      calls++;
      return { success: false, errorCode: "UNAUTHORIZED" };
    },
    async recharge() {
      calls++;
      return { success: false, errorCode: "IDEMPOTENCY_CONFLICT" };
    },
    async logout() {
      calls++;
      return { localCleared: true, serverStatus: "NO_LOCAL_SESSION" };
    },
  };
  const options = { ipc, owner, packaged: true, ownerEntryPath: entry, service };
  const event = { sender: owner, senderFrame: owner.mainFrame };
  return {
    options, owner, ipc, handlers, event,
    clears: () => clears, calls: () => calls,
  };
}

test("registers five exact channels and forwards trusted Owner calls", async () => {
  const f = fixture();
  const registration = registerFinoraServerWalletIpc(f.options);
  assert.deepEqual([...f.handlers.keys()].sort(), [
    "finora:server-wallet:balance",
    "finora:server-wallet:enroll",
    "finora:server-wallet:logout",
    "finora:server-wallet:recharge",
    "finora:server-wallet:sign-in",
  ]);
  assert.equal(
    (await f.handlers.get(channels.signIn)(f.event, credentials)).success, true,
  );
  assert.equal(f.calls(), 1);
  registration.dispose();
  assert.equal(f.handlers.size, 0);
});

test("another window and subframe cannot reach service", async () => {
  const f = fixture();
  const registration = registerFinoraServerWalletIpc(f.options);
  for (const event of [
    { sender: {}, senderFrame: f.owner.mainFrame },
    { sender: f.owner, senderFrame: { url } },
  ]) {
    assert.equal(
      (await f.handlers.get(channels.signIn)(event, credentials)).errorCode,
      "UNAUTHORIZED",
    );
  }
  assert.equal(f.calls(), 0);
  registration.dispose();
});

test("argument count is enforced before service invocation", async () => {
  const f = fixture();
  const registration = registerFinoraServerWalletIpc(f.options);
  assert.equal(
    (await f.handlers.get(channels.balance)(f.event, {})).errorCode,
    "INVALID_REQUEST",
  );
  assert.equal(
    (await f.handlers.get(channels.signIn)(f.event, credentials, {})).errorCode,
    "INVALID_REQUEST",
  );
  assert.equal(f.calls(), 0);
  registration.dispose();
});

test("main document navigation and renderer crash clear local access", () => {
  const f = fixture();
  const registration = registerFinoraServerWalletIpc(f.options);
  f.owner.emit("did-start-navigation", { isMainFrame: true, isSameDocument: false });
  assert.equal(f.clears(), 1);
  f.owner.emit("render-process-gone", {}, { reason: "crashed" });
  assert.equal(f.clears(), 2);
  registration.dispose();
});

test("hash navigation and subframe navigation preserve the current session", () => {
  const f = fixture();
  const registration = registerFinoraServerWalletIpc(f.options);
  f.owner.emit("did-start-navigation", { isMainFrame: true, isSameDocument: true });
  f.owner.emit("did-start-navigation", { isMainFrame: false, isSameDocument: false });
  assert.equal(f.clears(), 0);
  registration.invalidate();
  assert.equal(f.clears(), 1);
  registration.dispose();
});

test("destroy removes channels and listeners; disposal is idempotent", () => {
  const f = fixture();
  const registration = registerFinoraServerWalletIpc(f.options);
  f.owner.emit("destroyed");
  assert.equal(f.handlers.size, 0);
  assert.equal(f.owner.listenerCount("did-start-navigation"), 0);
  assert.equal(f.owner.listenerCount("render-process-gone"), 0);
  const clears = f.clears();
  registration.dispose();
  assert.equal(f.clears(), clears);
});

test("duplicate registration cannot replace working handlers", () => {
  const f = fixture();
  const registration = registerFinoraServerWalletIpc(f.options);
  const original = f.handlers.get(channels.signIn);
  assert.throws(() => registerFinoraServerWalletIpc(f.options));
  assert.equal(f.handlers.get(channels.signIn), original);
  registration.dispose();
});

test("partial registration failure removes only newly installed handlers", () => {
  const f = fixture();
  const existing = () => "existing";
  f.handlers.set(channels.balance, existing);
  assert.throws(() => registerFinoraServerWalletIpc(f.options));
  assert.equal(f.handlers.size, 1);
  assert.equal(f.handlers.get(channels.balance), existing);
  assert.equal(f.owner.listenerCount("did-start-navigation"), 0);
});
test("recharge channel enforces exact arguments and trusted main frame", async () => {
  const f = fixture();
  const registration = registerFinoraServerWalletIpc(f.options);
  try {
    const handler = f.handlers.get(channels.recharge);
    assert.equal(typeof handler, "function");
    const input = {
      amountInr: 100, paymentMethod: "PHONEPE",
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
    };
    assert.equal((await handler(f.event)).errorCode, "INVALID_REQUEST");
    assert.equal((await handler(f.event, input, {})).errorCode, "INVALID_REQUEST");
    for (const event of [
      { sender: {}, senderFrame: f.owner.mainFrame },
      { sender: f.owner, senderFrame: { url } },
    ]) {
      assert.equal((await handler(event, input)).errorCode, "UNAUTHORIZED");
    }
    assert.equal(f.calls(), 0);
    assert.equal((await handler(f.event, { ...input, walletId: "1234567890" }))
      .errorCode, "INVALID_REQUEST");
    assert.equal(f.calls(), 0);
    assert.equal((await handler(f.event, input)).errorCode, "IDEMPOTENCY_CONFLICT");
    assert.equal(f.calls(), 1);
  } finally {
    registration.dispose();
  }
  assert.equal(f.handlers.has(channels.recharge), false);
});

test("navigation suppresses a recharge reply already awaiting service", async () => {
  const f = fixture();
  let finish;
  f.options.service.recharge = () => new Promise(resolve => { finish = resolve; });
  const registration = registerFinoraServerWalletIpc(f.options);
  try {
    const pending = f.handlers.get(channels.recharge)(f.event, {
      amountInr: 100, paymentMethod: "PHONEPE",
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
    });
    f.owner.emit("did-start-navigation", {
      isMainFrame: true, isSameDocument: false,
    });
    finish({ success: false, errorCode: "IDEMPOTENCY_CONFLICT" });
    assert.equal((await pending).errorCode, "STALE_OPERATION");
    assert.equal(f.clears(), 1);
  } finally {
    registration.dispose();
  }
});
