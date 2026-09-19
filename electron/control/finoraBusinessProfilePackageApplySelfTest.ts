/* ===========================================================
   FINORA ENTERPRISE OS™

   SIGNED BUSINESS PROFILE PORTABILITY APPLY SELF TEST

   PROVES:

   - Current native installation remains authoritative locally
   - Historical signed installation target is immutable provenance
   - Native BUSINESS_PROFILE lane rejects historical-device target
   - Portable BUSINESS_PROFILE lane accepts same branch target
   - Payload installationBinding must exactly equal signed target
   - Global packageId replay fails closed
   - Portable branch sequence rollback fails closed
   - Wrong branch fails at branch-scope authority
   - Tampered signature fails closed
   - Rejected portable matrix is zero-mutation
=========================================================== */

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
  getFinoraControlCenterPublicIdentity,
} from "../control-center/finoraControlCenterKeyVault.js";

import {
  signFinoraBusinessProfilePackage,
} from "../control-center/finoraBusinessProfileIssuer.js";
import {
  issueFinoraBusinessProfilePackage,
} from "../control-center/finoraControlCenterIssuanceCoordinator.js";

import {
  signFinoraControlCenterPackage,
} from "../control-center/finoraControlCenterSigner.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import type {
  FinoraControlInstallationIdentity,
} from "./finoraControlStore.js";

import {
  readFinoraControlStore,
  saveFinoraInstallationIdentity,
} from "./finoraControlStore.js";

import {
  applyFinoraSignedBusinessProfilePackage,
  applyFinoraSignedPortableBusinessProfilePackage,
} from "./finoraBusinessProfilePackageApplyService.js";


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


function expectSuccess(
  label:
    string,

  result: {
    success:
      boolean;

    error?:
      string;
  },
): void {

  assert(
    result.success,
    result.error ??
      `${label}: expected success.`,
  );

  console.log(
    `PASS: ${label}`,
  );
}


function expectFailure(
  label:
    string,

  result: {
    success:
      boolean;

    error?:
      string;
  },

  expectedToken?:
    string,
): void {

  assert(
    !result.success,
    `${label}: expected failure.`,
  );

  if (expectedToken) {
    assert(
      result.error?.includes(
        expectedToken,
      ),
      `${label}: expected error token ${expectedToken}; received ${result.error ?? "<none>"}.`,
    );
  }

  console.log(
    `PASS: ${label}`,
  );
}


