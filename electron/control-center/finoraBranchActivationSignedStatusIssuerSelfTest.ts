// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// SIGNED BRANCH STATUS ISSUER SELF TEST
//
// PURPOSE:
//
// - Exercise the real privileged Branch Activation issuer
// - Exercise the real Control Center signing-key vault
// - Exercise real ECDSA P-256 signing
// - Verify signatures independently with the public key
// - Prove SUSPEND / RESUME / REVOKE issuance
// - Prove action/status mismatch rejection
//
// ISOLATION:
//
// - Electron userData is redirected to a temporary directory
//   before app readiness.
// - Production Control Center key-vault data is never touched.
// ============================================================

import {
  app,
} from "electron";

import {
  mkdtemp,
  rm,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  canonicalizeFinoraControlCenterValue,
} from "./finoraControlCenterCanonicalization.js";

import {
  verifyFinoraControlCenterCanonicalSignature,
} from "./finoraControlCenterCrypto.js";

import {
  getFinoraControlCenterPublicIdentity,
} from "./finoraControlCenterKeyVault.js";

import {
  signFinoraBranchActivationPackage,
} from "./finoraBranchActivationIssuer.js";

import type {
  FinoraBranchActivationIssuanceTarget,
} from "./finoraBranchActivationIssuancePolicy.js";

// ============================================================
// TYPES
// ============================================================

type SignedStatusAction =
  | "SUSPEND"
  | "RESUME"
  | "REVOKE";

type AdministrativeStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

// ============================================================
// FIXED TEST IDENTITY
// ============================================================

const OWNER_ID =
  "OWNER-SIGNED-STATUS-ISSUER-TEST";

const BUSINESS_ID =
  "BUSINESS-SIGNED-STATUS-ISSUER-TEST";

const BRANCH_ID =
  "BRANCH-SIGNED-STATUS-ISSUER-TEST";

const USER_ID =
  "USER-SIGNED-STATUS-ISSUER-TEST";

const INSTALLATION_ID =
  "INSTALLATION-SIGNED-STATUS-ISSUER-TEST";

const PUBLIC_KEY_FINGERPRINT =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const BINDING_KEY_ID =
  "FINORA-BINDING-0123456789ABCDEF0123456789ABCDEF";

const ISSUED_AT =
  "2026-09-06T06:00:00.000Z";

const VALID_FROM =
  "2026-01-01T00:00:00.000Z";

const VALID_UNTIL =
  "2027-01-01T00:00:00.000Z";

const TARGET:
  FinoraBranchActivationIssuanceTarget = {

  ownerId:
    OWNER_ID,

  businessId:
    BUSINESS_ID,

  branchId:
    BRANCH_ID,

  installationId:
    INSTALLATION_ID,

  bindingKeyId:
    BINDING_KEY_ID,

  fingerprintAlgorithm:
    "SHA-256",

  publicKeyFingerprint:
    PUBLIC_KEY_FINGERPRINT,
};

// ============================================================
// ASSERT
// ============================================================

function assert(
  condition:
    unknown,

  message:
    string,
): asserts condition {

  if (!condition) {
    throw new Error(
      message,
    );
  }
}

// ============================================================
// PAYLOAD
// ============================================================

