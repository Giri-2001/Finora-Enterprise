/* ============================================================
   FINORA ENTERPRISE OS
   CONTROL CENTER
   BRANCH CERTIFICATION ROTATION ISSUANCE JOURNAL

   SECURITY / IDEMPOTENCY CONTRACT

   - requestId maps durably to exactly one signed package.
   - Mapping is persisted before package return/export.
   - Exact retry returns identical package/sequence/signature.
   - requestId collision with different request evidence fails.
   - Persisted package digest mismatch fails closed.
   - Lookup -> issue -> durable write is same-process serialized.
   - Journal is safeStorage encrypted and atomically replaced.
============================================================ */

import {
  app,
  safeStorage,
} from "electron";

import {
  createHash,
} from "node:crypto";

import {
  promises as fs,
} from "node:fs";

import path from "node:path";

const JOURNAL_FORMAT =
  "FINORA_BRANCH_CERTIFICATION_ROTATION_ISSUANCE_JOURNAL" as const;

const JOURNAL_SCHEMA_VERSION =
  1 as const;

const DIGEST_ALGORITHM =
  "SHA-256" as const;

const MAX_JOURNAL_BYTES =
  16 * 1024 * 1024;

const MAX_PACKAGE_JSON_BYTES =
  512 * 1024;

export interface FinoraBranchCertificationRotationJournalRequestEvidence {
  request: {
    requestId:
      string;
  };
}

interface FinoraBranchCertificationRotationIssuanceJournalRecordV1 {
  requestId:
    string;

  requestDigestAlgorithm:
    typeof DIGEST_ALGORITHM;

  requestDigest:
    string;

  signedPackageDigestAlgorithm:
    typeof DIGEST_ALGORITHM;

  signedPackageDigest:
    string;

  signedPackageJson:
    string;

  schemaVersion:
    1;
}

interface FinoraBranchCertificationRotationIssuanceJournalV1 {
  format:
    typeof JOURNAL_FORMAT;

  records:
    FinoraBranchCertificationRotationIssuanceJournalRecordV1[];

  schemaVersion:
    typeof JOURNAL_SCHEMA_VERSION;
}

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {

  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function isNonEmptyString(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function isSha256(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    /^[0-9a-f]{64}$/.test(
      value,
    )
  );
}

function sha256(
  value:
    string,
): string {

  return createHash(
    "sha256",
  )
    .update(
      value,
      "utf8",
    )
    .digest(
      "hex",
    );
}

function canonicalize(
  value:
    unknown,
): unknown {

  if (
    Array.isArray(
      value,
    )
  ) {
    return value.map(
      (
        item,
      ) =>
        canonicalize(
          item,
        ),
    );
  }

  if (
    isRecord(
      value,
    )
  ) {
    const output:
      Record<string, unknown> =
      {};

    for (
      const key of
      Object.keys(
        value,
      ).sort()
    ) {
      const item =
        value[
          key
        ];

      if (
        item !==
          undefined
      ) {
        output[
          key
        ] =
          canonicalize(
            item,
          );
      }
    }

    return output;
  }

  return value;
}

function canonicalJson(
  value:
    unknown,
): string {

  const result =
    JSON.stringify(
      canonicalize(
        value,
      ),
    );

  if (
    typeof result !==
      "string"
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation request evidence cannot be canonicalized.",
    );
  }

  return result;
}

function getJournalPath():
  string {

  return path.join(
    app.getPath(
      "userData",
    ),
    "FINORA",
    "control-center",
    "finora-branch-certification-rotation-issuance-journal.bin",
  );
}

function createEmptyJournal():
  FinoraBranchCertificationRotationIssuanceJournalV1 {

  return {
    format:
      JOURNAL_FORMAT,

    records:
      [],

    schemaVersion:
      JOURNAL_SCHEMA_VERSION,
  };
}

