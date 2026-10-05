import {
  BrowserWindow,
  dialog,
} from "electron";

import {
  readFile,
} from "node:fs/promises";

import {
  basename,
} from "node:path";

import {
  loadFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

import {
  applyFinoraSignedBranchAccessPackage,
} from "./finoraBranchAccessPackageApplyService.js";

import {
  applyFinoraSignedPricingPolicyPackage,
} from "./finoraPricingPolicyPackageApplyService.js";

interface FinoraStandaloneImportSuccess {
  success: true;
  cancelled: false;
  fileName: string;
  purpose:
    | "BRANCH_ACCESS"
    | "PRICING_POLICY";
}

interface FinoraStandaloneImportCancelled {
  success: true;
  cancelled: true;
}

interface FinoraStandaloneImportFailure {
  success: false;
  error: string;
}

export type FinoraStandaloneImportResult =
  | FinoraStandaloneImportSuccess
  | FinoraStandaloneImportCancelled
  | FinoraStandaloneImportFailure;

function failure(
  error: string,
): FinoraStandaloneImportFailure {
  return {
    success: false,
    error,
  };
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function chooseAndReadSignedPackage(
  parentWindow: BrowserWindow,
  title: string,
): Promise<
  | {
      success: true;
      cancelled: false;
      fileName: string;
      signedPackage: Record<string, unknown>;
    }
  | FinoraStandaloneImportCancelled
  | FinoraStandaloneImportFailure
> {
  const selection =
    await dialog.showOpenDialog(
      parentWindow,
      {
        title,
        properties: [
          "openFile",
        ],
        filters: [
          {
            name: "FINORA Signed Package",
            extensions: [
              "finora",
              "json",
            ],
          },
        ],
      },
    );

  if (
    selection.canceled ||
    selection.filePaths.length !== 1
  ) {
    return {
      success: true,
      cancelled: true,
    };
  }

  const filePath =
    selection.filePaths[0];

  let raw: string;

  try {
    raw =
      await readFile(
        filePath,
        "utf8",
      );
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read the FINORA signed package.",
    );
  }

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(raw);
  } catch {
    return failure(
      "The selected FINORA signed package is not valid JSON.",
    );
  }

  if (!isRecord(parsed)) {
    return failure(
      "The selected FINORA signed package must contain one signed package object.",
    );
  }

  return {
    success: true,
    cancelled: false,
    fileName:
      basename(filePath),
    signedPackage:
      parsed,
  };
}

async function loadTrustedKeys() {
  const trust =
    await loadFinoraRecipientTrustStore();

  if (
    trust === undefined ||
    trust.trustedKeys.length === 0
  ) {
    throw new Error(
      "FINORA recipient trust must be established before importing a signed package.",
    );
  }

  return trust.trustedKeys;
}

export async function importFinoraCredentialAuthorizationFromNativeDialog(
  parentWindow: BrowserWindow,
): Promise<FinoraStandaloneImportResult> {

  const opened =
    await chooseAndReadSignedPackage(
      parentWindow,
      "Import FINORA Credential Authorization",
    );

  if (
    !opened.success ||
    opened.cancelled
  ) {
    return opened;
  }

  const signedPackage =
    opened.signedPackage;

  if (
    signedPackage.purpose !==
      "BRANCH_ACCESS"
  ) {
    return failure(
      "Only a signed FINORA BRANCH_ACCESS package can be imported as Credential Authorization.",
    );
  }

  const payload =
    signedPackage.payload;

  if (
    !isRecord(payload) ||
    payload.action !==
      "AUTHORIZE_CREDENTIAL"
  ) {
    return failure(
      "FINORA Credential Authorization import requires BRANCH_ACCESS action AUTHORIZE_CREDENTIAL.",
    );
  }

  let trustedKeys;

  try {
    trustedKeys =
      await loadTrustedKeys();
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to load FINORA recipient trust.",
    );
  }

  const result =
    await applyFinoraSignedBranchAccessPackage(
      signedPackage,
      trustedKeys,
      new Date(),
    );

  if (!result.success) {
    return failure(
      result.error ??
        "Unable to apply FINORA Credential Authorization.",
    );
  }

  return {
    success: true,
    cancelled: false,
    fileName:
      opened.fileName,
    purpose:
      "BRANCH_ACCESS",
  };
}

export async function importFinoraPricingPolicyFromNativeDialog(
  parentWindow: BrowserWindow,
): Promise<FinoraStandaloneImportResult> {

  const opened =
    await chooseAndReadSignedPackage(
      parentWindow,
      "Import FINORA Pricing Update",
    );

  if (
    !opened.success ||
    opened.cancelled
  ) {
    return opened;
  }

  const signedPackage =
    opened.signedPackage;

  if (
    signedPackage.purpose !==
      "PRICING_POLICY"
  ) {
    return failure(
      "Only a signed FINORA PRICING_POLICY package can be imported as a Pricing Update.",
    );
  }

  let trustedKeys;

  try {
    trustedKeys =
      await loadTrustedKeys();
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to load FINORA recipient trust.",
    );
  }

  const result =
    await applyFinoraSignedPricingPolicyPackage(
      signedPackage,
      trustedKeys,
      new Date(),
    );

  if (!result.success) {
    return failure(
      result.error ??
        "Unable to apply FINORA Pricing Update.",
    );
  }

  return {
    success: true,
    cancelled: false,
    fileName:
      opened.fileName,
    purpose:
      "PRICING_POLICY",
  };
}
