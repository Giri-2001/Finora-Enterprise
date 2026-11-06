import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const TOKEN_A = "a".repeat(64);
const TOKEN_B = "b".repeat(64);
const BUSINESS = "c".repeat(64);

const scope = {
  userId: "u1",
  ownerId: "o1",
  businessId: "b1",
  branchId: "br1",
};

function deferred() {
  let resolve;
  const promise = new Promise(r => {
    resolve = r;
  });
  return { promise, resolve };
}

function harness(ttlMs = 300_000) {
  const source = fs.readFileSync(
    "electron/control/finoraSenderWalletSession.ts",
    "utf8",
  );

  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "finoraSenderWalletSession.ts",
    reportDiagnostics: true,
  });

  assert.equal(
    compiled.diagnostics?.length ?? 0,
    0,
    "TypeScript transpile diagnostics",
  );

  let account = { ...scope };

  const mockAuthenticate = async () => ({
    success: true,
    accessToken: TOKEN_A,
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
    principal: { ...account },
  });

  const module = { exports: {} };
  const evaluate = new Function(
    "require",
    "module",
    "exports",
    compiled.outputText,
  );

  evaluate(
    specifier => {
      if (specifier === "./finoraAccountPasswordLoginClient.js") {
        return {
          authenticateFinoraAccountPassword: mockAuthenticate,
        };
      }
      throw new Error("UNEXPECTED_IMPORT");
    },
    module,
    module.exports,
  );

  return {
    api: module.exports,
    setAccount(value) {
      account = { ...value };
    },
  };
}

function successResponse() {
  return {
    success: true,
    accessToken: TOKEN_B,
    expiresAt: new Date(
      Date.now() + 3_600_000,
    ).toISOString(),
    scope: { ...scope },
  };
}

async function login(api, sender) {
  const result = await api.establishFinoraSenderWallet(
    sender,
    "owner",
    "test-only-password",
  );
  assert.equal(result.success, true);
}

test("valid near-expiry session rotates successfully", async () => {
  const { api } = harness();
  const sender = {};
  await login(api, sender);

  let calls = 0;

  const result = await api.rotateFinoraSenderWalletIfDue(
    sender,
    BUSINESS,
    scope,
    async () => {
      calls++;
      return successResponse();
    },
  );

  assert.deepEqual(result, {
    success: true,
    rotated: true,
  });
  assert.equal(calls, 1);
  assert.equal(
    api.getFinoraSenderWalletAuthorization(sender),
    `Bearer ${TOKEN_B}`,
  );
});

test("logout defeats in-flight rotation response", async () => {
  const { api } = harness();
  const sender = {};
  await login(api, sender);

  const pending = deferred();

  const task = api.rotateFinoraSenderWalletIfDue(
    sender,
    BUSINESS,
    scope,
    () => pending.promise,
  );

  api.clearFinoraSenderWallet(sender);
  pending.resolve(successResponse());

  const result = await task;

  assert.equal(result.success, false);
  assert.equal(result.rotated, false);
  assert.equal(
    api.getFinoraSenderWalletAuthorization(sender),
    null,
  );
});

test("account switch defeats stale rotation response", async () => {
  const h = harness();
  const sender = {};
  await login(h.api, sender);

  const pending = deferred();

  const task = h.api.rotateFinoraSenderWalletIfDue(
    sender,
    BUSINESS,
    scope,
    () => pending.promise,
  );

  const different = {
    ...scope,
    ownerId: "other-owner",
    branchId: "other-branch",
  };

  h.setAccount(different);
  await login(h.api, sender);

  pending.resolve(successResponse());

  const stale = await task;

  assert.equal(stale.success, false);
  assert.deepEqual(
    h.api.getFinoraSenderWalletPrincipal(sender),
    different,
  );
});

test("concurrent activity creates only one rotation request", async () => {
  const { api } = harness();
  const sender = {};
  await login(api, sender);

  const pending = deferred();
  let calls = 0;

  const transport = () => {
    calls++;
    return pending.promise;
  };

  const first = api.rotateFinoraSenderWalletIfDue(
    sender, BUSINESS, scope, transport,
  );
  const second = api.rotateFinoraSenderWalletIfDue(
    sender, BUSINESS, scope, transport,
  );

  assert.equal(calls, 1);

  pending.resolve(successResponse());

  const [one, two] = await Promise.all([first, second]);

  assert.equal(one.success, true);
  assert.equal(two.success, true);
  assert.equal(calls, 1);
});

test("wrong branch never contacts rotation service", async () => {
  const { api } = harness();
  const sender = {};
  await login(api, sender);

  let called = false;

  const result = await api.rotateFinoraSenderWalletIfDue(
    sender,
    BUSINESS,
    { ...scope, branchId: "wrong-branch" },
    async () => {
      called = true;
      return successResponse();
    },
  );

  assert.equal(result.success, false);
  assert.equal(called, false);
});

test("session with more than 10 minutes remaining does not rotate", async () => {
  const { api } = harness(3_000_000);
  const sender = {};
  await login(api, sender);

  let called = false;

  const result = await api.rotateFinoraSenderWalletIfDue(
    sender,
    BUSINESS,
    scope,
    async () => {
      called = true;
      return successResponse();
    },
  );

  assert.deepEqual(result, {
    success: true,
    rotated: false,
  });
  assert.equal(called, false);
});

test("expired Wallet cannot be rescued by rotation", async () => {
  const { api } = harness(20);
  const sender = {};
  await login(api, sender);

  await new Promise(resolve => setTimeout(resolve, 50));

  let called = false;

  const result = await api.rotateFinoraSenderWalletIfDue(
    sender,
    BUSINESS,
    scope,
    async () => {
      called = true;
      return successResponse();
    },
  );

  assert.equal(result.success, false);
  assert.equal(called, false);
  assert.equal(
    api.getFinoraSenderWalletAuthorization(sender),
    null,
  );
});

test("invalid replacement scope retains existing token", async () => {
  const { api } = harness();
  const sender = {};
  await login(api, sender);

  const result = await api.rotateFinoraSenderWalletIfDue(
    sender,
    BUSINESS,
    scope,
    async () => ({
      ...successResponse(),
      scope: { ...scope, ownerId: "attacker" },
    }),
  );

  assert.equal(result.success, false);
  assert.equal(
    api.getFinoraSenderWalletAuthorization(sender),
    `Bearer ${TOKEN_A}`,
  );
});