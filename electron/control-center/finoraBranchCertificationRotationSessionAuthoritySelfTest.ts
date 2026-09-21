import assert from "node:assert/strict";

import type {
  WebContents,
} from "electron";

import {
  generateFinoraWindowsInstallationBindingMaterial,
  toFinoraWindowsInstallationBindingPublic,
} from "../control/finoraInstallationBindingCrypto.js";

import {
  generateFinoraBranchCertificationKeyMaterial,
  toFinoraBranchCertificationPublicKey,
} from "../control/finoraBranchCertificationCrypto.js";

import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,
} from "../control/finoraBranchCertificationRotationContract.js";

import type {
  FinoraVerifiedBranchCertificationRotationRequest,
} from "./finoraBranchCertificationRotationRequestVerifier.js";

import {
  clearFinoraVerifiedBranchCertificationRotationRequest,
  getFinoraVerifiedBranchCertificationRotationRequest,
  rememberFinoraVerifiedBranchCertificationRotationRequest,
  takeFinoraVerifiedBranchCertificationRotationRequest,
} from "./finoraBranchCertificationRotationSessionAuthority.js";

function createFakeWebContents(
  destroyed =
    false,
): WebContents {

  return {
    isDestroyed:
      () =>
        destroyed,
  } as unknown as WebContents;
}

function createVerifiedFixture():
  FinoraVerifiedBranchCertificationRotationRequest {

  const now =
    Date.now();

  const device =
    toFinoraWindowsInstallationBindingPublic(
      generateFinoraWindowsInstallationBindingMaterial(
        new Date(
          now - 30_000,
        ),
      ),
    );

  const previous =
    toFinoraBranchCertificationPublicKey(
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          now - 20_000,
        ),
      ),
    );

  const replacement =
    toFinoraBranchCertificationPublicKey(
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          now - 10_000,
        ),
      ),
    );

  return {
    request: {
      requestId:
        "FIN-BCR-REQ-SESSION-001",

      ownerId:
        "OWNER-BCR-SESSION",

      businessId:
        "BUSINESS-BCR-SESSION",

      branchId:
        "BRANCH-BCR-SESSION",

      requestingInstallationId:
        device.installationId,

      requestingBindingKeyId:
        device.bindingKeyId,

      requestingFingerprintAlgorithm:
        device.fingerprintAlgorithm,

      requestingPublicKeyFingerprint:
        device.publicKeyFingerprint,

      authStateId:
        "AUTH-BCR-SESSION",

      authGeneration:
        1,

      portableAuthFingerprintAlgorithm:
        "SHA-256",

      portableAuthFingerprint:
        "c".repeat(
          64,
        ),

      previousCertificationKeyId:
      previous.keyId,

      replacementCertificationPublicKey: {
        ...replacement,
      },

      recoveryReason:
        FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,

      requestedAt:
        new Date(
          now - 1_000,
        ).toISOString(),
    },

    deviceBinding: {
      ...device,
    },

    schemaVersion:
      1,
  };
}

function run():
  void {

  const renderer =
    createFakeWebContents();

  const fixture =
    createVerifiedFixture();

  rememberFinoraVerifiedBranchCertificationRotationRequest(
    renderer,
    fixture,
  );

  fixture.request.ownerId =
    "MUTATED-OUTSIDE-SESSION";

  const remembered =
    getFinoraVerifiedBranchCertificationRotationRequest(
      renderer,
    );

  assert.ok(
    remembered,
  );

  assert.equal(
    remembered?.request.ownerId,
    "OWNER-BCR-SESSION",
  );

  console.log(
    "PASS: remember stores a defensive verified-request clone",
  );

  if (
    remembered ===
      undefined
  ) {
    throw new Error(
      "Verified rotation request unexpectedly missing.",
    );
  }

  remembered.request.businessId =
    "MUTATED-RETURNED-CLONE";

  const secondRead =
    getFinoraVerifiedBranchCertificationRotationRequest(
      renderer,
    );

  assert.equal(
    secondRead?.request.businessId,
    "BUSINESS-BCR-SESSION",
  );

  console.log(
    "PASS: get returns a defensive clone",
  );

  const taken =
    takeFinoraVerifiedBranchCertificationRotationRequest(
      renderer,
    );

  assert.ok(
    taken,
  );

  assert.equal(
    taken?.request.requestId,
    "FIN-BCR-REQ-SESSION-001",
  );

  assert.equal(
    getFinoraVerifiedBranchCertificationRotationRequest(
      renderer,
    ),
    undefined,
  );

  assert.equal(
    takeFinoraVerifiedBranchCertificationRotationRequest(
      renderer,
    ),
    undefined,
  );

  console.log(
    "PASS: take atomically consumes the verified request exactly once",
  );

  rememberFinoraVerifiedBranchCertificationRotationRequest(
    renderer,
    createVerifiedFixture(),
  );

  clearFinoraVerifiedBranchCertificationRotationRequest(
    renderer,
  );

  assert.equal(
    getFinoraVerifiedBranchCertificationRotationRequest(
      renderer,
    ),
    undefined,
  );

  console.log(
    "PASS: explicit clear removes verified rotation session state",
  );

  const destroyedRenderer =
    createFakeWebContents(
      true,
    );

  assert.throws(
    () =>
      rememberFinoraVerifiedBranchCertificationRotationRequest(
        destroyedRenderer,
        createVerifiedFixture(),
      ),
  );

  assert.equal(
    getFinoraVerifiedBranchCertificationRotationRequest(
      destroyedRenderer,
    ),
    undefined,
  );

  assert.equal(
    takeFinoraVerifiedBranchCertificationRotationRequest(
      destroyedRenderer,
    ),
    undefined,
  );

  console.log(
    "PASS: destroyed renderer cannot retain or consume verified request state",
  );

  console.log(
    "============================================================",
  );

  console.log(
    "PASS: A5-M18C-D1-C1 VERIFIED ROTATION SESSION EXECUTABLE PROOF",
  );

  console.log(
    "============================================================",
  );
}

run();