function createPayload(
  action:
    SignedStatusAction,

  administrativeStatus:
    AdministrativeStatus,
): Record<string, unknown> {

  return {

    activation: {

      activationId:
        "ACTIVATION-SIGNED-STATUS-ISSUER-TEST",

      ownerId:
        OWNER_ID,

      businessId:
        BUSINESS_ID,

      branchId:
        BRANCH_ID,

      status:
        "ACTIVE",

      activatedAt:
        VALID_FROM,

      createdAt:
        VALID_FROM,

      updatedAt:
        ISSUED_AT,

      schemaVersion:
        1,
    },

    accessGrant: {

      grantId:
        "GRANT-SIGNED-STATUS-ISSUER-TEST",

      userId:
        USER_ID,

      ownerId:
        OWNER_ID,

      businessId:
        BUSINESS_ID,

      branchId:
        BRANCH_ID,

      storageMode:
        "LOCAL",

      accessType:
        "REGISTERED",

      administrativeStatus,

      validity: {

        validFrom:
          VALID_FROM,

        validUntil:
          VALID_UNTIL,
      },

      registrationPayment: {

        amount:
          2000,

        currency:
          "INR",

        paymentMode:
          "CASH",

        paidAt:
          VALID_FROM,

        remarks:
          "FINORA Signed Status issuer self-test.",

        refundable:
          false,
      },

      registrationCycle:
        1,

      createdAt:
        VALID_FROM,

      updatedAt:
        ISSUED_AT,

      schemaVersion:
        1,
    },

    installationBinding: {

      installationId:
        INSTALLATION_ID,

      bindingKeyId:
        BINDING_KEY_ID,

      fingerprintAlgorithm:
        "SHA-256",

      publicKeyFingerprint:
        PUBLIC_KEY_FINGERPRINT,

      schemaVersion:
        1,
    },

    action,

    issuedAt:
      ISSUED_AT,

    schemaVersion:
      1,
  };
}

// ============================================================
// SIGN + VERIFY
// ============================================================

async function signAndVerify(
  action:
    SignedStatusAction,

  administrativeStatus:
    AdministrativeStatus,

  sequence:
    number,
): Promise<{
  issuerId: string;
  signingKeyId: string;
}> {

  const signedPackage =
    await signFinoraBranchActivationPackage({

      packageId:
        `PACKAGE-SIGNED-STATUS-${action}-${sequence}`,

      sequence,

      issuedAt:
        ISSUED_AT,

      target:
        TARGET,

      payload:
        createPayload(
          action,
          administrativeStatus,
        ),
    });

  assert(
    signedPackage.purpose ===
      "BRANCH_ACTIVATION",
    `${action}: signed package purpose is invalid.`,
  );

  assert(
    signedPackage.signature.algorithm ===
      "ECDSA_P256_SHA256",
    `${action}: signature algorithm is invalid.`,
  );

  assert(
    signedPackage.signature.encoding ===
      "IEEE_P1363",
    `${action}: signature encoding is invalid.`,
  );

  assert(
    signedPackage.signature.canonicalization ===
      "FINORA_CANONICAL_JSON_V1",
    `${action}: canonicalization is invalid.`,
  );

  const payload =
    signedPackage.payload as
      Record<string, unknown>;

  assert(
    payload.action ===
      action,
    `${action}: signed payload action changed.`,
  );

  const accessGrant =
    payload.accessGrant as
      Record<string, unknown>;

  assert(
    accessGrant.administrativeStatus ===
      administrativeStatus,
    `${action}: signed administrative status changed.`,
  );

  const publicIdentity =
    await getFinoraControlCenterPublicIdentity();

  assert(
    signedPackage.issuer.issuerId ===
      publicIdentity.issuerId,
    `${action}: issuer identity mismatch.`,
  );

  assert(
    signedPackage.issuer.signingKeyId ===
      publicIdentity.signingKeyId,
    `${action}: signing-key identity mismatch.`,
  );

  assert(
    signedPackage.signature.signingKeyId ===
      publicIdentity.signingKeyId,
    `${action}: signature signing-key identity mismatch.`,
  );

  const {
    signature,
    ...unsignedPackage
  } =
    signedPackage;

  const canonicalPackage =
    canonicalizeFinoraControlCenterValue(
      unsignedPackage,
    );

  const verified =
    verifyFinoraControlCenterCanonicalSignature(
      canonicalPackage,
      signature.value,
      publicIdentity.publicKeySpkiDerBase64,
    );

  assert(
    verified,
    `${action}: independent public-key signature verification failed.`,
  );

  console.log(
    `PASS: real Control Center ${action} package signed and independently verified`,
  );

  return {
    issuerId:
      publicIdentity.issuerId,

    signingKeyId:
      publicIdentity.signingKeyId,
  };
}

