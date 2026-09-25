/* ============================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   EXACT-BRANCH PRICING STORE

   PRECEDENCE:
   exact branch custom > FINORA Income > mandatory fallback

   IMPORTANT:
   - Blank / null custom fields inherit FINORA Income.
   - Zero / negative pricing is forbidden.
   - Scope is exact ownerId + businessId + branchId.
   - This store is Control Center release configuration only.
============================================================ */

import {
  app,
} from "electron";

import {
  promises as fs,
} from "node:fs";

import * as path from "node:path";

export const FINORA_CONTROL_CENTER_BRANCH_PRICING_SCHEMA_VERSION =
  1 as const;

export interface FinoraControlCenterBranchPricingScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export interface FinoraControlCenterBranchPricingInput
  extends FinoraControlCenterBranchPricingScope {

  customerCreateFee?:
    number | null;

  loanDisbursementFee?:
    number | null;

  collectionBelow25000Fee?:
    number | null;

  collection25000To50000Fee?:
    number | null;

  collectionAbove50000Fee?:
    number | null;
}

export interface FinoraControlCenterBranchPricingView
  extends FinoraControlCenterBranchPricingScope {

  customerCreateFee?:
    number;

  loanDisbursementFee?:
    number;

  collectionBelow25000Fee?:
    number;

  collection25000To50000Fee?:
    number;

  collectionAbove50000Fee?:
    number;

  revision:
    number;

  updatedAt:
    string;

  schemaVersion:
    typeof FINORA_CONTROL_CENTER_BRANCH_PRICING_SCHEMA_VERSION;
}

interface FinoraControlCenterBranchPricingStore {
  schemaVersion:
    typeof FINORA_CONTROL_CENTER_BRANCH_PRICING_SCHEMA_VERSION;

  records:
    FinoraControlCenterBranchPricingView[];
}

const PRICE_KEYS = [
  "customerCreateFee",
  "loanDisbursementFee",
  "collectionBelow25000Fee",
  "collection25000To50000Fee",
  "collectionAbove50000Fee",
] as const;

type PriceKey =
  typeof PRICE_KEYS[number];

const DIRECTORY =
  "FINORA";

const SUBDIRECTORY =
  "control-center";

