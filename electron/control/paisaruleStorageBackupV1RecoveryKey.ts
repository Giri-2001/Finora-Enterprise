import { hkdfSync } from "node:crypto";

// PAISARULE_C117_R289_RECOVERY_KEY_AUTHORITY
//
// Domain-separated recovery journal authentication key.
// This module never stores, persists or logs key material.
// Backup encryption key must come from trusted native authority.
// Caller must independently verify authenticated Owner session,
// exact branch scope and removable storage identity.
//
// This does NOT provide authorization for a restore or recovery.

const DERIVATION_SALT =
  "PAISARULE_RECOVERY_JOURNAL_KEY_SEPARATION_V2";

const DERIVATION_INFO =
  "PAISARULE_RECOVERY_JOURNAL_HMAC_V2";

const KEY_BYTES = 32;

function fail(code: string): never {
  throw new Error(code);
}

export async function withPaisaruleRecoveryJournalKeyV2<T>(
  backupKey: Uint8Array,
  operation: (journalKey: Buffer) => Promise<T> | T,
): Promise<T> {
  if (
    !(backupKey instanceof Uint8Array) ||
    backupKey.byteLength !== KEY_BYTES ||
    typeof operation !== "function"
  ) {
    fail("RECOVERY_KEY_AUTHORITY_INVALID");
  }

  // Copy the input to avoid mutating the caller's session key.
  const keyCopy = Buffer.from(backupKey);
  const salt = Buffer.from(DERIVATION_SALT, "utf8");
  const info = Buffer.from(DERIVATION_INFO, "utf8");

  let derived: Buffer | null = null;

  try {
    derived = Buffer.from(
      hkdfSync(
        "sha256",
        keyCopy,
        salt,
        info,
        KEY_BYTES,
      ),
    );

    if (derived.byteLength !== KEY_BYTES) {
      fail("RECOVERY_KEY_DERIVATION_FAILED");
    }

    return await operation(derived);
  } finally {
    if (derived) {
      derived.fill(0);
    }
    keyCopy.fill(0);
    salt.fill(0);
    info.fill(0);
  }
}