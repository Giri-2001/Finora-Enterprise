import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createFinoraServerWalletRechargeClient: createClient } =
  require("../../dist-electron/control/finoraServerWalletRechargeClient.js");

const token = "a".repeat(64);
const key = "ABCDEF12-1111-4111-8111-111111111111";
const input = () => ({
  amountInr: 100,
  paymentMethod: "PHONEPE",
  idempotencyKey: key,
});
const receipt = (replayed = false, status = "PENDING") => ({
  ok: true,
  source: "POSTGRESQL_RECHARGE_REQUESTS",
  request: {
    requestId: "22222222-2222-4222-8222-222222222222",
    walletId: "1234567890",
    amountInr: "100.00",
    paymentMethod: "PHONEPE",
    status,
    createdAt: "2026-10-10T09:00:00.000Z",
  },
  replayed,
});
const json = (body, status = 201) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

test("fixed endpoint sends exact fields and returns only request receipt", async () => {
  let calls = 0;
  const client = createClient(async (url, options) => {
    calls++;
    assert.equal(url, "https://api.finoraenterprise.com/owner/wallet/recharges");
    assert.equal(options.method, "POST");
    const headers = new Headers(options.headers);
    assert.equal(headers.get("authorization"), `Bearer ${token}`);
    assert.equal(headers.get("content-type"), "application/json");
    assert.equal(options.redirect, "error");
    assert.equal(options.credentials, "omit");
    assert.equal(options.cache, "no-store");
    assert.ok(options.signal instanceof AbortSignal);
    assert.deepEqual(JSON.parse(options.body), {
      ...input(), idempotencyKey: key.toLowerCase(),
    });
    const body = receipt();
    body.secret = "private";
    body.request.balanceInr = "999.00";
    body.request.adminActor = "private";
    return json(body);
  });
  const result = await client(token, input());
  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    source: receipt().source,
    request: receipt().request,
    replayed: false,
  });
  assert.equal(calls, 1);
});

test("retries retain PENDING, APPROVED and DECLINED without claiming a new credit", async () => {
  for (const status of ["PENDING", "APPROVED", "DECLINED"]) {
    const client = createClient(async () => json(receipt(true, status), 200));
    const result = await client(token, input());
    assert.equal(result.success, true);
    assert.equal(result.data.replayed, true);
    assert.equal(result.data.request.status, status);
    assert.equal("balanceInr" in result.data, false);
    assert.equal("credited" in result.data, false);
  }
});

test("invalid token, scope selectors, amounts and keys never reach transport", async () => {
  let calls = 0;
  const client = createClient(async () => { calls++; throw new Error("unexpected"); });
  for (const value of ["", "a".repeat(63), token + "\n", "G".repeat(64)]) {
    assert.equal((await client(value, input())).errorCode, "UNAUTHORIZED");
  }
  const invalid = [
    null, [], {}, { ...input(), walletId: "1234567890" },
    ...[49, 2001, 50.5, "100", NaN, Infinity].map(amountInr => ({ ...input(), amountInr })),
    { ...input(), paymentMethod: "OTHER" },
    { ...input(), idempotencyKey: key + "\n" },
    { ...input(), idempotencyKey: "invalid" },
  ];
  for (const value of invalid) {
    assert.equal((await client(token, value)).errorCode, "INVALID_REQUEST");
  }
  assert.equal(calls, 0);
});

test("both payment methods and amount boundaries remain exact decimal strings", async () => {
  for (const amountInr of [50, 2000]) {
    for (const paymentMethod of ["PHONEPE", "GOOGLE_PAY"]) {
      const client = createClient(async () => {
        const body = receipt();
        body.request.amountInr = amountInr.toFixed(2);
        body.request.paymentMethod = paymentMethod;
        return json(body);
      });
      const result = await client(token, { ...input(), amountInr, paymentMethod });
      assert.equal(result.success, true);
      assert.equal(result.data.request.amountInr, amountInr.toFixed(2));
    }
  }
});

test("HTTP failures and transport exceptions are sanitized without automatic retry", async () => {
  for (const [status, errorCode] of [
    [400, "INVALID_REQUEST"], [401, "UNAUTHORIZED"],
    [404, "WALLET_NOT_AVAILABLE"], [409, "IDEMPOTENCY_CONFLICT"],
    [429, "RATE_LIMITED"], [503, "SERVER_UNAVAILABLE"],
    [302, "SERVER_UNAVAILABLE"],
  ]) {
    let calls = 0;
    const client = createClient(async () => {
      calls++;
      return new Response("internal details", { status });
    });
    assert.deepEqual(await client(token, input()), { success: false, errorCode });
    assert.equal(calls, 1);
  }
  const client = createClient(async () => { throw new Error(token); });
  assert.deepEqual(await client(token, input()), {
    success: false, errorCode: "SERVER_UNAVAILABLE",
  });
  assert.throws(() => createClient(null), /TRANSPORT_INVALID/);
});

test("mismatched financial fields and inconsistent replay responses are rejected", async () => {
  const mutations = [
    body => { body.ok = false; },
    body => { body.source = "LOCAL"; },
    body => { body.request.amountInr = 100; },
    body => { body.request.amountInr = "101.00"; },
    body => { body.request.paymentMethod = "GOOGLE_PAY"; },
    body => { body.request.requestId += "\n"; },
    body => { body.request.walletId = "bad"; },
    body => { body.request.createdAt = "bad"; },
    body => { body.request.status = "APPROVED"; },
    body => { body.replayed = true; },
  ];
  for (const mutate of mutations) {
    const body = receipt();
    mutate(body);
    const result = await createClient(async () => json(body))(token, input());
    assert.equal(result.errorCode, "INVALID_SERVER_RESPONSE");
  }
  assert.equal(
    (await createClient(async () => json(receipt(), 200))(token, input())).errorCode,
    "INVALID_SERVER_RESPONSE",
  );
});

test("HTML, invalid JSON and oversized success bodies cannot become receipts", async () => {
  for (const makeResponse of [
    () => new Response("<html>error</html>", {
      status: 201, headers: { "content-type": "text/html" },
    }),
    () => new Response("{", {
      status: 201, headers: { "content-type": "application/json" },
    }),
    () => json({ ...receipt(), extra: "x".repeat(9000) }),
  ]) {
    const result = await createClient(async () => makeResponse())(token, input());
    assert.equal(result.errorCode, "INVALID_SERVER_RESPONSE");
  }
});

test("caller mutation cannot change request snapshot and retry preserves its key", async () => {
  const original = input();
  const sent = [];
  let finish;
  const client = createClient(async (_url, options) => {
    sent.push(JSON.parse(options.body));
    if (sent.length === 1) return new Promise(resolve => { finish = resolve; });
    return json(receipt(true), 200);
  });
  const pending = client(token, original);
  original.amountInr = 999;
  original.paymentMethod = "GOOGLE_PAY";
  original.idempotencyKey = "changed";
  finish(json(receipt()));
  assert.equal((await pending).success, true);
  assert.equal((await client(token, input())).success, true);
  assert.deepEqual(sent[0], sent[1]);
  assert.equal(sent[0].idempotencyKey, key.toLowerCase());
});