import {
  access,
  readFile,
  writeFile,
} from "node:fs/promises";

import {
  constants as fsConstants,
} from "node:fs";

import path from "node:path";

import process from "node:process";

import {
  fileURLToPath,
} from "node:url";

const MANDATORY_DEFAULTS =
  Object.freeze({

    customerCreateFee:
      30,

    loanDisbursementFee:
      30,

    collectionBelow25000Fee:
      20,

    collection25000To50000Fee:
      25,

    collectionAbove50000Fee:
      30,
  });

const PRICE_KEYS = [
  "customerCreateFee",
  "loanDisbursementFee",
  "collectionBelow25000Fee",
  "collection25000To50000Fee",
  "collectionAbove50000Fee",
];

function isValidPrice(
  value,
) {

  if (
    typeof value !== "number" ||
    !Number.isFinite(
      value,
    ) ||
    value <= 0 ||
    value > 1000000
  ) {
    return false;
  }

  const minor =
    value *
    100;

  return (
    Math.abs(
      minor -
      Math.round(
        minor,
      ),
    ) <
    0.000001
  );
}

function isValidSubscriptionPrice(
  value,
) {

  if (
    typeof value !== "number" ||
    !Number.isFinite(
      value,
    ) ||
    value < 0 ||
    value > 1000000
  ) {
    return false;
  }

  const minor =
    value *
    100;

  return (
    Math.abs(
      minor -
      Math.round(
        minor,
      ),
    ) <
    0.000001
  );
}

function normalizeOptionalText(
  value,
  maximumLength,
) {

  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(
      "FINORA Pricing notice text must be a string.",
    );
  }

  const normalized =
    value.trim();

  if (!normalized) {
    return undefined;
  }

  if (
    normalized.length >
      maximumLength
  ) {
    throw new Error(
      "FINORA Pricing notice text is too long.",
    );
  }

  return normalized;
}

function normalizeOptionalDateTime(
  value,
) {

  const normalized =
    normalizeOptionalText(
      value,
      64,
    );

  if (!normalized) {
    return undefined;
  }

  const timestamp =
    Date.parse(
      normalized,
    );

  if (Number.isNaN(timestamp)) {
    throw new Error(
      "FINORA Pricing notice date is invalid.",
    );
  }

  return new Date(
    timestamp,
  ).toISOString();
}

