/* ===========================================================
   FINORA CONTROL CENTER
   PROVISIONING RESUME STORE

   PURPOSE:
   - Persist non-secret new-branch provisioning draft identity.
   - Resume Control Center provisioning after reload/restart.
   - Keep draft metadata separate from immutable Registry identity.
   - Never persist Password or Security Code.

   SECURITY:
   - MAIN PROCESS ONLY.
   - No signing authority.
   - No recipient private material.
   - No credential secrets.
   - No Registry identity mutation.
   - Protected at rest with Electron safeStorage.
   =========================================================== */

import {
  app,
  safeStorage,
} from "electron";

import fs from "node:fs/promises";
import path from "node:path";

export const
FINORA_CONTROL_CENTER_PROVISIONING_RESUME_SCHEMA_VERSION =
  1 as const;

export interface FinoraControlCenterProvisioningResumeRecord {
  ownerId: string;
  businessId: string;
  branchId: string;

  ownerName: string;
  businessName: string;
  branchName: string;

  userId: string;
  username: string;

  updatedAt: string;

  schemaVersion:
    typeof FINORA_CONTROL_CENTER_PROVISIONING_RESUME_SCHEMA_VERSION;
}

export interface UpsertFinoraControlCenterProvisioningResumeInput {
  ownerId: string;
  businessId: string;
  branchId: string;

  ownerName: string;
  businessName: string;
  branchName: string;

  userId: string;
  username: string;
}

interface FinoraControlCenterProvisioningResumeRoot {
  records:
    FinoraControlCenterProvisioningResumeRecord[];

  updatedAt: string;

  schemaVersion:
    typeof FINORA_CONTROL_CENTER_PROVISIONING_RESUME_SCHEMA_VERSION;
}

const STORE_DIRECTORY =
  "FINORA";

const STORE_SUBDIRECTORY =
  "control-center";

const STORE_FILE =
  "finora-control-center-provisioning-resume.bin";

let mutationQueue:
  Promise<void> =
    Promise.resolve();

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function cloneRecord(
  record:
    FinoraControlCenterProvisioningResumeRecord,
): FinoraControlCenterProvisioningResumeRecord {
  return JSON.parse(
    JSON.stringify(record),
  ) as FinoraControlCenterProvisioningResumeRecord;
}

function getStoreFile(): string {
  if (!app.isReady()) {
    throw new Error(
      "FINORA Control Center provisioning resume store requires Electron app readiness.",
    );
  }

  return path.join(
    app.getPath("userData"),
    STORE_DIRECTORY,
    STORE_SUBDIRECTORY,
    STORE_FILE,
  );
}

function createEmptyRoot():
  FinoraControlCenterProvisioningResumeRoot {
  return {
    records: [],
    updatedAt:
      new Date(0).toISOString(),
    schemaVersion:
      FINORA_CONTROL_CENTER_PROVISIONING_RESUME_SCHEMA_VERSION,
  };
}

function validateRecord(
  value: unknown,
): value is FinoraControlCenterProvisioningResumeRecord {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const record =
    value as Record<string, unknown>;

  return (
    isNonEmptyString(record.ownerId) &&
    isNonEmptyString(record.businessId) &&
    isNonEmptyString(record.branchId) &&
    isNonEmptyString(record.ownerName) &&
    isNonEmptyString(record.businessName) &&
    isNonEmptyString(record.branchName) &&
    isNonEmptyString(record.userId) &&
    isNonEmptyString(record.username) &&
    isNonEmptyString(record.updatedAt) &&
    record.schemaVersion ===
      FINORA_CONTROL_CENTER_PROVISIONING_RESUME_SCHEMA_VERSION
  );
}

function validateRoot(
  value: unknown,
): value is FinoraControlCenterProvisioningResumeRoot {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const root =
    value as Record<string, unknown>;

  return (
    root.schemaVersion ===
      FINORA_CONTROL_CENTER_PROVISIONING_RESUME_SCHEMA_VERSION &&
    Array.isArray(root.records) &&
    root.records.every(validateRecord) &&
    isNonEmptyString(root.updatedAt)
  );
}

