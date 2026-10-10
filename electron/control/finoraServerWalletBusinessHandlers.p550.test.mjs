import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const lifecycle = require(
  "../../dist-electron/control/finoraServerWalletBusinessLifecycle.js",
);
const compiled = fs.readFileSync(
  new URL(
    "../../dist-electron/control/finoraBranchLoginSessionIpc.js",
    import.meta.url,
  ),
  "utf8",
);

function fixture(overrides = {}) {
  const handlers = new Map();
  const owner = { mainFrame: {} };
  const event = { sender: owner, senderFrame: owner.mainFrame };
  const order = [];
  let clears = 0;

  const release = lifecycle.bindFinoraServerWalletBusinessLifecycle(
    owner,
    () => {
      clears++;
      order.push("clear");
    },
  );

  const authority = {
    createFinoraBranchLoginSession: async () => {
      order.push("login");
      return { success: true, data: { synthetic: true } };
    },
    invalidateFinoraBranchLoginSession: () => {
      order.push("invalidate");
      return true;
    },
    validateFinoraBranchLoginSession: async () => ({
      success: true,
      data: { synthetic: true },
    }),
    touchFinoraBranchLoginSession: () => ({
      success: true,
      data: { synthetic: true },
    }),
    ...overrides,
  };

  const module = { exports: {} };
  function limitedRequire(name) {
    if (name === "electron") {
      return {
        ipcMain: {
          handle(channel, handler) {
            assert.equal(handlers.has(channel), false);
            handlers.set(channel, handler);
          },
        },
      };
    }
    if (name === "./finoraBranchLoginSessionAuthority.js") return authority;
    if (name === "./finoraServerWalletBusinessLifecycle.js") return lifecycle;
    throw new Error(`Unexpected test dependency: ${name}`);
  }

  const execute = vm.runInThisContext(
    `(function(require,module,exports){\n${compiled}\n})`,
    { filename: "compiled-business-session-handler.test.cjs" },
  );
  execute(limitedRequire, module, module.exports);

  module.exports.registerFinoraBranchLoginSessionHandlers(
    frame => frame === owner.mainFrame,
    {},
  );

  return {
    owner, event, order, release,
    get clears() { return clears; },
    call(name, suppliedEvent = event) {
      return handlers.get(`finora:login-session:${name}`)(
        suppliedEvent,
        { sessionId: "synthetic-session" },
      );
    },
  };
}

test("untrusted window and subframe cannot clear wallet or authenticate", async () => {
  let authenticationCalls = 0;
  const f = fixture({
    createFinoraBranchLoginSession: async () => {
      authenticationCalls++;
      return { success: true };
    },
  });
  try {
    const other = { mainFrame: {} };
    const events = [
      { sender: other, senderFrame: other.mainFrame },
      { sender: f.owner, senderFrame: {} },
      { sender: f.owner, senderFrame: null },
    ];
    for (const event of events) {
      for (const name of ["login", "invalidate"]) {
        const result = await f.call(name, event);
        assert.equal(result.errorCode, "UNTRUSTED_RENDERER");
      }
    }
    assert.equal(f.clears, 0);
    assert.equal(authenticationCalls, 0);
  } finally {
    f.release();
  }
});

test("login clears before waiting and again before completion returns", async () => {
  let finish;
  let entered = false;
  const pending = new Promise(resolve => { finish = resolve; });
  const f = fixture({
    createFinoraBranchLoginSession: async () => {
      entered = true;
      return pending;
    },
  });
  try {
    const response = f.call("login");
    assert.equal(entered, true);
    assert.equal(f.clears, 1);
    finish({ success: true, data: { synthetic: true } });
    assert.equal((await response).success, true);
    assert.equal(f.clears, 2);
  } finally {
    f.release();
  }
});

test("failed login still clears wallet and preserves rejection", async () => {
  const f = fixture({
    createFinoraBranchLoginSession: async () => ({
      success: false,
      errorCode: "SYNTHETIC_AUTH_REJECTION",
    }),
  });
  try {
    const result = await f.call("login");
    assert.equal(result.errorCode, "SYNTHETIC_AUTH_REJECTION");
    assert.equal(f.clears, 2);
  } finally {
    f.release();
  }
});

test("login exception is sanitized and cannot skip final clearing", async () => {
  const f = fixture({
    createFinoraBranchLoginSession: async () => {
      throw new Error("SYNTHETIC_INTERNAL_DETAIL");
    },
  });
  try {
    const result = await f.call("login");
    assert.equal(result.errorCode, "LOGIN_SESSION_SERVICE_FAILED");
    assert.equal(JSON.stringify(result).includes("SYNTHETIC_INTERNAL_DETAIL"), false);
    assert.equal(f.clears, 2);
  } finally {
    f.release();
  }
});

test("business invalidation clears before and after authority call", async () => {
  const f = fixture();
  try {
    const result = await f.call("invalidate");
    assert.equal(result.success, true);
    assert.equal(result.data.invalidated, true);
    assert.deepEqual(f.order, ["clear", "invalidate", "clear"]);
  } finally {
    f.release();
  }
});

test("business invalidation exception still clears and fails safely", async () => {
  const f = fixture({
    invalidateFinoraBranchLoginSession: () => {
      throw new Error("SYNTHETIC_INVALIDATION_FAILURE");
    },
  });
  try {
    const result = await f.call("invalidate");
    assert.equal(result.errorCode, "LOGIN_SESSION_SERVICE_FAILED");
    assert.equal(f.clears, 2);
  } finally {
    f.release();
  }
});

test("routine validation and activity do not clear wallet access", async () => {
  const f = fixture();
  try {
    assert.equal((await f.call("validate")).success, true);
    assert.equal((await f.call("touch")).success, true);
    assert.equal(f.clears, 0);
  } finally {
    f.release();
  }
});
