// ============================================================
// FINORA ENTERPRISE OS
// USB REPLACEMENT COORDINATOR SELF-TEST
// PHASE : 5.6M-1A
// STATUS: Executable Boundary Proof
// ============================================================

import {
  mkdir,
  mkdtemp,
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
  FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
  FINORA_PORTABLE_BRANCH_AUTH_FILE_NAME,
  FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY,
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import {
  generateFinoraBranchCertificationKeyMaterial,
} from "./finoraBranchCertificationCrypto.js";

import {
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

import {
  createFinoraPortableBranchAuthEnrollmentMaterialV1,
  decryptFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  replaceFinoraPortableBranchAuthUsb,
} from "./finoraPortableBranchAuthUsbReplacementCoordinator.js";

// ============================================================
// ASSERT
// ============================================================

function assert(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (
    !condition
  ) {
    throw new Error(
      message,
    );
  }
}

// ============================================================
// SELF-TEST
// ============================================================

async function runSelfTest(): Promise<void> {
  const root =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-usb-replacement-",
      ),
    );

  const sourceRoot =
    join(
      root,
      "SOURCE_USB",
    );

  const targetRoot =
    join(
      root,
      "TARGET_USB",
    );

  try {
    await mkdir(
      sourceRoot,
      {
        recursive:
          true,
      },
    );

    await mkdir(
      targetRoot,
      {
        recursive:
          true,
      },
    );

    const commonInput = {
      password:
        "PortablePassword-5.6M",

      securityCode:
        "PortableSecurityCode-5.6M",

      expectedScope: {
        ownerId:
          "owner-5-6m",

        businessId:
          "business-5-6m",

        branchId:
          "branch-5-6m",
      },
    };

    // ========================================================
    // SAME SOURCE/TARGET MUST FAIL BEFORE STORAGE ACCESS
    // ========================================================

    const sameRootResult =
      await replaceFinoraPortableBranchAuthUsb({
        ...commonInput,

        sourceUsbRoot:
          sourceRoot,

        targetUsbRoot:
          sourceRoot,
      });

    assert(
      !sameRootResult.success &&
      sameRootResult.errorCode ===
        "INVALID_REQUEST",
      "Same source/target USB root was not rejected.",
    );

    console.log(
      "PASS: same source and target USB root fails closed",
    );

    // ========================================================
    // MISSING SOURCE MUST FAIL WITHOUT TARGET CREATION
    // ========================================================

    const missingSourceResult =
      await replaceFinoraPortableBranchAuthUsb({
        ...commonInput,

        sourceUsbRoot:
          sourceRoot,

        targetUsbRoot:
          targetRoot,
      });

    assert(
      !missingSourceResult.success &&
      missingSourceResult.errorCode ===
        "SOURCE_NOT_FOUND",
      missingSourceResult.success
        ? "Missing source unexpectedly succeeded."
        : `Unexpected missing-source result: ${missingSourceResult.errorCode}: ${missingSourceResult.error}`,
    );

    const targetStore =
      new FinoraPortableBranchAuthStore({
        resolveLocalRoot:
          () =>
            null,

        resolveUsbRoot:
          async () =>
            targetRoot,
      });

    const targetAfterMissingSource =
      await targetStore.read(
        "USB",
      );

    assert(
      targetAfterMissingSource ===
        null,
      "Missing-source failure created target Portable Auth state.",
    );

    console.log(
      "PASS: missing source USB fails closed without target mutation",
    );

    // ========================================================
    // MALFORMED SOURCE MUST FAIL CLOSED
    // ========================================================

    const sourceAuthDirectory =
      join(
        sourceRoot,
        FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
        FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY,
      );

    await mkdir(
      sourceAuthDirectory,
      {
        recursive:
          true,
      },
    );

    const sourceAuthPath =
      join(
        sourceAuthDirectory,
        FINORA_PORTABLE_BRANCH_AUTH_FILE_NAME,
      );

    await writeFile(
      sourceAuthPath,
      "{ malformed portable auth",
      {
        encoding:
          "utf8",
      },
    );

    const malformedSourceResult =
      await replaceFinoraPortableBranchAuthUsb({
        ...commonInput,

        sourceUsbRoot:
          sourceRoot,

        targetUsbRoot:
          targetRoot,
      });

    assert(
      !malformedSourceResult.success &&
      malformedSourceResult.errorCode ===
        "SOURCE_STORAGE_FAILED",
      malformedSourceResult.success
        ? "Malformed source unexpectedly succeeded."
        : `Unexpected malformed-source result: ${malformedSourceResult.errorCode}: ${malformedSourceResult.error}`,
    );

    const targetAfterMalformedSource =
      await targetStore.read(
        "USB",
      );

    assert(
      targetAfterMalformedSource ===
        null,
      "Malformed-source failure created target Portable Auth state.",
    );

    console.log(
      "PASS: malformed source Portable Auth fails closed without target mutation",
    );

    // ========================================================
    // REAL CERTIFIED OLD USB -> EMPTY NEW USB
    // ========================================================

    await rm(
      sourceRoot,
      {
        recursive:
          true,

        force:
          true,
      },
    );

    await rm(
      targetRoot,
      {
        recursive:
          true,

        force:
          true,
      },
    );

    await mkdir(
      sourceRoot,
      {
        recursive:
          true,
      },
    );

    await mkdir(
      targetRoot,
      {
        recursive:
          true,
      },
    );

    const createUsbStore =
      (
        usbRoot:
          string,
      ) =>
        new FinoraPortableBranchAuthStore({
          resolveLocalRoot:
            () =>
              null,

          resolveUsbRoot:
            async () =>
              usbRoot,
        });

    const sourceStore =
      createUsbStore(
        sourceRoot,
      );

    const certifiedSourceAuthorizationId =
      "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001";

    const certifiedScope = {
      ownerId:
        "OWNER-USB-REPLACEMENT-000001",

      businessId:
        "BUSINESS-USB-REPLACEMENT-000001",

      branchId:
        "BRANCH-USB-REPLACEMENT-000001",
    };

    const certifiedPassword =
      "PortablePassword-5.6M";

    const certifiedSecurityCode =
      "PortableSecurityCode-5.6M";

    const branchCertificationKeyMaterial =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          "2026-09-17T12:00:00.000Z",
        ),
      );

    const certifiedMaterial =
      await createFinoraPortableBranchAuthEnrollmentMaterialV1({
        authStateId:
          "PORTABLE-USB-REPLACEMENT-STATE-000001",

        sourceAuthorizationId:
          certifiedSourceAuthorizationId,

        sourceAuthorizationVerificationEvidence:
          createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
            certifiedSourceAuthorizationId,
          ),

        branchCertificationKeyMaterial,

        ownerId:
          certifiedScope.ownerId,

        businessId:
          certifiedScope.businessId,

        branchId:
          certifiedScope.branchId,

        userId:
          "USER-USB-REPLACEMENT-000001",

        username:
          "Admin",

        fullName:
          "FINORA USB Replacement Owner",

        role:
          "ADMIN",

        dataContext:
          "REAL",

        storageMode:
          "USB",

        authGeneration:
          1,

        createdAt:
          "2026-09-17T12:01:00.000Z",

        updatedAt:
          "2026-09-17T12:01:00.000Z",

        password:
          certifiedPassword,

        securityCode:
          certifiedSecurityCode,
      });

    const sourceSeedResult =
      await sourceStore.ensureExact(
        "USB",
        certifiedMaterial.envelope,
      );

    assert(
      sourceSeedResult ===
        "WRITTEN",
      "Certified source Portable Auth fixture was not written.",
    );

    const sourceBeforeReplacement =
      await sourceStore.read(
        "USB",
      );

    assert(
      sourceBeforeReplacement !==
        null,
      "Certified source Portable Auth fixture disappeared before replacement.",
    );

    const sourceBeforeSerialized =
      JSON.stringify(
        sourceBeforeReplacement,
      );

    const firstReplacement =
      await replaceFinoraPortableBranchAuthUsb({
        sourceUsbRoot:
          sourceRoot,

        targetUsbRoot:
          targetRoot,

        password:
          certifiedPassword,

        securityCode:
          certifiedSecurityCode,

        expectedScope:
          certifiedScope,
      });

    assert(
      firstReplacement.success &&
      firstReplacement.data.result ===
        "WRITTEN",
      firstReplacement.success
        ? `Expected WRITTEN but received ${firstReplacement.data.result}.`
        : `Certified replacement failed: ${firstReplacement.errorCode}: ${firstReplacement.error}`,
    );

    assert(
      firstReplacement.data.ownerId ===
        certifiedScope.ownerId &&
      firstReplacement.data.businessId ===
        certifiedScope.businessId &&
      firstReplacement.data.branchId ===
        certifiedScope.branchId &&
      firstReplacement.data.authGeneration ===
        1 &&
      firstReplacement.data.certificationKeyId ===
        branchCertificationKeyMaterial.keyId,
      "USB replacement success metadata changed branch identity or certification authority.",
    );

    const replacementTargetStore =
      createUsbStore(
        targetRoot,
      );

    const targetAfterReplacement =
      await replacementTargetStore.read(
        "USB",
      );

    assert(
      targetAfterReplacement !==
        null,
      "NEW USB Portable Auth state was not written.",
    );

    assert(
      JSON.stringify(
        targetAfterReplacement,
      ) ===
        sourceBeforeSerialized,
      "NEW USB does not contain the exact OLD USB Portable Auth envelope.",
    );

    console.log(
      "PASS: genuine certified OLD USB writes exact Portable Auth to empty NEW USB",
    );

    const targetPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV1(
        targetAfterReplacement,
        certifiedPassword,
        certifiedSecurityCode,
        {
          expectedScope:
            certifiedScope,
        },
      );

    const targetCertification =
      targetPayload.branchCertificationKeyMaterial;

    assert(
      targetCertification !==
        undefined,
      "NEW USB lost Branch Certification private authority.",
    );

    assert(
      targetCertification.keyId ===
        branchCertificationKeyMaterial.keyId &&
      targetCertification.publicKey ===
        branchCertificationKeyMaterial.publicKey &&
      targetCertification.privateKey ===
        branchCertificationKeyMaterial.privateKey &&
      targetCertification.publicKeyFingerprint ===
        branchCertificationKeyMaterial.publicKeyFingerprint,
      "NEW USB changed Branch Certification key material.",
    );

    console.log(
      "PASS: replacement preserves exact Branch Certification private authority",
    );

    const sourceAfterReplacement =
      await sourceStore.read(
        "USB",
      );

    assert(
      sourceAfterReplacement !==
        null &&
      JSON.stringify(
        sourceAfterReplacement,
      ) ===
        sourceBeforeSerialized,
      "OLD USB changed after successful replacement.",
    );

    console.log(
      "PASS: successful replacement leaves OLD USB exact artifact unchanged",
    );

    // ========================================================
    // IDEMPOTENT RETRY
    // ========================================================

    const retryReplacement =
      await replaceFinoraPortableBranchAuthUsb({
        sourceUsbRoot:
          sourceRoot,

        targetUsbRoot:
          targetRoot,

        password:
          certifiedPassword,

        securityCode:
          certifiedSecurityCode,

        expectedScope:
          certifiedScope,
      });

    assert(
      retryReplacement.success &&
      retryReplacement.data.result ===
        "ALREADY_MATCHED",
      retryReplacement.success
        ? `Expected ALREADY_MATCHED but received ${retryReplacement.data.result}.`
        : `Idempotent retry failed: ${retryReplacement.errorCode}: ${retryReplacement.error}`,
    );

    const targetAfterRetry =
      await replacementTargetStore.read(
        "USB",
      );

    assert(
      targetAfterRetry !==
        null &&
      JSON.stringify(
        targetAfterRetry,
      ) ===
        sourceBeforeSerialized,
      "Idempotent retry changed NEW USB Portable Auth state.",
    );

    console.log(
      "PASS: second replacement is idempotent ALREADY_MATCHED",
    );

    // ========================================================
    // WRONG PASSWORD MUST NOT TOUCH TARGET
    // ========================================================

    const wrongPasswordTargetRoot =
      join(
        root,
        "WRONG_PASSWORD_TARGET",
      );

    await mkdir(
      wrongPasswordTargetRoot,
      {
        recursive:
          true,
      },
    );

    const wrongPasswordResult =
      await replaceFinoraPortableBranchAuthUsb({
        sourceUsbRoot:
          sourceRoot,

        targetUsbRoot:
          wrongPasswordTargetRoot,

        password:
          "WrongPortablePassword-5.6M",

        securityCode:
          certifiedSecurityCode,

        expectedScope:
          certifiedScope,
      });

    assert(
      !wrongPasswordResult.success &&
      wrongPasswordResult.errorCode ===
        "AUTHENTICATION_FAILED",
      "Wrong Password did not fail with AUTHENTICATION_FAILED.",
    );

    const wrongPasswordTargetStore =
      createUsbStore(
        wrongPasswordTargetRoot,
      );

    assert(
      await wrongPasswordTargetStore.read(
        "USB",
      ) ===
        null,
      "Wrong Password mutated NEW USB.",
    );

    console.log(
      "PASS: wrong Password fails before NEW USB mutation",
    );

    // ========================================================
    // WRONG SECURITY CODE MUST NOT TOUCH TARGET
    // ========================================================

    const wrongSecurityTargetRoot =
      join(
        root,
        "WRONG_SECURITY_TARGET",
      );

    await mkdir(
      wrongSecurityTargetRoot,
      {
        recursive:
          true,
      },
    );

    const wrongSecurityResult =
      await replaceFinoraPortableBranchAuthUsb({
        sourceUsbRoot:
          sourceRoot,

        targetUsbRoot:
          wrongSecurityTargetRoot,

        password:
          certifiedPassword,

        securityCode:
          "WrongSecurityCode-5.6M",

        expectedScope:
          certifiedScope,
      });

    assert(
      !wrongSecurityResult.success &&
      wrongSecurityResult.errorCode ===
        "AUTHENTICATION_FAILED",
      "Wrong Security Code did not fail with AUTHENTICATION_FAILED.",
    );

    const wrongSecurityTargetStore =
      createUsbStore(
        wrongSecurityTargetRoot,
      );

    assert(
      await wrongSecurityTargetStore.read(
        "USB",
      ) ===
        null,
      "Wrong Security Code mutated NEW USB.",
    );

    console.log(
      "PASS: wrong Security Code fails before NEW USB mutation",
    );

    // ========================================================
    // WRONG BRANCH SCOPE MUST NOT TOUCH TARGET
    // ========================================================

    const wrongScopeTargetRoot =
      join(
        root,
        "WRONG_SCOPE_TARGET",
      );

    await mkdir(
      wrongScopeTargetRoot,
      {
        recursive:
          true,
      },
    );

    const wrongScopeResult =
      await replaceFinoraPortableBranchAuthUsb({
        sourceUsbRoot:
          sourceRoot,

        targetUsbRoot:
          wrongScopeTargetRoot,

        password:
          certifiedPassword,

        securityCode:
          certifiedSecurityCode,

        expectedScope: {
          ...certifiedScope,

          branchId:
            "BRANCH-USB-REPLACEMENT-WRONG-000001",
        },
      });

    assert(
      !wrongScopeResult.success &&
      wrongScopeResult.errorCode ===
        "AUTHENTICATION_FAILED",
      "Wrong branch scope did not fail with AUTHENTICATION_FAILED.",
    );

    const wrongScopeTargetStore =
      createUsbStore(
        wrongScopeTargetRoot,
      );

    assert(
      await wrongScopeTargetStore.read(
        "USB",
      ) ===
        null,
      "Wrong branch scope mutated NEW USB.",
    );

    console.log(
      "PASS: wrong branch scope fails before NEW USB mutation",
    );

    // ========================================================
    // CONFLICTING EXISTING TARGET MUST FAIL CLOSED
    // ========================================================

    const conflictTargetRoot =
      join(
        root,
        "CONFLICT_TARGET",
      );

    await mkdir(
      conflictTargetRoot,
      {
        recursive:
          true,
      },
    );

    const conflictingMaterial =
      await createFinoraPortableBranchAuthEnrollmentMaterialV1({
        authStateId:
          "PORTABLE-USB-REPLACEMENT-CONFLICT-000001",

        sourceAuthorizationId:
          certifiedSourceAuthorizationId,

        sourceAuthorizationVerificationEvidence:
          createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
            certifiedSourceAuthorizationId,
          ),

        branchCertificationKeyMaterial,

        ownerId:
          certifiedScope.ownerId,

        businessId:
          certifiedScope.businessId,

        branchId:
          certifiedScope.branchId,

        userId:
          "USER-USB-REPLACEMENT-000001",

        username:
          "Admin",

        fullName:
          "FINORA USB Replacement Owner",

        role:
          "ADMIN",

        dataContext:
          "REAL",

        storageMode:
          "USB",

        authGeneration:
          1,

        createdAt:
          "2026-09-17T12:01:00.000Z",

        updatedAt:
          "2026-09-17T12:02:00.000Z",

        password:
          certifiedPassword,

        securityCode:
          certifiedSecurityCode,
      });

    const conflictTargetStore =
      createUsbStore(
        conflictTargetRoot,
      );

    const conflictSeed =
      await conflictTargetStore.ensureExact(
        "USB",
        conflictingMaterial.envelope,
      );

    assert(
      conflictSeed ===
        "WRITTEN",
      "Conflicting NEW USB fixture was not written.",
    );

    const conflictBefore =
      await conflictTargetStore.read(
        "USB",
      );

    assert(
      conflictBefore !==
        null,
      "Conflicting NEW USB fixture disappeared.",
    );

    const conflictBeforeSerialized =
      JSON.stringify(
        conflictBefore,
      );

    const conflictReplacementResult =
      await replaceFinoraPortableBranchAuthUsb({
        sourceUsbRoot:
          sourceRoot,

        targetUsbRoot:
          conflictTargetRoot,

        password:
          certifiedPassword,

        securityCode:
          certifiedSecurityCode,

        expectedScope:
          certifiedScope,
      });

    assert(
      !conflictReplacementResult.success &&
      conflictReplacementResult.errorCode ===
        "TARGET_STORAGE_FAILED",
      "Conflicting NEW USB did not fail closed with TARGET_STORAGE_FAILED.",
    );

    const conflictAfter =
      await conflictTargetStore.read(
        "USB",
      );

    assert(
      conflictAfter !==
        null &&
      JSON.stringify(
        conflictAfter,
      ) ===
        conflictBeforeSerialized,
      "Conflicting NEW USB artifact was overwritten or changed.",
    );

    console.log(
      "PASS: conflicting NEW USB fails closed and preserves existing artifact",
    );

    const finalSource =
      await sourceStore.read(
        "USB",
      );

    assert(
      finalSource !==
        null &&
      JSON.stringify(
        finalSource,
      ) ===
        sourceBeforeSerialized,
      "Negative replacement matrix changed OLD USB.",
    );

    console.log(
      "PASS: complete replacement matrix leaves OLD USB immutable",
    );

    // ========================================================
    // BOUNDARY SUMMARY
    // ========================================================

    console.log(
      "PASS: 5.6M-1A USB replacement coordinator boundary executable proof",
    );
  }
  finally {
    await rm(
      root,
      {
        recursive:
          true,

        force:
          true,
      },
    );

    console.log(
      "PASS: isolated USB replacement self-test root deleted",
    );
  }
}

runSelfTest()
  .then(
    () => {
      process.exitCode =
        0;
    },
  )
  .catch(
    (
      error,
    ) => {
      console.error(
        "SELF-TEST FAILED:",
        error,
      );

      process.exitCode =
        1;
    },
  );