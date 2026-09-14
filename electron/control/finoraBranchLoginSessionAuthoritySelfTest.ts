/* ============================================================
   FINORA ENTERPRISE OS™

   BRANCH LOGIN SESSION AUTHORITY SELF TEST

   D4E4I7-K2B

   PROVES:

   1. Wrong Password -> INVALID_CREDENTIALS.
   2. Wrong Password never reaches Security Code challenge.
   3. Valid Password on unknown device -> SECURITY_CODE_REQUIRED.
   4. Wrong Security Code -> SECURITY_CODE_INVALID.
   5. Wrong Security Code creates no login session.
   6. Correct Security Code authorizes current device.
   7. Correct Security Code creates authoritative login session.
   8. Trusted-device retry needs Password only.
   9. Historical installation-bound entitlement is accepted
      logically only after current Device Trust succeeds.
  10. Non-ACTIVE logical entitlement is denied.
  11. Wrong selected storage mode fails closed.
  12. Runtime behavior proves Password -> Device Trust -> Session.

   ISOLATION:

   - Temporary Electron userData
   - Temporary encrypted Control Store
   - Temporary native Windows binding
   - Temporary Control Center signing authority
   - No production recipient state
   - No renderer authority
   - No Business Date
============================================================ */

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
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  readFinoraControlStore,
  saveFinoraBranchAccessGrant,
  saveFinoraBranchActivation,
  saveFinoraInstallationIdentity,
  saveFinoraStorageEntitlement,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchAccessGrant,
  FinoraControlBranchActivation,
  FinoraControlInstallationIdentity,
  FinoraControlStorageEntitlement,
} from "./finoraControlStore.js";

import {
  FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
} from "./finoraBranchAccessPackage.types.js";

import type {
  FinoraBranchCredentialEnrollmentAuthorization,
} from "./finoraBranchAccessPackage.types.js";

import {
  issueFinoraBranchCredentialEnrollmentBundle,
} from "../control-center/finoraBranchCredentialEnrollmentBundleIssuer.js";

import {
  applyFinoraBranchCredentialEnrollmentBundle,
} from "./finoraBranchCredentialEnrollmentBundleApplyService.js";

import {
  getFinoraControlCenterPublicIdentity,
} from "../control-center/finoraControlCenterKeyVault.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import {
  enrollFinoraBranchCredentialWithPortableStore,
} from "./finoraBranchCredentialEnrollmentService.js";

import {
  createFinoraBranchLoginSession,
  invalidateFinoraBranchLoginSession,
  validateFinoraBranchLoginSession,
} from "./finoraBranchLoginSessionAuthority.js";

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

function addDays(
  value:
    Date,

  days:
    number,
): string {

  return new Date(
    value.getTime() +
      days *
        24 *
        60 *
        60 *
        1000,
  ).toISOString();
}

