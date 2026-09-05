/* ===========================================================
   FINORA ENTERPRISE OS™

   WINDOWS INSTALLATION BINDING VAULT

   MODULE  : Native Control
   LAYER   : Electron Main
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Persist the Windows installation binding material
   - Protect the private binding key with Electron safeStorage
   - Reject corrupt / undecryptable / invalid vault state
   - Never fall back to plaintext
   - Never replace an existing installation binding identity

   SECURITY:

   - Electron main only.
   - No IPC.
   - No preload.
   - No renderer.
   - No plaintext private-key persistence.
   - No Business Date.
=========================================================== */

import {
  app,
  safeStorage,
} from "electron";

import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  constants as fsConstants,
} from "node:fs";

import {
  dirname,
  join,
} from "node:path";

import {
  randomUUID,
} from "node:crypto";

import {
  validateFinoraWindowsInstallationBindingMaterial,
} from "./finoraInstallationBindingCrypto.js";

import type {
  FinoraWindowsInstallationBindingMaterial,
} from "./finoraInstallationBindingCrypto.js";

// ============================================================
// CONSTANTS
// ============================================================

const DIRECTORY_FINORA =
  "FINORA";

const DIRECTORY_CONTROL =
  "control";

const VAULT_FILE_NAME =
  "finora-installation-binding.bin";

// ============================================================
// PATH
// ============================================================

function getFinoraInstallationBindingVaultPath():
  string {

  return join(
    app.getPath(
      "userData",
    ),
    DIRECTORY_FINORA,
    DIRECTORY_CONTROL,
    VAULT_FILE_NAME,
  );
}

// ============================================================
// ENCRYPTION AVAILABILITY
// ============================================================

function assertSafeStorageAvailable():
  void {

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure installation binding storage is unavailable on this Windows installation.",
    );
  }
}

// ============================================================
// EXISTS
// ============================================================

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

  } catch (
    error
  ) {

    const code =
      (
        error as NodeJS.ErrnoException
      ).code;

    if (
      code === "ENOENT"
    ) {
      return false;
    }

    throw error;
  }
}

// ============================================================
// LOAD
// ============================================================

export async function loadFinoraInstallationBindingVault():
  Promise<
    FinoraWindowsInstallationBindingMaterial |
    undefined
  > {

  const vaultPath =
    getFinoraInstallationBindingVaultPath();

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
      "FINORA installation binding vault is empty.",
    );
  }

  const decrypted =
    safeStorage.decryptString(
      encrypted,
    );

  if (
    typeof decrypted !==
      "string" ||
    decrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA installation binding vault could not be decrypted.",
    );
  }

  let parsed:
    unknown;

  try {

    parsed =
      JSON.parse(
        decrypted,
      );

  } catch {

    throw new Error(
      "FINORA installation binding vault contains invalid data.",
    );
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(
      parsed,
    )
  ) {
    throw new Error(
      "FINORA installation binding vault structure is invalid.",
    );
  }

  const material =
    parsed as
      FinoraWindowsInstallationBindingMaterial;

  validateFinoraWindowsInstallationBindingMaterial(
    material,
  );

  return material;
}

// ============================================================
// PERSIST NEW IMMUTABLE VAULT
// ============================================================

export async function persistNewFinoraInstallationBindingVault(
  material:
    FinoraWindowsInstallationBindingMaterial,
): Promise<void> {

  validateFinoraWindowsInstallationBindingMaterial(
    material,
  );

  assertSafeStorageAvailable();

  const vaultPath =
    getFinoraInstallationBindingVaultPath();

  if (
    await fileExists(
      vaultPath,
    )
  ) {
    throw new Error(
      "FINORA installation binding vault already exists and cannot be replaced.",
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

  const encrypted =
    safeStorage.encryptString(
      JSON.stringify(
        material,
      ),
    );

  if (
    encrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA installation binding encryption returned an empty payload.",
    );
  }

  const tempPath =
    `${vaultPath}.${randomUUID()}.tmp`;

  try {

    await writeFile(
      tempPath,
      encrypted,
      {
        flag:
          "wx",
      },
    );

    /*
     * The destination is immutable.
     *
     * A successful first rename establishes this installation's
     * native binding identity.
     */
    await rename(
      tempPath,
      vaultPath,
    );

  } catch (
    error
  ) {

    await rm(
      tempPath,
      {
        force:
          true,
      },
    );

    throw error;
  }
}

// ============================================================
// END
// ============================================================