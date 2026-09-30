import {
  app,
  safeStorage,
} from "electron";

import fs from "node:fs/promises";
import path from "node:path";

import type {
  FinoraBranchCredentialEnrollmentAuthorization,
} from "../control/finoraBranchAccessPackage.types.js";

import {
  readExistingFinoraControlCenterPublicAuthorityIdentity,
} from "./finoraControlCenterKeyVault.js";

import {
  issueFinoraBranchPortabilityAuthorityPackage,
} from "./finoraBranchPortabilityAuthorityIssuer.js";

const FINORA_DEVELOPER_PRODUCT_NAME =
  "FINORA Developer Control Center";

const FINORA_DEVELOPER_USER_DATA_NAME =
  "FINORA Developer Control Center";

const EXPECTED_AUTHORIZATION_ID =
  "FINORA-CREDENTIAL-ENROLLMENT-DGB-000001";

const EXPECTED_OWNER_ID =
  "OWNER-DGB-000001";

const EXPECTED_BUSINESS_ID =
  "BUSINESS-DGB-000001";

const EXPECTED_BRANCH_ID =
  "BRANCH-DGB-000001";

app.setName(
  FINORA_DEVELOPER_PRODUCT_NAME,
);

app.setPath(
  "userData",
  path.join(
    app.getPath("appData"),
    FINORA_DEVELOPER_USER_DATA_NAME,
  ),
);

function requireRecord(
  value: unknown,
  label: string,
): Record<string, unknown> {

  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      `Invalid ${label}.`,
    );
  }

  return value as Record<string, unknown>;
}

function requireText(
  value: unknown,
  label: string,
): string {

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `Invalid ${label}.`,
    );
  }

  return value;
}

