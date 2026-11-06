import test from "node:test";
import assert from "node:assert/strict";

import {
  createFinoraWalletRotationClient,
} from "../../dist-electron/control/finoraWalletRotationClient.js";

const oldToken = "a".repeat(64);
const newToken = "c".repeat(64);
const businessSessionId = "b".repeat(64);

const scope = {
  userId: "u1",
  ownerId: "o1",
  businessId: "b1",
  branchId: "br1",
};

const request = {
  oldWalletToken: oldToken,
  businessSessionId,
  expectedScope: scope,
};

function reply(
  body,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function validBody() {
  return {
    ok: true,
    accessToken: newToken,
    expiresAt: new Date(
      Date.now() + 3_600_000,
    ).toISOString(),
    scope,
  };
}

const url = "https://example.com";

test("valid rotation preserves owner and branch scope", async () => {
  const rotate = createFinoraWalletRotationClient(
    url,
    async (path, options) => {
      assert.equal(
        path,
        `${url}/owner/wallet/session/rotate`,
      );
      assert.equal(options.method, "POST");
      assert.equal(
        options.headers.authorization,
        `Bearer ${oldToken}`,
      );
      assert.equal(
        options.headers["x-finora-business-session"],
        businessSessionId,
      );
      assert.equal(options.cache, "no-store");
      return reply(validBody());
    },
  );

  const result = await rotate(request);
  assert.equal(result.success, true);
  assert.equal(result.accessToken, newToken);
  assert.deepEqual(result.scope, scope);
});

test("different branch is rejected", async () => {
  const rotate = createFinoraWalletRotationClient(
    url,
    async () => reply({
      ...validBody(),
      scope: { ...scope, branchId: "other" },
    }),
  );

  const result = await rotate(request);
  assert.equal(result.success, false);
  assert.equal(
    result.errorCode,
    "INVALID_ROTATION_RESPONSE",
  );
});

test("expired, oversized and reused tokens rejected", async () => {
  for (const body of [
    {
      ...validBody(),
      expiresAt: new Date(
        Date.now() - 1000,
      ).toISOString(),
    },
    {
      ...validBody(),
      expiresAt: new Date(
        Date.now() + 7_200_000,
      ).toISOString(),
    },
    {
      ...validBody(),
      accessToken: oldToken,
    },
  ]) {
    const rotate = createFinoraWalletRotationClient(
      url,
      async () => reply(body),
    );

    const result = await rotate(request);
    assert.equal(result.success, false);
  }
});

test("revoked session fails closed", async () => {
  const rotate = createFinoraWalletRotationClient(
    url,
    async () => reply({
      ok: false,
      error: "ROTATION_NOT_AUTHORIZED",
    }, 403),
  );

  const result = await rotate(request);
  assert.equal(result.success, false);
  assert.equal(
    result.errorCode,
    "ROTATION_NOT_AUTHORIZED",
  );
});

test("malformed input does not contact server", async () => {
  let called = false;

  const rotate = createFinoraWalletRotationClient(
    url,
    async () => {
      called = true;
      throw Error("MUST_NOT_CONTACT_SERVER");
    },
  );

  const result = await rotate({
    ...request,
    businessSessionId: "invalid",
  });

  assert.equal(result.success, false);
  assert.equal(called, false);
});

test("network errors are sanitized", async () => {
  const rotate = createFinoraWalletRotationClient(
    url,
    async () => {
      throw Error("INTERNAL_NETWORK_DETAIL");
    },
  );

  const result = await rotate(request);

  assert.deepEqual(result, {
    success: false,
    errorCode: "ROTATION_UNAVAILABLE",
  });
});

test("insecure remote HTTP transport rejected", () => {
  assert.throws(
    () => createFinoraWalletRotationClient(
      "http://example.com",
    ),
    /INVALID_WALLET_ROTATION_TRANSPORT/,
  );
});