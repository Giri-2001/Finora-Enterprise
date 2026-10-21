/**
 * FINORA_P1_633Z_ENCRYPTED_SUBSCRIPTION_INTENT
 * Electron Main only. No renderer access or network requests.
 * Separate storage from Recharge Intent.
 * Pending purchase is immutable until server reconciliation.
 */

import { app, safeStorage } from "electron";
import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type FinoraPurchaseIntentScope = {
  ownerId: string;
  businessId: string;
  branchId: string;
  walletId: string;
};

export type FinoraPurchaseIntent = {
  planMonths: 1 | 3 | 6 | 12;
  idempotencyKey: string;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validScope(value: unknown):
  value is FinoraPurchaseIntentScope {
  if (!value || typeof value !== "object" ||
      Array.isArray(value)) return false;

  const v = value as Record<string, unknown>;

  return ["ownerId", "businessId", "branchId", "walletId"]
    .every(key =>
      typeof v[key] === "string" &&
      (v[key] as string).length > 0 &&
      (v[key] as string).length <= 128
    );
}

function validIntent(value: unknown):
  value is FinoraPurchaseIntent {
  if (!value || typeof value !== "object" ||
      Array.isArray(value)) return false;

  const v = value as Record<string, unknown>;

  return Object.keys(v).length === 2 &&
    [1, 3, 6, 12].includes(v.planMonths as number) &&
    typeof v.idempotencyKey === "string" &&
    UUID.test(v.idempotencyKey);
}

function scopeKey(scope: FinoraPurchaseIntentScope): string {
  return createHash("sha256").update(
    JSON.stringify([
      scope.ownerId,
      scope.businessId,
      scope.branchId,
      scope.walletId,
    ]),
  ).digest("hex");
}

export function createFinoraServerSubscriptionPurchaseIntentStore() {
  const directory = path.join(
    app.getPath("userData"),
    "FINORA",
    "wallet",
    "pending-subscription-purchases",
  );

  function requireEncryption(): void {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("PURCHASE_ENCRYPTION_UNAVAILABLE");
    }
  }

  function fileFor(scope: FinoraPurchaseIntentScope): string {
    return path.join(directory, `${scopeKey(scope)}.bin`);
  }

  async function read(
    scope: FinoraPurchaseIntentScope,
  ): Promise<FinoraPurchaseIntent | null> {
    if (!validScope(scope)) {
      throw new Error("PURCHASE_SCOPE_INVALID");
    }

    requireEncryption();

    let encrypted: Buffer;

    try {
      encrypted = await fs.readFile(fileFor(scope));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }

    if (encrypted.length === 0 || encrypted.length > 32768) {
      throw new Error("PURCHASE_INTENT_CIPHERTEXT_INVALID");
    }

    const decoded: unknown = JSON.parse(
      safeStorage.decryptString(encrypted),
    );

    if (!decoded || typeof decoded !== "object" ||
        Array.isArray(decoded)) {
      throw new Error("PURCHASE_INTENT_INVALID");
    }

    const record = decoded as Record<string, unknown>;
    const savedScope = record.scope;
    const savedIntent = record.intent;

    if (!validScope(savedScope) || !validIntent(savedIntent) ||
        record.version !== 1 ||
        scopeKey(savedScope) !== scopeKey(scope) ||
        savedScope.ownerId !== scope.ownerId ||
        savedScope.businessId !== scope.businessId ||
        savedScope.branchId !== scope.branchId ||
        savedScope.walletId !== scope.walletId) {
      throw new Error("PURCHASE_INTENT_SCOPE_MISMATCH");
    }

    return {
      planMonths: savedIntent.planMonths,
      idempotencyKey: savedIntent.idempotencyKey.toLowerCase(),
    };
  }

  async function save(
    scope: FinoraPurchaseIntentScope,
    intent: FinoraPurchaseIntent,
  ): Promise<FinoraPurchaseIntent> {
    if (!validScope(scope) || !validIntent(intent)) {
      throw new Error("PURCHASE_INTENT_INVALID");
    }

    requireEncryption();

    await fs.mkdir(directory, {
      recursive: true,
      mode: 0o700,
    });

    const target = fileFor(scope);
    const lock = `${target}.lock`;

    // Exclusive cross-process creation. Fail closed on a stale lock:
    // never overwrite an uncertain pending purchase.
    try {
      await fs.mkdir(lock);
    } catch {
      throw new Error("PURCHASE_INTENT_LOCKED");
    }

    try {
      const existing = await read(scope);

      if (existing) {
        if (existing.planMonths !== intent.planMonths ||
            existing.idempotencyKey.toLowerCase() !==
              intent.idempotencyKey.toLowerCase()) {
          throw new Error("PURCHASE_INTENT_CONFLICT");
        }
        return existing;
      }

      const pending: FinoraPurchaseIntent = {
        planMonths: intent.planMonths,
        idempotencyKey: intent.idempotencyKey.toLowerCase(),
      };

      const encrypted = safeStorage.encryptString(
        JSON.stringify({
          version: 1,
          scope,
          intent: pending,
        }),
      );

      if (encrypted.length === 0 || encrypted.length > 32768) {
        throw new Error("PURCHASE_INTENT_CIPHERTEXT_INVALID");
      }

      const temporary = `${target}.${randomUUID()}.tmp`;
      let handle: Awaited<ReturnType<typeof fs.open>> | null = null;

      try {
        handle = await fs.open(temporary, "wx", 0o600);
        await handle.writeFile(encrypted);
        await handle.sync();
        await handle.close();
        handle = null;

        // Under exclusive lock: no replacement of an existing intent.
        const raceCheck = await read(scope);
        if (raceCheck) {
          throw new Error("PURCHASE_INTENT_CONFLICT");
        }

        await fs.rename(temporary, target);
      } finally {
        if (handle) await handle.close();
        await fs.rm(temporary, { force: true }).catch(() => {});
      }

      const confirmed = await read(scope);

      if (!confirmed ||
          confirmed.planMonths !== pending.planMonths ||
          confirmed.idempotencyKey !== pending.idempotencyKey) {
        throw new Error("PURCHASE_INTENT_PERSISTENCE_FAILED");
      }

      return confirmed;
    } finally {
      await fs.rmdir(lock).catch(() => {});
    }
  }

  // FINORA_P1_634A_COMPLETION
  // Caller must independently validate the successful server receipt.
  // This store never decides whether a payment succeeded.
  // Never delete an intent if the UUID or plan differs.
  async function clearIfMatches(
    scope: FinoraPurchaseIntentScope,
    intent: FinoraPurchaseIntent,
  ): Promise<boolean> {
    if (!validScope(scope) || !validIntent(intent)) {
      throw new Error("PURCHASE_INTENT_INVALID");
    }

    requireEncryption();

    const target = fileFor(scope);
    const lock = `${target}.lock`;

    try {
      await fs.mkdir(lock);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }
      throw new Error("PURCHASE_INTENT_LOCKED");
    }

    try {
      const existing = await read(scope);

      if (!existing) return false;

      if (
        existing.planMonths !== intent.planMonths ||
        existing.idempotencyKey !== intent.idempotencyKey.toLowerCase()
      ) {
        return false;
      }

      await fs.unlink(target);
      return true;
    } finally {
      await fs.rmdir(lock).catch(() => {});
    }
  }

  return Object.freeze({
    load: read,
    save,
    clearIfMatches,
  });
}