async function main(): Promise<void> {

  const sourcePath =
    process.env.FINORA_BRANCH2_SOURCE_BUNDLE;

  if (!sourcePath) {
    throw new Error(
      "FINORA_BRANCH2_SOURCE_BUNDLE is missing.",
    );
  }

  await app.whenReady();

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      "Electron safeStorage is unavailable.",
    );
  }

  const currentAuthority =
    await readExistingFinoraControlCenterPublicAuthorityIdentity();

  /*
   * Critical fail-closed rule:
   * never let this migration create a new Control Center authority.
   */
  if (!currentAuthority) {
    throw new Error(
      "Existing FINORA Developer Control Center signing authority was not found. No proof was issued.",
    );
  }

  const raw =
    await fs.readFile(
      sourcePath,
      "utf8",
    );

  const outer =
    requireRecord(
      JSON.parse(raw),
      "historical Control Bundle",
    );

  if (
    outer.purpose !==
      "CONTROL_BUNDLE"
  ) {
    throw new Error(
      "Historical source file is not a CONTROL_BUNDLE.",
    );
  }

  const payload =
    requireRecord(
      outer.payload,
      "Control Bundle payload",
    );

  if (!Array.isArray(payload.packages)) {
    throw new Error(
      "Historical Control Bundle packages are missing.",
    );
  }

  const branchAccessChildren =
    payload.packages.filter(
      (candidate) => {
        if (
          typeof candidate !== "object" ||
          candidate === null ||
          Array.isArray(candidate)
        ) {
          return false;
        }

        return (
          (candidate as Record<string, unknown>).purpose ===
            "BRANCH_ACCESS"
        );
      },
    );

  if (branchAccessChildren.length !== 1) {
    throw new Error(
      "Historical Control Bundle must contain exactly one BRANCH_ACCESS child.",
    );
  }

  const branchAccess =
    requireRecord(
      branchAccessChildren[0],
      "BRANCH_ACCESS child",
    );

  const branchIssuer =
    requireRecord(
      branchAccess.issuer,
      "BRANCH_ACCESS issuer",
    );

  const historicalIssuerId =
    requireText(
      branchIssuer.issuerId,
      "historical issuerId",
    );

  const historicalSigningKeyId =
    requireText(
      branchIssuer.signingKeyId,
      "historical signingKeyId",
    );

  /*
   * Recovery service requires exact signer lineage.
   * Fail BEFORE reserving a portability sequence if the
   * current DCC signer is not the historical Branch Access signer.
   */
  if (
    currentAuthority.issuerId !== historicalIssuerId ||
    currentAuthority.signingKeyId !== historicalSigningKeyId
  ) {
    throw new Error(
      [
        "Current DCC signer does not match historical Branch2 BRANCH_ACCESS signer.",
        `Historical issuer=${historicalIssuerId}`,
        `Historical key=${historicalSigningKeyId}`,
        `Current issuer=${currentAuthority.issuerId}`,
        `Current key=${currentAuthority.signingKeyId}`,
        "No proof was issued.",
      ].join("\n"),
    );
  }

  const branchPayload =
    requireRecord(
      branchAccess.payload,
      "BRANCH_ACCESS payload",
    );

  const credentialEnrollment =
    requireRecord(
      branchPayload.credentialEnrollment,
      "credentialEnrollment",
    );

  if (
    credentialEnrollment.authorizationId !==
      EXPECTED_AUTHORIZATION_ID ||
    credentialEnrollment.ownerId !==
      EXPECTED_OWNER_ID ||
    credentialEnrollment.businessId !==
      EXPECTED_BUSINESS_ID ||
    credentialEnrollment.branchId !==
      EXPECTED_BRANCH_ID ||
    credentialEnrollment.storageMode !==
      "USB" ||
    credentialEnrollment.method !==
      "SET_PASSWORD_ON_RECIPIENT"
  ) {
    throw new Error(
      "Historical credential authorization is not the expected Branch2 USB authorization. No proof was issued.",
    );
  }

  const sourceAuthorization =
    credentialEnrollment as unknown as
      FinoraBranchCredentialEnrollmentAuthorization;

  const signedProof =
    await issueFinoraBranchPortabilityAuthorityPackage({
      target: {
        ownerId:
          EXPECTED_OWNER_ID,

        businessId:
          EXPECTED_BUSINESS_ID,

        branchId:
          EXPECTED_BRANCH_ID,
      },

      sourceAuthorization,
    });

  if (
    signedProof.purpose !==
      "BRANCH_PORTABILITY_AUTHORITY" ||
    signedProof.payload.sourceAuthorizationId !==
      EXPECTED_AUTHORIZATION_ID ||
    signedProof.issuer.issuerId !==
      historicalIssuerId ||
    signedProof.issuer.signingKeyId !==
      historicalSigningKeyId
  ) {
    throw new Error(
      "Issued portability package failed post-sign lineage checks.",
    );
  }

  const downloads =
    app.getPath(
      "downloads",
    );

  const finalPath =
    path.join(
      downloads,
      `${signedProof.packageId}.finora`,
    );

  const temporaryPath =
    `${finalPath}.${process.pid}.tmp`;

  const serialized =
    JSON.stringify(
      signedProof,
      null,
      2,
    );

  try {

    await fs.writeFile(
      temporaryPath,
      serialized,
      {
        encoding:
          "utf8",

        flag:
          "wx",
      },
    );

    await fs.rename(
      temporaryPath,
      finalPath,
    );

  } catch (error) {

    await fs.rm(
      temporaryPath,
      {
        force:
          true,
      },
    );

    throw error;
  }

  console.log("");
  console.log("============================================================");
  console.log("BRANCH2 PORTABILITY AUTHORITY ISSUED");
  console.log("============================================================");
  console.log(`FILE=${finalPath}`);
  console.log(`PACKAGE_ID=${signedProof.packageId}`);
  console.log(`PURPOSE=${signedProof.purpose}`);
  console.log(`SEQUENCE=${signedProof.sequence}`);
  console.log(`AUTHORIZATION_ID=${signedProof.payload.sourceAuthorizationId}`);
  console.log(`ISSUER_ID=${signedProof.issuer.issuerId}`);
  console.log(`SIGNING_KEY_ID=${signedProof.issuer.signingKeyId}`);
  console.log("PASS: genuine signed Branch2 portability authority created.");
}

void main()
  .then(
    () => {
      app.exit(0);
    },
    (
      error:
        unknown,
    ) => {

      console.error("");
      console.error("BRANCH2 PORTABILITY ISSUE FAILED");

      console.error(
        error instanceof Error
          ? error.message
          : String(error),
      );

      app.exit(1);
    },
  );
