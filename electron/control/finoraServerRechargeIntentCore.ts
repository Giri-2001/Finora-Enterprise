async function withRechargeFilesystemLock<T>(
  file: string,
  operation: () => Promise<T>,
): Promise<T> {
  const lockFile = file + ".lock";
  let handle: Awaited<ReturnType<typeof fs.open>>;

  try {
    handle = await fs.open(lockFile, "wx", 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error("RECHARGE_INTENT_BUSY");
    }
    throw error;
  }

  const ownerNonce = randomUUID();
  let initialized = false;

  try {
    await handle.writeFile(JSON.stringify({
      schemaVersion: 1,
      ownerNonce,
      createdAt: Date.now(),
    }));
    await handle.sync();
    initialized = true;

    return await operation();
  } finally {
    if (!initialized) {
      await handle.close();
    } else {
      try {
        // Verify both inode identity and unpredictable lock ownership.
        // Never remove a lock replaced by another process.
        const originalStat = await handle.stat();
        const currentStat = await fs.lstat(lockFile);

        if (
          !currentStat.isFile() ||
          currentStat.isSymbolicLink() ||
          originalStat.dev !== currentStat.dev ||
          originalStat.ino !== currentStat.ino
        ) {
          throw new Error("RECHARGE_LOCK_OWNERSHIP_LOST");
        }

        const raw = await fs.readFile(lockFile, "utf8");
        const metadata = JSON.parse(raw) as {
          schemaVersion?: number;
          ownerNonce?: string;
        };

        if (
          metadata.schemaVersion !== 1 ||
          metadata.ownerNonce !== ownerNonce
        ) {
          throw new Error("RECHARGE_LOCK_OWNERSHIP_LOST");
        }

        // This remains a best-effort ownership check, not an
        // atomic compare-and-unlink filesystem operation.
        await fs.rm(lockFile);
      } finally {
        await handle.close();
      }
    }
  }
}
const rechargeIntentOperations = new Map<string, Promise<void>>();

async function withRechargeIntentLock<T>(
  file: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous =
    rechargeIntentOperations.get(file) ?? Promise.resolve();

  let release!: () => void;
  const completion = new Promise<void>(resolve => {
    release = resolve;
  });

  const queued = previous.then(() => completion);
  rechargeIntentOperations.set(file, queued);

  await previous;

  try {
    return await withRechargeFilesystemLock(file, operation);
  } finally {
    release();
    if (rechargeIntentOperations.get(file) === queued) {
      rechargeIntentOperations.delete(file);
    }
  }
}
import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export interface RechargeIntentScope {
  ownerId: string;
  businessId: string;
  branchId: string;
  walletId: string;
}

export interface RechargeIntent {
  amountInr: number;
  paymentMethod: "PHONEPE" | "GOOGLE_PAY";
  idempotencyKey: string;
}

export interface RechargeIntentProtection {
  available(): boolean;
  encrypt(plain: string): Buffer;
  decrypt(encrypted: Buffer): string;
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateScope(scope: RechargeIntentScope): void {
  for (const field of ["ownerId", "businessId", "branchId", "walletId"] as const) {
    const value = scope?.[field];
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.length > 128 ||
      value.trim() !== value ||
      /[\u0000-\u001f\u007f]/.test(value)
    ) throw new Error("INVALID_RECHARGE_SCOPE");
  }

  if (!/^[0-9]{8,12}$/.test(scope.walletId)) {
    throw new Error("INVALID_RECHARGE_WALLET");
  }
}

function validateIntent(intent: RechargeIntent): void {
  if (
    !intent ||
    !Number.isSafeInteger(intent.amountInr) ||
    intent.amountInr < 50 ||
    intent.amountInr > 2000 ||
    (intent.paymentMethod !== "PHONEPE" &&
      intent.paymentMethod !== "GOOGLE_PAY") ||
    typeof intent.idempotencyKey !== "string" ||
    !UUID.test(intent.idempotencyKey)
  ) throw new Error("INVALID_RECHARGE_INTENT");
}

