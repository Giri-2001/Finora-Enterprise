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

  /**
   * Global-only FINORA subscription pricing.
   *
   * These values never participate in Branch Pricing overrides.
   * Zero is explicitly valid so FINORA can publish genuine
   * promotional/free subscription periods.
   *
   * Undefined means the plan has not yet been configured.
   */
  subscription1MonthFee?:
    number;

  subscription3MonthFee?:
    number;

  subscription6MonthFee?:
    number;

  subscription12MonthFee?:
    number;

  /**
   * Optional global Pricing announcement displayed to owners
   * after the published pricing revision reaches their app.
   */
  pricingNoticeTitle?:
    string;

  pricingNoticeMessage?:
    string;

  pricingNoticeEffectiveFrom?:
    string;

  pricingNoticeEffectiveUntil?:
    string;
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

function isValidSubscriptionPrice(
  value:
    unknown,
): value is number {

  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value,
    ) ||
    value < 0 ||
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

function normalizeOptionalText(
  value:
    unknown,
  maximumLength:
    number,
): string | undefined {

  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return undefined;
  }

  if (
    typeof value !==
      "string"
  ) {
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
  value:
    unknown,
): string | undefined {

  const normalized =
    normalizeOptionalText(
      value,
      64,
    );

  if (!normalized) {
    return undefined;
  }

  const parsed =
    Date.parse(
      normalized,
    );

  if (Number.isNaN(parsed)) {
    throw new Error(
      "FINORA Pricing notice date is invalid.",
    );
  }

  return new Date(
    parsed,
  ).toISOString();
}

function isOptionalSubscriptionPrice(
  value:
    unknown,
): boolean {

  return (
    value ===
      undefined ||
    isValidSubscriptionPrice(
      value,
    )
  );
}

function isOptionalString(
  value:
    unknown,
): boolean {

  return (
    value ===
      undefined ||
    typeof value ===
      "string"
  );
}

function isOptionalIsoDateTime(
  value:
    unknown,
): boolean {

  return (
    value ===
      undefined ||
    (
      typeof value ===
        "string" &&
      !Number.isNaN(
        Date.parse(
          value,
        ),
      )
    )
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

    ...(
      candidate.subscription1MonthFee ===
        undefined
        ? {}
        : (
            isValidSubscriptionPrice(
              candidate.subscription1MonthFee,
            )
              ? {
                  subscription1MonthFee:
                    candidate.subscription1MonthFee,
                }
              : (() => {
                  throw new Error(
                    "FINORA 1 Month Subscription price must be a non-negative INR amount with at most two decimal places.",
                  );
                })()
          )
    ),

    ...(
      candidate.subscription3MonthFee ===
        undefined
        ? {}
        : (
            isValidSubscriptionPrice(
              candidate.subscription3MonthFee,
            )
              ? {
                  subscription3MonthFee:
                    candidate.subscription3MonthFee,
                }
              : (() => {
                  throw new Error(
                    "FINORA 3 Month Subscription price must be a non-negative INR amount with at most two decimal places.",
                  );
                })()
          )
    ),

    ...(
      candidate.subscription6MonthFee ===
        undefined
        ? {}
        : (
            isValidSubscriptionPrice(
              candidate.subscription6MonthFee,
            )
              ? {
                  subscription6MonthFee:
                    candidate.subscription6MonthFee,
                }
              : (() => {
                  throw new Error(
                    "FINORA 6 Month Subscription price must be a non-negative INR amount with at most two decimal places.",
                  );
                })()
          )
    ),

    ...(
      candidate.subscription12MonthFee ===
        undefined
        ? {}
        : (
            isValidSubscriptionPrice(
              candidate.subscription12MonthFee,
            )
              ? {
                  subscription12MonthFee:
                    candidate.subscription12MonthFee,
                }
              : (() => {
                  throw new Error(
                    "FINORA 12 Month Subscription price must be a non-negative INR amount with at most two decimal places.",
                  );
                })()
          )
    ),

    ...(
      normalizeOptionalText(
        candidate.pricingNoticeTitle,
        120,
      )
        ? {
            pricingNoticeTitle:
              normalizeOptionalText(
                candidate.pricingNoticeTitle,
                120,
              ),
          }
        : {}
    ),

    ...(
      normalizeOptionalText(
        candidate.pricingNoticeMessage,
        500,
      )
        ? {
            pricingNoticeMessage:
              normalizeOptionalText(
                candidate.pricingNoticeMessage,
                500,
              ),
          }
        : {}
    ),

    ...(
      normalizeOptionalDateTime(
        candidate.pricingNoticeEffectiveFrom,
      )
        ? {
            pricingNoticeEffectiveFrom:
              normalizeOptionalDateTime(
                candidate.pricingNoticeEffectiveFrom,
              ),
          }
        : {}
    ),

    ...(
      normalizeOptionalDateTime(
        candidate.pricingNoticeEffectiveUntil,
      )
        ? {
            pricingNoticeEffectiveUntil:
              normalizeOptionalDateTime(
                candidate.pricingNoticeEffectiveUntil,
              ),
          }
        : {}
    ),
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
    ) &&
    isOptionalSubscriptionPrice(
      candidate.subscription1MonthFee,
    ) &&
    isOptionalSubscriptionPrice(
      candidate.subscription3MonthFee,
    ) &&
    isOptionalSubscriptionPrice(
      candidate.subscription6MonthFee,
    ) &&
    isOptionalSubscriptionPrice(
      candidate.subscription12MonthFee,
    ) &&
    isOptionalString(
      candidate.pricingNoticeTitle,
    ) &&
    isOptionalString(
      candidate.pricingNoticeMessage,
    ) &&
    isOptionalIsoDateTime(
      candidate.pricingNoticeEffectiveFrom,
    ) &&
    isOptionalIsoDateTime(
      candidate.pricingNoticeEffectiveUntil,
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