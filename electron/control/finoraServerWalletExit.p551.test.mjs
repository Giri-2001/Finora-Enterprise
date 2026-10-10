import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL(
  "../../app/renderer/v2/services/wallet/finoraServerWalletExit.ts",
  import.meta.url,
), "utf8");

const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
}).outputText;

function load(bridge) {
  const module = { exports: {} };
  const execute = vm.runInThisContext(
    "(function(require,module,exports){" + compiled + "})",
  );
  execute(name => {
    assert.equal(name, "./finoraServerWalletBridge");
    return { getFinoraServerWalletBridge: () => bridge };
  }, module, module.exports);
  return module.exports.endFinoraServerWalletAccess;
}

test("missing bridge does not claim local clearing or server revocation", async () => {
  assert.deepEqual(await load(null)(), {
    localCleared: false, serverStatus: "BRIDGE_UNAVAILABLE",
  });
});

test("logout is called without a business session ID or scope", async () => {
  let calls = 0;
  const exit = load({
    logout: async (...args) => {
      calls++;
      assert.deepEqual(args, []);
      return { localCleared: true, serverStatus: "REVOKED", extra: "discard" };
    },
  });
  assert.deepEqual(await exit(), { localCleared: true, serverStatus: "REVOKED" });
  assert.equal(calls, 1);
});

test("local clearing and unconfirmed server outcome remain separate", async () => {
  for (const serverStatus of [
    "NOT_REVOKED", "NO_LOCAL_SESSION", "UNAUTHORIZED", "SERVER_UNAVAILABLE",
  ]) {
    const exit = load({ logout: async () => ({ localCleared: true, serverStatus }) });
    assert.deepEqual(await exit(), { localCleared: true, serverStatus });
  }
});

test("failed and malformed local clearing cannot report success", async () => {
  for (const result of [
    null, {}, { localCleared: false, serverStatus: "REVOKED" },
    { localCleared: "true", serverStatus: "REVOKED" },
  ]) {
    const exit = load({ logout: async () => result });
    assert.deepEqual(await exit(), {
      localCleared: false, serverStatus: "SERVER_UNAVAILABLE",
    });
  }
});

test("unknown server status cannot become confirmed revocation", async () => {
  const exit = load({
    logout: async () => ({ localCleared: true, serverStatus: "UNKNOWN" }),
  });
  assert.deepEqual(await exit(), {
    localCleared: true, serverStatus: "INVALID_SERVER_RESPONSE",
  });
});

test("IPC exceptions are sanitized without rejecting forced-exit cleanup", async () => {
  const exit = load({
    logout: async () => { throw new Error("SYNTHETIC_INTERNAL_DETAIL"); },
  });
  assert.deepEqual(await exit(), {
    localCleared: false, serverStatus: "SERVER_UNAVAILABLE",
  });
});