function assertJournalRecord(
  value:
    unknown,
): asserts value is FinoraBranchCertificationRotationIssuanceJournalRecordV1 {

  if (
    !isRecord(
      value,
    ) ||
    Object.keys(
      value,
    ).sort().join(
      "|",
    ) !==
      [
        "requestDigest",
        "requestDigestAlgorithm",
        "requestId",
        "schemaVersion",
        "signedPackageDigest",
        "signedPackageDigestAlgorithm",
        "signedPackageJson",
      ].sort().join(
        "|",
      ) ||
    !isNonEmptyString(
      value.requestId,
    ) ||
    value.requestDigestAlgorithm !==
      DIGEST_ALGORITHM ||
    !isSha256(
      value.requestDigest,
    ) ||
    value.signedPackageDigestAlgorithm !==
      DIGEST_ALGORITHM ||
    !isSha256(
      value.signedPackageDigest,
    ) ||
    !isNonEmptyString(
      value.signedPackageJson,
    ) ||
    Buffer.byteLength(
      value.signedPackageJson,
      "utf8",
    ) >
      MAX_PACKAGE_JSON_BYTES ||
    sha256(
      value.signedPackageJson,
    ) !==
      value.signedPackageDigest ||
    value.schemaVersion !==
      1
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation issuance journal record is invalid.",
    );
  }

  let signedPackage:
    unknown;

  try {
    signedPackage =
      JSON.parse(
        value.signedPackageJson,
      );
  }
  catch {
    throw new Error(
      "FINORA Branch Certification Rotation issuance journal signed package is malformed.",
    );
  }

  if (
    !isRecord(
      signedPackage,
    ) ||
    !isNonEmptyString(
      signedPackage.packageId,
    ) ||
    !Number.isSafeInteger(
      signedPackage.sequence,
    ) ||
    (
      signedPackage.sequence as number
    ) <=
      0 ||
    !isRecord(
      signedPackage.payload,
    ) ||
    signedPackage.payload.requestId !==
      value.requestId
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation issuance journal signed package metadata is invalid.",
    );
  }
}

function assertJournal(
  value:
    unknown,
): asserts value is FinoraBranchCertificationRotationIssuanceJournalV1 {

  if (
    !isRecord(
      value,
    ) ||
    Object.keys(
      value,
    ).sort().join(
      "|",
    ) !==
      [
        "format",
        "records",
        "schemaVersion",
      ].sort().join(
        "|",
      ) ||
    value.format !==
      JOURNAL_FORMAT ||
    !Array.isArray(
      value.records,
    ) ||
    value.schemaVersion !==
      JOURNAL_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation issuance journal is invalid.",
    );
  }

  const requestIds =
    new Set<string>();

  const packageIds =
    new Set<string>();

  for (
    const record of
    value.records
  ) {
    assertJournalRecord(
      record,
    );

    if (
      requestIds.has(
        record.requestId,
      )
    ) {
      throw new Error(
        "FINORA Branch Certification Rotation issuance journal contains a duplicate requestId.",
      );
    }

    requestIds.add(
      record.requestId,
    );

    const signedPackage =
      JSON.parse(
        record.signedPackageJson,
      ) as {
        packageId:
          string;
      };

    if (
      packageIds.has(
        signedPackage.packageId,
      )
    ) {
      throw new Error(
        "FINORA Branch Certification Rotation issuance journal contains a duplicate packageId.",
      );
    }

    packageIds.add(
      signedPackage.packageId,
    );
  }
}

function parsePersistedPackage<
  TSignedPackage
>(
  record:
    FinoraBranchCertificationRotationIssuanceJournalRecordV1,
): TSignedPackage {

  assertJournalRecord(
    record,
  );

  return JSON.parse(
    record.signedPackageJson,
  ) as TSignedPackage;
}

async function readJournal():
  Promise<
    FinoraBranchCertificationRotationIssuanceJournalV1
  > {

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Branch Certification Rotation issuance-journal encryption is unavailable.",
    );
  }

  const journalPath =
    getJournalPath();

  let encrypted:
    Buffer;

  try {
    encrypted =
      await fs.readFile(
        journalPath,
      );
  }
  catch (
    error
  ) {
    if (
      isRecord(
        error,
      ) &&
      error.code ===
        "ENOENT"
    ) {
      return createEmptyJournal();
    }

    throw error;
  }

  if (
    encrypted.byteLength <=
      0 ||
    encrypted.byteLength >
      MAX_JOURNAL_BYTES
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation issuance journal size is invalid.",
    );
  }

  let plainText:
    string;

  try {
    plainText =
      safeStorage.decryptString(
        encrypted,
      );
  }
  catch {
    throw new Error(
      "FINORA Branch Certification Rotation issuance journal could not be decrypted.",
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        plainText,
      );
  }
  catch {
    throw new Error(
      "FINORA Branch Certification Rotation issuance journal contains malformed JSON.",
    );
  }

  assertJournal(
    parsed,
  );

  return parsed;
}

