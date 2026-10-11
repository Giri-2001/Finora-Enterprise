import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  randomBytes, createCipheriv, createDecipheriv,
  createPublicKey, verify,
} from "node:crypto";

import {
  createFinoraServerWalletOnlineAccess,
} from "../../dist-electron/control/finoraServerWalletOnlineAccess.js";
import {
  createFinoraServerWalletAccessService,
} from "../../dist-electron/control/finoraServerWalletAccessService.js";
import {
  createFinoraServerWalletCoordinator,
} from "../../dist-electron/control/finoraServerWalletCoordinator.js";
import {
  createFinoraServerWalletKeyVaultCore,
} from "../../dist-electron/control/finoraServerWalletKeyVaultCore.js";
import {
  createFinoraServerWalletIdentityClient,
} from "../../dist-electron/control/finoraServerWalletIdentityClient.js";
import {
  createFinoraServerWalletSessionClient,
} from "../../dist-electron/control/finoraServerWalletSessionClient.js";
import {
  createFinoraServerWalletBalanceClient,
} from "../../dist-electron/control/finoraServerWalletBalanceClient.js";
import {
  createFinoraServerWalletLogoutClient,
} from "../../dist-electron/control/finoraServerWalletLogoutClient.js";

const credentials = {
  username: "fixture.owner",
  password: "Synthetic-p548-password",
  securityCode: "Synthetic-p548-code",
};
const scope = {
  userId: "9890000004", ownerId: "9890000001",
  businessId: "9890000002", branchId: "9890000003",
  credentialId: "9890000008", authGeneration: 1,
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" },
  });
}

async function fixture(t, seedKey = true) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "finora-p548c-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));

  const encryptionKey = randomBytes(32);
  const vault = createFinoraServerWalletKeyVaultCore(
    path.join(directory, "keys"),
    {
      available: () => true,
      encrypt(plain) {
        const iv = randomBytes(12);
        const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv, {
          authTagLength: 16,
        });
        const encrypted = Buffer.concat([
          cipher.update(plain, "utf8"), cipher.final(),
        ]);
        return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
      },
      decrypt(bytes) {
        if (bytes.length < 28) throw new Error("Invalid synthetic ciphertext");
        const decipher = createDecipheriv(
          "aes-256-gcm", encryptionKey, bytes.subarray(0, 12),
          { authTagLength: 16 },
        );
        decipher.setAuthTag(bytes.subarray(12, 28));
        return Buffer.concat([
          decipher.update(bytes.subarray(28)), decipher.final(),
        ]).toString("utf8");
      },
    },
  );

  const material = seedKey ? await vault.getOrCreate(scope) : null;
  const challenge = randomBytes(32).toString("hex");
  const authTicket = randomBytes(32).toString("hex");
  const token = randomBytes(32).toString("hex");
  const calls = [];
  let generation = 1;
  let revoked = false;
  let sessions = 0;
  let beforeChallenge = null;

  const transport = async (url, options) => {
    assert.equal(new URL(url).origin, "https://api.finoraenterprise.com");
    const endpoint = new URL(url).pathname;
    calls.push(endpoint);
    const body = options.body ? JSON.parse(options.body) : null;

    if (endpoint === "/owner/wallet/identity") {
      if (
        body.password !== credentials.password ||
        body.securityCode !== credentials.securityCode
      ) return json({ ok: false }, 401);

      return json({
        ok: true,
        identity: {
          ...scope, authGeneration: generation,
          canonicalUsername: credentials.username,
        },
      });
    }

    if (endpoint === "/owner/wallet/proof/challenge") {
      if (beforeChallenge) await beforeChallenge();
      assert.deepEqual(body, {
        username: credentials.username, password: credentials.password,
      });
      return json({
        ok: true, challenge, authTicket,
        credentialId: scope.credentialId,
        authGeneration: scope.authGeneration,
        expiresAt: new Date(Date.now() + 110000).toISOString(),
      });
    }

    if (endpoint === "/owner/wallet/proof/session") {
      assert.ok(material);
      assert.equal(body.challenge, challenge);
      assert.equal(body.authTicket, authTicket);
      assert.equal(body.keyId, material.keyId.toLowerCase());

      const message = [
        "FINORA-OWNER-WALLET-PROOF-V1",
        challenge, body.keyId,
        scope.userId, scope.ownerId, scope.businessId,
        scope.branchId, scope.credentialId, String(scope.authGeneration),
      ].join("\n");

      assert.equal(verify(
        "sha256",
        Buffer.from(message, "utf8"),
        createPublicKey({
          key: Buffer.from(material.publicKeySpkiDerBase64, "base64"),
          format: "der", type: "spki",
        }),
        Buffer.from(body.signature, "base64"),
      ), true);

      sessions++;
      return json({
        ok: true, tokenType: "Bearer", accessToken: token,
        expiresAt: new Date(Date.now() + 1700000).toISOString(),
      });
    }

    if (endpoint === "/owner/wallet/balance") {
      assert.equal(new Headers(options.headers).get("authorization"), "Bearer " + token);
      if (revoked) return json({ ok: false, error: "UNAUTHORIZED" }, 401);
      return json({
        ok: true, source: "POSTGRESQL_WALLETS",
        walletId: "9890000006", balanceInr: "50.00",
        currency: "INR", updatedAt: new Date().toISOString(),
      });
    }

    if (endpoint === "/owner/wallet/logout") {
      assert.equal(new Headers(options.headers).get("authorization"), "Bearer " + token);
      revoked = true;
      return json({ ok: true, revoked: true });
    }

    throw new Error("Unexpected test endpoint");
  };

  const service = createFinoraServerWalletOnlineAccess({
    vault,
    identify: createFinoraServerWalletIdentityClient(transport),
    accessFactory(options) {
      return createFinoraServerWalletAccessService({
        ...options,
        coordinator: createFinoraServerWalletCoordinator({
          resolveScope: options.resolveScope,
          login: createFinoraServerWalletSessionClient(transport),
          readBalance: createFinoraServerWalletBalanceClient(transport),
          revoke: createFinoraServerWalletLogoutClient(transport),
        }),
        // Enrollment HTTP was tested separately. Here we verify persistence/order.
        enroll: async (_credentials, expectedScope, key) => {
          calls.push("TEST_ENROLLMENT");
          assert.deepEqual(expectedScope, scope);
          const persisted = await vault.read(scope);
          assert.equal(persisted.keyId, key.keyId);
          assert.equal(
            persisted.privateKeyPkcs8DerBase64,
            key.privateKeyPkcs8DerBase64,
          );
          return {
            success: true,
            data: { keyId: key.keyId, enrolledAt: new Date().toISOString() },
          };
        },
      });
    },
  });

  return {
    service, vault, calls,
    sessionCount: () => sessions,
    changeGeneration: value => { generation = value; },
    revoke: () => { revoked = true; },
    pauseChallenge: callback => { beforeChallenge = callback; },
  };
}

