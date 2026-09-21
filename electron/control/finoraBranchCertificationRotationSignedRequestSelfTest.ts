import assert from "node:assert/strict";

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
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  generateFinoraBranchCertificationKeyMaterial,
  toFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";

import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,
} from "./finoraBranchCertificationRotationContract.js";

import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_SCHEMA_VERSION,
  FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_STATE,
} from "./finoraBranchCertificationRotationPendingStore.js";

import type {
  FinoraBranchCertificationRotationPendingRecordV1,
} from "./finoraBranchCertificationRotationPendingStore.js";

import {
  createFinoraBranchCertificationRotationRequestFile,
} from "./finoraBranchCertificationRotationRequest.js";

import {
  createFinoraBranchCertificationRotationSignedRequest,
} from "./finoraBranchCertificationRotationSignedRequest.js";

import {
  verifyFinoraBranchCertificationRotationSignedRequest,
} from "../control-center/finoraBranchCertificationRotationRequestVerifier.js";

function clone<T>(
  value:
    T,
): T {

  return JSON.parse(
    JSON.stringify(
      value,
    ),
  ) as T;
}

async function run():
  Promise<void> {

  const isolatedUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-bcr-pop-",
      ),
    );

  app.setPath(
    "userData",
    isolatedUserData,
  );

  try {
    await app.whenReady();

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert.ok(
      nativeBinding,
    );

    console.log(
      "PASS: isolated native P-256 installation binding ready",
    );

    const previousMaterial =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          "2026-09-20T15:00:00.000Z",
        ),
      );

    const replacementMaterial =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          "2026-09-20T15:01:00.000Z",
        ),
      );

    const pending:
      FinoraBranchCertificationRotationPendingRecordV1 = {

        state:
          FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_STATE,

        requestId:
          "FIN-BCR-REQ-POP-001",

        ownerId:
          "OWNER-001",

        businessId:
          "BUSINESS-001",

        branchId:
          "BRANCH-001",

        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          nativeBinding.fingerprintAlgorithm,

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,

        authStateId:
          "AUTH-STATE-001",

        authGeneration:
          1,

        portableAuthFingerprintAlgorithm:
          "SHA-256",

        portableAuthFingerprint:
          "a".repeat(
            64,
          ),

        previousCertificationKeyId:
          toFinoraBranchCertificationPublicKey(
            previousMaterial,
          ).keyId,

        replacementCertificationKeyMaterial:
          replacementMaterial,

        recoveryReason:
          FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,

        requestedAt:
          "2026-09-20T15:02:00.000Z",

        schemaVersion:
          FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_SCHEMA_VERSION,
      };

    const requestFile =
      createFinoraBranchCertificationRotationRequestFile(
        pending,
      );

    const signed =
      await createFinoraBranchCertificationRotationSignedRequest(
        requestFile,
      );

    console.log(
      "PASS: native-signed rotation request created",
    );

    const serialized =
      JSON.stringify(
        signed,
      );

    assert.equal(
      serialized.includes(
        replacementMaterial.privateKey,
      ),
      false,
    );

    assert.equal(
      serialized.includes(
        '"privateKey"',
      ),
      false,
    );

    console.log(
      "PASS: signed exported shape contains no replacement private key",
    );

    const verified =
      verifyFinoraBranchCertificationRotationSignedRequest(
        signed,
      );

    assert.equal(
      verified.request.requestId,
      pending.requestId,
    );

    assert.equal(
      verified.request.branchId,
      pending.branchId,
    );

    assert.equal(
      verified.deviceBinding.bindingKeyId,
      nativeBinding.bindingKeyId,
    );

    console.log(
      "PASS: Control Center verifier accepted exact native possession proof",
    );

    const tamperedRequest =
      clone(
        signed,
      );

    tamperedRequest.requestFile.request.branchId =
      "BRANCH-TAMPERED";

    assert.throws(
      () =>
        verifyFinoraBranchCertificationRotationSignedRequest(
          tamperedRequest,
        ),
    );

    console.log(
      "PASS: signed request payload tamper rejected",
    );

    const tamperedSignature =
      clone(
        signed,
      );

    const signatureBytes =
      Buffer.from(
        tamperedSignature.signature.value,
        "base64",
      );

    signatureBytes[0] =
      signatureBytes[0] ^
      1;

    tamperedSignature.signature.value =
      signatureBytes.toString(
        "base64",
      );

    assert.throws(
      () =>
        verifyFinoraBranchCertificationRotationSignedRequest(
          tamperedSignature,
        ),
    );

    console.log(
      "PASS: native possession signature tamper rejected",
    );

    const substitutedBinding =
      clone(
        signed,
      );

    substitutedBinding.deviceBinding.publicKeyFingerprint =
      "b".repeat(
        64,
      );

    assert.throws(
      () =>
        verifyFinoraBranchCertificationRotationSignedRequest(
          substitutedBinding,
        ),
    );

    console.log(
      "PASS: public-key fingerprint substitution rejected",
    );

    const mismatchedRequestBinding =
      clone(
        signed,
      );

    mismatchedRequestBinding.requestFile.request.requestingPublicKeyFingerprint =
      "c".repeat(
        64,
      );

    assert.throws(
      () =>
        verifyFinoraBranchCertificationRotationSignedRequest(
          mismatchedRequestBinding,
        ),
    );

    console.log(
      "PASS: request/native-binding mismatch rejected",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: A5-M18B-C1-B1 NATIVE POP CRYPTOGRAPHIC EXECUTABLE PROOF",
    );

    console.log(
      "============================================================",
    );
  }
  finally {
    await rm(
      isolatedUserData,
      {
        recursive:
          true,
        force:
          true,
      },
    );

    app.exit(
      0,
    );
  }
}

run().catch(
  (
    error,
  ) => {

    console.error(
      error instanceof Error
        ? error.stack ?? error.message
        : String(
            error,
          ),
    );

    app.exit(
      1,
    );
  },
);