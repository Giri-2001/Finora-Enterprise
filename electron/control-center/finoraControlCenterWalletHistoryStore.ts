/* ===========================================================
   FINORA CONTROL CENTER
   WALLET HISTORY JOURNAL

   PURPOSE:
   - Persist branch-specific Wallet Recharge decision history.
   - Record APPROVED / DECLINED outcomes only after callers
     have completed their authoritative signed/export flow.
   - Retain local import/export file evidence for audit.
   - Keep local filesystem paths out of signed FINORA payloads.

   SECURITY:
   - MAIN PROCESS ONLY.
   - Electron safeStorage encrypted at rest.
   - Logical append-only journal.
   - No update/delete API.
   - No Wallet mutation.
   - No signing authority.
   - No renderer-supplied financial authority.
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
FINORA_CONTROL_CENTER_WALLET_HISTORY_SCHEMA_VERSION =
  1 as const;

export type FinoraControlCenterWalletHistoryDecision =
  | "APPROVED"
  | "DECLINED";

export interface FinoraControlCenterWalletHistoryRecord {
  historyId:
    string;

  decision:
    FinoraControlCenterWalletHistoryDecision;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  businessCode:
    string;

  branchCode:
    string;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    string;

  publicKeyFingerprint:
    string;

  requestId:
    string;

  paymentReference:
    string;

  amountMinor:
    number;

  currency:
    string;

  paymentMethod:
    string;

  paymentSource:
    string;

  requestedAt:
    string;

  decisionAt:
    string;

  recordedAt:
    string;

  controlBundlePackageId:
    string;

  importedRequestFileName:
    string;

  importedRequestFilePath:
    string;

  exportedResultFileName:
    string;

  exportedResultFilePath:
    string;

  schemaVersion:
    typeof FINORA_CONTROL_CENTER_WALLET_HISTORY_SCHEMA_VERSION;
}

interface FinoraControlCenterWalletHistoryRoot {
  records:
    FinoraControlCenterWalletHistoryRecord[];

  createdAt:
    string;

  updatedAt:
    string;

  schemaVersion:
    typeof FINORA_CONTROL_CENTER_WALLET_HISTORY_SCHEMA_VERSION;
}

export interface AppendFinoraControlCenterWalletHistoryInput {
  decision:
    FinoraControlCenterWalletHistoryDecision;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  businessCode:
    string;

  branchCode:
    string;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    string;

  publicKeyFingerprint:
    string;

  requestId:
    string;

  paymentReference:
    string;

  amountMinor:
    number;

  currency:
    string;

  paymentMethod:
    string;

  paymentSource:
    string;

  requestedAt:
    string;

  decisionAt:
    string;

  controlBundlePackageId:
    string;

  importedRequestFileName:
    string;

  importedRequestFilePath:
    string;

  exportedResultFileName:
    string;

  exportedResultFilePath:
    string;
}

const STORE_DIRECTORY =
  "FINORA";

const STORE_SUBDIRECTORY =
  "control-center";

const STORE_FILE =
  "finora-control-center-wallet-history.bin";

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
    Date.parse(
      value,
    );

  return (
    Number.isFinite(parsed) &&
    new Date(parsed).toISOString() ===
      value
  );
}

function isDecision(
  value: unknown,
): value is FinoraControlCenterWalletHistoryDecision {

  return (
    value ===
      "APPROVED" ||
    value ===
      "DECLINED"
  );
}

function cloneRecord(
  record:
    FinoraControlCenterWalletHistoryRecord,
): FinoraControlCenterWalletHistoryRecord {

  return JSON.parse(
    JSON.stringify(
      record,
    ),
  ) as
    FinoraControlCenterWalletHistoryRecord;
}

function cloneRoot(
  root:
    FinoraControlCenterWalletHistoryRoot,
): FinoraControlCenterWalletHistoryRoot {

  return JSON.parse(
    JSON.stringify(
      root,
    ),
  ) as
    FinoraControlCenterWalletHistoryRoot;
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

function requireCanonicalTimestamp(
  value: string,
  label: string,
): string {

  const normalized =
    normalizeRequired(
      value,
      label,
    );

  if (
    !isCanonicalTimestamp(
      normalized,
    )
  ) {
    throw new Error(
      `${label} must be a canonical ISO timestamp.`,
    );
  }

  return normalized;
}

function requireAbsolutePath(
  value: string,
  label: string,
): string {

  const normalized =
    normalizeRequired(
      value,
      label,
    );

  if (
    !path.isAbsolute(
      normalized,
    )
  ) {
    throw new Error(
      `${label} must be an absolute local filesystem path.`,
    );
  }

  return normalized;
}

function validateFileEvidence(
  fileName: string,
  filePath: string,
  label: string,
): void {

  if (
    path.basename(
      filePath,
    ).toLocaleLowerCase() !==
    fileName.toLocaleLowerCase()
  ) {
    throw new Error(
      `${label} filename does not match its local path.`,
    );
  }
}

function createHistoryId(
  controlBundlePackageId: string,
): string {

  return (
    "FINORA-WALLET-HISTORY-" +
    controlBundlePackageId
  );
}

function validateRecord(
  value: unknown,
): asserts value is FinoraControlCenterWalletHistoryRecord {

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
      "FINORA Control Center Wallet History record is invalid.",
    );
  }

  const record =
    value as
      Record<string, unknown>;

  const requiredStrings =
    [
      "historyId",
      "ownerId",
      "businessId",
      "branchId",
      "businessCode",
      "branchCode",
      "installationId",
      "bindingKeyId",
      "fingerprintAlgorithm",
      "publicKeyFingerprint",
      "requestId",
      "paymentReference",
      "currency",
      "paymentMethod",
      "paymentSource",
      "controlBundlePackageId",
      "importedRequestFileName",
      "importedRequestFilePath",
      "exportedResultFileName",
      "exportedResultFilePath",
    ] as const;

  for (
    const key of
    requiredStrings
  ) {

    if (
      !isNonEmptyString(
        record[key],
      )
    ) {
      throw new Error(
        `FINORA Control Center Wallet History ${key} is invalid.`,
      );
    }
  }

  if (
    !isDecision(
      record.decision,
    )
  ) {
    throw new Error(
      "FINORA Control Center Wallet History decision is invalid.",
    );
  }

  if (
    typeof record.amountMinor !==
      "number" ||
    !Number.isSafeInteger(
      record.amountMinor,
    ) ||
    record.amountMinor <=
      0
  ) {
    throw new Error(
      "FINORA Control Center Wallet History amountMinor is invalid.",
    );
  }

  if (
    !isCanonicalTimestamp(
      record.requestedAt,
    ) ||
    !isCanonicalTimestamp(
      record.decisionAt,
    ) ||
    !isCanonicalTimestamp(
      record.recordedAt,
    )
  ) {
    throw new Error(
      "FINORA Control Center Wallet History timestamp is invalid.",
    );
  }

  if (
    record.schemaVersion !==
      FINORA_CONTROL_CENTER_WALLET_HISTORY_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA Control Center Wallet History record schema is invalid.",
    );
  }

  const expectedHistoryId =
    createHistoryId(
      record.controlBundlePackageId as string,
    );

  if (
    record.historyId !==
      expectedHistoryId
  ) {
    throw new Error(
      "FINORA Control Center Wallet History ID is invalid.",
    );
  }

  const importedPath =
    record.importedRequestFilePath as string;

  const exportedPath =
    record.exportedResultFilePath as string;

  if (
    !path.isAbsolute(
      importedPath,
    ) ||
    !path.isAbsolute(
      exportedPath,
    )
  ) {
    throw new Error(
      "FINORA Control Center Wallet History file evidence path is invalid.",
    );
  }

  validateFileEvidence(
    record.importedRequestFileName as string,
    importedPath,
    "Imported Wallet Recharge Request",
  );

  validateFileEvidence(
    record.exportedResultFileName as string,
    exportedPath,
    "Exported Wallet Recharge result",
  );
}

function validateRoot(
  value: unknown,
): asserts value is FinoraControlCenterWalletHistoryRoot {

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
      "FINORA Control Center Wallet History root is invalid.",
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
      root.createdAt,
    ) ||
    !isCanonicalTimestamp(
      root.updatedAt,
    ) ||
    root.schemaVersion !==
      FINORA_CONTROL_CENTER_WALLET_HISTORY_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA Control Center Wallet History root fields are invalid.",
    );
  }

  const historyIds =
    new Set<string>();

  const packageIds =
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
        FinoraControlCenterWalletHistoryRecord;

    if (
      historyIds.has(
        record.historyId,
      )
    ) {
      throw new Error(
        "FINORA Control Center Wallet History contains a duplicate history ID.",
      );
    }

    if (
      packageIds.has(
        record.controlBundlePackageId,
      )
    ) {
      throw new Error(
        "FINORA Control Center Wallet History contains a duplicate Control Bundle package ID.",
      );
    }

    historyIds.add(
      record.historyId,
    );

    packageIds.add(
      record.controlBundlePackageId,
    );
  }
}

function getStorePath():
  string {

  if (!app.isReady()) {
    throw new Error(
      "FINORA Control Center Wallet History cannot be used before Electron is ready.",
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

async function readStore():
  Promise<
    FinoraControlCenterWalletHistoryRoot | undefined
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
      "FINORA Control Center Wallet History file is empty.",
    );
  }

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Wallet History encryption is unavailable.",
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
      "FINORA Control Center Wallet History cannot be decrypted.",
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
      "FINORA Control Center Wallet History contains invalid JSON.",
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
    FinoraControlCenterWalletHistoryRoot,
): Promise<void> {

  validateRoot(
    root,
  );

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Wallet History encryption is unavailable.",
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

function normalizeInput(
  input:
    AppendFinoraControlCenterWalletHistoryInput,
): Omit<
  FinoraControlCenterWalletHistoryRecord,
  "historyId" | "recordedAt" | "schemaVersion"
> {

  if (
    !isDecision(
      input.decision,
    )
  ) {
    throw new Error(
      "FINORA Wallet History decision must be APPROVED or DECLINED.",
    );
  }

  if (
    !Number.isSafeInteger(
      input.amountMinor,
    ) ||
    input.amountMinor <=
      0
  ) {
    throw new Error(
      "FINORA Wallet History amountMinor must be a positive safe integer.",
    );
  }

  const importedRequestFileName =
    normalizeRequired(
      input.importedRequestFileName,
      "Imported request filename",
    );

  const importedRequestFilePath =
    requireAbsolutePath(
      input.importedRequestFilePath,
      "Imported request path",
    );

  const exportedResultFileName =
    normalizeRequired(
      input.exportedResultFileName,
      "Exported result filename",
    );

  const exportedResultFilePath =
    requireAbsolutePath(
      input.exportedResultFilePath,
      "Exported result path",
    );

  validateFileEvidence(
    importedRequestFileName,
    importedRequestFilePath,
    "Imported Wallet Recharge Request",
  );

  validateFileEvidence(
    exportedResultFileName,
    exportedResultFilePath,
    "Exported Wallet Recharge result",
  );

  return {
    decision:
      input.decision,

    ownerId:
      normalizeRequired(
        input.ownerId,
        "Owner ID",
      ),

    businessId:
      normalizeRequired(
        input.businessId,
        "Business ID",
      ),

    branchId:
      normalizeRequired(
        input.branchId,
        "Branch ID",
      ),

    businessCode:
      normalizeRequired(
        input.businessCode,
        "Business Code",
      ),

    branchCode:
      normalizeRequired(
        input.branchCode,
        "Branch Code",
      ),

    installationId:
      normalizeRequired(
        input.installationId,
        "Installation ID",
      ),

    bindingKeyId:
      normalizeRequired(
        input.bindingKeyId,
        "Binding Key ID",
      ),

    fingerprintAlgorithm:
      normalizeRequired(
        input.fingerprintAlgorithm,
        "Fingerprint Algorithm",
      ),

    publicKeyFingerprint:
      normalizeRequired(
        input.publicKeyFingerprint,
        "Public Key Fingerprint",
      ),

    requestId:
      normalizeRequired(
        input.requestId,
        "Wallet Recharge Request ID",
      ),

    paymentReference:
      normalizeRequired(
        input.paymentReference,
        "Payment Reference",
      ),

    amountMinor:
      input.amountMinor,

    currency:
      normalizeRequired(
        input.currency,
        "Currency",
      ),

    paymentMethod:
      normalizeRequired(
        input.paymentMethod,
        "Payment Method",
      ),

    paymentSource:
      normalizeRequired(
        input.paymentSource,
        "Payment Source",
      ),

    requestedAt:
      requireCanonicalTimestamp(
        input.requestedAt,
        "Requested At",
      ),

    decisionAt:
      requireCanonicalTimestamp(
        input.decisionAt,
        "Decision At",
      ),

    controlBundlePackageId:
      normalizeRequired(
        input.controlBundlePackageId,
        "Control Bundle Package ID",
      ),

    importedRequestFileName,
    importedRequestFilePath,
    exportedResultFileName,
    exportedResultFilePath,
  };
}

function recordMatchesInput(
  record:
    FinoraControlCenterWalletHistoryRecord,

  input:
    Omit<
      FinoraControlCenterWalletHistoryRecord,
      "historyId" | "recordedAt" | "schemaVersion"
    >,
): boolean {

  return (
    record.decision ===
      input.decision &&
    record.ownerId ===
      input.ownerId &&
    record.businessId ===
      input.businessId &&
    record.branchId ===
      input.branchId &&
    record.businessCode ===
      input.businessCode &&
    record.branchCode ===
      input.branchCode &&
    record.installationId ===
      input.installationId &&
    record.bindingKeyId ===
      input.bindingKeyId &&
    record.fingerprintAlgorithm ===
      input.fingerprintAlgorithm &&
    record.publicKeyFingerprint ===
      input.publicKeyFingerprint &&
    record.requestId ===
      input.requestId &&
    record.paymentReference ===
      input.paymentReference &&
    record.amountMinor ===
      input.amountMinor &&
    record.currency ===
      input.currency &&
    record.paymentMethod ===
      input.paymentMethod &&
    record.paymentSource ===
      input.paymentSource &&
    record.requestedAt ===
      input.requestedAt &&
    record.decisionAt ===
      input.decisionAt &&
    record.controlBundlePackageId ===
      input.controlBundlePackageId &&
    record.importedRequestFileName ===
      input.importedRequestFileName &&
    record.importedRequestFilePath ===
      input.importedRequestFilePath &&
    record.exportedResultFileName ===
      input.exportedResultFileName &&
    record.exportedResultFilePath ===
      input.exportedResultFilePath
  );
}

async function appendInternal(
  input:
    AppendFinoraControlCenterWalletHistoryInput,
): Promise<
  FinoraControlCenterWalletHistoryRecord
> {

  const normalized =
    normalizeInput(
      input,
    );

  const existingRoot =
    await readStore();

  const historyId =
    createHistoryId(
      normalized.controlBundlePackageId,
    );

  const existing =
    existingRoot?.records.find(
      (record) =>
        record.historyId ===
          historyId ||
        record.controlBundlePackageId ===
          normalized.controlBundlePackageId,
    );

  if (existing) {

    if (
      !recordMatchesInput(
        existing,
        normalized,
      )
    ) {
      throw new Error(
        "FINORA Control Center Wallet History detected a conflicting retry for an existing Control Bundle package.",
      );
    }

    return cloneRecord(
      existing,
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

  const recordedAt =
    clockResult.data.observedAt;

  const record:
    FinoraControlCenterWalletHistoryRecord = {

      historyId,

      ...normalized,

      recordedAt,

      schemaVersion:
        FINORA_CONTROL_CENTER_WALLET_HISTORY_SCHEMA_VERSION,
    };

  const root:
    FinoraControlCenterWalletHistoryRoot =
      existingRoot ??
      {
        records:
          [],

        createdAt:
          recordedAt,

        updatedAt:
          recordedAt,

        schemaVersion:
          FINORA_CONTROL_CENTER_WALLET_HISTORY_SCHEMA_VERSION,
      };

  root.records.push(
    record,
  );

  root.updatedAt =
    recordedAt;

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

export function appendFinoraControlCenterWalletHistory(
  input:
    AppendFinoraControlCenterWalletHistoryInput,
): Promise<
  FinoraControlCenterWalletHistoryRecord
> {

  const operation =
    mutationQueue.then(
      () =>
        appendInternal(
          input,
        ),
      () =>
        appendInternal(
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

export async function loadFinoraControlCenterWalletHistory():
  Promise<
    FinoraControlCenterWalletHistoryRecord[]
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

export async function loadFinoraControlCenterWalletHistoryForBranch(
  ownerId: string,
  businessId: string,
  branchId: string,
): Promise<
  FinoraControlCenterWalletHistoryRecord[]
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

  const all =
    await loadFinoraControlCenterWalletHistory();

  return all
    .filter(
      (record) =>
        record.ownerId ===
          normalizedOwnerId &&
        record.businessId ===
          normalizedBusinessId &&
        record.branchId ===
          normalizedBranchId,
    )
    .sort(
      (left, right) =>
        Date.parse(
          right.decisionAt,
        ) -
        Date.parse(
          left.decisionAt,
        ),
    )
    .map(
      cloneRecord,
    );
}