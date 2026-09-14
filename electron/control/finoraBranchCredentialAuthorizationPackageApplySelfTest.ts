/* ===========================================================
   FINORA ENTERPRISE OS

   SIGNED BRANCH CREDENTIAL AUTHORIZATION RECIPIENT SELF TEST

   PROVES:

   - Existing ACTIVE Branch Access is authoritative
   - AUTHORIZE_CREDENTIAL carries no Access Grant snapshot
   - Recovery persists only pending credential authorization
   - Existing Branch Access Grant remains field-identical
   - Credential is not created until recipient Set Password
   - Replay fails closed
   - Wrong storage fails closed
   - Wrong credential scope fails closed
   - REPLACE cannot carry credential authorization
   - SUSPENDED / REVOKED access cannot authorize credentials
   - Failed packages do not consume sequence state
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
  signFinoraBranchAccessPackage,
} from "../control-center/finoraBranchAccessIssuer.js";

import {
  signFinoraControlCenterPackage,
} from "../control-center/finoraControlCenterSigner.js";

import {
  FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
} from "./finoraBranchAccessPackage.types.js";

import type {
  FinoraBranchAccessGrantPayload,
  FinoraBranchAccessPackageTarget,
  FinoraBranchCredentialEnrollmentAuthorization,
} from "./finoraBranchAccessPackage.types.js";

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
  applyFinoraSignedBranchAccessPackage,
} from "./finoraBranchAccessPackageApplyService.js";


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
): void {

  assert(
    !result.success,
    `${label}: expected failure.`,
  );

  console.log(
    `PASS: ${label}`,
  );
}


function addDays(
  timestamp:
    string,

  days:
    number,
): string {

  return new Date(
    Date.parse(
      timestamp,
    ) +
      days *
        24 *
        60 *
        60 *
        1000,
  ).toISOString();
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
          "finora-credential-authorization-recipient-",
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


    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0 &&
      nativeBinding.bindingKeyId.length >
        0 &&
      nativeBinding.publicKeyFingerprint.length >
        0,
      "Native installation binding is incomplete.",
    );

    console.log(
      "PASS: isolated native installation binding created",
    );


    const now =
      new Date();

    const issueIssuedAt =
      now.toISOString();

    const createdAt =
      new Date(
        now.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const ownerId =
      "OWNER-CREDENTIAL-AUTH-RECIPIENT-SELFTEST";

    const businessId =
      "BUSINESS-CREDENTIAL-AUTH-RECIPIENT-SELFTEST";

    const branchId =
      "BRANCH-CREDENTIAL-AUTH-RECIPIENT-SELFTEST";

    const userId =
      "USER-CREDENTIAL-AUTH-RECIPIENT-SELFTEST";

    const grantId =
      "GRANT-CREDENTIAL-AUTH-RECIPIENT-SELFTEST";

    const installation:
      FinoraControlInstallationIdentity = {

        installationId:
          nativeBinding.installationId,

        ownerId,

        businessId,

        branchId,

        businessCode:
          "CAR01",

        branchCode:
          "C01",

        createdAt,

        updatedAt:
          createdAt,

        schemaVersion:
          1,
      };

    const installationResult =
      await saveFinoraInstallationIdentity(
        installation,
      );

    expectSuccess(
      "isolated installation identity persisted",
      installationResult,
    );


    const publicIdentity =
      await getFinoraControlCenterPublicIdentity();

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
      "PASS: Control Center public identity trusted by isolated recipient",
    );


    const target:
      FinoraBranchAccessPackageTarget = {

        ownerId,

        businessId,

        branchId,

        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,
      };


    const validFrom =
      createdAt;

    const validUntil =
      addDays(
        validFrom,
        365,
      );

    const accessGrant:
      FinoraBranchAccessGrantPayload = {

        grantId,

        userId,

        ownerId,

        businessId,

        branchId,

        storageMode:
          "LOCAL",

        accessType:
          "REGISTERED",

        administrativeStatus:
          "ACTIVE",

        validity: {
          validFrom,
          validUntil,
        },

        registrationPayment: {
          amount:
            2000,

          currency:
            "INR",

          paymentMode:
            "CASH",

          paidAt:
            validFrom,

          remarks:
            "Credential recovery recipient self-test.",

          refundable:
            false,
        },

        registrationCycle:
          1,

        createdAt,

        updatedAt:
          issueIssuedAt,

        schemaVersion:
          1,
      };


    // ========================================================
    // 1. SEED EXISTING ACTIVE ACCESS WITHOUT CREDENTIAL AUTH
    // ========================================================

    const issuePackage =
      await signFinoraBranchAccessPackage({

        packageId:
          "PACKAGE-CREDENTIAL-AUTH-ACCESS-ISSUE",

        sequence:
          1,

        issuedAt:
          issueIssuedAt,

        target,

        payload: {
          action:
            "ISSUE",

          accessGrant,

          issuedAt:
            issueIssuedAt,

          schemaVersion:
            1,
        },
      });

    const issueResult =
      await applyFinoraSignedBranchAccessPackage(
        issuePackage,
        trustedKeys,
        new Date(
          issueIssuedAt,
        ),
      );

    expectSuccess(
      "existing ACTIVE Branch Access seeded through signed ISSUE",
      issueResult,
    );

    const beforeRecovery =
      await readFinoraControlStore();

    assert(
      beforeRecovery.success &&
        beforeRecovery.data,
      beforeRecovery.error ??
        "Unable to read pre-recovery Control Store.",
    );

    const grantBeforeRecovery =
      beforeRecovery.data.branchAccessGrants
        ?.find(
          (item) =>
            item.userId ===
              userId &&
            item.ownerId ===
              ownerId &&
            item.businessId ===
              businessId &&
            item.branchId ===
              branchId,
        );

    assert(
      grantBeforeRecovery,
      "Seeded Branch Access grant is missing.",
    );

    const grantJsonBeforeRecovery =
      JSON.stringify(
        grantBeforeRecovery,
      );

    const authorizationCountBefore =
      beforeRecovery.data
        .branchCredentialEnrollmentAuthorizations
        ?.length ??
      0;

    const credentialCountBefore =
      beforeRecovery.data
        .branchCredentials
        ?.length ??
      0;

    assert(
      authorizationCountBefore ===
        0,
      "Recovery fixture unexpectedly already has credential authorization.",
    );

    assert(
      credentialCountBefore ===
        0,
      "Recovery fixture unexpectedly already has Branch Credential.",
    );

    console.log(
      "PASS: recovery fixture begins with ACTIVE access and zero credential authority",
    );


    // ========================================================
    // 2. VALID AUTHORIZE_CREDENTIAL
    // ========================================================

    const recoveryIssuedAt =
      new Date(
        now.getTime() +
          1000,
      ).toISOString();

    const credentialAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {

        authorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-RECOVERY-SUCCESS",

        userId,

        username:
          "admin",

        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        ownerId,

        businessId,

        branchId,

        storageMode:
          "LOCAL",

        dataContext:
          "REAL",

        method:
          FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,

        oneTime:
          true,

        schemaVersion:
          1,
      };

    const recoveryPackage =
      await signFinoraBranchAccessPackage({

        packageId:
          "PACKAGE-CREDENTIAL-AUTH-RECOVERY-SUCCESS",

        sequence:
          2,

        issuedAt:
          recoveryIssuedAt,

        target,

        payload: {
          action:
            "AUTHORIZE_CREDENTIAL",

          credentialEnrollment:
            credentialAuthorization,

          issuedAt:
            recoveryIssuedAt,

          schemaVersion:
            1,
        },
      });

    const recoveryPayload =
      recoveryPackage.payload as
        Record<string, unknown>;

    assert(
      !Object.prototype.hasOwnProperty.call(
        recoveryPayload,
        "accessGrant",
      ),
      "Signed AUTHORIZE_CREDENTIAL unexpectedly contains Access Grant snapshot.",
    );

    console.log(
      "PASS: signed AUTHORIZE_CREDENTIAL contains no Access Grant snapshot",
    );

    const recoveryResult =
      await applyFinoraSignedBranchAccessPackage(
        recoveryPackage,
        trustedKeys,
        new Date(
          recoveryIssuedAt,
        ),
      );

    expectSuccess(
      "signed AUTHORIZE_CREDENTIAL applied against existing ACTIVE access",
      recoveryResult,
    );

    const afterRecovery =
      await readFinoraControlStore();

    assert(
      afterRecovery.success &&
        afterRecovery.data,
      afterRecovery.error ??
        "Unable to read post-recovery Control Store.",
    );

    const grantAfterRecovery =
      afterRecovery.data.branchAccessGrants
        ?.find(
          (item) =>
            item.userId ===
              userId &&
            item.ownerId ===
              ownerId &&
            item.businessId ===
              businessId &&
            item.branchId ===
              branchId,
        );

    assert(
      grantAfterRecovery,
      "Branch Access grant disappeared during credential authorization.",
    );

    assert(
      JSON.stringify(
        grantAfterRecovery,
      ) ===
        grantJsonBeforeRecovery,
      "AUTHORIZE_CREDENTIAL mutated existing Branch Access grant.",
    );

    console.log(
      "PASS: AUTHORIZE_CREDENTIAL left existing Branch Access grant field-identical",
    );

    const persistedAuthorization =
      afterRecovery.data
        .branchCredentialEnrollmentAuthorizations
        ?.find(
          (item) =>
            item.authorizationId ===
              credentialAuthorization.authorizationId,
        );

    assert(
      persistedAuthorization?.username ===
        "admin" &&
      persistedAuthorization.userId ===
        userId &&
      persistedAuthorization.storageMode ===
        "LOCAL" &&
      persistedAuthorization.dataContext ===
        "REAL" &&
      persistedAuthorization.oneTime ===
        true,
      "Credential recovery authorization was not persisted correctly.",
    );

    assert(
      (
        afterRecovery.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        authorizationCountBefore +
          1,
      "Credential recovery authorization was not added exactly once.",
    );

    assert(
      (
        afterRecovery.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        credentialCountBefore,
      "AUTHORIZE_CREDENTIAL created a Branch Credential before Set Password.",
    );

    console.log(
      "PASS: credential authorization persisted exactly once",
    );

    console.log(
      "PASS: AUTHORIZE_CREDENTIAL did not create credential before Set Password",
    );

    assert(
      afterRecovery.data.appliedControlPackages
        ?.some(
          (item) =>
            item.packageId ===
              "PACKAGE-CREDENTIAL-AUTH-RECOVERY-SUCCESS",
        ),
      "Successful AUTHORIZE_CREDENTIAL is missing from replay ledger.",
    );

    console.log(
      "PASS: successful AUTHORIZE_CREDENTIAL persisted in replay ledger",
    );


    // ========================================================
    // 3. REPLAY MUST FAIL WITH ZERO MUTATION
    // ========================================================

    const replayBaseline =
      JSON.stringify(
        afterRecovery.data,
      );

    const replayResult =
      await applyFinoraSignedBranchAccessPackage(
        recoveryPackage,
        trustedKeys,
        new Date(
          recoveryIssuedAt,
        ),
      );

    expectFailure(
      "same AUTHORIZE_CREDENTIAL replay rejected",
      replayResult,
    );

    const afterReplay =
      await readFinoraControlStore();

    assert(
      afterReplay.success &&
        afterReplay.data,
      afterReplay.error ??
        "Unable to read post-replay Control Store.",
    );

    assert(
      JSON.stringify(
        afterReplay.data,
      ) ===
        replayBaseline,
      "Rejected AUTHORIZE_CREDENTIAL replay mutated Control Store.",
    );

    console.log(
      "PASS: rejected replay left Control Store unchanged",
    );


    // ========================================================
    // 4. WRONG STORAGE MUST FAIL
    // ========================================================

    const negativeIssuedAt =
      new Date(
        now.getTime() +
          2000,
      ).toISOString();

    const wrongStorageAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {
        ...credentialAuthorization,

        authorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-RECOVERY-WRONG-STORAGE",

        storageMode:
          "USB",
      };

    const wrongStoragePackage =
      await signFinoraBranchAccessPackage({

        packageId:
          "PACKAGE-CREDENTIAL-AUTH-WRONG-STORAGE",

        sequence:
          3,

        issuedAt:
          negativeIssuedAt,

        target,

        payload: {
          action:
            "AUTHORIZE_CREDENTIAL",

          credentialEnrollment:
            wrongStorageAuthorization,

          issuedAt:
            negativeIssuedAt,

          schemaVersion:
            1,
        },
      });

    const negativeBaseline =
      await readFinoraControlStore();

    assert(
      negativeBaseline.success &&
        negativeBaseline.data,
      negativeBaseline.error ??
        "Unable to read recovery negative baseline.",
    );

    const negativeBaselineJson =
      JSON.stringify(
        negativeBaseline.data,
      );

    const wrongStorageResult =
      await applyFinoraSignedBranchAccessPackage(
        wrongStoragePackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "AUTHORIZE_CREDENTIAL wrong storage rejected",
      wrongStorageResult,
    );


    // ========================================================
    // 5. WRONG CREDENTIAL SCOPE MUST FAIL
    // ========================================================

    const wrongScopeAuthorization = {
      ...credentialAuthorization,

      authorizationId:
        "FINORA-CREDENTIAL-ENROLLMENT-RECOVERY-WRONG-SCOPE",

      businessId:
        "BUSINESS-WRONG-SCOPE",
    };

    const wrongScopePackage =
      await signFinoraControlCenterPackage({

        packageId:
          "PACKAGE-CREDENTIAL-AUTH-WRONG-SCOPE",

        purpose:
          "BRANCH_ACCESS",

        target,

        issuedAt:
          negativeIssuedAt,

        sequence:
          3,

        payloadVersion:
          1,

        payload: {
          action:
            "AUTHORIZE_CREDENTIAL",

          credentialEnrollment:
            wrongScopeAuthorization,

          issuedAt:
            negativeIssuedAt,

          schemaVersion:
            1,
        },

        schemaVersion:
          1,
      });

    const wrongScopeResult =
      await applyFinoraSignedBranchAccessPackage(
        wrongScopePackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "AUTHORIZE_CREDENTIAL wrong credential scope rejected",
      wrongScopeResult,
    );


    // ========================================================
    // 6. ORDINARY REPLACE CANNOT CARRY CREDENTIAL AUTHORITY
    // ========================================================

    const replaceCredentialPackage =
      await signFinoraControlCenterPackage({

        packageId:
          "PACKAGE-CREDENTIAL-AUTH-ILLEGAL-REPLACE",

        purpose:
          "BRANCH_ACCESS",

        target,

        issuedAt:
          negativeIssuedAt,

        sequence:
          3,

        payloadVersion:
          1,

        payload: {
          action:
            "REPLACE",

          accessGrant,

          credentialEnrollment: {
            ...credentialAuthorization,

            authorizationId:
              "FINORA-CREDENTIAL-ENROLLMENT-ILLEGAL-REPLACE",
          },

          issuedAt:
            negativeIssuedAt,

          schemaVersion:
            1,
        },

        schemaVersion:
          1,
      });

    const replaceCredentialResult =
      await applyFinoraSignedBranchAccessPackage(
        replaceCredentialPackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "ordinary REPLACE credential authorization rejected",
      replaceCredentialResult,
    );

    const afterNegativeMatrix =
      await readFinoraControlStore();

    assert(
      afterNegativeMatrix.success &&
        afterNegativeMatrix.data,
      afterNegativeMatrix.error ??
        "Unable to read post-negative recovery state.",
    );

    assert(
      JSON.stringify(
        afterNegativeMatrix.data,
      ) ===
        negativeBaselineJson,
      "Wrong storage/scope or illegal REPLACE mutated Control Store.",
    );

    console.log(
      "PASS: recovery negative matrix left entire Control Store unchanged",
    );


    // ========================================================
    // 7. SUSPEND ACCESS, THEN RECOVERY MUST FAIL
    //
    // Sequence 3 proves all failed sequence-3 packages above
    // did not advance authoritative sequence state.
    // ========================================================

    const suspendIssuedAt =
      new Date(
        now.getTime() +
          3000,
      ).toISOString();

    const suspendedGrant:
      FinoraBranchAccessGrantPayload = {
        ...accessGrant,

        administrativeStatus:
          "SUSPENDED",

        updatedAt:
          suspendIssuedAt,
      };

    const suspendPackage =
      await signFinoraBranchAccessPackage({

        packageId:
          "PACKAGE-CREDENTIAL-AUTH-SUSPEND",

        sequence:
          3,

        issuedAt:
          suspendIssuedAt,

        target,

        payload: {
          action:
            "SUSPEND",

          accessGrant:
            suspendedGrant,

          issuedAt:
            suspendIssuedAt,

          schemaVersion:
            1,
        },
      });

    const suspendResult =
      await applyFinoraSignedBranchAccessPackage(
        suspendPackage,
        trustedKeys,
        new Date(
          suspendIssuedAt,
        ),
      );

    expectSuccess(
      "signed SUSPEND applied after rejected sequence-3 recovery packages",
      suspendResult,
    );

    const suspendedRecoveryIssuedAt =
      new Date(
        now.getTime() +
          4000,
      ).toISOString();

    const suspendedRecoveryPackage =
      await signFinoraBranchAccessPackage({

        packageId:
          "PACKAGE-CREDENTIAL-AUTH-WHILE-SUSPENDED",

        sequence:
          4,

        issuedAt:
          suspendedRecoveryIssuedAt,

        target,

        payload: {
          action:
            "AUTHORIZE_CREDENTIAL",

          credentialEnrollment: {
            ...credentialAuthorization,

            authorizationId:
              "FINORA-CREDENTIAL-ENROLLMENT-WHILE-SUSPENDED",
          },

          issuedAt:
            suspendedRecoveryIssuedAt,

          schemaVersion:
            1,
        },
      });

    const suspendedRecoveryResult =
      await applyFinoraSignedBranchAccessPackage(
        suspendedRecoveryPackage,
        trustedKeys,
        new Date(
          suspendedRecoveryIssuedAt,
        ),
      );

    expectFailure(
      "AUTHORIZE_CREDENTIAL rejected while Branch Access suspended",
      suspendedRecoveryResult,
    );


    // ========================================================
    // 8. RESUME THEN REVOKE
    // ========================================================

    const resumeIssuedAt =
      new Date(
        now.getTime() +
          5000,
      ).toISOString();

    const resumedGrant:
      FinoraBranchAccessGrantPayload = {
        ...suspendedGrant,

        administrativeStatus:
          "ACTIVE",

        updatedAt:
          resumeIssuedAt,
      };

    const resumePackage =
      await signFinoraBranchAccessPackage({

        packageId:
          "PACKAGE-CREDENTIAL-AUTH-RESUME",

        sequence:
          4,

        issuedAt:
          resumeIssuedAt,

        target,

        payload: {
          action:
            "RESUME",

          accessGrant:
            resumedGrant,

          issuedAt:
            resumeIssuedAt,

          schemaVersion:
            1,
        },
      });

    const resumeResult =
      await applyFinoraSignedBranchAccessPackage(
        resumePackage,
        trustedKeys,
        new Date(
          resumeIssuedAt,
        ),
      );

    expectSuccess(
      "failed suspended recovery did not consume sequence 4",
      resumeResult,
    );

    const revokeIssuedAt =
      new Date(
        now.getTime() +
          6000,
      ).toISOString();

    const revokedGrant:
      FinoraBranchAccessGrantPayload = {
        ...resumedGrant,

        administrativeStatus:
          "REVOKED",

        updatedAt:
          revokeIssuedAt,
      };

    const revokePackage =
      await signFinoraBranchAccessPackage({

        packageId:
          "PACKAGE-CREDENTIAL-AUTH-REVOKE",

        sequence:
          5,

        issuedAt:
          revokeIssuedAt,

        target,

        payload: {
          action:
            "REVOKE",

          accessGrant:
            revokedGrant,

          issuedAt:
            revokeIssuedAt,

          schemaVersion:
            1,
        },
      });

    const revokeResult =
      await applyFinoraSignedBranchAccessPackage(
        revokePackage,
        trustedKeys,
        new Date(
          revokeIssuedAt,
        ),
      );

    expectSuccess(
      "signed REVOKE applied",
      revokeResult,
    );


    // ========================================================
    // 9. REVOKED ACCESS MUST NEVER AUTHORIZE CREDENTIAL
    // ========================================================

    const revokedRecoveryIssuedAt =
      new Date(
        now.getTime() +
          7000,
      ).toISOString();

    const revokedRecoveryPackage =
      await signFinoraBranchAccessPackage({

        packageId:
          "PACKAGE-CREDENTIAL-AUTH-WHILE-REVOKED",

        sequence:
          6,

        issuedAt:
          revokedRecoveryIssuedAt,

        target,

        payload: {
          action:
            "AUTHORIZE_CREDENTIAL",

          credentialEnrollment: {
            ...credentialAuthorization,

            authorizationId:
              "FINORA-CREDENTIAL-ENROLLMENT-WHILE-REVOKED",
          },

          issuedAt:
            revokedRecoveryIssuedAt,

          schemaVersion:
            1,
        },
      });

    const revokedBaseline =
      await readFinoraControlStore();

    assert(
      revokedBaseline.success &&
        revokedBaseline.data,
      revokedBaseline.error ??
        "Unable to read revoked-state baseline.",
    );

    const revokedBaselineJson =
      JSON.stringify(
        revokedBaseline.data,
      );

    const revokedRecoveryResult =
      await applyFinoraSignedBranchAccessPackage(
        revokedRecoveryPackage,
        trustedKeys,
        new Date(
          revokedRecoveryIssuedAt,
        ),
      );

    expectFailure(
      "AUTHORIZE_CREDENTIAL rejected while Branch Access revoked",
      revokedRecoveryResult,
    );

    const finalStore =
      await readFinoraControlStore();

    assert(
      finalStore.success &&
        finalStore.data,
      finalStore.error ??
        "Unable to read final recovery Control Store.",
    );

    assert(
      JSON.stringify(
        finalStore.data,
      ) ===
        revokedBaselineJson,
      "Rejected revoked recovery mutated Control Store.",
    );

    assert(
      (
        finalStore.data
          .branchCredentialEnrollmentAuthorizations
          ?.filter(
            (item) =>
              item.authorizationId ===
                credentialAuthorization.authorizationId,
          ).length ??
        0
      ) ===
        1,
      "Recovery authorization was duplicated or lost.",
    );

    assert(
      (
        finalStore.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        0,
      "Credential was created without Set Password.",
    );

    console.log(
      "PASS: rejected revoked recovery left Control Store unchanged",
    );

    console.log(
      "PASS: only the original recovery authorization remains pending",
    );

    console.log(
      "PASS: no Branch Credential exists before Set Password",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA AUTHORIZE_CREDENTIAL RECIPIENT E2E SELFTEST",
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
          "PASS: isolated credential-recovery userData deleted",
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
        "PASS: AUTHORIZE_CREDENTIAL recipient self-test process exiting with code 0",
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
        "FAIL: FINORA AUTHORIZE_CREDENTIAL RECIPIENT E2E SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );