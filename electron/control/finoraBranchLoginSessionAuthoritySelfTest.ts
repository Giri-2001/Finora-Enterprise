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
  safeStorage,
} from "electron";

import {
  mkdir,
  mkdtemp,
  rename,
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
  generateFinoraBranchCertificationKeyMaterial,
} from "./finoraBranchCertificationCrypto.js";

import {
  bindFinoraBranchCertificationBootstrapToBranch,
  persistFinoraBranchCertificationBootstrapGenerated,
} from "./finoraBranchCertificationBootstrapStore.js";

import {
  generateFinoraWindowsInstallationBindingMaterial,
} from "./finoraInstallationBindingCrypto.js";

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

function getRawLoginControlStoreFixtureFile(): string {
  return join(
    app.getPath("userData"),
    "FINORA",
    "control",
    "finora-control.bin",
  );
}

async function persistRawLoginControlStoreFixture(
  value: unknown,
): Promise<void> {
  const controlFile =
    getRawLoginControlStoreFixtureFile();

  const controlDirectory =
    join(
      app.getPath("userData"),
      "FINORA",
      "control",
    );

  const temporaryFile =
    `${controlFile}.legacy-login.tmp`;

  await mkdir(
    controlDirectory,
    {
      recursive: true,
      mode: 0o700,
    },
  );

  const plainText =
    JSON.stringify(value);

  let encrypted: Buffer;

  if (await safeStorage.isAsyncEncryptionAvailable()) {
    encrypted =
      await safeStorage.encryptStringAsync(
        plainText,
      );
  }
  else if (safeStorage.isEncryptionAvailable()) {
    encrypted =
      safeStorage.encryptString(
        plainText,
      );
  }
  else {
    throw new Error(
      "Secure operating-system encryption is unavailable for the legacy Login Authority fixture.",
    );
  }

  await writeFile(
    temporaryFile,
    encrypted,
    { mode: 0o600 },
  );

  await rename(
    temporaryFile,
    controlFile,
  );
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
    // BRANCH CERTIFICATION BOOTSTRAP
    //
    // Current enrollment production flow requires durable
    // BRANCH_BOUND_AFTER_RESPONSE certification custody.
    // This is isolated self-test state only.
    // ========================================================

    const loginBranchCertificationBinding =
      generateFinoraWindowsInstallationBindingMaterial(
        new Date(),
        "FINORA-INSTALLATION-LOGIN-SELFTEST-BRANCH-CERT",
      );

    const loginBranchCertificationKeyMaterial =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(),
      );

    const loginBranchCertificationRequestId =
      "FINORA-ENROLLMENT-LOGIN-SELFTEST-BRANCH-CERT-REQUEST";

    const loginBranchCertificationResponseId =
      "FINORA-ENROLLMENT-RESPONSE-LOGIN-SELFTEST-BRANCH-CERT";

    await persistFinoraBranchCertificationBootstrapGenerated({
      requestId:
        loginBranchCertificationRequestId,

      installationId:
        loginBranchCertificationBinding.installationId,

      bindingKeyId:
        loginBranchCertificationBinding.bindingKeyId,

      fingerprintAlgorithm:
        loginBranchCertificationBinding.fingerprintAlgorithm,

      publicKeyFingerprint:
        loginBranchCertificationBinding.publicKeyFingerprint,

      certificationKeyMaterial:
        loginBranchCertificationKeyMaterial,

      generatedAt:
        loginBranchCertificationKeyMaterial.createdAt,
    });

    const loginBoundBranchCertification =
      await bindFinoraBranchCertificationBootstrapToBranch({
        requestId:
          loginBranchCertificationRequestId,

        responseId:
          loginBranchCertificationResponseId,

        ownerId,
        businessId,
        branchId,

        boundAt:
          new Date().toISOString(),
      });

    assert(
      loginBoundBranchCertification.state ===
        "BRANCH_BOUND_AFTER_RESPONSE" &&
      loginBoundBranchCertification.branchBinding?.responseId ===
        loginBranchCertificationResponseId &&
      loginBoundBranchCertification.branchBinding?.ownerId ===
        ownerId &&
      loginBoundBranchCertification.branchBinding?.businessId ===
        businessId &&
      loginBoundBranchCertification.branchBinding?.branchId ===
        branchId,
      "Login Authority self-test Branch Certification bootstrap was not bound to the exact branch.",
    );

    console.log(
      "PASS: exact BRANCH_BOUND_AFTER_RESPONSE certification custody prepared for Login Authority enrollment",
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
    // R84I
    // VALID PASSWORD + MISSING BUSINESS PROFILE
    // MUST ENTER SIGNED RECOVERY BEFORE DEVICE TRUST
    // ========================================================

    let r84iRecoveryFailureCalls =
      0;

    const r84iRecoveryFailure:
      NonNullable<
        Parameters<
          typeof createFinoraBranchLoginSession
        >[2]
      > =
      async () => {
        r84iRecoveryFailureCalls +=
          1;

        return {
          success:
            false,

          errorCode:
            "CONTROL_STATE_FAILED",

          error:
            "R84I_MISSING_PROFILE_RECOVERY_SENTINEL",
        };
      };

    const r84iRecoveryFailureResult =
      await createFinoraBranchLoginSession(
        {
          username,
          password,

          storageMode:
            "LOCAL",
        },
        portableStore,
        r84iRecoveryFailure,
      );

    assert(
      !r84iRecoveryFailureResult.success &&
      r84iRecoveryFailureResult.errorCode ===
        "CONTROL_STATE_FAILED" &&
      r84iRecoveryFailureResult.error ===
        "R84I_MISSING_PROFILE_RECOVERY_SENTINEL" &&
      r84iRecoveryFailureCalls ===
        1,
      "Valid Password with missing Business Profile did not enter signed recovery exactly once.",
    );

    console.log(
      "PASS: valid Password + missing Business Profile enters signed recovery before Device Trust",
    );

    // --------------------------------------------------------
    // A recovery callback cannot merely report success.
    // The signed Business Profile must exist durably afterward.
    // --------------------------------------------------------

    let r84iNonPersistingRecoveryCalls =
      0;

    const r84iNonPersistingRecovery:
      NonNullable<
        Parameters<
          typeof createFinoraBranchLoginSession
        >[2]
      > =
      async () => {
        r84iNonPersistingRecoveryCalls +=
          1;

        return {
          success:
            true,
        };
      };

    const r84iNonPersistingRecoveryResult =
      await createFinoraBranchLoginSession(
        {
          username,
          password,

          storageMode:
            "LOCAL",
        },
        portableStore,
        r84iNonPersistingRecovery,
      );

    assert(
      !r84iNonPersistingRecoveryResult.success &&
      r84iNonPersistingRecoveryResult.errorCode ===
        "CONTROL_STATE_FAILED" &&
      r84iNonPersistingRecoveryResult.error ===
        "The signed FINORA Business Profile is required for this branch." &&
      r84iNonPersistingRecoveryCalls ===
        1,
      "Non-persisting Business Profile recovery did not fail closed.",
    );

    console.log(
      "PASS: recovery success without durable signed Business Profile fails closed before Device Trust",
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

    const authorizedSessionInvalidated =
      invalidateFinoraBranchLoginSession({
        sessionId:
          authorizedLogin.data.sessionId,
      });

    assert(
      authorizedSessionInvalidated,
      "Active authoritative login session was not invalidated.",
    );

    const validationAfterInvalidation =
      await validateFinoraBranchLoginSession({
        sessionId:
          authorizedLogin.data.sessionId,
      });

    assert(
      !validationAfterInvalidation.success &&
        validationAfterInvalidation.errorCode ===
          "SESSION_NOT_FOUND",
      "Invalidated authoritative session remained valid.",
    );

    const repeatedInvalidation =
      invalidateFinoraBranchLoginSession({
        sessionId:
          authorizedLogin.data.sessionId,
      });

    assert(
      repeatedInvalidation ===
        false,
      "Repeated session invalidation was not idempotent.",
    );

    console.log(
      "PASS: 5.6I authoritative session invalidation removes bearer and is idempotent",
    );

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
    // LEGACY LOGIN SECURITY CODE SETUP MATRIX
    // ========================================================

    const legacySourceStore =
      await readFinoraControlStore();

    assert(
      legacySourceStore.success &&
        legacySourceStore.data,
      legacySourceStore.success
        ? "Unexpected legacy source Control Store state."
        : (legacySourceStore.error ?? "Legacy source Control Store read failed."),
    );

    const legacyFixtureStore =
      structuredClone(
        legacySourceStore.data,
      );

    const legacyFixtureCredential =
      legacyFixtureStore.branchCredentials?.find(
        (item) =>
          item.userId === userId &&
          item.sourceAuthorizationId === sourceAuthorizationId,
      );

    assert(
      legacyFixtureCredential !== undefined,
      "Legacy login fixture credential is missing.",
    );

    const legacySourceGeneration =
      legacyFixtureCredential.authGeneration ?? 1;

    delete legacyFixtureCredential.securityVerifier;

    let exactLegacyEntitlementFound =
      false;

    legacyFixtureStore.storageEntitlements =
      (legacyFixtureStore.storageEntitlements ?? []).map(
        (item) => {
          if (item.entitlementId !== entitlement.entitlementId) {
            return item;
          }

          exactLegacyEntitlementFound =
            true;

          return {
            ...item,
            installationId: nativeBinding.installationId,
            bindingKeyId: nativeBinding.bindingKeyId,
            fingerprintAlgorithm: nativeBinding.fingerprintAlgorithm,
            publicKeyFingerprint: nativeBinding.publicKeyFingerprint,
            storageMode: "LOCAL" as const,
            status: "ACTIVE" as const,
          };
        },
      );

    assert(
      exactLegacyEntitlementFound,
      "Legacy login fixture could not locate Storage Entitlement.",
    );

    await persistRawLoginControlStoreFixture(
      legacyFixtureStore,
    );

    const legacyPortableFile =
      join(
        temporaryUserData,
        "FINORA",
        "auth",
        "finora-branch-auth.bin",
      );

    await rm(
      legacyPortableFile,
      { force: true },
    );

    assert(
      await portableStore.read("LOCAL") === null,
      "Legacy login fixture did not remove predecessor Portable Auth.",
    );

    const legacyReadable =
      await readFinoraControlStore();

    assert(
      legacyReadable.success &&
        legacyReadable.data &&
      legacyReadable.data.branchCredentials?.find(
        (item) => item.userId === userId,
      )?.securityVerifier === undefined,
      legacyReadable.success
        ? "Legacy credential unexpectedly retained Security Code verifier."
        : (legacyReadable.error ?? "Legacy fixture became unreadable."),
    );

    console.log(
      "PASS: legacy Login Authority fixture preserves signed lineage + exact current native storage authority",
    );

    // --------------------------------------------------------
    // WRONG PASSWORD MUST NOT EXPOSE SETUP CHALLENGE
    // --------------------------------------------------------

    const legacyWrongPassword =
      await createFinoraBranchLoginSession(
        {
          username,
          password: "wrong-password",
          storageMode: "LOCAL",
        },
        portableStore,
      );

    assert(
      !legacyWrongPassword.success &&
      legacyWrongPassword.errorCode === "INVALID_CREDENTIALS" &&
      String(legacyWrongPassword.errorCode) !== "SECURITY_CODE_SETUP_REQUIRED",
      "Legacy wrong Password leaked into Security Code setup challenge.",
    );

    console.log(
      "PASS: legacy wrong Password still fails before Security Code setup disclosure",
    );

    // --------------------------------------------------------
    // VALID PASSWORD -> SECURITY CODE SETUP REQUIRED
    // --------------------------------------------------------

    const legacySetupChallenge =
      await createFinoraBranchLoginSession(
        {
          username,
          password,
          storageMode: "LOCAL",
        },
        portableStore,
      );

    assert(
      !legacySetupChallenge.success &&
      legacySetupChallenge.errorCode === "SECURITY_CODE_SETUP_REQUIRED",
      legacySetupChallenge.success
        ? "Legacy Password-only login unexpectedly issued a session."
        : `Unexpected legacy setup challenge: ${legacySetupChallenge.errorCode}: ${legacySetupChallenge.error}`,
    );

    console.log(
      "PASS: valid legacy Password returns SECURITY_CODE_SETUP_REQUIRED before Device Trust",
    );

    // --------------------------------------------------------
    // INVALID SETUP CODE -> ZERO DURABLE MIGRATION
    // --------------------------------------------------------

    const legacyInvalidSetup =
      await createFinoraBranchLoginSession(
        {
          username,
          password,
          storageMode: "LOCAL",
          securityCode: "short",
        },
        portableStore,
      );

    assert(
      !legacyInvalidSetup.success,
      "Invalid legacy Security Code unexpectedly succeeded.",
    );

    const afterInvalidLegacySetup =
      await readFinoraControlStore();

    assert(
      afterInvalidLegacySetup.success &&
        afterInvalidLegacySetup.data &&
      afterInvalidLegacySetup.data.branchCredentials?.find(
        (item) => item.userId === userId,
      )?.securityVerifier === undefined &&
      await portableStore.read("LOCAL") === null,
      "Invalid legacy Security Code mutated credential or Portable Auth state.",
    );

    console.log(
      "PASS: invalid legacy Security Code fails closed with zero durable migration",
    );

    // --------------------------------------------------------
    // VALID SETUP -> BOOTSTRAP + DEVICE TRUST + SESSION
    // --------------------------------------------------------

    const legacySecurityCode =
      "FINORA-LEGACY-LOGIN-SELFTEST";

    const legacyAuthorizedLogin =
      await createFinoraBranchLoginSession(
        {
          username,
          password,
          storageMode: "LOCAL",
          securityCode: legacySecurityCode,
        },
        portableStore,
      );

    assert(
      legacyAuthorizedLogin.success,
      legacyAuthorizedLogin.success
        ? "Unexpected legacy authorized-login state."
        : `${legacyAuthorizedLogin.errorCode}: ${legacyAuthorizedLogin.error}`,
    );

    const afterLegacySetup =
      await readFinoraControlStore();

    assert(
      afterLegacySetup.success &&
        afterLegacySetup.data,
      afterLegacySetup.success
        ? "Unexpected post-bootstrap Control Store state."
        : (afterLegacySetup.error ?? "Post-bootstrap Control Store read failed."),
    );

    const migratedLegacyCredential =
      afterLegacySetup.data.branchCredentials?.find(
        (item) =>
          item.userId === userId &&
          item.sourceAuthorizationId === sourceAuthorizationId,
      );

    assert(
      migratedLegacyCredential !== undefined &&
      migratedLegacyCredential.securityVerifier !== undefined &&
      migratedLegacyCredential.authGeneration === legacySourceGeneration + 1 &&
      await portableStore.read("LOCAL") !== null,
      "Legacy setup did not persist Security Code verifier, generation advance and Portable Auth.",
    );

    const legacySessionValidation =
      await validateFinoraBranchLoginSession({
        sessionId: legacyAuthorizedLogin.data.sessionId,
      });

    assert(
      legacySessionValidation.success,
      legacySessionValidation.success
        ? "Unexpected migrated session validation state."
        : legacySessionValidation.error,
    );

    console.log(
      "PASS: valid legacy Security Code bootstraps Portable Auth, authorizes device and issues authoritative session",
    );

    invalidateFinoraBranchLoginSession({
      sessionId: legacyAuthorizedLogin.data.sessionId,
    });

    // --------------------------------------------------------
    // MIGRATED TRUSTED DEVICE -> PASSWORD ONLY
    // --------------------------------------------------------

    const legacyPasswordOnlyRetry =
      await createFinoraBranchLoginSession(
        {
          username,
          password,
          storageMode: "LOCAL",
        },
        portableStore,
      );

    assert(
      legacyPasswordOnlyRetry.success,
      legacyPasswordOnlyRetry.success
        ? "Unexpected migrated Password-only retry state."
        : `${legacyPasswordOnlyRetry.errorCode}: ${legacyPasswordOnlyRetry.error}`,
    );

    console.log(
      "PASS: migrated legacy credential retries on trusted device with Password only",
    );

    invalidateFinoraBranchLoginSession({
      sessionId: legacyPasswordOnlyRetry.data.sessionId,
    });

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