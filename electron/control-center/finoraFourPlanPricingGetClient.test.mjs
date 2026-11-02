import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";

async function compile(sourceName, replacements = []) {
  let raw = await fs.readFile(
    new URL(sourceName, import.meta.url),
    "utf8",
  );

  for (const [oldText, newText] of replacements) {
    assert.ok(raw.includes(oldText));
    raw = raw.replace(oldText, newText);
  }

  const output = ts.transpileModule(raw, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
    reportDiagnostics: true,
  });

  assert.equal(
    output.diagnostics?.filter(
      d => d.category === ts.DiagnosticCategory.Error,
    ).length ?? 0,
    0,
  );

  return `data:text/javascript;base64,${
    Buffer.from(output.outputText).toString("base64")
  }`;
}

const contractUrl = await compile(
  "./finoraFourPlanPricingResponseContract.ts",
);

const clientUrl = await compile(
  "./finoraFourPlanPricingGetClient.ts",
  [[
    '"./finoraFourPlanPricingResponseContract.js"',
    `"${contractUrl}"`,
  ]],
);

const { loadFinoraFourPlanPricingFromServer: load } =
  await import(clientUrl);

const months = [1, 3, 6, 12];
const codes = [
  "CUSTOMER_CREATE",
  "LOAN_DISBURSEMENT",
  "COLLECTION",
];

function body(scope = "GLOBAL") {
  const amount = () => ({
    amountInr: "0.00",
    source: "GLOBAL",
    revisionId: "1234567890",
  });

  return {
    ok: true,
    scope,
    branchId: scope === "GLOBAL" ? null : "TEST-01",
    plans: months.map(m => ({
      months: m,
      subscription: amount(),
      fees: Object.fromEntries(
        codes.map(code => [code, amount()]),
      ),
    })),
  };
}

function response(data, status = 200, contentType = "application/json") {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(key) {
        return key.toLowerCase() === "content-type"
          ? contentType
          : null;
      },
    },
    async json() {
      return data;
    },
  };
}

function options(overrides = {}) {
  return {
    baseUrl: "https://api.example.test",
    adminKey: "A".repeat(40),
    scope: "GLOBAL",
    branchId: null,
    ...overrides,
  };
}

test("global GET sends Admin Key without renderer storage", async () => {
  const calls = [];

  const result = await load(options({
    transport: async (url, init) => {
      calls.push({ url, init });
      return response(body());
    },
  }));

  assert.equal(result.plans.length, 4);
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    "https://api.example.test/admin/pricing/plans/global",
  );
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.headers["x-finora-admin-key"], "A".repeat(40));
  assert.equal(calls[0].init.credentials, "omit");
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(calls[0].init.cache, "no-store");
});

test("branch GET uses exact branch URL", async () => {
  let requested = "";

  const result = await load(options({
    scope: "BRANCH",
    branchId: "TEST-01",
    transport: async url => {
      requested = url;
      return response(body("BRANCH"));
    },
  }));

  assert.equal(result.branchId, "TEST-01");
  assert.ok(requested.endsWith(
    "/admin/pricing/plans/branch/TEST-01",
  ));
});

test("invalid Admin Key fails before network", async () => {
  let calls = 0;

  await assert.rejects(
    load(options({
      adminKey: "short",
      transport: async () => {
        calls++;
        return response(body());
      },
    })),
    /FINORA_PRICING_ADMIN_KEY_INVALID/,
  );

  assert.equal(calls, 0);
});

test("insecure remote HTTP is rejected", async () => {
  await assert.rejects(
    load(options({
      baseUrl: "http://remote.example.test",
      transport: async () => response(body()),
    })),
    /FINORA_PRICING_TRANSPORT_INSECURE/,
  );
});

test("local HTTP requires explicit opt-in", async () => {
  await assert.rejects(
    load(options({
      baseUrl: "http://127.0.0.1:3000",
      transport: async () => response(body()),
    })),
    /FINORA_PRICING_TRANSPORT_INSECURE/,
  );

  const result = await load(options({
    baseUrl: "http://127.0.0.1:3000",
    allowLocalTest: true,
    transport: async () => response(body()),
  }));

  assert.equal(result.plans.length, 4);
});

test("invalid branch identifier fails before network", async () => {
  await assert.rejects(
    load(options({
      scope: "BRANCH",
      branchId: "../other",
      transport: async () => {
        throw new Error("MUST_NOT_REQUEST");
      },
    })),
    /FINORA_PRICING_BRANCH_INVALID/,
  );
});

test("401 and 403 fail without returning server body", async () => {
  for (const status of [401, 403]) {
    await assert.rejects(
      load(options({
        transport: async () => response({}, status),
      })),
      /FINORA_PRICING_ADMIN_UNAUTHORIZED/,
    );
  }
});

test("non-JSON responses rejected", async () => {
  await assert.rejects(
    load(options({
      transport: async () =>
        response(body(), 200, "text/html"),
    })),
    /FINORA_PRICING_CONTENT_TYPE_INVALID/,
  );
});

test("cross-branch response fails closed", async () => {
  await assert.rejects(
    load(options({
      scope: "BRANCH",
      branchId: "OTHER-01",
      transport: async () =>
        response(body("BRANCH")),
    })),
    /FINORA_PLAN_PRICING_SCOPE_INVALID/,
  );
});
