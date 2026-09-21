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
  findFinoraControlCenterBranchRegistryRecord,
  registerFinoraControlCenterBranch,
} from "./finoraControlCenterBranchRegistryStore.js";

import {
  issueFinoraBranchCertificationRotationPackage,
} from "./finoraBranchCertificationRotationIssuer.js";

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
        "finora-bcr-issuer-",
      ),
    );

  app.setPath(
    "userData",
    isolatedUserData,
  );

  try {
    await app.whenReady();

    const now =
      Date.now();

    const deviceMaterial =
      generateFinoraWindowsInstallationBindingMaterial(
        new Date(
          now - 60_000,
        ),
      );

    const device =
      toFinoraWindowsInstallationBindingPublic(
        deviceMaterial,
      );

    const unauthorizedDevice =
      toFinoraWindowsInstallationBindingPublic(
        generateFinoraWindowsInstallationBindingMaterial(
          new Date(
            now - 55_000,
          ),
        ),
      );

    const previousMaterial =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          now - 50_000,
        ),
      );

    const replacementMaterial =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          now - 40_000,
        ),
      );

    const otherMaterial =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          now - 30_000,
        ),
      );

    const previousPublic =
      toFinoraBranchCertificationPublicKey(
        previousMaterial,
      );

    const replacementPublic =
      toFinoraBranchCertificationPublicKey(
        replacementMaterial,
      );

    const otherPublic =
      toFinoraBranchCertificationPublicKey(
        otherMaterial,
      );

    await registerFinoraControlCenterBranch({
      identity: {
        ownerId:
          "OWNER-ROTATION-001",

        businessId:
          "BUSINESS-ROTATION-001",

        branchId:
          "BRANCH-ROTATION-001",

        businessCode:
          "BIZ001",

        branchCode:
          "BR001",

        installation: {
          installationId:
            device.installationId,

          bindingKeyId:
            device.bindingKeyId,

          platform:
            device.platform,

          algorithm:
            device.algorithm,

          publicKeyFormat:
            device.publicKeyFormat,

          publicKey:
            device.publicKey,

          fingerprintAlgorithm:
            device.fingerprintAlgorithm,

          publicKeyFingerprint:
            device.publicKeyFingerprint,

          bindingCreatedAt:
            device.createdAt,
        },
      },

      branchCertificationPublicKey: {
        ...previousPublic,
      },
    });

    console.log(
      "PASS: Registry seeded with exact old certification anchor and authorized installation",
    );

    const requestedAt =
      new Date(
        now - 5_000,
      ).toISOString();

    const verified:
      FinoraVerifiedBranchCertificationRotationRequest = {

        request: {
          requestId:
            "FIN-BCR-REQ-ISSUER-001",

          ownerId:
            "OWNER-ROTATION-001",

          businessId:
            "BUSINESS-ROTATION-001",

          branchId:
            "BRANCH-ROTATION-001",

          requestingInstallationId:
            device.installationId,

          requestingBindingKeyId:
            device.bindingKeyId,

          requestingFingerprintAlgorithm:
            device.fingerprintAlgorithm,

          requestingPublicKeyFingerprint:
            device.publicKeyFingerprint,

          authStateId:
            "AUTH-ROTATION-001",

          authGeneration:
            1,

          portableAuthFingerprintAlgorithm:
            "SHA-256",

          portableAuthFingerprint:
            "a".repeat(
              64,
            ),

          previousCertificationKeyId:
            previousPublic.keyId,

          replacementCertificationPublicKey: {
            ...replacementPublic,
          },

          recoveryReason:
            FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,

          requestedAt,
        },

        deviceBinding: {
          ...device,
        },

        schemaVersion:
          1,
      };

    /*
     * Failed old-anchor preflight must occur BEFORE sequence reserve.
     */
    const wrongOldAnchor =
      clone(
        verified,
      );

    wrongOldAnchor.request.previousCertificationKeyId =
      replacementPublic.keyId;

    wrongOldAnchor.request.replacementCertificationPublicKey = {
      ...otherPublic,
    };

    await assert.rejects(
      () =>
        issueFinoraBranchCertificationRotationPackage({
          verifiedRequest:
            wrongOldAnchor,
        }),
    );

    console.log(
      "PASS: wrong previous certification anchor rejected before issuance",
    );

    /*
     * Unauthorized native device must also fail before reserve.
     */
    const unauthorized =
      clone(
        verified,
      );

    unauthorized.request.requestingInstallationId =
      unauthorizedDevice.installationId;

    unauthorized.request.requestingBindingKeyId =
      unauthorizedDevice.bindingKeyId;

    unauthorized.request.requestingFingerprintAlgorithm =
      unauthorizedDevice.fingerprintAlgorithm;

    unauthorized.request.requestingPublicKeyFingerprint =
      unauthorizedDevice.publicKeyFingerprint;

    unauthorized.deviceBinding = {
      ...unauthorizedDevice,
    };

    await assert.rejects(
      () =>
        issueFinoraBranchCertificationRotationPackage({
          verifiedRequest:
            unauthorized,
        }),
    );

    console.log(
      "PASS: unauthorized requesting installation rejected before issuance",
    );

    /*
     * Since both negative preflights occurred before reservation,
     * the first valid issuance must receive sequence 1.
     */
    const first =
      await issueFinoraBranchCertificationRotationPackage({
        verifiedRequest:
          verified,
      });

    assert.equal(
      first.purpose,
      "BRANCH_CERTIFICATION_ROTATION",
    );

    assert.equal(
      first.sequence,
      1,
    );

    assert.equal(
      first.target.ownerId,
      verified.request.ownerId,
    );

    assert.equal(
      first.target.businessId,
      verified.request.businessId,
    );

    assert.equal(
      first.target.branchId,
      verified.request.branchId,
    );

    assert.equal(
      first.target.installationId,
      device.installationId,
    );

    assert.equal(
      first.target.bindingKeyId,
      device.bindingKeyId,
    );

    const firstPreviousCertificationPublicKey =
      first.payload.previousCertificationPublicKey;

    if (
      firstPreviousCertificationPublicKey ===
        undefined
    ) {
      throw new Error(
        "FAIL: ordinary rotation omitted previous certification public authority.",
      );
    }

    assert.equal(
      firstPreviousCertificationPublicKey.keyId,
      previousPublic.keyId,
    );

    assert.equal(
      first.payload.replacementCertificationPublicKey.keyId,
      replacementPublic.keyId,
    );

    assert.equal(
      first.payload.approvedAt,
      first.issuedAt,
    );

    assert.equal(
      Buffer.from(
        first.signature.value,
        "base64",
      ).byteLength,
      64,
    );

    console.log(
      "PASS: first valid rotation issued as signed sequence 1 package",
    );

    /*
     * A separate valid request under the same exact installation scope
     * must advance the durable purpose-specific sequence.
     */
    const secondVerified =
      clone(
        verified,
      );

    secondVerified.request.requestId =
      "FIN-BCR-REQ-ISSUER-002";

    const second =
      await issueFinoraBranchCertificationRotationPackage({
        verifiedRequest:
          secondVerified,
      });

    assert.equal(
      second.sequence,
      2,
    );

    assert.ok(
      second.packageId !==
        first.packageId,
    );

    console.log(
      "PASS: rotation issuance sequence is monotonic",
    );

    /*
     * Legacy recovery compatibility:
     *
     * Older affected owner state may have no locally durable previous
     * certification keyId because the lost bootstrap custody was the only
     * full local certification anchor.
     *
     * The request may therefore omit previousCertificationKeyId.
     * Control Center must still use the exact Registry current
     * certification authority as the signed old anchor.
     */
    const legacyWithoutKeyId =
      clone(
        verified,
      );

    legacyWithoutKeyId.request.requestId =
      "FIN-BCR-REQ-ISSUER-LEGACY-NO-KEYID-001";

    delete legacyWithoutKeyId.request.previousCertificationKeyId;

    assert.equal(
      legacyWithoutKeyId.request.previousCertificationKeyId,
      undefined,
    );

    const legacyIssued =
      await issueFinoraBranchCertificationRotationPackage({
        verifiedRequest:
          legacyWithoutKeyId,
      });

    assert.equal(
      legacyIssued.sequence,
      3,
    );

    assert.deepEqual(
      legacyIssued.payload.previousCertificationPublicKey,
      previousPublic,
    );

    assert.equal(
      legacyIssued.payload.replacementCertificationPublicKey.keyId,
      replacementPublic.keyId,
    );

    console.log(
      "PASS: legacy rotation request without previousCertificationKeyId issued from Registry authority",
    );

    /*
     * Issuance foundation MUST NOT mutate the Registry certification
     * anchor. Registry replacement happens only after successful
     * package export in the later transaction step.
     */
    const after =
      await findFinoraControlCenterBranchRegistryRecord(
        verified.request.ownerId,
        verified.request.businessId,
        verified.request.branchId,
      );

    assert.ok(
      after,
    );

    assert.equal(
      after?.branchCertificationPublicKey?.keyId,
      previousPublic.keyId,
    );

    assert.equal(
      after?.branchCertificationPublicKey?.publicKeyFingerprint,
      previousPublic.publicKeyFingerprint,
    );

    console.log(
      "PASS: issuance does not mutate Registry certification authority",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: A5-M18C-B1 CONTROL CENTER ROTATION ISSUER EXECUTABLE PROOF",
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