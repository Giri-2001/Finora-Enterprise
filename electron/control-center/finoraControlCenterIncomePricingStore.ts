/* ============================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   FINORA INCOME GLOBAL PRICING STORE

   RESPONSIBILITY:
   - Persist Control Center global default platform pricing
   - Supply mandatory defaults when no saved Control Center value exists
   - Keep branch-specific Pricing Policy separate
   - Never create zero/free pricing implicitly

   PRECEDENCE TARGET:
   BRANCH-SPECIFIC SIGNED PRICE > GLOBAL DEFAULT PRICE

   VERSION : 1.0
============================================================ */

import {
  app,
} from "electron";

import {
  promises as fs,
} from "node:fs";

import * as path from "node:path";

export const FINORA_CONTROL_CENTER_INCOME_PRICING_SCHEMA_VERSION =
  1 as const;

export interface FinoraControlCenterIncomePricingInput {
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

export interface FinoraControlCenterIncomePricingView
  extends FinoraControlCenterIncomePricingInput {

  source:
    | "MANDATORY_DEFAULT"
    | "CONTROL_CENTER";

  revision:
    number;

  updatedAt?:
    string;

  schemaVersion:
    typeof FINORA_CONTROL_CENTER_INCOME_PRICING_SCHEMA_VERSION;
}

const DEFAULT_PRICING:
  Readonly<FinoraControlCenterIncomePricingInput> =
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

const DIRECTORY =
  "FINORA";

const SUBDIRECTORY =
  "control-center";

const FILE_NAME =
  "finora-income-pricing.json";

function getFilePath():
  string {

  if (!app.isReady()) {
    throw new Error(
      "FINORA Income Pricing cannot be used before Electron app readiness.",
    );
  }

  return path.join(
    app.getPath("userData"),
    DIRECTORY,
    SUBDIRECTORY,
    FILE_NAME,
  );
}

function isValidPrice(
  value:
    unknown,
): value is number {

  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value,
    ) ||
    value <= 0 ||
    value > 1_000_000
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

function sanitizeInput(
  value:
    unknown,
): FinoraControlCenterIncomePricingInput {

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
      "A valid FINORA Income Pricing object is required.",
    );
  }

  const candidate =
    value as
      Partial<
        FinoraControlCenterIncomePricingInput
      >;

  if (
    !isValidPrice(
      candidate.customerCreateFee,
    ) ||
    !isValidPrice(
      candidate.loanDisbursementFee,
    ) ||
    !isValidPrice(
      candidate.collectionBelow25000Fee,
    ) ||
    !isValidPrice(
      candidate.collection25000To50000Fee,
    ) ||
    !isValidPrice(
      candidate.collectionAbove50000Fee,
    )
  ) {
    throw new Error(
      "All five FINORA Income prices must be positive INR amounts with at most two decimal places.",
    );
  }

  return {
    customerCreateFee:
      candidate.customerCreateFee,

    loanDisbursementFee:
      candidate.loanDisbursementFee,

    collectionBelow25000Fee:
      candidate.collectionBelow25000Fee,

    collection25000To50000Fee:
      candidate.collection25000To50000Fee,

    collectionAbove50000Fee:
      candidate.collectionAbove50000Fee,
  };
}

function isPersistedView(
  value:
    unknown,
): value is FinoraControlCenterIncomePricingView {

  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    return false;
  }

  const candidate =
    value as
      Partial<
        FinoraControlCenterIncomePricingView
      >;

  return (
    candidate.schemaVersion ===
      FINORA_CONTROL_CENTER_INCOME_PRICING_SCHEMA_VERSION &&
    candidate.source ===
      "CONTROL_CENTER" &&
    Number.isInteger(
      candidate.revision,
    ) &&
    Number(
      candidate.revision,
    ) >= 1 &&
    typeof candidate.updatedAt ===
      "string" &&
    !Number.isNaN(
      Date.parse(
        candidate.updatedAt,
      ),
    ) &&
    isValidPrice(
      candidate.customerCreateFee,
    ) &&
    isValidPrice(
      candidate.loanDisbursementFee,
    ) &&
    isValidPrice(
      candidate.collectionBelow25000Fee,
    ) &&
    isValidPrice(
      candidate.collection25000To50000Fee,
    ) &&
    isValidPrice(
      candidate.collectionAbove50000Fee,
    )
  );
}

function builtInDefaults():
  FinoraControlCenterIncomePricingView {

  return {
    ...DEFAULT_PRICING,

    source:
      "MANDATORY_DEFAULT",

    revision:
      0,

    schemaVersion:
      FINORA_CONTROL_CENTER_INCOME_PRICING_SCHEMA_VERSION,
  };
}

export async function readFinoraControlCenterIncomePricing():
  Promise<FinoraControlCenterIncomePricingView> {

  const file =
    getFilePath();

  try {

    const raw =
      await fs.readFile(
        file,
        "utf8",
      );

    const parsed:
      unknown =
        JSON.parse(
          raw,
        );

    if (!isPersistedView(parsed)) {
      throw new Error(
        "FINORA Income Pricing store failed schema validation.",
      );
    }

    return parsed;

  } catch (error) {

    if (
      typeof error ===
        "object" &&
      error !==
        null &&
      "code" in error &&
      (
        error as {
          code?:
            string;
        }
      ).code ===
        "ENOENT"
    ) {
      return builtInDefaults();
    }

    throw error;
  }
}

export async function updateFinoraControlCenterIncomePricing(
  input:
    unknown,
): Promise<FinoraControlCenterIncomePricingView> {

  const sanitized =
    sanitizeInput(
      input,
    );

  const current =
    await readFinoraControlCenterIncomePricing();

  const next:
    FinoraControlCenterIncomePricingView = {

      ...sanitized,

      source:
        "CONTROL_CENTER",

      revision:
        current.revision +
        1,

      updatedAt:
        new Date()
          .toISOString(),

      schemaVersion:
        FINORA_CONTROL_CENTER_INCOME_PRICING_SCHEMA_VERSION,
    };

  const file =
    getFilePath();

  const directory =
    path.dirname(
      file,
    );

  await fs.mkdir(
    directory,
    {
      recursive:
        true,
    },
  );

  const temporaryFile =
    `${file}.${process.pid}.tmp`;

  await fs.writeFile(
    temporaryFile,
    JSON.stringify(
      next,
      null,
      2,
    ),
    "utf8",
  );

  await fs.rename(
    temporaryFile,
    file,
  );

  return next;
}

export function getFinoraMandatoryIncomePricingDefaults():
  Readonly<FinoraControlCenterIncomePricingInput> {

  return DEFAULT_PRICING;
}