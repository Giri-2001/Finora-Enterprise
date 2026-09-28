// ============================================================
// FINORA ENTERPRISE
// PORTABLE STATE DURABLE EXPORT SERVICE
//
// PURPOSE:
// - Create signed Portable State.
// - Encrypt it with a dedicated Transfer Code.
// - Persist crash-recovery transaction evidence.
// - Stage the encrypted transfer file.
// - Commit lineage Head.
// - Atomically expose final .finora file.
// - Recover interrupted export transactions.
//
// IMPORTANT:
// The Transfer Code is function-local input only and is never
// written into the transaction store.
// ============================================================

import {
  Buffer,
} from "node:buffer";

import {
  createHash,
} from "node:crypto";

import {
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";

import {
  dirname,
  extname,
  isAbsolute,
  join,
} from "node:path";

import {
  commitFinoraControlCenterPortableStateEnvelopeHead,
  createFinoraControlCenterPortableStateEnvelope,
} from "./finoraControlCenterPortableStateExporter.js";

import {
  loadFinoraControlCenterPortableStateHead,
} from "./finoraControlCenterPortableStateHeadStore.js";

import {
  runFinoraControlCenterKeyAuthoritySerialized,
} from "./finoraControlCenterKeyAuthorityQueue.js";

import {
  createFinoraControlCenterPortableStateTransferBundleV1,
  parseFinoraControlCenterPortableStateTransferBundleV1,
  serializeFinoraControlCenterPortableStateTransferBundleV1,
} from "./finoraControlCenterPortableStateTransferCrypto.js";

import {
  clearFinoraControlCenterPortableStateExportTransaction,
  loadFinoraControlCenterPortableStateExportTransaction,
  prepareFinoraControlCenterPortableStateExportTransaction,
} from "./finoraControlCenterPortableStateExportTransactionStore.js";

import type {
  FinoraControlCenterPortableStateExportTransactionRecord,
} from "./finoraControlCenterPortableStateExportTransactionStore.js";

import type {
  FinoraControlCenterPortableStateEnvelope,
} from "./finoraControlCenterPortableState.types.js";


const MAX_TRANSFER_FILE_BYTES =
  48 * 1024 * 1024;


export interface ExportFinoraControlCenterPortableStateToPathInput {
  readonly targetPath:
    string;

  readonly transferCode:
    string;
}


export interface ExportFinoraControlCenterPortableStateToPathResult {
  readonly status:
    "EXPORTED";

  readonly targetPath:
    string;

  readonly bytes:
    number;

  readonly stateGeneration:
    number;

  readonly payloadSha256:
    string;

  readonly parentPayloadSha256:
    string | null;

  readonly transferBundleSha256:
    string;
}


export interface RecoverFinoraControlCenterPortableStateExportResult {
  readonly status:
    | "ALREADY_CLEAR"
    | "RECOVERED_FROM_STAGING"
    | "RECOVERED_FROM_FINAL"
    | "ABANDONED_NO_DURABLE_ARTIFACT";

  readonly targetPath?:
    string;

  readonly stateGeneration?:
    number;

  readonly payloadSha256?:
    string;
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


function assertTargetPath(
  targetPath:
    string,
): void {

  if (
    typeof targetPath !==
      "string" ||
    targetPath.length ===
      0 ||
    targetPath !==
      targetPath.trim() ||
    !isAbsolute(
      targetPath,
    ) ||
    extname(
      targetPath,
    ).toLowerCase() !==
      ".finora"
  ) {

    throw new Error(
      "FINORA Portable State export target must be an absolute .finora path.",
    );
  }
}


function createSha256(
  bytes:
    Buffer,
): string {

  return createHash(
    "sha256",
  )
    .update(
      bytes,
    )
    .digest(
      "hex",
    );
}


async function pathExists(
  path:
    string,
): Promise<boolean> {

  try {

    await stat(
      path,
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
      code ===
        "ENOENT"
    ) {

      return false;
    }

    throw error;
  }
}


function resolveStagingPath(
  transaction:
    FinoraControlCenterPortableStateExportTransactionRecord,
): string {

  return join(
    dirname(
      transaction.targetPath,
    ),
    `.${transaction.transactionId}.finora-pending`,
  );
}


async function readAndVerifyTransferArtifact(
  artifactPath:
    string,
  expectedSha256:
    string,
): Promise<Buffer> {

  const bytes =
    await readFile(
      artifactPath,
    );

  if (
    bytes.length <=
      0 ||
    bytes.length >
      MAX_TRANSFER_FILE_BYTES
  ) {

    throw new Error(
      "FINORA Portable State transfer artifact size is invalid.",
    );
  }

  const actualSha256 =
    createSha256(
      bytes,
    );

  if (
    actualSha256 !==
      expectedSha256
  ) {

    throw new Error(
      "FINORA Portable State transfer artifact SHA-256 does not match the pending transaction.",
    );
  }

  parseFinoraControlCenterPortableStateTransferBundleV1(
    bytes.toString(
      "utf8",
    ),
  );

  return bytes;
}


function parsePendingEnvelope(
  transaction:
    FinoraControlCenterPortableStateExportTransactionRecord,
): FinoraControlCenterPortableStateEnvelope {

  let parsed:
    unknown;

  try {

    parsed =
      JSON.parse(
        transaction.serializedEnvelope,
      );
  } catch {

    throw new Error(
      "FINORA pending Portable State signed envelope is malformed.",
    );
  }

  if (
    !isRecord(
      parsed,
    ) ||
    !isRecord(
      parsed.payload,
    ) ||
    parsed.payload.issuerId !==
      transaction.issuerId ||
    parsed.payload.signingKeyId !==
      transaction.signingKeyId ||
    parsed.payload.stateGeneration !==
      transaction.stateGeneration ||
    parsed.payload.parentPayloadSha256 !==
      transaction.parentPayloadSha256 ||
    parsed.payloadSha256 !==
      transaction.payloadSha256
  ) {

    throw new Error(
      "FINORA pending Portable State transaction does not match its signed envelope evidence.",
    );
  }

  return parsed as unknown as
    FinoraControlCenterPortableStateEnvelope;
}


async function exportInternal(
  input:
    ExportFinoraControlCenterPortableStateToPathInput,
): Promise<
  ExportFinoraControlCenterPortableStateToPathResult
> {

  assertTargetPath(
    input.targetPath,
  );

  const pendingBefore =
    await loadFinoraControlCenterPortableStateExportTransaction();

  if (pendingBefore) {

    throw new Error(
      "FINORA Portable State export is blocked by a pending export transaction that requires recovery.",
    );
  }

  if (
    await pathExists(
      input.targetPath,
    )
  ) {

    throw new Error(
      "FINORA Portable State export target already exists.",
    );
  }


  const envelope =
    await createFinoraControlCenterPortableStateEnvelope();

  const serializedEnvelope =
    JSON.stringify(
      envelope,
    );

  const transferBundle =
    await createFinoraControlCenterPortableStateTransferBundleV1(
      serializedEnvelope,
      input.transferCode,
    );

  const serializedTransferBundle =
    serializeFinoraControlCenterPortableStateTransferBundleV1(
      transferBundle,
    );

  const transferBytes =
    Buffer.from(
      serializedTransferBundle,
      "utf8",
    );

  if (
    transferBytes.length <=
      0 ||
    transferBytes.length >
      MAX_TRANSFER_FILE_BYTES
  ) {

    throw new Error(
      "FINORA Portable State encrypted transfer file size is invalid.",
    );
  }

  const transferBundleSha256 =
    createSha256(
      transferBytes,
    );


  const transaction =
    await prepareFinoraControlCenterPortableStateExportTransaction({
      issuerId:
        envelope.payload.issuerId,

      signingKeyId:
        envelope.payload.signingKeyId,

      stateGeneration:
        envelope.payload.stateGeneration,

      parentPayloadSha256:
        envelope.payload.parentPayloadSha256,

      payloadSha256:
        envelope.payloadSha256,

      targetPath:
        input.targetPath,

      transferBundleSha256,

      serializedEnvelope,
    });


  const stagingPath =
    resolveStagingPath(
      transaction,
    );

  let headCommitAttempted =
    false;

  try {

    await mkdir(
      dirname(
        input.targetPath,
      ),
      {
        recursive:
          true,
      },
    );

    if (
      await pathExists(
        stagingPath,
      )
    ) {

      throw new Error(
        "FINORA Portable State export staging path already exists.",
      );
    }

    if (
      await pathExists(
        input.targetPath,
      )
    ) {

      throw new Error(
        "FINORA Portable State export target appeared during export.",
      );
    }


    await writeFile(
      stagingPath,
      transferBytes,
      {
        flag:
          "wx",
      },
    );


    await readAndVerifyTransferArtifact(
      stagingPath,
      transferBundleSha256,
    );


    /*
     * From this point onward, any failure retains the encrypted
     * transaction journal for explicit recovery.
     *
     * commitFinoraControlCenterPortableStateEnvelopeHead() is
     * idempotent for the same generation + payload digest.
     */
    headCommitAttempted =
      true;

    await commitFinoraControlCenterPortableStateEnvelopeHead(
      envelope,
    );


    if (
      await pathExists(
        input.targetPath,
      )
    ) {

      throw new Error(
        "FINORA Portable State final target appeared before atomic publish.",
      );
    }


    await rename(
      stagingPath,
      input.targetPath,
    );


    const finalBytes =
      await readAndVerifyTransferArtifact(
        input.targetPath,
        transferBundleSha256,
      );


    await clearFinoraControlCenterPortableStateExportTransaction(
      transaction.transactionId,
    );


    return {
      status:
        "EXPORTED",

      targetPath:
        input.targetPath,

      bytes:
        finalBytes.length,

      stateGeneration:
        envelope.payload.stateGeneration,

      payloadSha256:
        envelope.payloadSha256,

      parentPayloadSha256:
        envelope.payload.parentPayloadSha256,

      transferBundleSha256,
    };
  } catch (
    error
  ) {

    if (!headCommitAttempted) {

      await rm(
        stagingPath,
        {
          force:
            true,
        },
      ).catch(
        () =>
          undefined,
      );

      await clearFinoraControlCenterPortableStateExportTransaction(
        transaction.transactionId,
      ).catch(
        () =>
          undefined,
      );
    }

    throw error;
  }
}


async function recoverInternal():
  Promise<
    RecoverFinoraControlCenterPortableStateExportResult
  > {

  const transaction =
    await loadFinoraControlCenterPortableStateExportTransaction();

  if (!transaction) {

    return {
      status:
        "ALREADY_CLEAR",
    };
  }


  assertTargetPath(
    transaction.targetPath,
  );

  const stagingPath =
    resolveStagingPath(
      transaction,
    );

  const finalExists =
    await pathExists(
      transaction.targetPath,
    );

  const stagingExists =
    await pathExists(
      stagingPath,
    );


  if (
    finalExists &&
    stagingExists
  ) {

    throw new Error(
      "FINORA Portable State recovery found both staging and final artifacts; transaction is ambiguous.",
    );
  }


  const envelope =
    parsePendingEnvelope(
      transaction,
    );


  // ----------------------------------------------------------
  // FINAL FILE EXISTS
  //
  // Typical crash window:
  // Head committed + staging renamed + journal not yet cleared.
  // ----------------------------------------------------------

  if (finalExists) {

    await readAndVerifyTransferArtifact(
      transaction.targetPath,
      transaction.transferBundleSha256,
    );

    await commitFinoraControlCenterPortableStateEnvelopeHead(
      envelope,
    );

    await clearFinoraControlCenterPortableStateExportTransaction(
      transaction.transactionId,
    );

    return {
      status:
        "RECOVERED_FROM_FINAL",

      targetPath:
        transaction.targetPath,

      stateGeneration:
        transaction.stateGeneration,

      payloadSha256:
        transaction.payloadSha256,
    };
  }


  // ----------------------------------------------------------
  // STAGING FILE EXISTS
  //
  // Typical crash windows:
  // - staging durable before Head commit
  // - Head committed before final rename
  // ----------------------------------------------------------

  if (stagingExists) {

    await readAndVerifyTransferArtifact(
      stagingPath,
      transaction.transferBundleSha256,
    );

    await commitFinoraControlCenterPortableStateEnvelopeHead(
      envelope,
    );

    if (
      await pathExists(
        transaction.targetPath,
      )
    ) {

      throw new Error(
        "FINORA Portable State final target appeared during recovery.",
      );
    }

    await rename(
      stagingPath,
      transaction.targetPath,
    );

    await readAndVerifyTransferArtifact(
      transaction.targetPath,
      transaction.transferBundleSha256,
    );

    await clearFinoraControlCenterPortableStateExportTransaction(
      transaction.transactionId,
    );

    return {
      status:
        "RECOVERED_FROM_STAGING",

      targetPath:
        transaction.targetPath,

      stateGeneration:
        transaction.stateGeneration,

      payloadSha256:
        transaction.payloadSha256,
    };
  }


  // ----------------------------------------------------------
  // NEITHER ARTIFACT EXISTS
  //
  // Safe abandon is allowed only when the lineage Head still
  // equals the transaction parent.
  //
  // If Head already equals the pending export, the artifact was
  // committed but is now missing. Keep the journal and fail.
  // ----------------------------------------------------------

  const currentHead =
    await loadFinoraControlCenterPortableStateHead();


  if (
    currentHead &&
    currentHead.issuerId ===
      transaction.issuerId &&
    currentHead.headGeneration ===
      transaction.stateGeneration &&
    currentHead.headPayloadSha256 ===
      transaction.payloadSha256
  ) {

    throw new Error(
      "FINORA Portable State lineage Head is committed but its durable export artifact is missing.",
    );
  }


  const canSafelyAbandon =
    (
      !currentHead &&
      transaction.parentPayloadSha256 ===
        null
    ) ||
    (
      currentHead !==
        undefined &&
      currentHead.issuerId ===
        transaction.issuerId &&
      currentHead.headGeneration <
        transaction.stateGeneration &&
      currentHead.headPayloadSha256 ===
        transaction.parentPayloadSha256
    );


  if (!canSafelyAbandon) {

    throw new Error(
      "FINORA Portable State pending export lineage does not match the current local Head.",
    );
  }


  await clearFinoraControlCenterPortableStateExportTransaction(
    transaction.transactionId,
  );


  return {
    status:
      "ABANDONED_NO_DURABLE_ARTIFACT",

    targetPath:
      transaction.targetPath,

    stateGeneration:
      transaction.stateGeneration,

    payloadSha256:
      transaction.payloadSha256,
  };
}


export function exportFinoraControlCenterPortableStateToPath(
  input:
    ExportFinoraControlCenterPortableStateToPathInput,
): Promise<
  ExportFinoraControlCenterPortableStateToPathResult
> {

  return runFinoraControlCenterKeyAuthoritySerialized(
    () =>
      exportInternal(
        input,
      ),
  );
}


export function recoverFinoraControlCenterPortableStateExport():
  Promise<
    RecoverFinoraControlCenterPortableStateExportResult
  > {

  return runFinoraControlCenterKeyAuthoritySerialized(
    recoverInternal,
  );
}