const FILE_NAME =
  "finora-branch-pricing.json";

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {

  return (
    typeof value === "object" &&
    value !== null &&
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
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidPrice(
  value:
    unknown,
): value is number {

  if (
    typeof value !== "number" ||
    !Number.isFinite(
      value,
    ) ||
    value <= 0 ||
    value > 1_000_000
  ) {
    return false;
  }

  const minorUnits =
    value *
    100;

  return (
    Math.abs(
      minorUnits -
      Math.round(
        minorUnits,
      ),
    ) <
    0.000001
  );
}

function normalizeScope(
  value:
    unknown,
): FinoraControlCenterBranchPricingScope {

  if (!isRecord(value)) {
    throw new Error(
      "A valid FINORA Branch Pricing scope is required.",
    );
  }

  const ownerId =
    typeof value.ownerId === "string"
      ? value.ownerId.trim()
      : "";

  const businessId =
    typeof value.businessId === "string"
      ? value.businessId.trim()
      : "";

  const branchId =
    typeof value.branchId === "string"
      ? value.branchId.trim()
      : "";

  if (
    !ownerId ||
    !businessId ||
    !branchId
  ) {
    throw new Error(
      "Owner, Business and Branch are required for FINORA Branch Pricing.",
    );
  }

  return {
    ownerId,
    businessId,
    branchId,
  };
}

function normalizeInput(
  value:
    unknown,
): FinoraControlCenterBranchPricingInput {

  if (!isRecord(value)) {
    throw new Error(
      "A valid FINORA Branch Pricing request is required.",
    );
  }

  const scope =
    normalizeScope(
      value,
    );

  const result:
    FinoraControlCenterBranchPricingInput = {
      ...scope,
    };

  for (const key of PRICE_KEYS) {

    const raw =
      value[key];

    if (
      raw === undefined ||
      raw === null ||
      (
        typeof raw === "string" &&
        raw.trim().length === 0
      )
    ) {
      result[key] =
        null;

      continue;
    }

    if (!isValidPrice(raw)) {
      throw new Error(
        `${key} must be a positive INR amount with at most two decimal places.`,
      );
    }

    result[key] =
      raw;
  }

  return result;
}

function getScopeKey(
  scope:
    FinoraControlCenterBranchPricingScope,
): string {

  return [
    scope.ownerId,
    scope.businessId,
    scope.branchId,
  ].join(
    "\u001f",
  );
}

function hasAnyCustomPrice(
  value:
    Partial<
      Pick<
        FinoraControlCenterBranchPricingView,
        PriceKey
      >
    >,
): boolean {

  return PRICE_KEYS.some(
    (key) =>
      value[key] !== undefined,
  );
}

function isStoredRecord(
  value:
    unknown,
): value is FinoraControlCenterBranchPricingView {

  if (!isRecord(value)) {
    return false;
  }

  if (
    value.schemaVersion !==
      FINORA_CONTROL_CENTER_BRANCH_PRICING_SCHEMA_VERSION ||
    !isNonEmptyString(
      value.ownerId,
    ) ||
    !isNonEmptyString(
      value.businessId,
    ) ||
    !isNonEmptyString(
      value.branchId,
    ) ||
    !Number.isInteger(
      value.revision,
    ) ||
    Number(
      value.revision,
    ) < 1 ||
    typeof value.updatedAt !== "string" ||
    Number.isNaN(
      Date.parse(
        value.updatedAt,
      ),
    )
  ) {
    return false;
  }

  let customCount =
    0;

  for (const key of PRICE_KEYS) {

    const price =
      value[key];

    if (price === undefined) {
      continue;
    }

    if (!isValidPrice(price)) {
      return false;
    }

    customCount +=
      1;
  }

  return customCount > 0;
}

function getFilePath():
  string {

  if (!app.isReady()) {
    throw new Error(
      "FINORA Branch Pricing cannot be used before Electron app readiness.",
    );
  }

  return path.join(
    app.getPath(
      "userData",
    ),
    DIRECTORY,
    SUBDIRECTORY,
    FILE_NAME,
  );
}

async function readStore():
  Promise<FinoraControlCenterBranchPricingStore> {

  const filePath =
    getFilePath();

  let raw:
    string;

  try {

    raw =
      await fs.readFile(
        filePath,
        "utf8",
      );

  } catch (error) {

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (
        error as {
          code?:
            string;
        }
      ).code === "ENOENT"
    ) {
      return {
        schemaVersion:
          FINORA_CONTROL_CENTER_BRANCH_PRICING_SCHEMA_VERSION,

        records:
          [],
      };
    }

    throw error;
  }

  const parsed:
    unknown =
      JSON.parse(
        raw,
      );

  if (
    !isRecord(parsed) ||
    parsed.schemaVersion !==
      FINORA_CONTROL_CENTER_BRANCH_PRICING_SCHEMA_VERSION ||
    !Array.isArray(
      parsed.records,
    ) ||
    !parsed.records.every(
      isStoredRecord,
    )
  ) {
    throw new Error(
      "FINORA Branch Pricing store failed schema validation.",
    );
  }

  const records =
    parsed.records as
      FinoraControlCenterBranchPricingView[];

  const seen =
    new Set<string>();

  for (const record of records) {

    const key =
      getScopeKey(
        record,
      );

    if (seen.has(key)) {
      throw new Error(
        `Duplicate FINORA Branch Pricing scope: ${record.branchId}.`,
      );
    }

    seen.add(
      key,
    );
  }

  return {
    schemaVersion:
      FINORA_CONTROL_CENTER_BRANCH_PRICING_SCHEMA_VERSION,

    records,
  };
}

async function writeStore(
  store:
    FinoraControlCenterBranchPricingStore,
): Promise<void> {

  const filePath =
    getFilePath();

  await fs.mkdir(
    path.dirname(
      filePath,
    ),
    {
      recursive:
        true,
    },
  );

  const temporaryFile =
    `${filePath}.${process.pid}.tmp`;

  await fs.writeFile(
    temporaryFile,
    JSON.stringify(
      store,
      null,
      2,
    ),
    "utf8",
  );

  await fs.rename(
    temporaryFile,
    filePath,
  );
}

export async function readFinoraControlCenterBranchPricing(
  request:
    unknown,
): Promise<
  FinoraControlCenterBranchPricingView | undefined
> {

  const scope =
    normalizeScope(
      request,
    );

  const store =
    await readStore();

  const targetKey =
    getScopeKey(
      scope,
    );

  return store.records.find(
    (record) =>
      getScopeKey(
        record,
      ) === targetKey,
  );
}

export async function updateFinoraControlCenterBranchPricing(
  request:
    unknown,
): Promise<
  FinoraControlCenterBranchPricingView | undefined
> {

  const input =
    normalizeInput(
      request,
    );

  const store =
    await readStore();

  const targetKey =
    getScopeKey(
      input,
    );

  const existingIndex =
    store.records.findIndex(
      (record) =>
        getScopeKey(
          record,
        ) === targetKey,
    );

  const custom:
    Partial<
      Pick<
        FinoraControlCenterBranchPricingView,
        PriceKey
      >
    > = {};

  for (const priceKey of PRICE_KEYS) {

    const price =
      input[
        priceKey
      ];

    if (
      price !== undefined &&
      price !== null
    ) {
      custom[
        priceKey
      ] =
        price;
    }
  }

  if (!hasAnyCustomPrice(custom)) {

    if (existingIndex >= 0) {

      store.records.splice(
        existingIndex,
        1,
      );

      await writeStore(
        store,
      );
    }

    return undefined;
  }

  const previous =
    existingIndex >= 0
      ? store.records[
          existingIndex
        ]
      : undefined;

  const next:
    FinoraControlCenterBranchPricingView = {
      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,

      ...custom,

      revision:
        (
          previous?.revision ??
          0
        ) +
        1,

      updatedAt:
        new Date()
          .toISOString(),

      schemaVersion:
        FINORA_CONTROL_CENTER_BRANCH_PRICING_SCHEMA_VERSION,
    };

  if (existingIndex >= 0) {

    store.records[
      existingIndex
    ] =
      next;

  } else {

    store.records.push(
      next,
    );
  }

  store.records.sort(
    (
      left,
      right,
    ) =>
      getScopeKey(
        left,
      ).localeCompare(
        getScopeKey(
          right,
        ),
      ),
  );

  await writeStore(
    store,
  );

  return next;
}