async function readRoot():
  Promise<FinoraControlCenterProvisioningResumeRoot> {
  const file =
    getStoreFile();

  let encrypted: Buffer;

  try {
    encrypted =
      await fs.readFile(file);
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code ===
      "ENOENT"
    ) {
      return createEmptyRoot();
    }

    throw error;
  }

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA Control Center provisioning resume storage encryption is unavailable.",
    );
  }

  let plaintext: string;

  try {
    plaintext =
      safeStorage.decryptString(
        encrypted,
      );
  } catch {
    throw new Error(
      "FINORA Control Center provisioning resume store could not be decrypted.",
    );
  }

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(plaintext);
  } catch {
    throw new Error(
      "FINORA Control Center provisioning resume store contains invalid JSON.",
    );
  }

  if (!validateRoot(parsed)) {
    throw new Error(
      "FINORA Control Center provisioning resume store failed validation.",
    );
  }

  return parsed;
}

async function writeRoot(
  root:
    FinoraControlCenterProvisioningResumeRoot,
): Promise<void> {
  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA Control Center provisioning resume storage encryption is unavailable.",
    );
  }

  const file =
    getStoreFile();

  await fs.mkdir(
    path.dirname(file),
    {
      recursive: true,
    },
  );

  const encrypted =
    safeStorage.encryptString(
      JSON.stringify(root),
    );

  const temporaryFile =
    `${file}.tmp`;

  await fs.writeFile(
    temporaryFile,
    encrypted,
  );

  await fs.rename(
    temporaryFile,
    file,
  );
}

function scopeMatches(
  record:
    FinoraControlCenterProvisioningResumeRecord,
  ownerId: string,
  businessId: string,
  branchId: string,
): boolean {
  return (
    record.ownerId === ownerId &&
    record.businessId === businessId &&
    record.branchId === branchId
  );
}

export async function findFinoraControlCenterProvisioningResume(
  ownerId: string,
  businessId: string,
  branchId: string,
): Promise<
  FinoraControlCenterProvisioningResumeRecord |
  undefined
> {
  const root =
    await readRoot();

  const record =
    root.records.find(
      (candidate) =>
        scopeMatches(
          candidate,
          ownerId,
          businessId,
          branchId,
        ),
    );

  return record === undefined
    ? undefined
    : cloneRecord(record);
}

async function upsertInternal(
  input:
    UpsertFinoraControlCenterProvisioningResumeInput,
): Promise<
  FinoraControlCenterProvisioningResumeRecord
> {
  const values = [
    input.ownerId,
    input.businessId,
    input.branchId,
    input.ownerName,
    input.businessName,
    input.branchName,
    input.userId,
    input.username,
  ];

  if (
    values.some(
      (value) =>
        !isNonEmptyString(value),
    )
  ) {
    throw new Error(
      "FINORA Control Center provisioning resume requires complete non-secret draft identity.",
    );
  }

  const root =
    await readRoot();

  const now =
    new Date().toISOString();

  const record:
    FinoraControlCenterProvisioningResumeRecord = {
      ownerId:
        input.ownerId.trim(),
      businessId:
        input.businessId.trim(),
      branchId:
        input.branchId.trim(),

      ownerName:
        input.ownerName.trim(),
      businessName:
        input.businessName.trim(),
      branchName:
        input.branchName.trim(),

      userId:
        input.userId.trim(),
      username:
        input.username.trim(),

      updatedAt:
        now,

      schemaVersion:
        FINORA_CONTROL_CENTER_PROVISIONING_RESUME_SCHEMA_VERSION,
    };

  const index =
    root.records.findIndex(
      (candidate) =>
        scopeMatches(
          candidate,
          record.ownerId,
          record.businessId,
          record.branchId,
        ),
    );

  if (index >= 0) {
    root.records[index] =
      record;
  } else {
    root.records.push(
      record,
    );
  }

  root.updatedAt =
    now;

  await writeRoot(
    root,
  );

  return cloneRecord(
    record,
  );
}

export function upsertFinoraControlCenterProvisioningResume(
  input:
    UpsertFinoraControlCenterProvisioningResumeInput,
): Promise<
  FinoraControlCenterProvisioningResumeRecord
> {
  const operation =
    mutationQueue.then(
      () =>
        upsertInternal(input),
      () =>
        upsertInternal(input),
    );

  mutationQueue =
    operation.then(
      () => undefined,
      () => undefined,
    );

  return operation;
}