function isValidId(
  value,
) {

  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

async function fileExists(
  filePath,
) {

  try {

    await access(
      filePath,
      fsConstants.R_OK,
    );

    return true;

  } catch {

    return false;
  }
}

async function readJson(
  filePath,
) {

  const raw =
    await readFile(
      filePath,
      "utf8",
    );

  try {

    return JSON.parse(
      raw.replace(
        /^\uFEFF/,
        "",
      ),
    );

  } catch {

    throw new Error(
      `Invalid FINORA pricing JSON: ${filePath}. Release build aborted.`,
    );
  }
}

function extractGeneratedPrice(
  source,
  key,
) {

  const match =
    new RegExp(
      `${key}:\\s*([0-9]+(?:\\.[0-9]+)?)`,
    ).exec(
      source,
    );

  if (!match) {
    return undefined;
  }

  const value =
    Number(
      match[1],
    );

  return isValidPrice(
    value,
  )
    ? value
    : undefined;
}

function extractGeneratedSubscriptionPrice(
  source,
  key,
) {

  const match =
    new RegExp(
      `${key}:\\s*([0-9]+(?:\\.[0-9]+)?)`,
    ).exec(
      source,
    );

  if (!match) {
    return undefined;
  }

  const value =
    Number(
      match[1],
    );

  return isValidSubscriptionPrice(
    value,
  )
    ? value
    : undefined;
}

function extractGeneratedString(
  source,
  key,
) {

  const match =
    new RegExp(
      `${key}:\\s*("(?:\\\\.|[^"\\\\])*")`,
    ).exec(
      source,
    );

  if (!match) {
    return undefined;
  }

  try {
    const value =
      JSON.parse(
        match[1],
      );

    return typeof value === "string"
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

function extractGeneratedBranchArray(
  source,
  constantName,
) {

  const expression =
    new RegExp(
      `export const ${constantName}:[\\s\\S]*?Object\\.freeze\\(\\s*(\\[[\\s\\S]*?\\])\\s*,?\\s*\\);`,
    );

  const match =
    expression.exec(
      source,
    );

  if (!match) {
    return [];
  }

  try {

    const parsed =
      JSON.parse(
        match[1],
      );

    return Array.isArray(
      parsed,
    )
      ? parsed
      : [];

  } catch {

    return [];
  }
}

function extractGeneratedPricingObject(
  source,
  constantName,
) {

  const markerIndex =
    source.indexOf(
      `export const ${constantName}:`,
    );

  if (markerIndex < 0) {
    return undefined;
  }

  const tail =
    source.slice(
      markerIndex,
    );

  const pricing = {
    customerCreateFee:
      extractGeneratedPrice(
        tail,
        "customerCreateFee",
      ),

    loanDisbursementFee:
      extractGeneratedPrice(
        tail,
        "loanDisbursementFee",
      ),

    collectionBelow25000Fee:
      extractGeneratedPrice(
        tail,
        "collectionBelow25000Fee",
      ),

    collection25000To50000Fee:
      extractGeneratedPrice(
        tail,
        "collection25000To50000Fee",
      ),

    collectionAbove50000Fee:
      extractGeneratedPrice(
        tail,
        "collectionAbove50000Fee",
      ),

    subscription1MonthFee:
      extractGeneratedSubscriptionPrice(
        tail,
        "subscription1MonthFee",
      ),

    subscription3MonthFee:
      extractGeneratedSubscriptionPrice(
        tail,
        "subscription3MonthFee",
      ),

    subscription6MonthFee:
      extractGeneratedSubscriptionPrice(
        tail,
        "subscription6MonthFee",
      ),

    subscription12MonthFee:
      extractGeneratedSubscriptionPrice(
        tail,
        "subscription12MonthFee",
      ),

    pricingNoticeTitle:
      extractGeneratedString(
        tail,
        "pricingNoticeTitle",
      ),

    pricingNoticeMessage:
      extractGeneratedString(
        tail,
        "pricingNoticeMessage",
      ),

    pricingNoticeEffectiveFrom:
      extractGeneratedString(
        tail,
        "pricingNoticeEffectiveFrom",
      ),

    pricingNoticeEffectiveUntil:
      extractGeneratedString(
        tail,
        "pricingNoticeEffectiveUntil",
      ),
  };

  return PRICE_KEYS.every(
    (key) =>
      isValidPrice(
        pricing[key],
      ),
  )
    ? pricing
    : undefined;
}

async function readPreviousGeneratedRelease(
  filePath,
) {

  if (
    !await fileExists(
      filePath,
    )
  ) {
    return undefined;
  }

  const source =
    await readFile(
      filePath,
      "utf8",
    );

  return {
    currentPricing:
      extractGeneratedPricingObject(
        source,
        "FINORA_INCOME_PRICING_DEFAULTS",
      ),

    previousPricing:
      extractGeneratedPricingObject(
        source,
        "FINORA_PREVIOUS_INCOME_PRICING_DEFAULTS",
      ),

    currentBranches:
      extractGeneratedBranchArray(
        source,
        "FINORA_BRANCH_PRICING_OVERRIDES",
      ),

    previousBranches:
      extractGeneratedBranchArray(
        source,
        "FINORA_PREVIOUS_BRANCH_PRICING_OVERRIDES",
      ),
  };
}

function sameJson(
  left,
  right,
) {

  return (
    JSON.stringify(
      left,
    ) ===
    JSON.stringify(
      right,
    )
  );
}

function validateGlobalPricing(
  value,
) {

  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "FINORA Income Pricing source must be an object.",
    );
  }

  for (const key of PRICE_KEYS) {

    if (!isValidPrice(value[key])) {
      throw new Error(
        `FINORA Income Pricing field ${key} is invalid.`,
      );
    }
  }

  const subscriptionKeys = [
    "subscription1MonthFee",
    "subscription3MonthFee",
    "subscription6MonthFee",
    "subscription12MonthFee",
  ];

  for (const key of subscriptionKeys) {

    if (
      value[key] !== undefined &&
      !isValidSubscriptionPrice(
        value[key],
      )
    ) {
      throw new Error(
        `FINORA Subscription Pricing field ${key} is invalid.`,
      );
    }
  }

  const pricingNoticeTitle =
    normalizeOptionalText(
      value.pricingNoticeTitle,
      120,
    );

  const pricingNoticeMessage =
    normalizeOptionalText(
      value.pricingNoticeMessage,
      500,
    );

  const pricingNoticeEffectiveFrom =
    normalizeOptionalDateTime(
      value.pricingNoticeEffectiveFrom,
    );

  const pricingNoticeEffectiveUntil =
    normalizeOptionalDateTime(
      value.pricingNoticeEffectiveUntil,
    );

  if (
    pricingNoticeEffectiveFrom &&
    pricingNoticeEffectiveUntil &&
    Date.parse(
      pricingNoticeEffectiveUntil,
    ) <=
      Date.parse(
        pricingNoticeEffectiveFrom,
      )
  ) {
    throw new Error(
      "FINORA Pricing notice valid-until must be later than valid-from.",
    );
  }

  return {
    customerCreateFee:
      value.customerCreateFee,

    loanDisbursementFee:
      value.loanDisbursementFee,

    collectionBelow25000Fee:
      value.collectionBelow25000Fee,

    collection25000To50000Fee:
      value.collection25000To50000Fee,

    collectionAbove50000Fee:
      value.collectionAbove50000Fee,

    ...(value.subscription1MonthFee === undefined
      ? {}
      : {
          subscription1MonthFee:
            value.subscription1MonthFee,
        }),

    ...(value.subscription3MonthFee === undefined
      ? {}
      : {
          subscription3MonthFee:
            value.subscription3MonthFee,
        }),

    ...(value.subscription6MonthFee === undefined
      ? {}
      : {
          subscription6MonthFee:
            value.subscription6MonthFee,
        }),

    ...(value.subscription12MonthFee === undefined
      ? {}
      : {
          subscription12MonthFee:
            value.subscription12MonthFee,
        }),

    ...(pricingNoticeTitle
      ? {
          pricingNoticeTitle,
        }
      : {}),

    ...(pricingNoticeMessage
      ? {
          pricingNoticeMessage,
        }
      : {}),

    ...(pricingNoticeEffectiveFrom
      ? {
          pricingNoticeEffectiveFrom,
        }
      : {}),

    ...(pricingNoticeEffectiveUntil
      ? {
          pricingNoticeEffectiveUntil,
        }
      : {}),
  };
}

function validateBranchPricingStore(
  value,
) {

  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(
      value,
    ) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(
      value.records,
    )
  ) {
    throw new Error(
      "FINORA Branch Pricing store failed schema validation. Release build aborted.",
    );
  }

  const seen =
    new Set();

  return value.records.map(
    (
      record,
      index,
    ) => {

      if (
        typeof record !== "object" ||
        record === null ||
        Array.isArray(
          record,
        ) ||
        record.schemaVersion !== 1 ||
        !isValidId(
          record.ownerId,
        ) ||
        !isValidId(
          record.businessId,
        ) ||
        !isValidId(
          record.branchId,
        ) ||
        !Number.isInteger(
          record.revision,
        ) ||
        record.revision < 1 ||
        typeof record.updatedAt !== "string" ||
        Number.isNaN(
          Date.parse(
            record.updatedAt,
          ),
        )
      ) {
        throw new Error(
          `FINORA Branch Pricing record ${index + 1} metadata is invalid. Release build aborted.`,
        );
      }

      const ownerId =
        record.ownerId.trim();

      const businessId =
        record.businessId.trim();

      const branchId =
        record.branchId.trim();

      const scope =
        [
          ownerId,
          businessId,
          branchId,
        ].join(
          "\u001f",
        );

      if (seen.has(scope)) {
        throw new Error(
          `Duplicate FINORA Branch Pricing scope: ${branchId}. Release build aborted.`,
        );
      }

      seen.add(
        scope,
      );

      const output = {
        ownerId,
        businessId,
        branchId,
      };

      let customCount =
        0;

      for (const priceKey of PRICE_KEYS) {

        const price =
          record[
            priceKey
          ];

        if (price === undefined) {
          continue;
        }

        if (!isValidPrice(price)) {
          throw new Error(
            `FINORA Branch Pricing ${branchId} field ${priceKey} is invalid. Release build aborted.`,
          );
        }

        output[
          priceKey
        ] =
          price;

        customCount +=
          1;
      }

      if (customCount === 0) {
        throw new Error(
          `FINORA Branch Pricing ${branchId} contains no custom prices. Release build aborted.`,
        );
      }

      return output;
    },
  );
}