test("real module assembly signs login, reads balance and performs logout", async t => {
  const f = await fixture(t);
  const login = await f.service.signIn(credentials);
  assert.equal(login.success, true);
  assert.deepEqual(Object.keys(login.data), ["expiresAt"]);
  assert.equal(f.sessionCount(), 1);

  const balance = await f.service.balance();
  assert.equal(balance.success, true);
  assert.equal(balance.data.balanceInr, "50.00");
  assert.equal(Object.hasOwn(balance.data, "accessToken"), false);

  const logout = await f.service.logout();
  assert.equal(logout.localCleared, true);
  assert.equal(logout.serverStatus, "REVOKED");

  const callsBefore = f.calls.length;
  assert.equal((await f.service.balance()).success, false);
  assert.equal(f.calls.length, callsBefore);
});

test("missing persisted key requires enrollment without generating a key", async t => {
  const f = await fixture(t, false);
  const result = await f.service.signIn(credentials);
  assert.equal(result.errorCode, "KEY_ENROLLMENT_REQUIRED");
  assert.equal(await f.vault.read(scope), null);
  assert.deepEqual(f.calls, ["/owner/wallet/identity"]);
});

test("explicit enrollment persists key but grants no wallet session", async t => {
  const f = await fixture(t, false);
  assert.equal((await f.service.enroll(credentials)).success, true);
  assert.ok(await f.vault.read(scope));
  assert.equal(f.sessionCount(), 0);
  assert.equal((await f.service.balance()).success, false);
  assert.deepEqual(f.calls, ["/owner/wallet/identity", "TEST_ENROLLMENT"]);
});

test("failed replacement authentication clears previous local wallet access", async t => {
  const f = await fixture(t);
  assert.equal((await f.service.signIn(credentials)).success, true);
  const failed = await f.service.signIn({ ...credentials, password: "wrong" });
  assert.equal(failed.errorCode, "SERVER_REJECTED");
  const callsBefore = f.calls.length;
  assert.equal((await f.service.balance()).success, false);
  assert.equal(f.calls.length, callsBefore);
  assert.equal(f.sessionCount(), 1);
});

test("changed server generation cannot select an older vault key", async t => {
  const f = await fixture(t);
  f.changeGeneration(2);
  const result = await f.service.signIn(credentials);
  assert.equal(result.errorCode, "KEY_ENROLLMENT_REQUIRED");
  assert.ok(await f.vault.read(scope));
  assert.equal(await f.vault.read({ ...scope, authGeneration: 2 }), null);
  assert.equal(f.sessionCount(), 0);
});

test("revoked response clears current session without fabricated balance", async t => {
  const f = await fixture(t);
  assert.equal((await f.service.signIn(credentials)).success, true);
  f.revoke();
  const result = await f.service.balance();
  assert.equal(result.success, false);
  assert.equal(result.errorCode, "UNAUTHORIZED");
  const callsBefore = f.calls.length;
  assert.equal((await f.service.balance()).success, false);
  assert.equal(f.calls.length, callsBefore);
});

test("clear during proof login prevents late local session installation", async t => {
  const f = await fixture(t);
  let entered;
  let release;
  const started = new Promise(resolve => { entered = resolve; });
  const waiting = new Promise(resolve => { release = resolve; });
  f.pauseChallenge(async () => { entered(); await waiting; });

  const pending = f.service.signIn(credentials);
  await started;
  f.service.clearLocal();
  release();

  assert.equal((await pending).errorCode, "STALE_OPERATION");
  const callsBefore = f.calls.length;
  assert.equal((await f.service.balance()).success, false);
  assert.equal(f.calls.length, callsBefore);
});