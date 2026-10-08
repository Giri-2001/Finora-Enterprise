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
  createHash,
  randomUUID,
} from "node:crypto";

import {
  dirname,
  join,
} from "node:path";

import {
  assertFinoraBranchCertificationKeyMaterial,
} from "./finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationKeyMaterialV1,
} from "./finoraBranchCertificationContract.js";

const DIRECTORY_FINORA =
  "FINORA";

const DIRECTORY_WALLET =
  "wallet";

const FILE_PREFIX =
  "finora-wallet-branch-cert-";

const FILE_EXTENSION =
  ".bin";

const VAULT_SCHEMA_VERSION =
  1 as const;

const MAX_FILE_BYTES =
  128 * 1024;

type VaultScope = {
  ownerId: string;
  businessId: string;
  branchId: string;
};

type VaultRecord = {
  // D222B_WALLET_CONTINUITY
  authGeneration?: number;
  schemaVersion:
    typeof VAULT_SCHEMA_VERSION;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  material:
    FinoraBranchCertificationKeyMaterialV1;
};

function requireText(
  value: string,
  label: string,
): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value !== value.trim()
  ) {
    throw new Error(
      `FINORA Wallet Branch Certification ${label} is invalid.`,
    );
  }

  return value;
}

function createScope(
  ownerId: string,
  businessId: string,
  branchId: string,
): VaultScope {
  return {
    ownerId:
      requireText(ownerId, "ownerId"),

    businessId:
      requireText(businessId, "businessId"),

    branchId:
      requireText(branchId, "branchId"),
  };
}

function canonicalScope(
  scope: VaultScope,
): string {
  return (
    `${scope.ownerId.length}:${scope.ownerId}|` +
    `${scope.businessId.length}:${scope.businessId}|` +
    `${scope.branchId.length}:${scope.branchId}`
  );
}

function scopeDigest(
  scope: VaultScope,
): string {
  return createHash("sha256")
    .update(
      canonicalScope(scope),
      "utf8",
    )
    .digest("hex");
}

function getVaultPath(
  scope: VaultScope,
): string {
  return join(
    app.getPath("userData"),
    DIRECTORY_FINORA,
    DIRECTORY_WALLET,
    FILE_PREFIX +
      scopeDigest(scope) +
      FILE_EXTENSION,
  );
}

function assertSafeStorageAvailable():
  void {
  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA Wallet Branch Certification secure storage is unavailable on this Windows installation.",
    );
  }
}

async function fileExists(
  path: string,
): Promise<boolean> {
  try {
    await access(
      path,
      fsConstants.F_OK,
    );

    return true;
  }
  catch (
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

export async function readFinoraWalletBranchCertificationDeviceVault(
  ownerId: string,
  businessId: string,
  branchId: string,
  expectedAuthGeneration?: number,
): Promise<
  FinoraBranchCertificationKeyMaterialV1 |
  undefined
> {
  const scope =
    createScope(
      ownerId,
      businessId,
      branchId,
    );

  const vaultPath =
    getVaultPath(
      scope,
    );

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
    encrypted.length === 0 ||
    encrypted.length > MAX_FILE_BYTES
  ) {
    throw new Error(
      "FINORA Wallet Branch Certification vault envelope is invalid.",
    );
  }

  const decrypted =
    safeStorage.decryptString(
      encrypted,
    );

  if (
    typeof decrypted !== "string" ||
    decrypted.length === 0
  ) {
    throw new Error(
      "FINORA Wallet Branch Certification vault could not be decrypted.",
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
      "FINORA Wallet Branch Certification vault contains invalid data.",
    );
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error(
      "FINORA Wallet Branch Certification vault structure is invalid.",
    );
  }

  const record =
    parsed as VaultRecord;

  if (
    record.schemaVersion !== VAULT_SCHEMA_VERSION ||
    record.ownerId !== scope.ownerId ||
    record.businessId !== scope.businessId ||
    record.branchId !== scope.branchId
  ) {
    throw new Error(
      "FINORA Wallet Branch Certification vault scope mismatch.",
    );
  }

  if (
    expectedAuthGeneration !== undefined &&
    record.authGeneration !== expectedAuthGeneration
  ) {
    return undefined;
  }

  assertFinoraBranchCertificationKeyMaterial(
    record.material,
  );

  return record.material;
}

export async function writeFinoraWalletBranchCertificationDeviceVault(
  ownerId: string,
  businessId: string,
  branchId: string,
  material: FinoraBranchCertificationKeyMaterialV1,
  authGeneration?: number,
): Promise<void> {
  const scope =
    createScope(
      ownerId,
      businessId,
      branchId,
    );

  assertFinoraBranchCertificationKeyMaterial(
    material,
  );

  assertSafeStorageAvailable();

  const record:
    VaultRecord = {
      ...(authGeneration === undefined
        ? {}
        : { authGeneration }),
      schemaVersion:
        VAULT_SCHEMA_VERSION,

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,

      material,
    };

  const encrypted =
    safeStorage.encryptString(
      JSON.stringify(
        record,
      ),
    );

  if (
    encrypted.length === 0 ||
    encrypted.length > MAX_FILE_BYTES
  ) {
    throw new Error(
      "FINORA Wallet Branch Certification encryption returned an invalid payload.",
    );
  }

  const vaultPath =
    getVaultPath(
      scope,
    );

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

    await rm(
      vaultPath,
      {
        force:
          true,
      },
    );

    await rename(
      tempPath,
      vaultPath,
    );
  }
  catch (
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