const scriptDirectory =
  path.dirname(
    fileURLToPath(
      import.meta.url,
    ),
  );

const repositoryRoot =
  path.resolve(
    scriptDirectory,
    "..",
  );

const generatedFile =
  path.join(
    repositoryRoot,
    "app",
    "renderer",
    "v2",
    "services",
    "pricing",
    "finoraIncomePricingDefaults.generated.ts",
  );

const explicitUserData =
  process.env
    .FINORA_CONTROL_CENTER_USER_DATA;

const normalUserData =
  process.env.APPDATA
    ? path.join(
        process.env.APPDATA,
        "finora-enterprise",
      )
    : undefined;

const controlCenterUserData =
  explicitUserData ||
  normalUserData;

const globalPricingFile =
  controlCenterUserData
    ? path.join(
        controlCenterUserData,
        "FINORA",
        "control-center",
        "finora-income-pricing.json",
      )
    : undefined;

const branchPricingFile =
  controlCenterUserData
    ? path.join(
        controlCenterUserData,
        "FINORA",
        "control-center",
        "finora-branch-pricing.json",
      )
    : undefined;

let source =
  "MANDATORY_DEFAULT";

let pricing = {
  ...MANDATORY_DEFAULTS,
};

if (
  globalPricingFile &&
  await fileExists(
    globalPricingFile,
  )
) {

  const parsed =
    await readJson(
      globalPricingFile,
    );

  if (
    parsed.schemaVersion !== 1 ||
    parsed.source !== "CONTROL_CENTER" ||
    !Number.isInteger(
      parsed.revision,
    ) ||
    parsed.revision < 1 ||
    typeof parsed.updatedAt !== "string" ||
    Number.isNaN(
      Date.parse(
        parsed.updatedAt,
      ),
    )
  ) {
    throw new Error(
      "Saved FINORA Income Pricing metadata is invalid. Release build aborted.",
    );
  }

  pricing =
    validateGlobalPricing(
      parsed,
    );

  source =
    "CONTROL_CENTER";
}

