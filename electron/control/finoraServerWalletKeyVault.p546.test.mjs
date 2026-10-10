import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  randomBytes, createCipheriv, createDecipheriv,
} from "node:crypto";
import {
  createFinoraServerWalletKeyVaultCore,
} from "../../dist-electron/control/finoraServerWalletKeyVaultCore.js";

const scope = {
  userId: "9890000004", ownerId: "9890000001",
  businessId: "9890000002", branchId: "9890000003",
  credentialId: "9890000008", authGeneration: 1,
};

// Real authenticated encryption for core tests.
// This is NOT Electron safeStorage or a production encryption fallback.
async function setup(t) {
  const parent = await fs.mkdtemp(path.join(tmpdir(), "finora-p546-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const directory = path.join(parent, "vault");
  const encryptionKey = randomBytes(32);
  const protection = {
    available: () => true,
    encrypt(plain) {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv, { authTagLength: 16 });
      const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
      return Buffer.concat([iv, cipher.getAuthTag(), body]);
    },
    decrypt(bytes) {
      if (bytes.length < 28) throw new Error("INVALID_TEST_CIPHERTEXT");
      const decipher = createDecipheriv(
        "aes-256-gcm", encryptionKey, bytes.subarray(0, 12),
        { authTagLength: 16 },
      );
      decipher.setAuthTag(bytes.subarray(12, 28));
      return Buffer.concat([
        decipher.update(bytes.subarray(28)), decipher.final(),
      ]).toString("utf8");
    },
  };
  return {
    directory, protection,
    vault: createFinoraServerWalletKeyVaultCore(directory, protection),
  };
}

test("creates an encrypted key and reads the same key across instances", async t => {
  const { directory, protection, vault } = await setup(t);
  assert.equal(await vault.read(scope), null);
  const first = await vault.getOrCreate(scope);
  const reopened = createFinoraServerWalletKeyVaultCore(directory, protection);
  assert.deepEqual(await reopened.read(scope), first);
  assert.deepEqual(await reopened.getOrCreate(scope), first);
});

test("stored bytes exclude plaintext private key and scope", async t => {
  const { directory, vault } = await setup(t);
  const material = await vault.getOrCreate(scope);
  const files = await fs.readdir(directory);
  assert.equal(files.length, 1);
  const bytes = await fs.readFile(path.join(directory, files[0]));
  assert.equal(bytes.includes(Buffer.from(material.privateKeyPkcs8DerBase64)), false);
  assert.equal(bytes.includes(Buffer.from(scope.branchId)), false);
  assert.match(files[0], /^[a-f0-9]{64}\.bin$/);
});

test("branches and credential generations use distinct keys", async t => {
  const { vault } = await setup(t);
  const first = await vault.getOrCreate(scope);
  const sibling = await vault.getOrCreate({ ...scope, branchId: "9890000099" });
  const next = await vault.getOrCreate({ ...scope, authGeneration: 2 });
  assert.equal(new Set([first.keyId, sibling.keyId, next.keyId]).size, 3);
});

test("concurrent creators preserve exactly one winning key", async t => {
  const { directory, protection } = await setup(t);
  const results = await Promise.all(Array.from({ length: 6 }, () =>
    createFinoraServerWalletKeyVaultCore(directory, protection).getOrCreate(scope),
  ));
  assert.equal(new Set(results.map(result => result.keyId)).size, 1);
  assert.equal((await fs.readdir(directory)).length, 1);
});

test("corrupt file is rejected and never silently replaced", async t => {
  const { directory, vault } = await setup(t);
  await vault.getOrCreate(scope);
  const file = path.join(directory, (await fs.readdir(directory))[0]);
  const corrupted = Buffer.from("synthetic-corruption");
  await fs.writeFile(file, corrupted);
  await assert.rejects(vault.getOrCreate(scope), /WALLET_KEY_VAULT_UNAVAILABLE/);
  assert.deepEqual(await fs.readFile(file), corrupted);
});

test("ciphertext copied between branch files fails scope binding", async t => {
  const { directory, vault } = await setup(t);
  await vault.getOrCreate(scope);
  const first = (await fs.readdir(directory))[0];
  const other = { ...scope, branchId: "9890000099" };
  await vault.getOrCreate(other);
  const second = (await fs.readdir(directory)).find(name => name !== first);
  await fs.copyFile(path.join(directory, first), path.join(directory, second));
  await assert.rejects(vault.read(other), /WALLET_KEY_VAULT_UNAVAILABLE/);
});

test("unavailable encryption creates no vault directory", async t => {
  const { directory, protection } = await setup(t);
  const vault = createFinoraServerWalletKeyVaultCore(directory, {
    ...protection, available: () => false,
  });
  await assert.rejects(vault.getOrCreate(scope), /WALLET_KEY_VAULT_UNAVAILABLE/);
  await assert.rejects(fs.stat(directory), { code: "ENOENT" });
});

test("invalid scope and decryption failures return sanitized errors", async t => {
  const { directory, protection, vault } = await setup(t);
  await assert.rejects(
    vault.getOrCreate({ ...scope, branchId: "../bad\n" }),
    /WALLET_KEY_VAULT_UNAVAILABLE/,
  );
  await vault.getOrCreate(scope);
  const locked = createFinoraServerWalletKeyVaultCore(directory, {
    ...protection,
    decrypt: () => { throw new Error("private OS diagnostic"); },
  });
  await assert.rejects(locked.read(scope), {
    message: "WALLET_KEY_VAULT_UNAVAILABLE",
  });
});