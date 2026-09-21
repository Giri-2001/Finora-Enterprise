import assert from "node:assert/strict";

import {
  app,
  safeStorage,
} from "electron";

import {
  mkdtemp,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";

import type {
  Dirent,
} from "node:fs";

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
  findFinoraControlCenterBranchRegistryRecord,
  registerFinoraControlCenterBranch,
  rotateFinoraControlCenterBranchCertification,
} from "./finoraControlCenterBranchRegistryStore.js";

async function findFileRecursive(
  directory:
    string,

  fileName:
    string,
): Promise<
  string | undefined
> {

  const entries:
    Dirent[] =
    await readdir(
      directory,
      {
        withFileTypes:
          true,
      },
    );

  for (
    const entry of
    entries
  ) {

    const full =
      join(
        directory,
        entry.name,
      );

    if (
      entry.isFile() &&
      entry.name ===
        fileName
    ) {
      return full;
    }

    if (
      entry.isDirectory()
    ) {

      const nested =
        await findFileRecursive(
          full,
          fileName,
        );

      if (
        nested !==
          undefined
      ) {
        return nested;
      }
    }
  }

  return undefined;
}

async function run():
  Promise<void> {

  const isolatedUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-registry-cert-rotation-",
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
      "PASS: real Electron Registry encryption available",
    );

    const now =
      Date.now();

    const device1 =
      toFinoraWindowsInstallationBindingPublic(
        generateFinoraWindowsInstallationBindingMaterial(
          new Date(
            now - 90_000,
          ),
        ),
      );

    const device2 =
      toFinoraWindowsInstallationBindingPublic(
        generateFinoraWindowsInstallationBindingMaterial(
          new Date(
            now - 80_000,
          ),
        ),
      );

    const old1 =
      toFinoraBranchCertificationPublicKey(
        generateFinoraBranchCertificationKeyMaterial(
          new Date(
            now - 70_000,
          ),
        ),
      );

    const replacement1 =
      toFinoraBranchCertificationPublicKey(
        generateFinoraBranchCertificationKeyMaterial(
          new Date(
            now - 60_000,
          ),
        ),
      );

    const replacement2 =
      toFinoraBranchCertificationPublicKey(
        generateFinoraBranchCertificationKeyMaterial(
          new Date(
            now - 50_000,
          ),
        ),
      );

    const branch2Certification =
      toFinoraBranchCertificationPublicKey(
        generateFinoraBranchCertificationKeyMaterial(
          new Date(
            now - 40_000,
          ),
        ),
      );

    await registerFinoraControlCenterBranch({
      identity: {
        ownerId:
          "OWNER-CERT-ROTATION-1",

        businessId:
          "BUSINESS-CERT-ROTATION-1",

        branchId:
          "BRANCH-CERT-ROTATION-1",

        businessCode:
          "BCRBIZ1",

        branchCode:
          "BCRBR1",

        installation: {
          installationId:
            device1.installationId,

          bindingKeyId:
            device1.bindingKeyId,

          platform:
            device1.platform,

          algorithm:
            device1.algorithm,

          publicKeyFormat:
            device1.publicKeyFormat,

          publicKey:
            device1.publicKey,

          fingerprintAlgorithm:
            device1.fingerprintAlgorithm,

          publicKeyFingerprint:
            device1.publicKeyFingerprint,

          bindingCreatedAt:
            device1.createdAt,
        },
      },

      branchCertificationPublicKey: {
        ...old1,
      },
    });

    await registerFinoraControlCenterBranch({
      identity: {
        ownerId:
          "OWNER-CERT-ROTATION-2",

        businessId:
          "BUSINESS-CERT-ROTATION-2",

        branchId:
          "BRANCH-CERT-ROTATION-2",

        businessCode:
          "BCRBIZ2",

        branchCode:
          "BCRBR2",

        installation: {
          installationId:
            device2.installationId,

          bindingKeyId:
            device2.bindingKeyId,

          platform:
            device2.platform,

          algorithm:
            device2.algorithm,

          publicKeyFormat:
            device2.publicKeyFormat,

          publicKey:
            device2.publicKey,

          fingerprintAlgorithm:
            device2.fingerprintAlgorithm,

          publicKeyFingerprint:
            device2.publicKeyFingerprint,

          bindingCreatedAt:
            device2.createdAt,
        },
      },

      branchCertificationPublicKey: {
        ...branch2Certification,
      },
    });

    console.log(
      "PASS: two isolated Registry branches seeded",
    );

    const registryFile =
      await findFileRecursive(
        isolatedUserData,
        "finora-control-center-branch-registry.bin",
      );

    assert.ok(
      registryFile,
    );

    const first =
      await rotateFinoraControlCenterBranchCertification({
        ownerId:
          "OWNER-CERT-ROTATION-1",

        businessId:
          "BUSINESS-CERT-ROTATION-1",

        branchId:
          "BRANCH-CERT-ROTATION-1",

        requestingInstallationId:
          device1.installationId,

        requestingBindingKeyId:
          device1.bindingKeyId,

        requestingFingerprintAlgorithm:
          device1.fingerprintAlgorithm,

        requestingPublicKeyFingerprint:
          device1.publicKeyFingerprint,

        sourcePackageId:
          "FINORA-BCR-PKG-001",

        sequence:
          1,

        previousCertificationPublicKey: {
          ...old1,
        },

        replacementCertificationPublicKey: {
          ...replacement1,
        },
      });

    assert.equal(
      first.updated,
      true,
    );

    assert.equal(
      first.record.branchCertificationPublicKey?.keyId,
      replacement1.keyId,
    );

    assert.equal(
      first.record.branchCertificationRotation?.sourcePackageId,
      "FINORA-BCR-PKG-001",
    );

    assert.equal(
      first.record.branchCertificationRotation?.sequence,
      1,
    );

    console.log(
      "PASS: exact old -> replacement certification rotation persisted",
    );

    const bytesAfterFirst =
      await readFile(
        registryFile as string,
      );

    /*
     * Exact same package/evidence retry must return without rewrite.
     */
    const exactRetry =
      await rotateFinoraControlCenterBranchCertification({
        ownerId:
          "OWNER-CERT-ROTATION-1",

        businessId:
          "BUSINESS-CERT-ROTATION-1",

        branchId:
          "BRANCH-CERT-ROTATION-1",

        requestingInstallationId:
          device1.installationId,

        requestingBindingKeyId:
          device1.bindingKeyId,

        requestingFingerprintAlgorithm:
          device1.fingerprintAlgorithm,

        requestingPublicKeyFingerprint:
          device1.publicKeyFingerprint,

        sourcePackageId:
          "FINORA-BCR-PKG-001",

        sequence:
          1,

        previousCertificationPublicKey: {
          ...old1,
        },

        replacementCertificationPublicKey: {
          ...replacement1,
        },
      });

    assert.equal(
      exactRetry.updated,
      false,
    );

    const bytesAfterRetry =
      await readFile(
        registryFile as string,
      );

    assert.equal(
      bytesAfterRetry.equals(
        bytesAfterFirst,
      ),
      true,
    );

    console.log(
      "PASS: exact rotation retry is encrypted-file byte-stable",
    );

    /*
     * Same current replacement but different package evidence is
     * not an exact retry.
     */
    await assert.rejects(
      () =>
        rotateFinoraControlCenterBranchCertification({
          ownerId:
            "OWNER-CERT-ROTATION-1",

          businessId:
            "BUSINESS-CERT-ROTATION-1",

          branchId:
            "BRANCH-CERT-ROTATION-1",

          requestingInstallationId:
            device1.installationId,

          requestingBindingKeyId:
            device1.bindingKeyId,

          requestingFingerprintAlgorithm:
            device1.fingerprintAlgorithm,

          requestingPublicKeyFingerprint:
            device1.publicKeyFingerprint,

          sourcePackageId:
            "FINORA-BCR-PKG-CONFLICT",

          sequence:
            1,

          previousCertificationPublicKey: {
            ...old1,
          },

          replacementCertificationPublicKey: {
            ...replacement1,
          },
        }),
    );

    assert.equal(
      (
        await readFile(
          registryFile as string,
        )
      ).equals(
        bytesAfterFirst,
      ),
      true,
    );

    console.log(
      "PASS: conflicting retry rejected without Registry mutation",
    );

    /*
     * Stale old authority after successful rotation must fail.
     */
    await assert.rejects(
      () =>
        rotateFinoraControlCenterBranchCertification({
          ownerId:
            "OWNER-CERT-ROTATION-1",

          businessId:
            "BUSINESS-CERT-ROTATION-1",

          branchId:
            "BRANCH-CERT-ROTATION-1",

          requestingInstallationId:
            device1.installationId,

          requestingBindingKeyId:
            device1.bindingKeyId,

          requestingFingerprintAlgorithm:
            device1.fingerprintAlgorithm,

          requestingPublicKeyFingerprint:
            device1.publicKeyFingerprint,

          sourcePackageId:
            "FINORA-BCR-PKG-STALE",

          sequence:
            2,

          previousCertificationPublicKey: {
            ...old1,
          },

          replacementCertificationPublicKey: {
            ...replacement2,
          },
        }),
    );

    assert.equal(
      (
        await readFile(
          registryFile as string,
        )
      ).equals(
        bytesAfterFirst,
      ),
      true,
    );

    console.log(
      "PASS: stale previous authority rejected without Registry mutation",
    );

    /*
     * A replacement authority already belonging to branch 2 must
     * be rejected globally.
     */
    await assert.rejects(
      () =>
        rotateFinoraControlCenterBranchCertification({
          ownerId:
            "OWNER-CERT-ROTATION-1",

          businessId:
            "BUSINESS-CERT-ROTATION-1",

          branchId:
            "BRANCH-CERT-ROTATION-1",

          requestingInstallationId:
            device1.installationId,

          requestingBindingKeyId:
            device1.bindingKeyId,

          requestingFingerprintAlgorithm:
            device1.fingerprintAlgorithm,

          requestingPublicKeyFingerprint:
            device1.publicKeyFingerprint,

          sourcePackageId:
            "FINORA-BCR-PKG-COLLISION",

          sequence:
            2,

          previousCertificationPublicKey: {
            ...replacement1,
          },

          replacementCertificationPublicKey: {
            ...branch2Certification,
          },
        }),
    );

    assert.equal(
      (
        await readFile(
          registryFile as string,
        )
      ).equals(
        bytesAfterFirst,
      ),
      true,
    );

    console.log(
      "PASS: cross-branch replacement certification collision rejected",
    );

    /*
     * Valid later transition from current authority with higher
     * sequence succeeds.
     */
    const second =
      await rotateFinoraControlCenterBranchCertification({
        ownerId:
          "OWNER-CERT-ROTATION-1",

        businessId:
          "BUSINESS-CERT-ROTATION-1",

        branchId:
          "BRANCH-CERT-ROTATION-1",

        requestingInstallationId:
          device1.installationId,

        requestingBindingKeyId:
          device1.bindingKeyId,

        requestingFingerprintAlgorithm:
          device1.fingerprintAlgorithm,

        requestingPublicKeyFingerprint:
          device1.publicKeyFingerprint,

        sourcePackageId:
          "FINORA-BCR-PKG-002",

        sequence:
          2,

        previousCertificationPublicKey: {
          ...replacement1,
        },

        replacementCertificationPublicKey: {
          ...replacement2,
        },
      });

    assert.equal(
      second.updated,
      true,
    );

    assert.equal(
      second.record.branchCertificationPublicKey?.keyId,
      replacement2.keyId,
    );

    assert.equal(
      second.record.branchCertificationRotation?.sequence,
      2,
    );

    const reloaded =
      await findFinoraControlCenterBranchRegistryRecord(
        "OWNER-CERT-ROTATION-1",
        "BUSINESS-CERT-ROTATION-1",
        "BRANCH-CERT-ROTATION-1",
      );

    assert.ok(
      reloaded,
    );

    assert.equal(
      reloaded?.branchCertificationPublicKey?.keyId,
      replacement2.keyId,
    );

    assert.equal(
      reloaded?.branchCertificationRotation?.sourcePackageId,
      "FINORA-BCR-PKG-002",
    );

    console.log(
      "PASS: later monotonic certification rotation persisted and reloaded",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: A5-M18C-C1 REGISTRY CERTIFICATION ROTATION EXECUTABLE PROOF",
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