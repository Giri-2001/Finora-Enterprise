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

test("registers eleven exact channels and forwards trusted Owner calls", async () => {
  const f = fixture();
  const registration = registerFinoraServerWalletIpc(f.options);
  assert.deepEqual([...f.handlers.keys()].sort(), [
    "finora:server-wallet:balance",
    "finora:server-wallet:enroll",
    "finora:server-wallet:logout",
    "finora:server-wallet:pricing",
    "finora:server-wallet:recharge",
    "finora:server-wallet:recharges",
    "finora:server-wallet:sign-in",
    "finora:server-wallet:subscription-pending",
    "finora:server-wallet:subscription-purchase",
    "finora:server-wallet:subscription-resume",
    "finora:server-wallet:transactions",
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

// FINORA_P1_647H_PURCHASE_IPC_NEGATIVE_TEST
test("purchase IPC refuses unconfigured service and untrusted sender", async () => {
  const f = fixture();
  const registration = registerFinoraServerWalletIpc(f.options);
  const purchase = f.handlers.get(channels.subscriptionPurchase);

  assert.equal(typeof purchase, "function");

  const input = {
    planMonths: 1,
    idempotencyKey: "11111111-1111-4111-8111-111111111111",
  };

  assert.equal(
    (await purchase(f.event, input)).errorCode,
    "UNAUTHORIZED",
  );
  assert.equal(
    (await purchase(
      { sender: {}, senderFrame: f.owner.mainFrame },
      input,
    )).errorCode,
    "UNAUTHORIZED",
  );

  assert.equal(f.calls(), 0);
  registration.dispose();
});
// FINORA_P1_647I_PURCHASE_MOCK_TESTS
test("purchase IPC forwards only verified Owner payload", async () => {
  const f = fixture();
  const calls = [];
  f.options.purchaseService = async input => {
    calls.push(input);
    return { success: true, data: {
      source: "POSTGRESQL_SUBSCRIPTION_PURCHASE",
      replayed: false,
      purchaseId: "11111111-1111-4111-8111-111111111111",
      subscriptionId: "1234567890",
      transactionId: "1234567891",
      amountInr: "199.00",
      balanceInr: "151.00",
      startsAt: "2026-10-20T00:00:00.000Z",
      expiresAt: "2026-11-20T00:00:00.000Z",
      status: "ACTIVE",
    } };
  };

  const registration = registerFinoraServerWalletIpc(f.options);
  const purchase = f.handlers.get(channels.subscriptionPurchase);
  const input = {
    planMonths: 1,
    idempotencyKey: "AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA",
  };

  const result = await purchase(f.event, input);
  assert.equal(result.success, true);
  assert.deepEqual(calls, [{
    planMonths: 1,
    idempotencyKey: input.idempotencyKey.toLowerCase(),
  }]);

  registration.dispose();
});

test("purchase IPC rejects foreign sender and malformed payload", async () => {
  const f = fixture();
  let calls = 0;
  f.options.purchaseService = async () => {
    calls++;
    return { success: true };
  };

  const registration = registerFinoraServerWalletIpc(f.options);
  const purchase = f.handlers.get(channels.subscriptionPurchase);
  const valid = {
    planMonths: 1,
    idempotencyKey: "11111111-1111-4111-8111-111111111111",
  };

  const invalid = [
    null,
    [],
    {},
    { ...valid, planMonths: 2 },
    { ...valid, idempotencyKey: "invalid" },
    { ...valid, ownerId: "forbidden" },
    { ...valid, branchId: "forbidden" },
    { ...valid, token: "forbidden" },
  ];

  for (const value of invalid) {
    assert.notEqual(
      (await purchase(f.event, value)).success,
      true,
    );
  }

  assert.equal(
    (await purchase(f.event, valid, {})).success,
    false,
  );

  assert.equal(
    (await purchase(
      { sender: {}, senderFrame: f.owner.mainFrame },
      valid,
    )).errorCode,
    "UNAUTHORIZED",
  );

  assert.equal(
    (await purchase(
      { sender: f.owner, senderFrame: { url } },
      valid,
    )).errorCode,
    "UNAUTHORIZED",
  );

  assert.equal(calls, 0);
  registration.dispose();
});

test("purchase IPC suppresses response after Owner navigation", async () => {
  const f = fixture();
  let resolveService;
  let calls = 0;

  f.options.purchaseService = () => {
    calls++;
    return new Promise(resolve => {
      resolveService = resolve;
    });
  };

  const registration = registerFinoraServerWalletIpc(f.options);
  const purchase = f.handlers.get(channels.subscriptionPurchase);
  const input = {
    planMonths: 3,
    idempotencyKey: "22222222-2222-4222-8222-222222222222",
  };

  const pending = purchase(f.event, input);
  assert.equal(calls, 1);

  f.owner.emit("did-start-navigation", {
    isMainFrame: true,
    isSameDocument: false,
  });

  resolveService({ success: true, data: { mock: true } });

  const result = await pending;
  assert.equal(result.errorCode, "STALE_OPERATION");

  registration.dispose();
});
// FINORA_P1_648B_PENDING_STATUS_IPC_TEST
test("pending subscription status is read-only and Owner-scoped", async () => {
  const f = fixture();
  let calls = 0;

  f.options.purchaseStatusService = async () => {
    calls++;
    return {
      success: true,
      data: { pending: true, planMonths: 1 },
    };
  };

  const registration = registerFinoraServerWalletIpc(f.options);
  const status = f.handlers.get(channels.subscriptionPending);

  const result = await status(f.event);
  assert.deepEqual(result, {
    success: true,
    data: { pending: true, planMonths: 1 },
  });

  assert.equal("idempotencyKey" in result.data, false);
  assert.equal("walletId" in result.data, false);

  assert.equal(
    (await status({ sender: {}, senderFrame: f.owner.mainFrame }))
      .errorCode,
    "UNAUTHORIZED",
  );
  assert.equal(
    (await status(f.event, {})).errorCode,
    "UNAUTHORIZED",
  );
  assert.equal(calls, 1);

  registration.dispose();
});
// FINORA_P1_648E_RESUME_TEST
test("resume IPC requires trusted Owner and no arguments", async () => {
  const f = fixture();
  let calls = 0;
  f.options.purchaseResumeService = async () => {
    calls++;
    return { success: false, errorCode: "NO_PENDING_PURCHASE" };
  };

  const registration = registerFinoraServerWalletIpc(f.options);
  const resume = f.handlers.get(channels.subscriptionResume);
  assert.equal(typeof resume, "function");

  assert.equal(
    (await resume(f.event)).errorCode,
    "NO_PENDING_PURCHASE",
  );
  assert.equal(calls, 1);

  assert.equal(
    (await resume(f.event, { idempotencyKey: "forbidden" })).errorCode,
    "UNAUTHORIZED",
  );
  assert.equal(
    (await resume({ sender: {}, senderFrame: f.owner.mainFrame }))
      .errorCode,
    "UNAUTHORIZED",
  );
  assert.equal(calls, 1);
  registration.dispose();
});

test("resume IPC suppresses stale response after navigation", async () => {
  const f = fixture();
  let resolveRequest;

  f.options.purchaseResumeService = () => new Promise(resolve => {
    resolveRequest = resolve;
  });

  const registration = registerFinoraServerWalletIpc(f.options);
  const resume = f.handlers.get(channels.subscriptionResume);
  const pending = resume(f.event);

  f.owner.emit("did-start-navigation", {
    isMainFrame: true,
    isSameDocument: false,
  });

  resolveRequest({ success: true, data: { mock: true } });
  assert.equal((await pending).errorCode, "STALE_OPERATION");
  registration.dispose();
});
// FINORA_P1_648R_RECEIPT_REGRESSION
test("purchase and resume strip private fields from valid receipt", async () => {
  for (const method of ["subscriptionPurchase", "subscriptionResume"]) {
    const f = fixture();
    const service = async () => ({
      success: true,
      privateInternal: "NEVER_EXPOSE",
      data: {
        source: "POSTGRESQL_SUBSCRIPTION_PURCHASE",
        replayed: false,
        purchaseId: "11111111-1111-4111-8111-111111111111",
        subscriptionId: "1234567890",
        transactionId: "1234567891",
        amountInr: "199.00",
        balanceInr: "151.00",
        startsAt: "2026-10-20T00:00:00.000Z",
        expiresAt: "2026-11-20T00:00:00.000Z",
        status: "ACTIVE",
        internalToken: "NEVER_EXPOSE",
      },
    });
    if (method === "subscriptionPurchase") f.options.purchaseService = service;
    else f.options.purchaseResumeService = service;
    const registration = registerFinoraServerWalletIpc(f.options);
    const handler = f.handlers.get(channels[method]);
    const args = method === "subscriptionPurchase"
      ? [{planMonths:1,idempotencyKey:
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}]
      : [];
    const result = await handler(f.event,...args);
    assert.equal(result.success,true);
    assert.equal(result.data.amountInr,"199.00");
    assert.equal("internalToken" in result.data,false);
    assert.equal("privateInternal" in result,false);
    registration.dispose();
  }
});

test("purchase and resume reject malformed receipt and private error", async () => {
  for (const method of ["subscriptionPurchase", "subscriptionResume"]) {
    const f = fixture();
    let current = {
      success:true,
      data:{status:"ACTIVE",privateField:"NEVER_EXPOSE"},
    };
    const service = async () => current;
    if (method === "subscriptionPurchase") f.options.purchaseService = service;
    else f.options.purchaseResumeService = service;
    const registration = registerFinoraServerWalletIpc(f.options);
    const handler = f.handlers.get(channels[method]);
    const args = method === "subscriptionPurchase"
      ? [{planMonths:1,idempotencyKey:
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}]
      : [];
    const bad = await handler(f.event,...args);
    assert.equal(bad.success,false);
    assert.equal(bad.errorCode,"PURCHASE_RECONCILIATION_REQUIRED");
    assert.equal("data" in bad,false);
    current = {
      success:false,errorCode:"PRIVATE_DATABASE_ERROR",
      privateDebug:"NEVER_EXPOSE",
    };
    const masked = await handler(f.event,...args);
    assert.equal(masked.errorCode,"PURCHASE_RECONCILIATION_REQUIRED");
    assert.equal("privateDebug" in masked,false);
    registration.dispose();
  }
});