// ============================================================
// MISMATCH REJECTION
// ============================================================

async function expectStatusMismatchRejection():
  Promise<void> {

  let rejected =
    false;

  try {

    await signFinoraBranchActivationPackage({

      packageId:
        "PACKAGE-SIGNED-STATUS-MISMATCH",

      sequence:
        4,

      issuedAt:
        ISSUED_AT,

      target:
        TARGET,

      payload:
        createPayload(
          "SUSPEND",
          "ACTIVE",
        ),
    });

  } catch (
    error
  ) {

    rejected =
      error instanceof Error &&
      error.message.includes(
        "action does not match the Branch Access administrative status",
      );
  }

  assert(
    rejected,
    "Control Center signer accepted a mismatched Signed Status action/status pair.",
  );

  console.log(
    "PASS: Control Center rejected mismatched Signed Status action/status before signing",
  );
}

// ============================================================
// SELF TEST
// ============================================================

async function runSelfTest():
  Promise<void> {

  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-control-center-status-issuer-selftest-",
      ),
    );

  let failure:
    unknown;

  try {

    // --------------------------------------------------------
    // ISOLATE ELECTRON KEY VAULT
    // --------------------------------------------------------

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    console.log(
      "PASS: isolated Electron userData configured before Control Center vault access",
    );

    // --------------------------------------------------------
    // REAL SIGNED STATUS ISSUANCE
    // --------------------------------------------------------

    const suspendIdentity =
      await signAndVerify(
        "SUSPEND",
        "SUSPENDED",
        1,
      );

    const resumeIdentity =
      await signAndVerify(
        "RESUME",
        "ACTIVE",
        2,
      );

    const revokeIdentity =
      await signAndVerify(
        "REVOKE",
        "REVOKED",
        3,
      );

    // --------------------------------------------------------
    // SAME ISOLATED SIGNING IDENTITY
    // --------------------------------------------------------

    assert(
      suspendIdentity.issuerId ===
        resumeIdentity.issuerId &&
      suspendIdentity.issuerId ===
        revokeIdentity.issuerId,
      "Signed Status packages did not use the same isolated Control Center issuer.",
    );

    assert(
      suspendIdentity.signingKeyId ===
        resumeIdentity.signingKeyId &&
      suspendIdentity.signingKeyId ===
        revokeIdentity.signingKeyId,
      "Signed Status packages did not use the same isolated Control Center signing key.",
    );

    console.log(
      "PASS: isolated Control Center issuer/signing-key identity remained stable",
    );

    // --------------------------------------------------------
    // PRE-SIGN POLICY REJECTION
    // --------------------------------------------------------

    await expectStatusMismatchRejection();

    // --------------------------------------------------------
    // COMPLETE
    // --------------------------------------------------------

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA CONTROL CENTER SIGNED STATUS ISSUER SELFTEST",
    );

    console.log(
      "============================================================",
    );

  } catch (
    error
  ) {

    failure =
      error;

  } finally {

    try {

      await rm(
        temporaryUserData,
        {
          recursive:
            true,

          force:
            true,
        },
      );

      console.log(
        "PASS: isolated temporary Control Center userData deleted",
      );

    } catch (
      cleanupError
    ) {

      if (!failure) {
        failure =
          cleanupError;
      }
    }
  }

  if (failure) {
    throw failure;
  }
}

// ============================================================
// ENTRY
// ============================================================

void runSelfTest()
  .then(
    () => {

      app.exit(
        0,
      );
    },
    (error) => {

      console.error(
        "FAIL: FINORA CONTROL CENTER SIGNED STATUS ISSUER SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );

// ============================================================
// END
// ============================================================