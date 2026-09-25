/* ===========================================================
   FINORA CONTROL CENTER
   BRANCH DIRECTORY METADATA STORE

   PURPOSE:
   - Persist operator-facing branch directory labels.
   - Keep display metadata separate from immutable Registry
     identity and signed issuance authorization.
   - Support partial trusted updates from Branch Access and
     Business Profile issuance workflows.
   - Protect local metadata with Electron safeStorage.

   SECURITY:
   - MAIN PROCESS ONLY.
   - No signing authority.
   - No recipient private material.
   - No branch identity mutation.
   - No wallet mutation.
   =========================================================== */

import {
  app,
  safeStorage,
} from "electron";

import fs from "node:fs/promises";
import path from "node:path";

import {
  observeFinoraControlCenterAuthoritativeWallClock,
} from "./finoraControlCenterClockHighWaterAuthorityService.js";

export const
FINORA_CONTROL_CENTER_BRANCH_DIRECTORY_METADATA_SCHEMA_VERSION =
  1 as const;

export type FinoraControlCenterBranchDirectoryMetadataSource =
  | "OPERATOR_CONFIRMED"
  | "BRANCH_ACCESS_ISSUANCE"
  | "BUSINESS_PROFILE_ISSUANCE";

export interface FinoraControlCenterBranchDirectoryMetadataRecord {
  ownerId: string;
  businessId: string;
  branchId: string;

  ownerName?: string;
  businessName?: string;
  branchName?: string;

  lastSource:
    FinoraControlCenterBranchDirectoryMetadataSource;

  updatedAt: string;

  schemaVersion:
    typeof FINORA_CONTROL_CENTER_BRANCH_DIRECTORY_METADATA_SCHEMA_VERSION;
}

interface FinoraControlCenterBranchDirectoryMetadataRoot {
  records:
    FinoraControlCenterBranchDirectoryMetadataRecord[];

  updatedAt: string;

  schemaVersion:
    typeof FINORA_CONTROL_CENTER_BRANCH_DIRECTORY_METADATA_SCHEMA_VERSION;
}

export interface UpsertFinoraControlCenterBranchDirectoryMetadataInput {
  ownerId: string;
  businessId: string;
  branchId: string;

  ownerName?: string;
  businessName?: string;
  branchName?: string;

  source:
    FinoraControlCenterBranchDirectoryMetadataSource;
}

const STORE_DIRECTORY =
  "FINORA";

const STORE_SUBDIRECTORY =
  "control-center";

const STORE_FILE =
  "finora-control-center-branch-directory-metadata.bin";

let mutationQueue:
  Promise<void> =
    Promise.resolve();

function isNonEmptyString(
  value: unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function isCanonicalTimestamp(
  value: unknown,
): value is string {

  if (!isNonEmptyString(value)) {
    return false;
  }

  const parsed =
    Date.parse(value);

  return (
    Number.isFinite(parsed) &&
    new Date(parsed).toISOString() ===
      value
  );
}

function isSource(
  value: unknown,
): value is FinoraControlCenterBranchDirectoryMetadataSource {

  return (
    value ===
      "OPERATOR_CONFIRMED" ||
    value ===
      "BRANCH_ACCESS_ISSUANCE" ||
    value ===
      "BUSINESS_PROFILE_ISSUANCE"
  );
}

function cloneRecord(
  record:
    FinoraControlCenterBranchDirectoryMetadataRecord,
): FinoraControlCenterBranchDirectoryMetadataRecord {

  return JSON.parse(
    JSON.stringify(
      record,
    ),
  ) as
    FinoraControlCenterBranchDirectoryMetadataRecord;
}

function cloneRoot(
  root:
    FinoraControlCenterBranchDirectoryMetadataRoot,
): FinoraControlCenterBranchDirectoryMetadataRoot {

  return JSON.parse(
    JSON.stringify(
      root,
    ),
  ) as
    FinoraControlCenterBranchDirectoryMetadataRoot;
}

function scopeKey(
  ownerId: string,
  businessId: string,
  branchId: string,
): string {

  return [
    ownerId,
    businessId,
    branchId,
  ].join(
    "\u001f",
  );
}

function validateRecord(
  value: unknown,
): asserts value is FinoraControlCenterBranchDirectoryMetadataRecord {

  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Directory metadata record is invalid.",
    );
  }

  const record =
    value as
      Record<string, unknown>;

  if (
    !isNonEmptyString(
      record.ownerId,
    ) ||
    !isNonEmptyString(
      record.businessId,
    ) ||
    !isNonEmptyString(
      record.branchId,
    ) ||
    !isSource(
      record.lastSource,
    ) ||
    !isCanonicalTimestamp(
      record.updatedAt,
    ) ||
    record.schemaVersion !==
      FINORA_CONTROL_CENTER_BRANCH_DIRECTORY_METADATA_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA Control Center Branch Directory metadata record fields are invalid.",
    );
  }

  for (
    const key of [
      "ownerName",
      "businessName",
      "branchName",
    ] as const
  ) {

    const candidate =
      record[key];

    if (
      candidate !==
        undefined &&
      !isNonEmptyString(
        candidate,
      )
    ) {
      throw new Error(
        `FINORA Control Center Branch Directory ${key} is invalid.`,
      );
    }
  }

  if (
    record.ownerName ===
      undefined &&
    record.businessName ===
      undefined &&
    record.branchName ===
      undefined
  ) {
    throw new Error(
      "FINORA Control Center Branch Directory metadata requires at least one display field.",
    );
  }
}

