/* ============================================================
   FINORA ENTERPRISE OS

   CANONICAL WALLET AUTHORITY VAULT

   RESPONSIBILITY:
   - Persist the canonical Wallet spend authority outside
     removable USB backup data.
   - Encrypt authority state with Electron safeStorage.
   - Never export authority state through Full Branch Backup.
   - Reject corrupt / undecryptable / invalid authority state.
   - Never silently replace an existing authority.
   - Keep one canonical authority per owner/business/branch.

   SECURITY:
   - Electron main only.
   - No IPC.
   - No preload.
   - No renderer access.
   - No plaintext fallback.
============================================================ */

import {
  app,
  safeStorage,
} from "electron";

import {
  constants as fsConstants,
} from "node:fs";

import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  dirname,
  join,
} from "node:path";

import {
  randomUUID,
} from "node:crypto";

import type {
  FinoraCanonicalWalletAuthorityState,
} from "./finoraCanonicalWalletAuthority.js";

const DIRECTORY_FINORA =
  "FINORA";

const DIRECTORY_CONTROL =
  "control";

const VAULT_FILE_NAME =
  "finora-canonical-wallet-authority.bin";

const VAULT_SCHEMA_VERSION =
  1;

function getVaultPath(): string {
  return join(
    app.getPath(
      "userData",
    ),
    DIRECTORY_FINORA,
    DIRECTORY_CONTROL,
    VAULT_FILE_NAME,
  );
}

function assertSafeStorageAvailable(): void {
  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA Wallet Authority safeStorage encryption is unavailable.",
    );
  }
}

async function fileExists(
  path:
    string,
): Promise<boolean> {
  try {
    await access(
      path,
      fsConstants.F_OK,
    );

    return true;
  }
  catch {
    return false;
  }
}

function validateAuthorityState(
  value:
    unknown,
): value is FinoraCanonicalWalletAuthorityState {

  if (
    typeof value !==
      "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  return (
    typeof record.authorityId ===
      "string" &&
    record.authorityId.trim().length >
      0 &&

    typeof record.walletId ===
      "string" &&
    record.walletId.trim().length >
      0 &&

    typeof record.ownerId ===
      "string" &&
    record.ownerId.trim().length >
      0 &&

    typeof record.businessId ===
      "string" &&
    record.businessId.trim().length >
      0 &&

    typeof record.branchId ===
      "string" &&
    record.branchId.trim().length >
      0 &&

    Number.isSafeInteger(
      record.authoritativeBalance,
    ) &&
    Number(record.authoritativeBalance) >=
      0 &&

    Number.isSafeInteger(
      record.authorityGeneration,
    ) &&
    Number(record.authorityGeneration) >=
      1 &&

    Number.isSafeInteger(
      record.spendCounter,
    ) &&
    Number(record.spendCounter) >=
      0 &&

    typeof record.headHash ===
      "string" &&
    record.headHash.trim().length >
      0 &&

    (
      record.previousHeadHash ===
        undefined ||
      (
        typeof record.previousHeadHash ===
          "string" &&
        record.previousHeadHash.length >
          0
      )
    ) &&

    (
      record.lastMutationId ===
        undefined ||
      (
        typeof record.lastMutationId ===
          "string" &&
        record.lastMutationId.trim().length >
          0
      )
    ) &&

    (
      record.pendingMutation ===
        undefined ||
      (
        typeof record.pendingMutation ===
          "object" &&
        record.pendingMutation !==
          null &&
        !Array.isArray(record.pendingMutation)
      )
    ) &&

    (
      record.status ===
        "ACTIVE" ||
      record.status ===
        "CONTINUATION_REQUIRED" ||
      record.status ===
        "BLOCKED"
    ) &&

    typeof record.updatedAt ===
      "string" &&
    record.updatedAt.trim().length >
      0 &&

    record.schemaVersion ===
      VAULT_SCHEMA_VERSION
  );
}