let branchPricing =
  [];

if (
  branchPricingFile &&
  await fileExists(
    branchPricingFile,
  )
) {

  branchPricing =
    validateBranchPricingStore(
      await readJson(
        branchPricingFile,
      ),
    );
}

branchPricing.sort(
  (
    left,
    right,
  ) => {

    const leftKey =
      [
        left.ownerId,
        left.businessId,
        left.branchId,
      ].join(
        "\u001f",
      );

    const rightKey =
      [
        right.ownerId,
        right.businessId,
        right.branchId,
      ].join(
        "\u001f",
      );

    return leftKey.localeCompare(
      rightKey,
    );
  },
);

const previousGeneratedRelease =
  await readPreviousGeneratedRelease(
    generatedFile,
  );

const releaseUnchanged =
  Boolean(
    previousGeneratedRelease?.currentPricing,
  ) &&
  sameJson(
    previousGeneratedRelease.currentPricing,
    pricing,
  ) &&
  sameJson(
    previousGeneratedRelease.currentBranches ?? [],
    branchPricing,
  );

const previousPricing =
  releaseUnchanged
    ? previousGeneratedRelease?.previousPricing
    : previousGeneratedRelease?.currentPricing;

const previousBranchPricing =
  releaseUnchanged
    ? (
        previousGeneratedRelease?.previousBranches ??
        []
      )
    : (
        previousGeneratedRelease?.currentBranches ??
        []
      );

const branchLiteral =
  JSON.stringify(
    branchPricing,
    null,
    2,
  );

const previousPricingLiteral =
  previousPricing
    ? JSON.stringify(
        previousPricing,
        null,
        2,
      )
    : "null";

const previousBranchLiteral =
  JSON.stringify(
    previousBranchPricing,
    null,
    2,
  );