async function main(): Promise<void> {

  let temporaryUserData:
    string | undefined;

  try {
    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-login-authority-selftest-",
        ),
      );

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    console.log(
      "PASS: isolated Login Authority userData created",
    );

    // ========================================================
    // FIXTURE IDENTITY
    // ========================================================

    const ownerId =
      "FINORA-OWNER-LOGIN-SELFTEST";

    const businessId =
      "FINORA-BUSINESS-LOGIN-SELFTEST";

    const branchId =
      "FINORA-BRANCH-LOGIN-SELFTEST";

    const userId =
      "FINORA-USER-LOGIN-SELFTEST";

    const username =
      "branch.admin";

    const password =
      "admin123";

    const securityCode =
      "FINORA-SECURITY-LOGIN-SELFTEST";

    const sourceAuthorizationId =
      "FINORA-CREDENTIAL-ENROLLMENT-LOGIN-SELFTEST-000001";

    const createdAt =
      new Date().toISOString();

    // ========================================================
    // NATIVE BINDING + INSTALLATION IDENTITY
    // ========================================================

    await ensureFinoraWindowsInstallationBinding();

    const nativeBinding =
      await getFinoraWindowsInstallationBinding();

    assert(
      nativeBinding !==
        null &&
      nativeBinding !==
        undefined,
      "Native installation binding was not created.",
    );

    console.log(
      "PASS: isolated current native binding created",
    );

    const installation:
      FinoraControlInstallationIdentity = {

        installationId:
          nativeBinding.installationId,

        ownerId,
        businessId,
        branchId,

        createdAt,
        updatedAt:
          createdAt,

        schemaVersion:
          1,
      };

    const installationSave =
      await saveFinoraInstallationIdentity(
        installation,
      );

    assert(
      installationSave.success,
      installationSave.success
        ? "Unexpected installation result."
        : (installationSave.error ?? "Installation save failed without error detail."),
    );

    // ========================================================
    // ACTIVE BRANCH ACCESS
    // ========================================================

    const validFrom =
      new Date(
        Date.now() -
          60 *
            1000,
      ).toISOString();

    const validUntil =
      addDays(
        new Date(
          validFrom,
        ),
        365,
      );

    const accessGrant:
      FinoraControlBranchAccessGrant = {

        grantId:
          "FINORA-BRANCH-ACCESS-GRANT-LOGIN-SELFTEST",

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
            "Login Authority runtime self-test.",

          refundable:
            false,
        },

        registrationCycle:
          1,

        createdAt:
          validFrom,

        updatedAt:
          validFrom,

        schemaVersion:
          1,
      };

    const grantSave =
      await saveFinoraBranchAccessGrant(
        accessGrant,
      );

    assert(
      grantSave.success,
      grantSave.success
        ? "Unexpected Branch Access result."
        : (grantSave.error ?? "Branch Access save failed without error detail."),
    );

    console.log(
      "PASS: active REGISTERED logical Branch Access fixture persisted",
    );

    // ========================================================
    // REAL TWO-CHILD CREDENTIAL ENROLLMENT AUTHORITY
    // ========================================================

    const sourceAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {

        authorizationId:
          sourceAuthorizationId,

        userId,

        username,

        fullName:
          "Branch Administrator",

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
              Date.now() -
                24 *
                  60 *
                  60 *
                  1000,
            ).toISOString(),
        },
      ];

    const credentialBundle =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target: {
          ownerId,
          businessId,
          branchId,

          installationId:
            nativeBinding.installationId,

          bindingKeyId:
            nativeBinding.bindingKeyId,

          fingerprintAlgorithm:
            nativeBinding.fingerprintAlgorithm,

          publicKeyFingerprint:
            nativeBinding.publicKeyFingerprint,
        },

        sourceAuthorization,
      });

    const bundleApply =
      await applyFinoraBranchCredentialEnrollmentBundle(
        credentialBundle,
        trustedKeys,
        new Date(),
      );

    assert(
      bundleApply.success,
      bundleApply.success
        ? "Unexpected Credential Enrollment Bundle result."
        : (bundleApply.error ?? "Credential Enrollment Bundle apply failed without error detail."),
    );

    console.log(
      "PASS: real signed Credential Enrollment Bundle applied with portability provenance",
    );

    // ========================================================
    // PASSWORD + SECURITY CODE ENROLLMENT / PORTABLE AUTH
    // ========================================================

    let localResolverCalls =
      0;

    let usbResolverCalls =
      0;

    const portableStore =
      new FinoraPortableBranchAuthStore({
        resolveLocalRoot:
          () => {
            localResolverCalls +=
              1;

            return temporaryUserData;
          },

        resolveUsbRoot:
          async () => {
            usbResolverCalls +=
              1;

            return null;
          },
      });

    const enrollment =
      await enrollFinoraBranchCredentialWithPortableStore(
        {
          username,
          password,
          securityCode,
        },
        portableStore,
      );

    assert(
      enrollment.success,
      enrollment.success
        ? "Unexpected credential enrollment result."
        : enrollment.error,
    );

    assert(
      enrollment.data.userId ===
        userId &&
      enrollment.data.storageMode ===
        "LOCAL" &&
      enrollment.data.dataContext ===
        "REAL",
      "Credential enrollment returned wrong principal.",
    );

    assert(
      localResolverCalls >
        0 &&
      usbResolverCalls ===
        0,
      "LOCAL credential enrollment consulted USB storage.",
    );

    console.log(
      "PASS: Password + Security Code enrollment produced LOCAL Portable Auth",
    );

    // ========================================================
    // ACTIVE BRANCH ACTIVATION
    // ========================================================

    const activation:
      FinoraControlBranchActivation = {

        activationId:
          "FINORA-BRANCH-ACTIVATION-LOGIN-SELFTEST",

        ownerId,
        businessId,
        branchId,

        status:
          "ACTIVE",

        activatedAt:
          createdAt,

        createdAt,

        updatedAt:
          createdAt,

        schemaVersion:
          1,
      };

    const activationSave =
      await saveFinoraBranchActivation(
        activation,
      );

    assert(
      activationSave.success,
      activationSave.success
        ? "Unexpected Branch Activation result."
        : (activationSave.error ?? "Branch Activation save failed without error detail."),
    );

    // ========================================================
    // HISTORICAL NATIVE-BOUND STORAGE ENTITLEMENT
    //
    // Deliberately does NOT match this current device binding.
    // Login may accept it only as logical entitlement AFTER
    // current Device Trust succeeds.
    // ========================================================

    const historicalInstallationId =
      "FINORA-INSTALLATION-HISTORICAL-LOGIN-SELFTEST";

    const historicalBindingKeyId =
      "FINORA-BINDING-11111111111111111111111111111111";

    const historicalFingerprint =
      "1".repeat(
        64,
      );

    assert(
      historicalInstallationId !==
        nativeBinding.installationId &&
      historicalBindingKeyId !==
        nativeBinding.bindingKeyId &&
      historicalFingerprint !==
        nativeBinding.publicKeyFingerprint,
      "Historical entitlement binding unexpectedly matches current device.",
    );

    let entitlement:
      FinoraControlStorageEntitlement = {

        entitlementId:
          "FINORA-STORAGE-ENTITLEMENT-LOGIN-SELFTEST",

        userId,
        ownerId,
        businessId,
        branchId,

        installationId:
          historicalInstallationId,

        bindingKeyId:
          historicalBindingKeyId,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          historicalFingerprint,

        storageMode:
          "LOCAL",

        status:
          "ACTIVE",

        activatedAt:
          createdAt,

        createdAt,

        updatedAt:
          createdAt,

        schemaVersion:
          1,
      };

    const entitlementSave =
      await saveFinoraStorageEntitlement(
        entitlement,
      );

    assert(
      entitlementSave.success,
      entitlementSave.success
        ? "Unexpected storage entitlement result."
        : (entitlementSave.error ?? "Storage entitlement save failed without error detail."),
    );

    console.log(
      "PASS: active logical entitlement retains historical native binding",
    );

    // ========================================================
    // MATRIX 1 + 2
    // WRONG PASSWORD MUST END BEFORE DEVICE TRUST CHALLENGE
    // ========================================================

    const wrongPassword =
      await createFinoraBranchLoginSession(
        {
          username,
          password:
            "wrong-password",

          storageMode:
            "LOCAL",
        },
        portableStore,
      );

    assert(
      !wrongPassword.success &&
      wrongPassword.errorCode ===
        "INVALID_CREDENTIALS",
      "Wrong Password did not return INVALID_CREDENTIALS.",
    );

    console.log(
      "PASS: K2B matrix 1 wrong Password returns INVALID_CREDENTIALS",
    );

    assert(
      String(wrongPassword.errorCode) !==
        "SECURITY_CODE_REQUIRED",
      "Wrong Password leaked into Security Code challenge.",
    );

    console.log(
      "PASS: K2B matrix 2 wrong Password never exposes Security Code challenge",
    );

    // ========================================================
    // MATRIX 3
    // UNKNOWN DEVICE + VALID PASSWORD
    // ========================================================

    const challenge =
      await createFinoraBranchLoginSession(
        {
          username,
          password,

          storageMode:
            "LOCAL",
        },
        portableStore,
      );

    assert(
      !challenge.success &&
      challenge.errorCode ===
        "SECURITY_CODE_REQUIRED",
      "Unknown device did not require Security Code.",
    );

    console.log(
      "PASS: K2B matrix 3 unknown device requires Security Code",
    );

    // ========================================================
    // MATRIX 4 + 5
    // WRONG SECURITY CODE
    // ========================================================

    const wrongSecurityCode =
      await createFinoraBranchLoginSession(
        {
          username,
          password,

          storageMode:
            "LOCAL",

          securityCode:
            "WRONG-FINORA-SECURITY-CODE",
        },
        portableStore,
      );

    assert(
      !wrongSecurityCode.success &&
      wrongSecurityCode.errorCode ===
        "SECURITY_CODE_INVALID",
      "Wrong Security Code did not fail as SECURITY_CODE_INVALID.",
    );

    console.log(
      "PASS: K2B matrix 4 wrong Security Code rejected",
    );

    assert(
      !wrongSecurityCode.success,
      "Wrong Security Code unexpectedly issued a login session.",
    );

    console.log(
      "PASS: K2B matrix 5 wrong Security Code creates no session",
    );

    const stillUnknown =
      await createFinoraBranchLoginSession(
        {
          username,
          password,

          storageMode:
            "LOCAL",
        },
        portableStore,
      );

    assert(
      !stillUnknown.success &&
      stillUnknown.errorCode ===
        "SECURITY_CODE_REQUIRED",
      "Wrong Security Code unexpectedly persisted Device Trust.",
    );

    // ========================================================
    // MATRIX 6 + 7 + 9
    // CORRECT SECURITY CODE -> TRUST + SESSION
    // HISTORICAL ENTITLEMENT MUST STILL BE ACCEPTED LOGICALLY
    // ========================================================

    const authorizedLogin =
      await createFinoraBranchLoginSession(
        {
          username,
          password,

          storageMode:
            "LOCAL",

          securityCode,
        },
        portableStore,
      );

    assert(
      authorizedLogin.success,
      authorizedLogin.success
        ? "Unexpected authorized-login state."
        : authorizedLogin.error,
    );

    console.log(
      "PASS: K2B matrix 6 correct Security Code authorizes current device",
    );

    assert(
      authorizedLogin.data.sessionId.length >
        0,
      "Correct Security Code did not issue a login session.",
    );

    const validation =
      await validateFinoraBranchLoginSession({
        sessionId:
          authorizedLogin.data.sessionId,
      });

    assert(
      validation.success,
      validation.success
        ? "Unexpected session-validation state."
        : validation.error,
    );

    console.log(
      "PASS: K2B matrix 7 correct Security Code creates valid authoritative session",
    );

    console.log(
      "PASS: K2B matrix 9 trusted replacement-device binding accepts ACTIVE logical historical entitlement",
    );

    invalidateFinoraBranchLoginSession({
      sessionId:
        authorizedLogin.data.sessionId,
    });

    // ========================================================
    // MATRIX 8
    // TRUSTED RETRY -> PASSWORD ONLY
    // ========================================================

    const trustedRetry =
      await createFinoraBranchLoginSession(
        {
          username,
          password,

          storageMode:
            "LOCAL",
        },
        portableStore,
      );

    assert(
      trustedRetry.success,
      trustedRetry.success
        ? "Unexpected trusted retry state."
        : trustedRetry.error,
    );

    console.log(
      "PASS: K2B matrix 8 trusted device retries with Password only",
    );

    invalidateFinoraBranchLoginSession({
      sessionId:
        trustedRetry.data.sessionId,
    });

    // ========================================================
    // MATRIX 10
    // NON-ACTIVE LOGICAL ENTITLEMENT
    // ========================================================

    entitlement = {
      ...entitlement,

      status:
        "SUSPENDED",

      updatedAt:
        new Date().toISOString(),
    };

    const inactiveSave =
      await saveFinoraStorageEntitlement(
        entitlement,
      );

    assert(
      inactiveSave.success,
      inactiveSave.success
        ? "Unexpected inactive-entitlement save state."
        : (inactiveSave.error ?? "Inactive entitlement save failed without error detail."),
    );

    const inactiveLogin =
      await createFinoraBranchLoginSession(
        {
          username,
          password,

          storageMode:
            "LOCAL",
        },
        portableStore,
      );

    assert(
      !inactiveLogin.success &&
      inactiveLogin.errorCode ===
        "STORAGE_ENTITLEMENT_DENIED",
      "Non-ACTIVE logical storage entitlement was not denied.",
    );

    console.log(
      "PASS: K2B matrix 10 non-ACTIVE logical entitlement denied",
    );

    // Restore exact same entitlement identity/binding.
    entitlement = {
      ...entitlement,

      status:
        "ACTIVE",

      updatedAt:
        new Date().toISOString(),
    };

    const activeRestore =
      await saveFinoraStorageEntitlement(
        entitlement,
      );

    assert(
      activeRestore.success,
      activeRestore.success
        ? "Unexpected ACTIVE entitlement restore state."
        : (activeRestore.error ?? "ACTIVE entitlement restore failed without error detail."),
    );

    // ========================================================
    // MATRIX 11
    // WRONG SELECTED STORAGE MODE
    // ========================================================

    const wrongStorage =
      await createFinoraBranchLoginSession(
        {
          username,
          password,

          storageMode:
            "USB",
        },
        portableStore,
      );

    assert(
      !wrongStorage.success &&
      wrongStorage.errorCode ===
        "STORAGE_MODE_MISMATCH",
      "Wrong selected storage mode did not fail closed.",
    );

    console.log(
      "PASS: K2B matrix 11 wrong storage mode fails closed",
    );

    // ========================================================
    // MATRIX 12
    // BEHAVIORAL ORDER PROOF
    //
    // Matrix 1/2 proved Password failure exits before challenge.
    // Matrix 3 proved Device Trust challenge follows Password.
    // Matrix 6/7 proved a session exists only after trust.
    // ========================================================

    console.log(
      "PASS: K2B matrix 12 Password -> Device Trust -> Session runtime ordering proven",
    );

    // ========================================================
    // FINAL CONTROL STATE SANITY
    // ========================================================

    const finalStore =
      await readFinoraControlStore();

    assert(
      finalStore.success &&
      finalStore.data,
      finalStore.success
        ? "Unexpected final Control Store state."
        : (finalStore.error ?? "Final Control Store save failed without error detail."),
    );

    const persistedCredential =
      finalStore.data.branchCredentials
        ?.find(
          (
            item,
          ) =>
            item.userId ===
              userId,
        );

    assert(
      persistedCredential !==
        undefined &&
      persistedCredential.sourceAuthorizationId ===
        sourceAuthorizationId,
      "Final credential lineage is incorrect.",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: D4E4I7-K2B LOGIN AUTHORITY EXECUTABLE MATRIX COMPLETE",
    );

    console.log(
      "============================================================",
    );
  }
  finally {
    if (
      temporaryUserData !==
        undefined
    ) {
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
        "PASS: isolated Login Authority userData deleted",
      );
    }
  }
}

void main()
  .then(
    () => {
      console.log(
        "PASS: Login Authority self-test process exiting with code 0",
      );

      app.exit(
        0,
      );
    },
  )
  .catch(
    (
      error:
        unknown,
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