export async function loadFinoraCanonicalWalletAuthorityVault():
  Promise<
    FinoraCanonicalWalletAuthorityState |
    undefined
  > {

  const vaultPath =
    getVaultPath();

  if (
    !await fileExists(
      vaultPath,
    )
  ) {
    return undefined;
  }

  assertSafeStorageAvailable();

  const encrypted =
    await readFile(
      vaultPath,
    );

  if (
    encrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA Wallet Authority vault is empty.",
    );
  }

  let decrypted:
    string;

  try {
    decrypted =
      safeStorage.decryptString(
        encrypted,
      );
  }
  catch {
    throw new Error(
      "FINORA Wallet Authority vault could not be decrypted.",
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        decrypted,
      );
  }
  catch {
    throw new Error(
      "FINORA Wallet Authority vault contains invalid JSON.",
    );
  }

  if (
    !validateAuthorityState(
      parsed,
    )
  ) {
    throw new Error(
      "FINORA Wallet Authority vault structure is invalid.",
    );
  }

  return parsed;
}

export async function persistNewFinoraCanonicalWalletAuthorityVault(
  state:
    FinoraCanonicalWalletAuthorityState,
): Promise<void> {

  if (
    !validateAuthorityState(
      state,
    )
  ) {
    throw new Error(
      "FINORA canonical Wallet Authority state is invalid.",
    );
  }

  assertSafeStorageAvailable();

  const vaultPath =
    getVaultPath();

  if (
    await fileExists(
      vaultPath,
    )
  ) {
    throw new Error(
      "FINORA canonical Wallet Authority vault already exists and cannot be replaced.",
    );
  }

  const parentDirectory =
    dirname(
      vaultPath,
    );

  await mkdir(
    parentDirectory,
    {
      recursive:
        true,
    },
  );

  const plaintext =
    JSON.stringify(
      state,
    );

  const encrypted =
    safeStorage.encryptString(
      plaintext,
    );

  const tempPath =
    `${vaultPath}.${randomUUID()}.tmp`;

  try {
    await writeFile(
      tempPath,
      encrypted,
      {
        mode:
          0o600,
      },
    );

    await rename(
      tempPath,
      vaultPath,
    );
  }
  finally {
    await rm(
      tempPath,
      {
        force:
          true,
      },
    );
  }
}

export async function replaceFinoraCanonicalWalletAuthorityVault(
  current:
    FinoraCanonicalWalletAuthorityState,

  next:
    FinoraCanonicalWalletAuthorityState,
): Promise<void> {

  if (
    !validateAuthorityState(
      current,
    ) ||
    !validateAuthorityState(
      next,
    )
  ) {
    throw new Error(
      "FINORA canonical Wallet Authority replacement state is invalid.",
    );
  }

  if (
    current.authorityId !==
      next.authorityId ||
    current.walletId !==
      next.walletId ||
    current.ownerId !==
      next.ownerId ||
    current.businessId !==
      next.businessId ||
    current.branchId !==
      next.branchId
  ) {
    throw new Error(
      "FINORA canonical Wallet Authority identity cannot be replaced.",
    );
  }

  if (
    next.authorityGeneration <
      current.authorityGeneration
  ) {
    throw new Error(
      "FINORA Wallet Authority generation rollback detected.",
    );
  }

  if (
    next.spendCounter <
      current.spendCounter
  ) {
    throw new Error(
      "FINORA Wallet Authority spend counter rollback detected.",
    );
  }

  const vaultPath =
    getVaultPath();

  const plaintext =
    JSON.stringify(
      next,
    );

  assertSafeStorageAvailable();

  const encrypted =
    safeStorage.encryptString(
      plaintext,
    );

  const tempPath =
    `${vaultPath}.${randomUUID()}.tmp`;

  try {

    await writeFile(
      tempPath,
      encrypted,
      {
        mode:
          0o600,
      },
    );

    await rename(
      tempPath,
      vaultPath,
    );

  }
  finally {

    await rm(
      tempPath,
      {
        force:
          true,
      },
    );

  }
}