async function writeJournal(
  journal:
    FinoraBranchCertificationRotationIssuanceJournalV1,
): Promise<void> {

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Branch Certification Rotation issuance-journal encryption is unavailable.",
    );
  }

  assertJournal(
    journal,
  );

  const journalPath =
    getJournalPath();

  const directory =
    path.dirname(
      journalPath,
    );

  await fs.mkdir(
    directory,
    {
      recursive:
        true,
    },
  );

  const serialized =
    JSON.stringify(
      journal,
    );

  const encrypted =
    safeStorage.encryptString(
      serialized,
    );

  if (
    encrypted.byteLength <=
      0 ||
    encrypted.byteLength >
      MAX_JOURNAL_BYTES
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation issuance journal exceeds the supported size limit.",
    );
  }

  const temporaryPath =
    `${journalPath}.${process.pid}.tmp`;

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
      journalPath,
    );
  }
  catch (
    error
  ) {
    await fs.rm(
      temporaryPath,
      {
        force:
          true,
      },
    ).catch(
      () =>
        undefined,
    );

    throw error;
  }
}

let journalQueue:
  Promise<void> =
  Promise.resolve();

function runSerialized<
  TResult
>(
  operation:
    () => Promise<TResult>,
): Promise<TResult> {

  const result =
    journalQueue.then(
      operation,
      operation,
    );

  journalQueue =
    result.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return result;
}

async function getOrCreateInternal<
  TSignedPackage
>(
  requestEvidence:
    FinoraBranchCertificationRotationJournalRequestEvidence,

  createSignedPackage:
    () => Promise<TSignedPackage>,
): Promise<TSignedPackage> {

  if (
    !requestEvidence ||
    !requestEvidence.request ||
    !isNonEmptyString(
      requestEvidence.request.requestId,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation issuance journal requires valid request evidence.",
    );
  }

  const requestId =
    requestEvidence.request.requestId;

  const requestDigest =
    sha256(
      canonicalJson(
        requestEvidence.request,
      ),
    );

  const journal =
    await readJournal();

  const existing =
    journal.records.find(
      (
        record,
      ) =>
        record.requestId ===
          requestId,
    );

  if (
    existing !==
      undefined
  ) {
    if (
      existing.requestDigestAlgorithm !==
        DIGEST_ALGORITHM ||
      existing.requestDigest !==
        requestDigest
    ) {
      throw new Error(
        "FINORA Branch Certification Rotation requestId conflicts with previously issued request evidence.",
      );
    }

    return parsePersistedPackage<
      TSignedPackage
    >(
      existing,
    );
  }

  const signedPackage =
    await createSignedPackage();

  const signedPackageJson =
    JSON.stringify(
      signedPackage,
    );

  if (
    typeof signedPackageJson !==
      "string" ||
    Buffer.byteLength(
      signedPackageJson,
      "utf8",
    ) <=
      0 ||
    Buffer.byteLength(
      signedPackageJson,
      "utf8",
    ) >
      MAX_PACKAGE_JSON_BYTES
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation issued package exceeds the supported journal size.",
    );
  }

  const candidate:
    FinoraBranchCertificationRotationIssuanceJournalRecordV1 = {
      requestId,

      requestDigestAlgorithm:
        DIGEST_ALGORITHM,

      requestDigest,

      signedPackageDigestAlgorithm:
        DIGEST_ALGORITHM,

      signedPackageDigest:
        sha256(
          signedPackageJson,
        ),

      signedPackageJson,

      schemaVersion:
        1,
  };

  assertJournalRecord(
    candidate,
  );

  const persistedPackage =
    JSON.parse(
      candidate.signedPackageJson,
    ) as {
      packageId:
        string;
    };

  for (
    const record of
    journal.records
  ) {
    const otherPackage =
      JSON.parse(
        record.signedPackageJson,
      ) as {
        packageId:
          string;
      };

    if (
      otherPackage.packageId ===
        persistedPackage.packageId
    ) {
      throw new Error(
        "FINORA Branch Certification Rotation issuance journal rejected a duplicate packageId.",
      );
    }
  }

  journal.records.push(
    candidate,
  );

  await writeJournal(
    journal,
  );

  /*
   * The package is returned only after durable requestId mapping.
   */
  return signedPackage;
}

export function getOrCreateFinoraBranchCertificationRotationIssuedPackage<
  TSignedPackage
>(
  requestEvidence:
    FinoraBranchCertificationRotationJournalRequestEvidence,

  createSignedPackage:
    () => Promise<TSignedPackage>,
): Promise<TSignedPackage> {

  return runSerialized(
    () =>
      getOrCreateInternal(
        requestEvidence,
        createSignedPackage,
      ),
  );
}