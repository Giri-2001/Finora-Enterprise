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

const branchLiteral =
  JSON.stringify(
    branchPricing,
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
    });

export const FINORA_BRANCH_PRICING_OVERRIDES:
  readonly FinoraBranchPricingOverride[] =
    Object.freeze(
      ${branchLiteral},
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
    `BranchCustomRecords=${branchPricing.length}`,
  ].join(" | "),
);