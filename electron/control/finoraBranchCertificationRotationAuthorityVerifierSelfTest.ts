import {
  assertFinoraBranchCertificationRotationPayload,
} from "./finoraBranchCertificationRotationContract.js";
import assert from "node:assert/strict";

import {
  verifyFinoraBranchCertificationRotationAuthority,
} from "./finoraBranchCertificationRotationAuthorityVerifier.js";
import {
  generateFinoraBranchCertificationKeyMaterial,
  toFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationRotationAuthorityVerifierDependencies,
} from "./finoraBranchCertificationRotationAuthorityVerifier.js";

import type {
  FinoraBranchCertificationRotationPendingRecordV1,
} from "./finoraBranchCertificationRotationPendingStore.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

const portableFingerprint =
  "a".repeat(
    64,
  );

const deviceFingerprint =
  "b".repeat(
    64,
  );

const previousKeyMaterial =
  generateFinoraBranchCertificationKeyMaterial(
    new Date(
      "2026-09-20T10:00:00.000Z",
    ),
  );

const previousKey =
  toFinoraBranchCertificationPublicKey(
    previousKeyMaterial,
  );

const replacementKeyMaterial =
  generateFinoraBranchCertificationKeyMaterial(
    new Date(
      "2026-09-20T10:01:00.000Z",
    ),
  );

const replacementPublicKey =
  toFinoraBranchCertificationPublicKey(
    replacementKeyMaterial,
  );
const pending =
  {
    state:
      "PENDING_CONTROL_CENTER_APPROVAL",

    requestId:
      "FIN-BCR-REQ-TEST-001",

    ownerId:
      "OWNER-TEST",

    businessId:
      "BUSINESS-TEST",

    branchId:
      "BRANCH-TEST",

    installationId:
      "INSTALLATION-TEST",

    bindingKeyId:
      "FINORA-BINDING-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",

    fingerprintAlgorithm:
      "SHA-256",

    publicKeyFingerprint:
      deviceFingerprint,

    authStateId:
      "AUTH-STATE-TEST",

    authGeneration:
      1,

    portableAuthFingerprintAlgorithm:
      "SHA-256",

    portableAuthFingerprint:
      portableFingerprint,

    previousCertificationKeyId:
      previousKey.keyId,

    replacementCertificationKeyMaterial: {
      ...replacementKeyMaterial,
    },

    recoveryReason:
      "LEGACY_CERTIFICATION_PRIVATE_KEY_UNAVAILABLE",

    requestedAt:
      "2026-09-20T10:02:00.000Z",

    schemaVersion:
      1,
  } as unknown as
    FinoraBranchCertificationRotationPendingRecordV1;

const expectedTarget = {
  ownerId:
    pending.ownerId,

  businessId:
    pending.businessId,

  branchId:
    pending.branchId,

  installationId:
    pending.installationId,

  bindingKeyId:
    pending.bindingKeyId,

  fingerprintAlgorithm:
    "SHA-256" as const,

  publicKeyFingerprint:
    pending.publicKeyFingerprint,
};

const payload = {
  payloadVersion:
    1,

  requestId:
    pending.requestId,

  ownerId:
    pending.ownerId,

  businessId:
    pending.businessId,

  branchId:
    pending.branchId,

  requestingInstallationId:
    pending.installationId,

  requestingBindingKeyId:
    pending.bindingKeyId,

  requestingFingerprintAlgorithm:
    pending.fingerprintAlgorithm,

  requestingPublicKeyFingerprint:
    pending.publicKeyFingerprint,

  authStateId:
    pending.authStateId,

  authGeneration:
    pending.authGeneration,

  portableAuthFingerprintAlgorithm:
    pending.portableAuthFingerprintAlgorithm,

  portableAuthFingerprint:
    pending.portableAuthFingerprint,

  previousCertificationPublicKey: {
    ...previousKey,
  },

  replacementCertificationPublicKey: {
    ...replacementPublicKey,
  },

  recoveryReason:
    pending.recoveryReason,

  requestedAt:
    pending.requestedAt,

  approvedAt:
    "2026-09-20T10:03:00.000Z",
};

const verifiedTrustedKey =
  {
    issuerId:
      "FINORA-CONTROL-CENTER-TEST",

    signingKeyId:
      "FINORA-CONTROL-KEY-TEST",
  } as unknown as
    FinoraBranchTrustedControlPublicKey;