function validateRoot(
  value: unknown,
): asserts value is FinoraControlCenterBranchDirectoryMetadataRoot {

  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Directory metadata root is invalid.",
    );
  }

  const root =
    value as
      Record<string, unknown>;

  if (
    !Array.isArray(
      root.records,
    ) ||
    !isCanonicalTimestamp(
      root.updatedAt,
    ) ||
    root.schemaVersion !==
      FINORA_CONTROL_CENTER_BRANCH_DIRECTORY_METADATA_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA Control Center Branch Directory metadata root fields are invalid.",
    );
  }

  const keys =
    new Set<string>();

  for (
    const candidate of
    root.records
  ) {

    validateRecord(
      candidate,
    );

    const record =
      candidate as
        FinoraControlCenterBranchDirectoryMetadataRecord;

    const key =
      scopeKey(
        record.ownerId,
        record.businessId,
        record.branchId,
      );

    if (
      keys.has(
        key,
      )
    ) {
      throw new Error(
        "FINORA Control Center Branch Directory metadata contains a duplicate branch scope.",
      );
    }

    keys.add(
      key,
    );
  }
}

function getStorePath():
  string {

  if (!app.isReady()) {
    throw new Error(
      "FINORA Control Center Branch Directory metadata cannot be used before Electron is ready.",
    );
  }

  return path.join(
    app.getPath(
      "userData",
    ),
    STORE_DIRECTORY,
    STORE_SUBDIRECTORY,
    STORE_FILE,
  );
}

function createEmptyRoot(
  observedAt: string,
): FinoraControlCenterBranchDirectoryMetadataRoot {

  return {
    records:
      [],

    updatedAt:
      observedAt,

    schemaVersion:
      FINORA_CONTROL_CENTER_BRANCH_DIRECTORY_METADATA_SCHEMA_VERSION,
  };
}

async function readStore():
  Promise<
    FinoraControlCenterBranchDirectoryMetadataRoot | undefined
  > {

  const storePath =
    getStorePath();

  let encrypted:
    Buffer;

  try {

    encrypted =
      await fs.readFile(
        storePath,
      );

  } catch (error) {

    const code =
      (
        error as
          NodeJS.ErrnoException
      ).code;

    if (code === "ENOENT") {
      return undefined;
    }

    throw error;
  }

  if (
    encrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA Control Center Branch Directory metadata file is empty.",
    );
  }

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Branch Directory metadata encryption is unavailable.",
    );
  }

  let plaintext:
    string;

  try {

    plaintext =
      safeStorage.decryptString(
        encrypted,
      );

  } catch {

    throw new Error(
      "FINORA Control Center Branch Directory metadata cannot be decrypted.",
    );
  }

  let parsed:
    unknown;

  try {

    parsed =
      JSON.parse(
        plaintext,
      );

  } catch {

    throw new Error(
      "FINORA Control Center Branch Directory metadata contains invalid JSON.",
    );
  }

  validateRoot(
    parsed,
  );

  return cloneRoot(
    parsed,
  );
}

async function writeStore(
  root:
    FinoraControlCenterBranchDirectoryMetadataRoot,
): Promise<void> {

  validateRoot(
    root,
  );

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Branch Directory metadata encryption is unavailable. Metadata was not persisted.",
    );
  }

  const storePath =
    getStorePath();

  const directory =
    path.dirname(
      storePath,
    );

  await fs.mkdir(
    directory,
    {
      recursive:
        true,
    },
  );

  const encrypted =
    safeStorage.encryptString(
      JSON.stringify(
        root,
      ),
    );

  const temporaryPath =
    `${storePath}.${process.pid}.${Date.now()}.tmp`;

  try {

    await fs.writeFile(
      temporaryPath,
      encrypted,
      {
        mode:
          0o600,
      },
    );

    await fs.rename(
      temporaryPath,
      storePath,
    );

  } catch (error) {

    await fs.rm(
      temporaryPath,
      {
        force:
          true,
      },
    )
      .catch(
        () =>
          undefined,
      );

    throw error;
  }
}

function normalizeRequired(
  value: string,
  label: string,
): string {

  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return normalized;
}