async function runSelfTest():
  Promise<void> {

  let temporaryUserData:
    string |
    undefined;

  let failure:
    unknown;

  try {

    assert(
      !app.isReady(),
      "Self-test must configure userData before Electron readiness.",
    );

    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-business-profile-portable-",
        ),
      );

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    console.log(
      "PASS: isolated Electron userData configured",
    );


    // ========================================================
    // CURRENT RECIPIENT DEVICE
    // ========================================================

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0,
      "Native installation binding was not created.",
    );

    console.log(
      "PASS: isolated current native installation binding created",
    );

    const now =
      new Date();

    const installationCreatedAt =
      new Date(
        now.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const ownerId =
      "OWNER-BUSINESS-PROFILE-PORTABLE-SELFTEST";

    const businessId =
      "BUSINESS-BUSINESS-PROFILE-PORTABLE-SELFTEST";

    const branchId =
      "BRANCH-BUSINESS-PROFILE-PORTABLE-SELFTEST";

    const businessCode =
      "BPR01";

    const branchCode =
      "BP01";

    const installation:
      FinoraControlInstallationIdentity = {

        installationId:
          nativeBinding.installationId,

        ownerId,

        businessId,

        branchId,

        businessCode,

        branchCode,

        createdAt:
          installationCreatedAt,

        updatedAt:
          installationCreatedAt,

        schemaVersion:
          1,
      };

    const installationResult =
      await saveFinoraInstallationIdentity(
        installation,
      );

    expectSuccess(
      "isolated current recipient installation identity persisted",
      installationResult,
    );


    // ========================================================
    // REAL CONTROL CENTER SIGNER -> TRUSTED RECIPIENT KEY
    // ========================================================

    const publicIdentity =
      await getFinoraControlCenterPublicIdentity();

    assert(
      publicIdentity.issuerId.length >
        0 &&
      publicIdentity.signingKeyId.length >
        0 &&
      publicIdentity.publicKeySpkiDerBase64.length >
        0,
      "Control Center public identity is incomplete.",
    );

    const trustedKeys:
      FinoraBranchTrustedControlPublicKey[] = [
        {
          issuerId:
            publicIdentity.issuerId,

          signingKeyId:
            publicIdentity.signingKeyId,

          algorithm:
            "ECDSA_P256_SHA256",

          format:
            "SPKI_DER_BASE64",

          publicKey:
            publicIdentity.publicKeySpkiDerBase64,

          status:
            "ACTIVE",

          validFrom:
            new Date(
              now.getTime() -
                24 *
                  60 *
                  60 *
                  1000,
            ).toISOString(),
        },
      ];

    console.log(
      "PASS: real Control Center signing identity trusted by isolated recipient",
    );


    // ========================================================
    // HISTORICAL SIGNED INSTALLATION PROVENANCE
    // ========================================================

    const historicalFingerprint =
      "ab".repeat(
        32,
      );

    const historicalTarget = {
      ownerId,

      businessId,

      branchId,

      installationId:
        "INSTALLATION-BUSINESS-PROFILE-HISTORICAL-000001",

      bindingKeyId:
        `FINORA-BINDING-${historicalFingerprint
          .slice(
            0,
            32,
          )
          .toUpperCase()}`,

      fingerprintAlgorithm:
        "SHA-256" as const,

      publicKeyFingerprint:
        historicalFingerprint,
    };

    assert(
      historicalTarget.installationId !==
        nativeBinding.installationId &&
      historicalTarget.bindingKeyId !==
        nativeBinding.bindingKeyId &&
      historicalTarget.publicKeyFingerprint !==
        nativeBinding.publicKeyFingerprint,
      "Historical BUSINESS_PROFILE target unexpectedly matches current device.",
    );

    const portableIssuedAt =
      new Date(
        now.getTime() +
          5 *
            60 *
            1000,
      ).toISOString();

    const profileCreatedAt =
      new Date(
        now.getTime() -
          30 *
            60 *
            1000,
      ).toISOString();

    const profileId =
      "PROFILE-BUSINESS-PROFILE-PORTABLE-SELFTEST";

    const portablePayload = {
      action:
        "ISSUE" as const,

      profile: {
        profileId,

        ownerId,

        businessId,

        branchId,

        businessCode,

        branchCode,

        businessName:
          "FINORA Portable Business Profile Self Test",

        branchName:
          "FINORA Portable Branch",

        createdAt:
          profileCreatedAt,

        updatedAt:
          portableIssuedAt,

        schemaVersion:
          1 as const,
      },

      installationBinding: {
        installationId:
          historicalTarget.installationId,

        bindingKeyId:
          historicalTarget.bindingKeyId,

        fingerprintAlgorithm:
          "SHA-256" as const,

        publicKeyFingerprint:
          historicalTarget.publicKeyFingerprint,

        schemaVersion:
          1 as const,
      },

      issuedAt:
        portableIssuedAt,

      schemaVersion:
        1 as const,
    };

    const coordinatorInitialPayload = {
      ...portablePayload,

      profile: {
        ...portablePayload.profile,

        /*
         * Keep nested profile time safely before the
         * coordinator-owned authoritative root issuedAt.
         */
        updatedAt:
          profileCreatedAt,
      },

      issuedAt:
        profileCreatedAt,
    };

    const portableHistoricalPackage =
      await issueFinoraBusinessProfilePackage({
        target:
          historicalTarget,

        payload:
          coordinatorInitialPayload,
      });

    const portableSequence =
      portableHistoricalPackage.sequence;

    assert(
      portableSequence ===
        1,
      "Initial coordinator BUSINESS_PROFILE ISSUE did not reserve native historical sequence 1.",
    );

    console.log(
      "PASS: real Control Center coordinator ISSUE seeded historical BUSINESS_PROFILE sequence 1",
    );

    console.log(
      "PASS: real Control Center signed historical-target BUSINESS_PROFILE package",
    );


    // ========================================================
    // PRE-STATE
    // ========================================================

    const before =
      await readFinoraControlStore();

    assert(
      before.success &&
        before.data,
      before.error ??
        "Unable to read pre-test Control Store.",
    );

    const beforeJson =
      JSON.stringify(
        before.data,
      );

    const nativeSequencesBefore =
      JSON.stringify(
        before.data.controlSequences ??
          [],
      );


    // ========================================================
    // NATIVE LANE MUST REJECT HISTORICAL TARGET
    // ========================================================

    const nativeHistoricalResult =
      await applyFinoraSignedBusinessProfilePackage(
        portableHistoricalPackage,
        trustedKeys,
        new Date(
          portableIssuedAt,
        ),
      );

    expectFailure(
      "historical-target BUSINESS_PROFILE rejected by native lane",
      nativeHistoricalResult,
      "TARGET_MISMATCH",
    );

    const afterNativeReject =
      await readFinoraControlStore();

    assert(
      afterNativeReject.success &&
        afterNativeReject.data,
      afterNativeReject.error ??
        "Unable to read Control Store after native rejection.",
    );

    assert(
      JSON.stringify(
        afterNativeReject.data,
      ) ===
        beforeJson,
      "Native historical-target rejection mutated Control Store.",
    );

    console.log(
      "PASS: native BUSINESS_PROFILE lane remains exact-current-device only",
    );


    // ========================================================
    // PORTABLE LANE ACCEPTS SAME HISTORICAL TARGET
    // ========================================================

    const portableApplyResult =
      await applyFinoraSignedPortableBusinessProfilePackage(
        portableHistoricalPackage,
        trustedKeys,
        new Date(
          portableIssuedAt,
        ),
      );

    expectSuccess(
      "historical-target BUSINESS_PROFILE accepted by portable lane",
      portableApplyResult,
    );

    const afterPortableApply =
      await readFinoraControlStore();

    assert(
      afterPortableApply.success &&
        afterPortableApply.data,
      afterPortableApply.error ??
        "Unable to read Control Store after portable BUSINESS_PROFILE apply.",
    );

    const persistedProfile =
      afterPortableApply.data.businessProfiles
        ?.find(
          (
            item,
          ) =>
            item.profileId ===
              profileId,
        );

    assert(
      persistedProfile !==
        undefined,
      "Portable BUSINESS_PROFILE was not persisted.",
    );

    assert(
      persistedProfile.installationId ===
        historicalTarget.installationId &&
      persistedProfile.bindingKeyId ===
        historicalTarget.bindingKeyId &&
      persistedProfile.fingerprintAlgorithm ===
        historicalTarget.fingerprintAlgorithm &&
      persistedProfile.publicKeyFingerprint ===
        historicalTarget.publicKeyFingerprint,
      "Portable BUSINESS_PROFILE did not preserve signed historical installation provenance.",
    );

    console.log(
      "PASS: signed historical BUSINESS_PROFILE installation provenance persisted exactly",
    );

    assert(
      afterPortableApply.data.installation
        ?.installationId ===
        nativeBinding.installationId,
      "Portable BUSINESS_PROFILE apply rebound current recipient installation identity.",
    );

    console.log(
      "PASS: current recipient installation identity remained unchanged",
    );

    const replayRecord =
      afterPortableApply.data.appliedControlPackages
        ?.find(
          (
            item,
          ) =>
            item.packageId ===
              portableHistoricalPackage.packageId,
        );

    assert(
      replayRecord?.installationId ===
        historicalTarget.installationId &&
      replayRecord.ownerId ===
        ownerId &&
      replayRecord.businessId ===
        businessId &&
      replayRecord.branchId ===
        branchId,
      "Portable BUSINESS_PROFILE replay evidence did not preserve signed historical target.",
    );

    console.log(
      "PASS: global replay evidence preserves historical installation target",
    );

    const portableSequenceRecord =
      afterPortableApply.data.portableBusinessProfileSequences
        ?.find(
          (
            item,
          ) =>
            item.issuerId ===
              publicIdentity.issuerId &&
            item.ownerId ===
              ownerId &&
            item.businessId ===
              businessId &&
            item.branchId ===
              branchId,
        );

    assert(
      portableSequenceRecord?.lastSequence ===
        portableSequence,
      "Portable BUSINESS_PROFILE branch sequence high-water was not advanced.",
    );

    console.log(
      "PASS: dedicated portable BUSINESS_PROFILE branch sequence advanced",
    );

    assert(
      JSON.stringify(
        afterPortableApply.data.controlSequences ??
          [],
      ) ===
        nativeSequencesBefore,
      "Portable BUSINESS_PROFILE apply mutated native installation-scoped controlSequences.",
    );

    console.log(
      "PASS: portable BUSINESS_PROFILE did not mutate native controlSequences",
    );


    // ========================================================
    // ========================================================
    // REAL CONTROL CENTER REPLACE -> PORTABLE RECIPIENT
    // ========================================================

    const coordinatorReplacementRequestedAt =
      new Date(
        now.getTime() -
          5 *
            60 *
            1000,
      ).toISOString();

    const coordinatorReplacementPayload = {
      ...portablePayload,

      action:
        "REPLACE" as const,

      profile: {
        ...portablePayload.profile,

        businessName:
          "FINORA Coordinator Portable Business Profile Updated",

        branchName:
          "FINORA Coordinator Portable Branch Updated",

        updatedAt:
          coordinatorReplacementRequestedAt,
      },

      issuedAt:
        coordinatorReplacementRequestedAt,
    };

    const coordinatorReplacementPackage =
      await issueFinoraBusinessProfilePackage({
        target:
          historicalTarget,

        payload:
          coordinatorReplacementPayload,
      });

    assert(
      coordinatorReplacementPackage.sequence ===
        portableSequence +
          1,
      "Coordinator BUSINESS_PROFILE REPLACE did not continue after native historical high-water.",
    );

    assert(
      coordinatorReplacementPackage.packageId.startsWith(
        "FINORA-PORTABLE-BUSINESS-PROFILE-",
      ),
      "Coordinator BUSINESS_PROFILE REPLACE did not use portable package-id authority.",
    );

    assert(
      coordinatorReplacementPackage.target.ownerId ===
        historicalTarget.ownerId &&
      coordinatorReplacementPackage.target.businessId ===
        historicalTarget.businessId &&
      coordinatorReplacementPackage.target.branchId ===
        historicalTarget.branchId &&
      coordinatorReplacementPackage.target.installationId ===
        historicalTarget.installationId &&
      coordinatorReplacementPackage.target.bindingKeyId ===
        historicalTarget.bindingKeyId &&
      coordinatorReplacementPackage.target.publicKeyFingerprint ===
        historicalTarget.publicKeyFingerprint,
      "Coordinator REPLACE rebound or altered signed historical target provenance.",
    );

    console.log(
      "PASS: real coordinator REPLACE used portable sequence authority and preserved historical target",
    );

    const coordinatorReplacementApplyResult =
      await applyFinoraSignedPortableBusinessProfilePackage(
        coordinatorReplacementPackage,
        trustedKeys,
        new Date(
          coordinatorReplacementPackage.issuedAt,
        ),
      );

    expectSuccess(
      "real coordinator REPLACE accepted by portable recipient lane",
      coordinatorReplacementApplyResult,
    );

    const afterCoordinatorApply =
      await readFinoraControlStore();

    assert(
      afterCoordinatorApply.success &&
        afterCoordinatorApply.data,
      afterCoordinatorApply.error ??
        "Unable to read Control Store after coordinator BUSINESS_PROFILE REPLACE.",
    );

    const coordinatorPersistedProfile =
      afterCoordinatorApply.data.businessProfiles
        ?.find(
          (
            item,
          ) =>
            item.profileId ===
              profileId,
        );

    assert(
      coordinatorPersistedProfile !==
        undefined,
      "Coordinator REPLACE profile was not persisted.",
    );

    assert(
      coordinatorPersistedProfile.businessName ===
        "FINORA Coordinator Portable Business Profile Updated" &&
      coordinatorPersistedProfile.branchName ===
        "FINORA Coordinator Portable Branch Updated",
      "Coordinator REPLACE mutable profile fields were not persisted.",
    );

    assert(
      coordinatorPersistedProfile.installationId ===
        historicalTarget.installationId &&
      coordinatorPersistedProfile.bindingKeyId ===
        historicalTarget.bindingKeyId &&
      coordinatorPersistedProfile.fingerprintAlgorithm ===
        historicalTarget.fingerprintAlgorithm &&
      coordinatorPersistedProfile.publicKeyFingerprint ===
        historicalTarget.publicKeyFingerprint,
      "Coordinator REPLACE did not preserve historical installation provenance.",
    );

    assert(
      afterCoordinatorApply.data.installation
        ?.installationId ===
        nativeBinding.installationId,
      "Coordinator REPLACE rebound current recipient installation identity.",
    );

    const coordinatorPortableSequence =
      afterCoordinatorApply.data.portableBusinessProfileSequences
        ?.find(
          (
            record,
          ) =>
            record.ownerId ===
              ownerId &&
            record.businessId ===
              businessId &&
            record.branchId ===
              branchId,
        );

    assert(
      coordinatorPortableSequence?.lastSequence ===
        coordinatorReplacementPackage.sequence,
      "Recipient portable BUSINESS_PROFILE sequence did not advance to coordinator REPLACE sequence.",
    );

    assert(
      JSON.stringify(
        afterCoordinatorApply.data.controlSequences ??
          [],
      ) ===
        nativeSequencesBefore,
      "Coordinator portable REPLACE mutated recipient native controlSequences.",
    );

    console.log(
      "PASS: coordinator-issued historical-target REPLACE applied without rebinding or native sequence mutation",
    );


    // NEGATIVE MATRIX BASELINE
    // ========================================================

    const portableNegativeBaselineJson =
      JSON.stringify(
        afterCoordinatorApply.data,
      );


    // ========================================================
    // GLOBAL PACKAGE-ID REPLAY
    // ========================================================

    const replayResult =
      await applyFinoraSignedPortableBusinessProfilePackage(
        portableHistoricalPackage,
        trustedKeys,
        new Date(
          portableIssuedAt,
        ),
      );

    expectFailure(
      "portable BUSINESS_PROFILE packageId replay rejected",
      replayResult,
      "PACKAGE_REPLAY",
    );


    // ========================================================
    // EQUAL PORTABLE SEQUENCE
    // ========================================================

    const staleIssuedAt =
      new Date(
        now.getTime() +
          6 *
            60 *
            1000,
      ).toISOString();

    const stalePayload = {
      ...portablePayload,

      action:
        "REPLACE" as const,

      profile: {
        ...portablePayload.profile,

        updatedAt:
          staleIssuedAt,
      },

      issuedAt:
        staleIssuedAt,
    };

    const stalePackage =
      await signFinoraBusinessProfilePackage({
        packageId:
          "PACKAGE-BUSINESS-PROFILE-PORTABLE-HISTORICAL-STALE",

        sequence:
          portableSequence + 1,

        issuedAt:
          staleIssuedAt,

        target:
          historicalTarget,

        payload:
          stalePayload,
      });

    const staleResult =
      await applyFinoraSignedPortableBusinessProfilePackage(
        stalePackage,
        trustedKeys,
        new Date(
          staleIssuedAt,
        ),
      );

    expectFailure(
      "equal portable BUSINESS_PROFILE sequence rejected",
      staleResult,
      "STALE_SEQUENCE",
    );


    // ========================================================
    // WRONG BRANCH
    // ========================================================

    const wrongBranchId =
      "BRANCH-BUSINESS-PROFILE-PORTABLE-WRONG";

    const wrongBranchIssuedAt =
      new Date(
        now.getTime() +
          7 *
            60 *
            1000,
      ).toISOString();

    const wrongBranchTarget = {
      ...historicalTarget,

      branchId:
        wrongBranchId,
    };

    const wrongBranchPayload = {
      ...portablePayload,

      action:
        "REPLACE" as const,

      profile: {
        ...portablePayload.profile,

        branchId:
          wrongBranchId,

        updatedAt:
          wrongBranchIssuedAt,
      },

      issuedAt:
        wrongBranchIssuedAt,
    };

    const wrongBranchPackage =
      await signFinoraBusinessProfilePackage({
        packageId:
          "PACKAGE-BUSINESS-PROFILE-PORTABLE-WRONG-BRANCH",

        sequence:
          portableSequence +
          1,

        issuedAt:
          wrongBranchIssuedAt,

        target:
          wrongBranchTarget,

        payload:
          wrongBranchPayload,
      });

    const wrongBranchResult =
      await applyFinoraSignedPortableBusinessProfilePackage(
        wrongBranchPackage,
        trustedKeys,
        new Date(
          wrongBranchIssuedAt,
        ),
      );

    expectFailure(
      "portable BUSINESS_PROFILE wrong branch rejected",
      wrongBranchResult,
      "TARGET_MISMATCH",
    );


    // ========================================================
    // VALID SIGNATURE, INVALID PAYLOAD ↔ HISTORICAL TARGET
    //
    // Generic signer is used intentionally here so the package
    // remains cryptographically valid while recipient-side
    // payload/target binding validation is exercised.
    // ========================================================

    const mismatchIssuedAt =
      new Date(
        now.getTime() +
          8 *
            60 *
            1000,
      ).toISOString();

    const mismatchedFingerprint =
      "cd".repeat(
        32,
      );

    const mismatchPayload = {
      ...portablePayload,

      action:
        "REPLACE" as const,

      profile: {
        ...portablePayload.profile,

        updatedAt:
          mismatchIssuedAt,
      },

      installationBinding: {
        installationId:
          "INSTALLATION-BUSINESS-PROFILE-MISMATCH-000001",

        bindingKeyId:
          `FINORA-BINDING-${mismatchedFingerprint
            .slice(
              0,
              32,
            )
            .toUpperCase()}`,

        fingerprintAlgorithm:
          "SHA-256" as const,

        publicKeyFingerprint:
          mismatchedFingerprint,

        schemaVersion:
          1 as const,
      },

      issuedAt:
        mismatchIssuedAt,
    };

    const signedBindingMismatchPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BUSINESS-PROFILE-PORTABLE-BINDING-MISMATCH",

        purpose:
          "BUSINESS_PROFILE",

        target:
          historicalTarget,

        issuedAt:
          mismatchIssuedAt,

        sequence:
          portableSequence +
          2,

        payloadVersion:
          1,

        payload:
          mismatchPayload,

        schemaVersion:
          1,
      });

    const bindingMismatchResult =
      await applyFinoraSignedPortableBusinessProfilePackage(
        signedBindingMismatchPackage,
        trustedKeys,
        new Date(
          mismatchIssuedAt,
        ),
      );

    expectFailure(
      "valid-signature BUSINESS_PROFILE payload historical-binding mismatch rejected",
      bindingMismatchResult,
      "signed installation binding does not match the verified package target",
    );


    // ========================================================
    // TAMPERED SIGNATURE
    // ========================================================

    const tamperedPackage = {
      ...stalePackage,

      packageId:
        "PACKAGE-BUSINESS-PROFILE-PORTABLE-TAMPERED",

      signature: {
        ...stalePackage.signature,

        value:
          Buffer.alloc(
            64,
          ).toString(
            "base64",
          ),
      },
    };

    const tamperedResult =
      await applyFinoraSignedPortableBusinessProfilePackage(
        tamperedPackage,
        trustedKeys,
        new Date(
          staleIssuedAt,
        ),
      );

    expectFailure(
      "tampered portable BUSINESS_PROFILE signature rejected",
      tamperedResult,
      "INVALID_SIGNATURE",
    );


    // ========================================================
    // EVERY REJECTED PORTABLE CASE MUST BE ZERO-MUTATION
    // ========================================================

    const portableNegativeFinal =
      await readFinoraControlStore();

    assert(
      portableNegativeFinal.success &&
        portableNegativeFinal.data,
      portableNegativeFinal.error ??
        "Unable to read final portable BUSINESS_PROFILE Control Store.",
    );

    assert(
      JSON.stringify(
        portableNegativeFinal.data,
      ) ===
        portableNegativeBaselineJson,
      "Rejected portable BUSINESS_PROFILE matrix mutated authoritative Control Store.",
    );

    console.log(
      "PASS: rejected portable BUSINESS_PROFILE matrix left entire Control Store unchanged",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA PORTABLE HISTORICAL-TARGET BUSINESS_PROFILE E2E SELFTEST",
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

    if (
      temporaryUserData !==
        undefined
    ) {

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
          "PASS: isolated temporary FINORA userData deleted",
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
  }

  if (failure) {
    throw failure;
  }
}


void runSelfTest()
  .then(
    () => {

      console.log(
        "PASS: BUSINESS_PROFILE portability self-test process exiting with code 0",
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
        "FAIL: FINORA PORTABLE BUSINESS_PROFILE E2E SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );

/* ============================================================
   END
============================================================ */