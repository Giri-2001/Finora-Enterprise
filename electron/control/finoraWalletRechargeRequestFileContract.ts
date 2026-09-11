/* ============================================================
   FINORA ENTERPRISE OS™

   WALLET RECHARGE REQUEST FILE CONTRACT

   MODULE  : Wallet
   LAYER   : Pure File Contract
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define the Wallet Recharge Request .finora envelope.
   - Build deterministic human-readable filenames.
   - Serialize bounded UTF-8 JSON.
   - Remain independent from Electron dialogs/filesystem.

   SECURITY:

   - Filename is convenience metadata only.
   - Filename is NEVER verification authority.
   - Renaming a file must not affect cryptographic verification.
   - No filesystem access.
   - No private-key access.
   - No Wallet mutation.
============================================================ */

import type {
  FinoraSignedWalletRechargeRequest,
} from "./finoraWalletRechargeRequest.types.js";

export const FINORA_WALLET_RECHARGE_REQUEST_FILE_FORMAT =
  "FINORA_WALLET_RECHARGE_REQUEST_V1" as const;

export const FINORA_WALLET_RECHARGE_REQUEST_FILE_EXTENSION =
  ".finora" as const;

export const FINORA_WALLET_RECHARGE_REQUEST_MAX_FILE_BYTES =
  64 * 1024;

export interface FinoraWalletRechargeRequestFileV1 {

  format:
    typeof FINORA_WALLET_RECHARGE_REQUEST_FILE_FORMAT;

  request:
    FinoraSignedWalletRechargeRequest;

  schemaVersion:
    1;
}

export type FinoraWalletRechargeRequestFile =
  FinoraWalletRechargeRequestFileV1;

function createBusinessCodeToken(
  value:
    string,
): string {

  const token =
    value
      .trim()
      .toUpperCase()
      .replace(
        /[^A-Z0-9]/g,
        "",
      )
      .slice(
        0,
        16,
      );

  return token.length > 0
    ? token
    : "BUS";
}

function createBranchCodeToken(
  value:
    string,
): string {

  const normalized =
    value
      .trim()
      .toUpperCase();

  const numericPart =
    normalized.replace(
      /[^0-9]/g,
      "",
    );

  if (
    numericPart.length >
      0
  ) {
    return (
      "BR" +
      numericPart.padStart(
        3,
        "0",
      )
    ).slice(
      0,
      18,
    );
  }

  const fallback =
    normalized
      .replace(
        /[^A-Z0-9]/g,
        "",
      )
      .slice(
        0,
        16,
      );

  return fallback.length > 0
    ? fallback
    : "BRANCH";
}

function createPaymentMethodToken(
  value:
    string,
): string {

  return value
    .trim()
    .toUpperCase()
    .replace(
      /[^A-Z0-9]/g,
      "",
    )
    .slice(
      0,
      20,
    );
}

function createAmountToken(
  amountMinor:
    number,
): string {

  if (
    !Number.isSafeInteger(
      amountMinor,
    ) ||
    amountMinor <=
      0
  ) {
    throw new Error(
      "FINORA Wallet Recharge Request amountMinor is invalid for filename generation.",
    );
  }

  const wholeRupees =
    Math.floor(
      amountMinor / 100,
    );

  const paise =
    amountMinor %
      100;

  if (
    paise ===
      0
  ) {
    return String(
      wholeRupees,
    );
  }

  return (
    String(
      wholeRupees,
    ) +
    "P" +
    String(
      paise,
    ).padStart(
      2,
      "0",
    )
  );
}

function createRequestToken(
  requestId:
    string,
): string {

  const prefix =
    "FINORA-WAL-REQ-";

  const digest =
    requestId.startsWith(
      prefix,
    )
      ? requestId.slice(
          prefix.length,
        )
      : requestId;

  const normalized =
    digest
      .toUpperCase()
      .replace(
        /[^A-F0-9]/g,
        "",
      );

  if (
    normalized.length <
      6
  ) {
    throw new Error(
      "FINORA Wallet Recharge Request ID cannot produce a safe short request token.",
    );
  }

  return normalized.slice(
    0,
    6,
  );
}

export function createFinoraWalletRechargeRequestFileName(
  request:
    FinoraSignedWalletRechargeRequest,
): string {

  const payload =
    request.payload;

  return (
    "FIN-WAL-REQ-" +
    createBusinessCodeToken(
      payload.displayIdentity.businessCode,
    ) +
    "-" +
    createBranchCodeToken(
      payload.displayIdentity.branchCode,
    ) +
    "-" +
    createPaymentMethodToken(
      payload.paymentMethod,
    ) +
    "-" +
    createAmountToken(
      payload.amountMinor,
    ) +
    "-" +
    createRequestToken(
      payload.requestId,
    ) +
    FINORA_WALLET_RECHARGE_REQUEST_FILE_EXTENSION
  );
}

export function createFinoraWalletRechargeRequestFile(
  request:
    FinoraSignedWalletRechargeRequest,
): FinoraWalletRechargeRequestFile {

  return {
    format:
      FINORA_WALLET_RECHARGE_REQUEST_FILE_FORMAT,

    request,

    schemaVersion:
      1,
  };
}

export function serializeFinoraWalletRechargeRequestFile(
  request:
    FinoraSignedWalletRechargeRequest,
): {
  serialized:
    string;

  bytes:
    number;
} {

  const serialized =
    JSON.stringify(
      createFinoraWalletRechargeRequestFile(
        request,
      ),
      null,
      2,
    );

  const bytes =
    Buffer.byteLength(
      serialized,
      "utf8",
    );

  if (
    bytes <=
      0 ||
    bytes >
      FINORA_WALLET_RECHARGE_REQUEST_MAX_FILE_BYTES
  ) {
    throw new Error(
      "FINORA Wallet Recharge Request exceeds the supported file size limit.",
    );
  }

  return {
    serialized,
    bytes,
  };
}

/* ============================================================
   END
============================================================ */