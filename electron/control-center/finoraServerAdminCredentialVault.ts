import {
  app,
  safeStorage,
} from "electron";

import {
  promises as fs,
} from "node:fs";

import path from "node:path";

const FINORA_ADMIN_CREDENTIAL_FILE =
  "finora-server-admin-credential.bin";

function getVaultPath():
  string {
  return path.join(
    app.getPath("userData"),
    FINORA_ADMIN_CREDENTIAL_FILE,
  );
}

function assertSafeStorage():
  void {
  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure credential storage is unavailable on this device.",
    );
  }
}

function normalizeAdminApiKey(
  value:
    string,
): string {
  const normalized =
    value.trim();

  if (
    normalized.length < 32
  ) {
    throw new Error(
      "FINORA administrator API credential is invalid.",
    );
  }

  return normalized;
}

export async function hasFinoraServerAdminCredential():
  Promise<boolean> {
  try {
    await fs.access(
      getVaultPath(),
    );

    return true;
  } catch {
    return false;
  }
}

export async function storeFinoraServerAdminCredential(
  apiKey:
    string,
): Promise<void> {
  assertSafeStorage();

  const normalized =
    normalizeAdminApiKey(
      apiKey,
    );

  const encrypted =
    safeStorage.encryptString(
      normalized,
    );

  const vaultPath =
    getVaultPath();

  await fs.mkdir(
    path.dirname(
      vaultPath,
    ),
    {
      recursive:
        true,
    },
  );

  await fs.writeFile(
    vaultPath,
    encrypted,
    {
      mode:
        0o600,
    },
  );
}

export async function readFinoraServerAdminCredential():
  Promise<string> {
  assertSafeStorage();

  let encrypted:
    Buffer;

  try {
    encrypted =
      await fs.readFile(
        getVaultPath(),
      );
  } catch {
    throw new Error(
      "FINORA Server administrator credential has not been configured.",
    );
  }

  let decrypted:
    string;

  try {
    decrypted =
      safeStorage.decryptString(
        encrypted,
      );
  } catch {
    throw new Error(
      "FINORA Server administrator credential could not be decrypted.",
    );
  }

  return normalizeAdminApiKey(
    decrypted,
  );
}

export async function clearFinoraServerAdminCredential():
  Promise<void> {
  try {
    await fs.unlink(
      getVaultPath(),
    );
  } catch (
    error
  ) {
    const code =
      (
        error as NodeJS.ErrnoException
      ).code;

    if (
      code !== "ENOENT"
    ) {
      throw error;
    }
  }
}