function buildControlPackage(
  overrides:
    Record<string, unknown> = {},
) {

  return {
    packageId:
      "FIN-CTRL-BCR-TEST-001",

    purpose:
      "BRANCH_CERTIFICATION_ROTATION",

    target: {
      ...expectedTarget,
    },

    issuedAt:
      "2026-09-20T10:03:00.000Z",

    sequence:
      7,

    payloadVersion:
      1,

    payload: {
      ...payload,
    },

    schemaVersion:
      1,

    ...overrides,
  };
}

function buildDependencies(
  controlPackage =
    buildControlPackage(),
):
  FinoraBranchCertificationRotationAuthorityVerifierDependencies {

  return {
    verifySignedPackage:
      (
        _value,
        _trustedKeys,
        _expectedTarget,
        _now,
      ) =>
        ({
          valid:
            true,

          controlPackage,

          verifiedTrustedKey,
        } as unknown as
          ReturnType<
            FinoraBranchCertificationRotationAuthorityVerifierDependencies[
              "verifySignedPackage"
            ]
          >),

    assertRotationPayload:
      (
        value,
      ) => {
        if (
          typeof value !==
            "object" ||
          value ===
            null
        ) {
          throw new Error(
            "test payload invalid",
          );
        }
      },

    createPortableAuthFingerprint:
      () =>
        portableFingerprint,

    toCertificationPublicKey:
      () =>
        ({
          ...replacementPublicKey,
        }),
  };
}

const envelope =
  {} as
    FinoraPortableBranchAuthEnvelopeV1;

const trustedKeys =
  [] as
    readonly FinoraBranchTrustedControlPublicKey[];

function verifyWith(
  dependencies:
    FinoraBranchCertificationRotationAuthorityVerifierDependencies,

  pendingOverride:
    FinoraBranchCertificationRotationPendingRecordV1 =
      pending,
) {

  return verifyFinoraBranchCertificationRotationAuthority(
    {
      signedPackage: {
        opaque:
          true,
      },

      trustedKeys,

      expectedTarget,

      pending:
        pendingOverride,

      currentPortableEnvelope:
        envelope,

      now:
        new Date(
          "2026-09-20T10:04:00.000Z",
        ),
    },
    dependencies,
  );
}

function expectFailure(
  result:
    ReturnType<
      typeof verifyFinoraBranchCertificationRotationAuthority
    >,

  fragment:
    string,

  label:
    string,
): void {

  assert.equal(
    result.success,
    false,
  );

  if (result.success) {
    throw new Error(
      label,
    );
  }

  assert.match(
    result.error,
    new RegExp(
      fragment,
      "i",
    ),
  );

  console.log(
    `PASS: ${label}`,
  );
}

