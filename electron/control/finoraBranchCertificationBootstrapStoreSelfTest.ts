import {
  app,
} from "electron";

import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  generateFinoraWindowsInstallationBindingMaterial,
} from "./finoraInstallationBindingCrypto.js";

import {
  generateFinoraBranchCertificationKeyMaterial,
} from "./finoraBranchCertificationCrypto.js";

import {
  bindFinoraBranchCertificationBootstrapToBranch,
  destroyFinoraBranchCertificationBootstrapAfterMigration,
  getFinoraBranchCertificationBootstrapStorePath,
  loadFinoraBranchCertificationBootstrap,
  persistFinoraBranchCertificationBootstrapGenerated,
  restoreFinoraBranchCertificationBootstrapGenerated,
} from "./finoraBranchCertificationBootstrapStore.js";

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

async function expectRejection(
  operation:
    () => Promise<unknown>,

  label:
    string,
): Promise<void> {

  let rejected =
    false;

  try {
    await operation();
  } catch {
    rejected =
      true;
  }

  assert(
    rejected,
    `${label} did not fail closed.`,
  );
}

async function run():
  Promise<void> {

  const isolatedUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-branch-cert-bootstrap-",
      ),
    );

  app.setPath(
    "userData",
    isolatedUserData,
  );

  await app.whenReady();

  console.log(
    "PASS: isolated Branch Certification bootstrap userData created",
  );

  try {

    const nativeBinding =
      generateFinoraWindowsInstallationBindingMaterial(
        new Date(
          "2026-09-16T01:00:00.000Z",
        ),
        "FINORA-INSTALLATION-BRANCH-CERT-SELFTEST",
      );

    const certificationMaterial =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          "2026-09-16T01:05:00.000Z",
        ),
      );

    const request1 =
      "FINORA-ENROLLMENT-BRANCH-CERT-SELFTEST-001";

    const request2 =
      "FINORA-ENROLLMENT-BRANCH-CERT-SELFTEST-002";

    const generatedInput = (
      requestId:
        string,
    ) => ({
      requestId,

      installationId:
        nativeBinding.installationId,

      bindingKeyId:
        nativeBinding.bindingKeyId,

      fingerprintAlgorithm:
        nativeBinding.fingerprintAlgorithm,

      publicKeyFingerprint:
        nativeBinding.publicKeyFingerprint,

      certificationKeyMaterial:
        certificationMaterial,

      generatedAt:
        certificationMaterial.createdAt,
    });

    const previousInitial =
      await persistFinoraBranchCertificationBootstrapGenerated(
        generatedInput(
          request1,
        ),
      );

    assert(
      previousInitial ===
        undefined,
      "First Branch Certification bootstrap persist unexpectedly replaced existing custody.",
    );

    const generated =
      await loadFinoraBranchCertificationBootstrap();

    assert(
      generated !==
        undefined &&
      generated.state ===
        "GENERATED_FOR_REQUEST" &&
      generated.requestId ===
        request1 &&
      generated.certificationKeyMaterial.privateKey ===
        certificationMaterial.privateKey,
      "Generated Branch Certification bootstrap custody did not round-trip exactly.",
    );

    console.log(
      "PASS: GENERATED_FOR_REQUEST custody persisted and loaded exactly",
    );

    const storePath =
      getFinoraBranchCertificationBootstrapStorePath();

    const encryptedBytes =
      await readFile(
        storePath,
      );

    assert(
      encryptedBytes.length >
        0,
      "Branch Certification bootstrap encrypted store is empty.",
    );

    assert(
      !encryptedBytes.includes(
        Buffer.from(
          certificationMaterial.privateKey,
          "utf8",
        ),
      ) &&
      !encryptedBytes.includes(
        Buffer.from(
          request1,
          "utf8",
        ),
      ),
      "Branch Certification bootstrap plaintext secret/provenance leaked into encrypted file bytes.",
    );

    console.log(
      "PASS: safeStorage file exposes no plaintext private key or request provenance",
    );

    const bytesBeforeIdempotent =
      Buffer.from(
        encryptedBytes,
      );

    const previousIdempotent =
      await persistFinoraBranchCertificationBootstrapGenerated(
        generatedInput(
          request1,
        ),
      );

    assert(
      previousIdempotent !==
        undefined &&
      previousIdempotent.requestId ===
        request1,
      "Exact generated bootstrap retry did not return previous custody.",
    );

    const bytesAfterIdempotent =
      await readFile(
        storePath,
      );

    assert(
      bytesAfterIdempotent.equals(
        bytesBeforeIdempotent,
      ),
      "Exact generated bootstrap retry rewrote encrypted custody bytes.",
    );

    console.log(
      "PASS: exact GENERATED_FOR_REQUEST retry is byte-stable and idempotent",
    );

    const previousForSecondRequest =
      await persistFinoraBranchCertificationBootstrapGenerated(
        generatedInput(
          request2,
        ),
      );

    assert(
      previousForSecondRequest !==
        undefined &&
      previousForSecondRequest.requestId ===
        request1,
      "Second request did not return previous bootstrap custody.",
    );

    const secondRequestState =
      await loadFinoraBranchCertificationBootstrap();

    assert(
      secondRequestState !==
        undefined &&
      secondRequestState.requestId ===
        request2 &&
      secondRequestState.certificationKeyMaterial.keyId ===
        certificationMaterial.keyId &&
      secondRequestState.certificationKeyMaterial.privateKey ===
        certificationMaterial.privateKey,
      "Second Enrollment Request did not retain immutable Branch Certification keypair.",
    );

    console.log(
      "PASS: request replacement retains one immutable Branch Certification keypair",
    );

    const restored =
      await restoreFinoraBranchCertificationBootstrapGenerated(
        request2,
        previousForSecondRequest,
      );

    assert(
      restored,
      "Conditional bootstrap restore did not restore previous request custody.",
    );

    const restoredState =
      await loadFinoraBranchCertificationBootstrap();

    assert(
      restoredState !==
        undefined &&
      restoredState.requestId ===
        request1 &&
      restoredState.certificationKeyMaterial.keyId ===
        certificationMaterial.keyId,
      "Conditional bootstrap restore produced incorrect state.",
    );

    console.log(
      "PASS: failed-export style conditional restore preserves immutable custody",
    );

    await persistFinoraBranchCertificationBootstrapGenerated(
      generatedInput(
        request2,
      ),
    );

    const stableGeneratedBytes =
      await readFile(
        storePath,
      );

    const differentCertificationMaterial =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          "2026-09-16T01:06:00.000Z",
        ),
      );

    await expectRejection(
      () =>
        persistFinoraBranchCertificationBootstrapGenerated({
          ...generatedInput(
            "FINORA-ENROLLMENT-BRANCH-CERT-SELFTEST-003",
          ),

          certificationKeyMaterial:
            differentCertificationMaterial,

          generatedAt:
            differentCertificationMaterial.createdAt,
        }),
      "Branch Certification keypair replacement",
    );

    assert(
      (
        await readFile(
          storePath,
        )
      ).equals(
        stableGeneratedBytes,
      ),
      "Rejected Branch Certification keypair replacement mutated encrypted custody.",
    );

    console.log(
      "PASS: Branch Certification keypair replacement is rejected with zero mutation",
    );

    const otherNativeBinding =
      generateFinoraWindowsInstallationBindingMaterial(
        new Date(
          "2026-09-16T01:07:00.000Z",
        ),
        "FINORA-INSTALLATION-BRANCH-CERT-SELFTEST-OTHER",
      );

    await expectRejection(
      () =>
        persistFinoraBranchCertificationBootstrapGenerated({
          ...generatedInput(
            "FINORA-ENROLLMENT-BRANCH-CERT-SELFTEST-004",
          ),

          installationId:
            otherNativeBinding.installationId,

          bindingKeyId:
            otherNativeBinding.bindingKeyId,

          fingerprintAlgorithm:
            otherNativeBinding.fingerprintAlgorithm,

          publicKeyFingerprint:
            otherNativeBinding.publicKeyFingerprint,
        }),
      "Native installation bootstrap rebinding",
    );

    assert(
      (
        await readFile(
          storePath,
        )
      ).equals(
        stableGeneratedBytes,
      ),
      "Rejected native installation bootstrap rebinding mutated encrypted custody.",
    );

    console.log(
      "PASS: bootstrap custody cannot move to a different native installation",
    );

    const originalEncrypted =
      await readFile(
        storePath,
      );

    const tamperedEncrypted =
      Buffer.from(
        originalEncrypted,
      );

    tamperedEncrypted[
      Math.floor(
        tamperedEncrypted.length /
        2,
      )
    ] ^=
      0x01;

    await writeFile(
      storePath,
      tamperedEncrypted,
    );

    await expectRejection(
      () =>
        loadFinoraBranchCertificationBootstrap(),
      "Tampered encrypted bootstrap store",
    );

    await writeFile(
      storePath,
      originalEncrypted,
    );

    const recoveredAfterTamper =
      await loadFinoraBranchCertificationBootstrap();

    assert(
      recoveredAfterTamper !==
        undefined &&
      recoveredAfterTamper.requestId ===
        request2,
      "Bootstrap self-test could not restore authoritative encrypted bytes after tamper proof.",
    );

    console.log(
      "PASS: encrypted bootstrap tamper fails closed",
    );

    const responseId =
      "FINORA-ENROLLMENT-RESPONSE-BRANCH-CERT-SELFTEST-001";

    const branchBound =
      await bindFinoraBranchCertificationBootstrapToBranch({
        requestId:
          request2,

        responseId,

        ownerId:
          "OWNER-BRANCH-CERT-SELFTEST",

        businessId:
          "BUSINESS-BRANCH-CERT-SELFTEST",

        branchId:
          "BRANCH-BRANCH-CERT-SELFTEST",

        boundAt:
          "2026-09-16T01:10:00.000Z",
      });

    assert(
      branchBound.state ===
        "BRANCH_BOUND_AFTER_RESPONSE" &&
      branchBound.branchBinding?.responseId ===
        responseId &&
      branchBound.certificationKeyMaterial.keyId ===
        certificationMaterial.keyId &&
      branchBound.certificationKeyMaterial.privateKey ===
        certificationMaterial.privateKey,
      "Verified response branch binding changed Branch Certification custody.",
    );

    console.log(
      "PASS: verified response establishes immutable BRANCH_BOUND_AFTER_RESPONSE custody",
    );

    const bytesBeforeExactRebind =
      await readFile(
        storePath,
      );

    const exactRebind =
      await bindFinoraBranchCertificationBootstrapToBranch({
        requestId:
          request2,

        responseId,

        ownerId:
          "OWNER-BRANCH-CERT-SELFTEST",

        businessId:
          "BUSINESS-BRANCH-CERT-SELFTEST",

        branchId:
          "BRANCH-BRANCH-CERT-SELFTEST",

        boundAt:
          "2026-09-16T01:10:00.000Z",
      });

    assert(
      exactRebind.state ===
        "BRANCH_BOUND_AFTER_RESPONSE",
      "Exact branch-binding retry did not return bound custody.",
    );

    assert(
      (
        await readFile(
          storePath,
        )
      ).equals(
        bytesBeforeExactRebind,
      ),
      "Exact branch-binding retry rewrote encrypted custody bytes.",
    );

    console.log(
      "PASS: exact branch-binding retry is byte-stable and idempotent",
    );

    await expectRejection(
      () =>
        bindFinoraBranchCertificationBootstrapToBranch({
          requestId:
            request2,

          responseId,

          ownerId:
            "OWNER-BRANCH-CERT-SELFTEST",

          businessId:
            "BUSINESS-BRANCH-CERT-SELFTEST",

          branchId:
            "BRANCH-CONFLICTING",

          boundAt:
            "2026-09-16T01:10:00.000Z",
        }),
      "Conflicting immutable branch binding",
    );

    assert(
      (
        await readFile(
          storePath,
        )
      ).equals(
        bytesBeforeExactRebind,
      ),
      "Rejected conflicting branch binding mutated bootstrap custody.",
    );

    console.log(
      "PASS: conflicting branch rebinding is rejected with zero mutation",
    );

    await expectRejection(
      () =>
        persistFinoraBranchCertificationBootstrapGenerated(
          generatedInput(
            "FINORA-ENROLLMENT-BRANCH-CERT-SELFTEST-005",
          ),
        ),
      "Generated request replacement after branch binding",
    );

    console.log(
      "PASS: branch-bound custody cannot return to GENERATED_FOR_REQUEST",
    );

    await expectRejection(
      () =>
        destroyFinoraBranchCertificationBootstrapAfterMigration({
          requestId:
            request2,

          responseId,

          ownerId:
            "OWNER-BRANCH-CERT-SELFTEST",

          businessId:
            "BUSINESS-BRANCH-CERT-SELFTEST",

          branchId:
            "BRANCH-BRANCH-CERT-SELFTEST",

          certificationKeyId:
            differentCertificationMaterial.keyId,

          migratedAt:
            "2026-09-16T01:15:00.000Z",
        }),
      "Wrong certification-key migration evidence",
    );

    assert(
      (
        await readFile(
          storePath,
        )
      ).equals(
        bytesBeforeExactRebind,
      ),
      "Rejected migration-destroy evidence mutated bootstrap custody.",
    );

    console.log(
      "PASS: wrong migration evidence cannot destroy bootstrap private-key custody",
    );

    const destroyed =
      await destroyFinoraBranchCertificationBootstrapAfterMigration({
        requestId:
          request2,

        responseId,

        ownerId:
          "OWNER-BRANCH-CERT-SELFTEST",

        businessId:
          "BUSINESS-BRANCH-CERT-SELFTEST",

        branchId:
          "BRANCH-BRANCH-CERT-SELFTEST",

        certificationKeyId:
          certificationMaterial.keyId,

        migratedAt:
          "2026-09-16T01:15:00.000Z",
      });

    assert(
      destroyed,
      "Exact verified migration did not destroy bootstrap custody.",
    );

    const afterDestroy =
      await loadFinoraBranchCertificationBootstrap();

    assert(
      afterDestroy ===
        undefined,
      "Branch Certification bootstrap store still exists after verified migration destruction.",
    );

    console.log(
      "PASS: exact verified migration physically destroys bootstrap secret-bearing store",
    );

    const repeatedDestroy =
      await destroyFinoraBranchCertificationBootstrapAfterMigration({
        requestId:
          request2,

        responseId,

        ownerId:
          "OWNER-BRANCH-CERT-SELFTEST",

        businessId:
          "BUSINESS-BRANCH-CERT-SELFTEST",

        branchId:
          "BRANCH-BRANCH-CERT-SELFTEST",

        certificationKeyId:
          certificationMaterial.keyId,

        migratedAt:
          "2026-09-16T01:16:00.000Z",
      });

    assert(
      repeatedDestroy ===
        false,
      "Repeated bootstrap destruction unexpectedly reported existing custody.",
    );

    console.log(
      "PASS: repeated bootstrap destruction is safely idempotent",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: PHASE 5.6L-3D2B BRANCH CERTIFICATION BOOTSTRAP STORE EXECUTABLE PROOF",
    );

    console.log(
      "============================================================",
    );

  } finally {

    await rm(
      isolatedUserData,
      {
        recursive:
          true,

        force:
          true,
      },
    );

    console.log(
      "PASS: isolated Branch Certification bootstrap userData deleted",
    );
  }
}

run()
  .then(
    () => {

      console.log(
        "PASS: Branch Certification Bootstrap Store self-test process exiting with code 0",
      );

      app.exit(
        0,
      );
    },
  )
  .catch(
    (
      error,
    ) => {

      console.error(
        error instanceof Error
          ? error.stack ??
              error.message
          : String(
              error,
            ),
      );

      app.exit(
        1,
      );
    },
  );