export function createFinoraServerRechargeIntentCore(
  directory: string,
  protection: RechargeIntentProtection,
) {
  if (
    typeof directory !== "string" ||
    !path.isAbsolute(directory) ||
    !protection ||
    typeof protection.available !== "function" ||
    typeof protection.encrypt !== "function" ||
    typeof protection.decrypt !== "function"
  ) throw new Error("INVALID_RECHARGE_STORE_CONFIGURATION");

  function location(scope: RechargeIntentScope): string {
    validateScope(scope);
    const digest = createHash("sha256")
      .update(JSON.stringify([
        "FINORA_SERVER_RECHARGE_INTENT_V1",
        scope.ownerId,
        scope.businessId,
        scope.branchId,
        scope.walletId,
      ]))
      .digest("hex");

    return path.join(directory, digest + ".bin");
  }

  function requireEncryption(): void {
    if (protection.available() !== true) {
      throw new Error("RECHARGE_ENCRYPTION_UNAVAILABLE");
    }
  }

  async function save(
    scope: RechargeIntentScope,
    intent: RechargeIntent,
  ): Promise<void> {
    validateScope(scope);
    validateIntent(intent);
    requireEncryption();

    await fs.mkdir(directory, { recursive: true, mode: 0o700 });

    const file = location(scope);
    return withRechargeIntentLock(file, async () => {
    const temporary = file + "." + randomUUID() + ".tmp";

    const plain = JSON.stringify({
      schemaVersion: 1,
      scope,
      intent,
    });

    const encrypted = protection.encrypt(plain);

    if (!Buffer.isBuffer(encrypted) ||
        encrypted.length === 0 ||
        encrypted.length > 32768) {
      throw new Error("INVALID_RECHARGE_CIPHERTEXT");
    }

    try {
      const handle = await fs.open(temporary, "wx", 0o600);

      try {
        await handle.writeFile(encrypted);
        // Flush encrypted bytes before publishing the intent.
        await handle.sync();
      } finally {
        await handle.close();
      }

      try {
        await fs.link(temporary, file);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") {
          throw new Error("PENDING_RECHARGE_INTENT_EXISTS");
        }
        throw error;
      }
    } finally {
      await fs.rm(temporary, { force: true });
    }
    });
  }

  async function load(
    scope: RechargeIntentScope,
  ): Promise<RechargeIntent | null> {
    requireEncryption();

    const file = location(scope);

    let bytes: Buffer;

    try {
      bytes = await fs.readFile(file);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }

    if (bytes.length === 0 || bytes.length > 32768) {
      throw new Error("INVALID_RECHARGE_CIPHERTEXT");
    }

    const value = JSON.parse(protection.decrypt(bytes)) as {
      schemaVersion: number;
      scope: RechargeIntentScope;
      intent: RechargeIntent;
    };

    if (
      value?.schemaVersion !== 1 ||
      JSON.stringify(value.scope) !== JSON.stringify(scope)
    ) throw new Error("RECHARGE_SCOPE_MISMATCH");

    validateIntent(value.intent);

    return { ...value.intent };
  }

  // P1-610O: Shared by all core instances in this Electron process.
  // Cross-process access requires a separate filesystem lock.
  async function clearIfMatches(
    scope: RechargeIntentScope,
    idempotencyKey: string,
  ): Promise<boolean> {
    validateScope(scope);

    if (typeof idempotencyKey !== "string" ||
        !UUID.test(idempotencyKey)) {
      throw new Error("INVALID_RECHARGE_INTENT");
    }

    const file = location(scope);
    return withRechargeIntentLock(file, async () => {
      const existing = await load(scope);
      if (!existing) return false;

      if (existing.idempotencyKey.toLowerCase() !==
          idempotencyKey.toLowerCase()) {
        throw new Error("RECHARGE_INTENT_MISMATCH");
      }

      try {
        await fs.rm(file);
        return true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return false;
        }
        throw error;
      }
    });
  }
  return Object.freeze({ save, load, clearIfMatches });
}