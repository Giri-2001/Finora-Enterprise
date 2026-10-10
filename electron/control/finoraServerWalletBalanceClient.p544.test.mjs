import test from "node:test";
import assert from "node:assert/strict";
import {
  createFinoraServerWalletBalanceClient as createClient,
} from "../../dist-electron/control/finoraServerWalletBalanceClient.js";

const token = "a".repeat(64);
const body = {
  ok: true,
  source: "POSTGRESQL_WALLETS",
  walletId: "2025138492",
  balanceInr: "50.00",
  currency: "INR",
  updatedAt: "2026-10-10T05:00:00.000Z",
};

function response(value = body, status = 200) {
  return new Response(JSON.stringify(value), {
    status, headers: { "content-type": "application/json" },
  });
}

test("reads authoritative decimal balance without exposing extra response fields", async () => {
  const read = createClient(async () => response({
    ...body, internalDetail: "HIDDEN",
  }));
  assert.deepEqual(await read(token), {
    success: true,
    data: {
      source: body.source, walletId: body.walletId,
      balanceInr: "50.00", currency: "INR", updatedAt: body.updatedAt,
    },
  });
});

test("uses fixed HTTPS endpoint and prevents redirect/cookie/cache use", async () => {
  let captured;
  const read = createClient(async (...args) => {
    captured = args;
    return response();
  });
  await read(token);
  assert.equal(captured[0],
    "https://api.finoraenterprise.com/owner/wallet/balance");
  const options = captured[1];
  assert.equal(options.method, "GET");
  assert.equal(options.headers.authorization, `Bearer ${token}`);
  assert.equal(options.redirect, "error");
  assert.equal(options.credentials, "omit");
  assert.equal(options.cache, "no-store");
  assert.equal(options.body, undefined);
  assert.ok(options.signal instanceof AbortSignal);
});

test("invalid tokens never make a network request", async () => {
  let calls = 0;
  const read = createClient(async () => { calls++; return response(); });
  for (const value of [null, "", "invalid", token + "\n", "A".repeat(64)]) {
    assert.deepEqual(await read(value), {
      success: false, errorCode: "UNAUTHORIZED",
    });
  }
  assert.equal(calls, 0);
});

test("auth, missing wallet and unavailable responses never fabricate balance", async () => {
  for (const [status, errorCode] of [
    [401, "UNAUTHORIZED"], [404, "WALLET_NOT_FOUND"],
    [403, "SERVER_UNAVAILABLE"], [429, "SERVER_UNAVAILABLE"],
    [500, "SERVER_UNAVAILABLE"], [503, "SERVER_UNAVAILABLE"],
  ]) {
    const read = createClient(async () => response({ balanceInr: "0.00" }, status));
    assert.deepEqual(await read(token), { success: false, errorCode });
  }
});

test("network and abort exceptions expose only unavailable", async () => {
  for (const error of [
    new Error("PRIVATE_NETWORK_DETAIL"),
    new DOMException("Synthetic timeout", "AbortError"),
  ]) {
    const read = createClient(async () => { throw error; });
    assert.deepEqual(await read(token), {
      success: false, errorCode: "SERVER_UNAVAILABLE",
    });
  }
});

test("malformed response and untrusted financial values are rejected", async () => {
  for (const changes of [
    { ok: false }, { source: "LOCAL" }, { currency: "USD" },
    { walletId: "FINORA:WALLET:LOCAL" }, { walletId: "2025138492\n" },
    { balanceInr: 50 }, { balanceInr: "-1.00" },
    { balanceInr: "NaN" }, { balanceInr: "50.001" },
    { balanceInr: "50.00\n" }, { balanceInr: "10000000000.00" },
    { updatedAt: "invalid" },
  ]) {
    const read = createClient(async () => response({ ...body, ...changes }));
    assert.deepEqual(await read(token), {
      success: false, errorCode: "INVALID_SERVER_RESPONSE",
    });
  }
});

test("valid server zero and maximum NUMERIC balance remain exact strings", async () => {
  for (const balanceInr of ["0.00", "0.01", "9999999999.99"]) {
    const read = createClient(async () => response({ ...body, balanceInr }));
    const result = await read(token);
    assert.equal(result.success, true);
    assert.equal(result.data.balanceInr, balanceInr);
  }
});

test("HTML and broken JSON cannot become successful wallet data", async () => {
  for (const makeResponse of [
    () => new Response("<html>Error</html>", {
      headers: { "content-type": "text/html" },
    }),
    () => new Response("{", {
      headers: { "content-type": "application/json" },
    }),
    () => response(null),
  ]) {
    const read = createClient(async () => makeResponse());
    assert.deepEqual(await read(token), {
      success: false, errorCode: "INVALID_SERVER_RESPONSE",
    });
  }
  assert.throws(() => createClient(null), /TRANSPORT_INVALID/);
});