function run():
  void {

  const valid =
    verifyWith(
      buildDependencies(),
    );


  if (!valid.success) {
    throw new Error(
      valid.error,
    );
  }

  assert.equal(
    valid.success,
    true,
  );

  assert.equal(
    valid.data.requestId,
    pending.requestId,
  );

  assert.equal(
    valid.data.packageId,
    "FIN-CTRL-BCR-TEST-001",
  );

  assert.equal(
    valid.data.sequence,
    7,
  );

  assert.equal(
    valid.data.currentPortableAuthFingerprint,
    portableFingerprint,
  );

  assert.equal(
    valid.data.replacementCertificationPublicKey.publicKey,
    replacementPublicKey.publicKey,
  );

  console.log(
    "PASS: exact signed rotation authority evidence accepted",
  );

  const signatureFailureDependencies =
    buildDependencies();

  signatureFailureDependencies.verifySignedPackage =
    () =>
      ({
        valid:
          false,

        reason:
          "SIGNATURE_INVALID",

        error:
          "test signature invalid",
      } as unknown as
        ReturnType<
          FinoraBranchCertificationRotationAuthorityVerifierDependencies[
            "verifySignedPackage"
          ]
        >);

  expectFailure(
    verifyWith(
      signatureFailureDependencies,
    ),
    "SIGNATURE_INVALID",
    "canonical signature verification failure rejected",
  );

  expectFailure(
    verifyWith(
      buildDependencies(
        buildControlPackage({
          purpose:
            "BRANCH_ACCESS",
        }),
      ),
    ),
    "purpose",
    "wrong signed package purpose rejected",
  );

  expectFailure(
    verifyWith(
      buildDependencies(),
      {
        ...pending,

        installationId:
          "OTHER-INSTALLATION",
      },
    ),
    "native installation target",
    "pending request for different native installation rejected",
  );

  const fingerprintDependencies =
    buildDependencies();

  fingerprintDependencies.createPortableAuthFingerprint =
    () =>
      "e".repeat(
        64,
      );

  expectFailure(
    verifyWith(
      fingerprintDependencies,
    ),
    "Portable Branch Auth",
    "changed current Portable Auth fingerprint rejected",
  );

  expectFailure(
    verifyWith(
      buildDependencies(
        buildControlPackage({
          payload: {
            ...payload,

            authGeneration:
              payload.authGeneration +
              1,
          },
        }),
      ),
    ),
    "exact pending request evidence",
    "authGeneration mismatch rejected",
  );

  const malformedPreviousAuthorityDependencies =
    buildDependencies(
      buildControlPackage({
        payload: {
          ...payload,

          previousCertificationPublicKey: {
            ...previousKey,

            publicKeyFingerprint:
              "f".repeat(
                64,
              ),
          },
        },
      }),
    );

  malformedPreviousAuthorityDependencies.assertRotationPayload =
    assertFinoraBranchCertificationRotationPayload;

  expectFailure(
    verifyWith(
      malformedPreviousAuthorityDependencies,
    ),
    "fingerprint does not match",
    "malformed previous certification public authority rejected by strict payload validation",
  );

  /*
   * Critical proof:
   *
   * keyId remains IDENTICAL while the actual public key changes.
   * Verification must reject this and therefore cannot degrade
   * to keyId-only matching.
   */
  expectFailure(
    verifyWith(
      buildDependencies(
        buildControlPackage({
          payload: {
            ...payload,

            replacementCertificationPublicKey: {
              ...replacementPublicKey,

              publicKey:
                "DIFFERENT-PUBLIC-KEY",
            },
          },
        }),
      ),
    ),
    "replacement certification key",
    "same keyId with different replacement public key rejected",
  );

  const payloadAssertionDependencies =
    buildDependencies();

  payloadAssertionDependencies.assertRotationPayload =
    () => {
      throw new Error(
        "strict payload assertion failed",
      );
    };

  expectFailure(
    verifyWith(
      payloadAssertionDependencies,
    ),
    "strict payload assertion failed",
    "strict rotation payload assertion failure rejected",
  );

  // ----------------------------------------------------------
  // LEGACY CERTIFICATION ADOPTION
  // ----------------------------------------------------------

  const legacyPending =
    {
      ...pending,

      previousCertificationKeyId:
        undefined,
    } as unknown as
      FinoraBranchCertificationRotationPendingRecordV1;

  const legacyPayload:
    Record<string, unknown> = {
      ...payload,

      legacyCertificationAdoption:
        true,
    };

  delete
    legacyPayload.previousCertificationPublicKey;

  assert.equal(
    legacyPayload.previousCertificationPublicKey,
    undefined,
  );

  const legacyValid =
    verifyWith(
      buildDependencies(
        buildControlPackage({
          payload:
            legacyPayload,
        }),
      ),
      legacyPending,
    );

  if (!legacyValid.success) {
    throw new Error(
      legacyValid.error,
    );
  }

  assert.equal(
    legacyValid.data.legacyCertificationAdoption,
    true,
  );

  assert.equal(
    legacyValid.data.previousCertificationPublicKey,
    undefined,
  );

  assert.equal(
    legacyValid.data.replacementCertificationPublicKey.keyId,
    replacementPublicKey.keyId,
  );

  assert.equal(
    legacyValid.data.requestId,
    legacyPending.requestId,
  );

  console.log(
    "PASS: legacy rotation authority accepted when protected pending previous keyId is absent",
  );

  expectFailure(
    verifyWith(
      buildDependencies(
        buildControlPackage({
          payload:
            legacyPayload,
        }),
      ),
      pending,
    ),
    "previous certification keyId",
    "legacy rotation authority rejected when protected pending previous keyId exists",
  );

  console.log(
    "============================================================",
  );

  console.log(
    "PASS: A5-M18D-B2 OWNER ROTATION AUTHORITY VERIFIER EXECUTABLE PROOF",
  );

  console.log(
    "============================================================",
  );
}

run();