function normalizeOptional(
  value:
    string | undefined,
  label:
    string,
): string | undefined {

  if (
    value ===
      undefined
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      `${label} must be a non-empty string when supplied.`,
    );
  }

  return normalized;
}

async function upsertInternal(
  input:
    UpsertFinoraControlCenterBranchDirectoryMetadataInput,
): Promise<
  FinoraControlCenterBranchDirectoryMetadataRecord
> {

  const ownerId =
    normalizeRequired(
      input.ownerId,
      "Owner ID",
    );

  const businessId =
    normalizeRequired(
      input.businessId,
      "Business ID",
    );

  const branchId =
    normalizeRequired(
      input.branchId,
      "Branch ID",
    );

  if (
    !isSource(
      input.source,
    )
  ) {
    throw new Error(
      "FINORA Control Center Branch Directory metadata source is invalid.",
    );
  }

  const ownerName =
    normalizeOptional(
      input.ownerName,
      "Owner Name",
    );

  const businessName =
    normalizeOptional(
      input.businessName,
      "Business Name",
    );

  const branchName =
    normalizeOptional(
      input.branchName,
      "Branch Name",
    );

  if (
    ownerName ===
      undefined &&
    businessName ===
      undefined &&
    branchName ===
      undefined
  ) {
    throw new Error(
      "At least one FINORA Branch Directory display field is required.",
    );
  }

  const clockResult =
    await observeFinoraControlCenterAuthoritativeWallClock();

  if (
    !clockResult.success
  ) {
    throw new Error(
      clockResult.error,
    );
  }

  const observedAt =
    clockResult.data.observedAt;

  const existingRoot =
    await readStore();

  const root =
    existingRoot ??
    createEmptyRoot(
      observedAt,
    );

  const key =
    scopeKey(
      ownerId,
      businessId,
      branchId,
    );

  let record =
    root.records.find(
      (
        candidate,
      ) =>
        scopeKey(
          candidate.ownerId,
          candidate.businessId,
          candidate.branchId,
        ) ===
        key,
    );

  if (!record) {

    record = {
      ownerId,
      businessId,
      branchId,

      ...(ownerName !==
        undefined
        ? {
            ownerName,
          }
        : {}),

      ...(businessName !==
        undefined
        ? {
            businessName,
          }
        : {}),

      ...(branchName !==
        undefined
        ? {
            branchName,
          }
        : {}),

      lastSource:
        input.source,

      updatedAt:
        observedAt,

      schemaVersion:
        FINORA_CONTROL_CENTER_BRANCH_DIRECTORY_METADATA_SCHEMA_VERSION,
    };

    root.records.push(
      record,
    );

  } else {

    if (
      ownerName !==
        undefined
    ) {
      record.ownerName =
        ownerName;
    }

    if (
      businessName !==
        undefined
    ) {
      record.businessName =
        businessName;
    }

    if (
      branchName !==
        undefined
    ) {
      record.branchName =
        branchName;
    }

    record.lastSource =
      input.source;

    record.updatedAt =
      observedAt;
  }

  root.updatedAt =
    observedAt;

  validateRoot(
    root,
  );

  await writeStore(
    root,
  );

  return cloneRecord(
    record,
  );
}

export async function loadFinoraControlCenterBranchDirectoryMetadata():
  Promise<
    FinoraControlCenterBranchDirectoryMetadataRecord[]
  > {

  const root =
    await readStore();

  return root ===
    undefined
    ? []
    : root.records.map(
        cloneRecord,
      );
}

export async function findFinoraControlCenterBranchDirectoryMetadata(
  ownerId: string,
  businessId: string,
  branchId: string,
): Promise<
  FinoraControlCenterBranchDirectoryMetadataRecord | undefined
> {

  const normalizedOwnerId =
    normalizeRequired(
      ownerId,
      "Owner ID",
    );

  const normalizedBusinessId =
    normalizeRequired(
      businessId,
      "Business ID",
    );

  const normalizedBranchId =
    normalizeRequired(
      branchId,
      "Branch ID",
    );

  const root =
    await readStore();

  if (!root) {
    return undefined;
  }

  const key =
    scopeKey(
      normalizedOwnerId,
      normalizedBusinessId,
      normalizedBranchId,
    );

  const record =
    root.records.find(
      (
        candidate,
      ) =>
        scopeKey(
          candidate.ownerId,
          candidate.businessId,
          candidate.branchId,
        ) ===
        key,
    );

  return record ===
    undefined
    ? undefined
    : cloneRecord(
        record,
      );
}

export function upsertFinoraControlCenterBranchDirectoryMetadata(
  input:
    UpsertFinoraControlCenterBranchDirectoryMetadataInput,
): Promise<
  FinoraControlCenterBranchDirectoryMetadataRecord
> {

  const operation =
    mutationQueue.then(
      () =>
        upsertInternal(
          input,
        ),
      () =>
        upsertInternal(
          input,
        ),
    );

  mutationQueue =
    operation.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return operation;
}