const generated =
`/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA RELEASE PRICING

   GENERATED BEFORE RELEASE BUILD.
   BUILD SOURCE: ${source}
   BRANCH PRICING RECORDS: ${branchPricing.length}

   PRECEDENCE:
   1. Exact Branch custom
   2. FINORA Income
   3. Mandatory production-safe defaults
============================================================ */

export interface FinoraIncomePricingDefaults {
  customerCreateFee:
    number;

  loanDisbursementFee:
    number;

  collectionBelow25000Fee:
    number;

  collection25000To50000Fee:
    number;

  collectionAbove50000Fee:
    number;

  subscription1MonthFee?:
    number;

  subscription3MonthFee?:
    number;

  subscription6MonthFee?:
    number;

  subscription12MonthFee?:
    number;

  pricingNoticeTitle?:
    string;

  pricingNoticeMessage?:
    string;

  pricingNoticeEffectiveFrom?:
    string;

  pricingNoticeEffectiveUntil?:
    string;
}

export interface FinoraBranchPricingOverride {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

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
}

export const FINORA_INCOME_PRICING_DEFAULTS:
  Readonly<FinoraIncomePricingDefaults> =
    Object.freeze({

      customerCreateFee:
        ${pricing.customerCreateFee},

      loanDisbursementFee:
        ${pricing.loanDisbursementFee},

      collectionBelow25000Fee:
        ${pricing.collectionBelow25000Fee},

      collection25000To50000Fee:
        ${pricing.collection25000To50000Fee},

      collectionAbove50000Fee:
        ${pricing.collectionAbove50000Fee},
${pricing.subscription1MonthFee === undefined
  ? ""
  : `
      subscription1MonthFee:
        ${pricing.subscription1MonthFee},`}
${pricing.subscription3MonthFee === undefined
  ? ""
  : `
      subscription3MonthFee:
        ${pricing.subscription3MonthFee},`}
${pricing.subscription6MonthFee === undefined
  ? ""
  : `
      subscription6MonthFee:
        ${pricing.subscription6MonthFee},`}
${pricing.subscription12MonthFee === undefined
  ? ""
  : `
      subscription12MonthFee:
        ${pricing.subscription12MonthFee},`}
${pricing.pricingNoticeTitle === undefined
  ? ""
  : `
      pricingNoticeTitle:
        ${JSON.stringify(pricing.pricingNoticeTitle)},`}
${pricing.pricingNoticeMessage === undefined
  ? ""
  : `
      pricingNoticeMessage:
        ${JSON.stringify(pricing.pricingNoticeMessage)},`}
${pricing.pricingNoticeEffectiveFrom === undefined
  ? ""
  : `
      pricingNoticeEffectiveFrom:
        ${JSON.stringify(pricing.pricingNoticeEffectiveFrom)},`}
${pricing.pricingNoticeEffectiveUntil === undefined
  ? ""
  : `
      pricingNoticeEffectiveUntil:
        ${JSON.stringify(pricing.pricingNoticeEffectiveUntil)},`}
    });

export const FINORA_BRANCH_PRICING_OVERRIDES:
  readonly FinoraBranchPricingOverride[] =
    Object.freeze(
      ${branchLiteral},
    );

export const FINORA_PREVIOUS_INCOME_PRICING_DEFAULTS:
  Readonly<FinoraIncomePricingDefaults> | null =
    ${previousPricingLiteral === "null"
      ? "null"
      : `Object.freeze(${previousPricingLiteral})`};

export const FINORA_PREVIOUS_BRANCH_PRICING_OVERRIDES:
  readonly FinoraBranchPricingOverride[] =
    Object.freeze(
      ${previousBranchLiteral},
    );
`;

await writeFile(
  generatedFile,
  generated,
  "utf8",
);

console.log(
  [
    "PASS: FINORA release pricing synchronized.",
    `Source=${source}`,
    `Customer=${pricing.customerCreateFee}`,
    `Loan=${pricing.loanDisbursementFee}`,
    `CollectionBelow25000=${pricing.collectionBelow25000Fee}`,
    `Collection25000To50000=${pricing.collection25000To50000Fee}`,
    `CollectionAbove50000=${pricing.collectionAbove50000Fee}`,
    `Subscription1M=${pricing.subscription1MonthFee ?? "NOT_CONFIGURED"}`,
    `Subscription3M=${pricing.subscription3MonthFee ?? "NOT_CONFIGURED"}`,
    `Subscription6M=${pricing.subscription6MonthFee ?? "NOT_CONFIGURED"}`,
    `Subscription12M=${pricing.subscription12MonthFee ?? "NOT_CONFIGURED"}`,
    `PricingNotice=${pricing.pricingNoticeTitle ?? "NONE"}`,
    `BranchCustomRecords=${branchPricing.length}`,
  ].join(" | "),
);