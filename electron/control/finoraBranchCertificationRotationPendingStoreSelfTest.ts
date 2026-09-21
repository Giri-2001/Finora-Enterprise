import assert from "node:assert/strict";

import {
  app,
  safeStorage,
} from "electron";

import {
  mkdtemp,
  readFile,
  rm,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  generateFinoraBranchCertificationKeyMaterial,
  toFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";

import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,
} from "./finoraBranchCertificationRotationContract.js";

import {
  destroyFinoraBranchCertificationRotationPending,
  getFinoraBranchCertificationRotationPendingStorePath,
  loadFinoraBranchCertificationRotationPending,
  persistFinoraBranchCertificationRotationPending,
} from "./finoraBranchCertificationRotationPendingStore.js";

async function run():
  Promise<void> {

  const isolatedUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-bcr-pending-",
      ),
    );

  app.setPath(
    "userData",
    isolatedUserData,
  );

  try {
    await app.whenReady();

    assert.equal(
      safeStorage.isEncryptionAvailable(),
      true,
    );

    console.log(
      "PASS: real Electron safeStorage encryption available",
    );

    const initial =
      await loadFinoraBranchCertificationRotationPending();

    assert.equal(
      initial,
      undefined,
    );

    console.log(
      "PASS: isolated pending custody starts empty",
    );

    const previousMaterial =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          "2026-09-20T14:00:00.000Z",
        ),
      );

    const replacementMaterial =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          "2026-09-20T14:01:00.000Z",
        ),
      );

    const installationFingerprint =
      "e".repeat(
        64,
      );

    const input = {
      requestId:
        "FIN-BCR-REQ-CUSTODY-001",

      ownerId:
        "OWNER-001",

      businessId:
        "BUSINESS-001",

      branchId:
        "BRANCH-001",

      installationId:
        "INSTALLATION-001",

      bindingKeyId:
        `FINORA-BINDING-${installationFingerprint
          .slice(
            0,
            32,
          )
          .toUpperCase()}`,

      fingerprintAlgorithm:
        "SHA-256" as const,

      publicKeyFingerprint:
        installationFingerprint,

      authStateId:
        "AUTH-STATE-001",

      authGeneration:
        1,

      portableAuthFingerprintAlgorithm:
        "SHA-256" as const,

      portableAuthFingerprint:
        "f".repeat(
          64,
        ),

      previousCertificationPublicKey:
        toFinoraBranchCertificationPublicKey(
          previousMaterial,
        ),

      replacementCertificationKeyMaterial:
        replacementMaterial,

      recoveryReason:
        FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,

      requestedAt:
        "2026-09-20T14:02:00.000Z",
    };

    const first =
      await persistFinoraBranchCertificationRotationPending(
        input,
      );

    assert.equal(
      first.replacementCertificationKeyMaterial.keyId,
      replacementMaterial.keyId,
    );

    console.log(
      "PASS: replacement certification private key persisted in pending custody",
    );

    const filePath =
      getFinoraBranchCertificationRotationPendingStorePath();

    const rawBefore =
      await readFile(
        filePath,
      );

    assert.equal(
      rawBefore.includes(
        Buffer.from(
          replacementMaterial.privateKey,
          "utf8",
        ),
      ),
      false,
    );

    assert.equal(
      rawBefore.includes(
        Buffer.from(
          '"privateKey"',
          "utf8",
        ),
      ),
      false,
    );

    console.log(
      "PASS: pending custody file does not expose plaintext private key",
    );

    const second =
      await persistFinoraBranchCertificationRotationPending(
        input,
      );

    assert.deepEqual(
      second,
      first,
    );

    const rawAfter =
      await readFile(
        filePath,
      );

    assert.equal(
      rawAfter.equals(
        rawBefore,
      ),
      true,
    );

    console.log(
      "PASS: exact pending-custody retry is byte-stable",
    );

    await assert.rejects(
      () =>
        persistFinoraBranchCertificationRotationPending({
          ...input,

          requestId:
            "FIN-BCR-REQ-CUSTODY-CONFLICT",
        }),
    );

    console.log(
      "PASS: conflicting pending rotation rejected",
    );

    const loaded =
      await loadFinoraBranchCertificationRotationPending();

    assert.deepEqual(
      loaded,
      first,
    );

    console.log(
      "PASS: encrypted pending custody reload verified",
    );

    await assert.rejects(
      () =>
        destroyFinoraBranchCertificationRotationPending({
          requestId:
            first.requestId,

          ownerId:
            first.ownerId,

          businessId:
            first.businessId,

          branchId:
            first.branchId,

          replacementCertificationKeyId:
            previousMaterial.keyId,
        }),
    );

    console.log(
      "PASS: wrong destruction evidence rejected",
    );

    const destroyed =
      await destroyFinoraBranchCertificationRotationPending({
        requestId:
          first.requestId,

        ownerId:
          first.ownerId,

        businessId:
          first.businessId,

        branchId:
          first.branchId,

        replacementCertificationKeyId:
          replacementMaterial.keyId,
      });

    assert.equal(
      destroyed,
      true,
    );

    assert.equal(
      await loadFinoraBranchCertificationRotationPending(),
      undefined,
    );

    console.log(
      "PASS: exact-evidence pending custody destruction verified",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: A5-M18B-B1 REAL ELECTRON PENDING-CUSTODY EXECUTABLE PROOF",
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