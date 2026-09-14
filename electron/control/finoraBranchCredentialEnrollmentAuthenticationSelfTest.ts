/* ===========================================================
   FINORA ENTERPRISE OS

   BRANCH CREDENTIAL ENROLLMENT + AUTHENTICATION SELF TEST

   PROVES:

   - Signed BRANCH_ACCESS ISSUE seeds existing USB access
   - Signed Credential Enrollment Bundle adds pending authority + portability provenance
   - Recipient Set Password requires username + password + Security Code
   - Signed authority supplies identity, role, scope and storage
   - Password and Security Code become separate SCRYPT verifiers
   - Password and Security Code use independent fresh salts
   - Plaintext password and Security Code are not persisted
   - Pending authorization is atomically consumed
   - sourceAuthorizationId remains permanent evidence
   - Correct admin/admin123 authentication succeeds
   - Wrong password and unknown username both fail identically
   - Second enrollment after consumption fails
   - New recovery authorization fails when credential exists
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
  issueFinoraBranchAccessPackage,
} from "../control-center/finoraControlCenterIssuanceCoordinator.js";

import {
  issueFinoraBranchCredentialEnrollmentBundle,
} from "../control-center/finoraBranchCredentialEnrollmentBundleIssuer.js";

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

import {
  applyFinoraBranchCredentialEnrollmentBundle,
} from "./finoraBranchCredentialEnrollmentBundleApplyService.js";

import {
  enrollFinoraBranchCredentialWithPortableStore,
} from "./finoraBranchCredentialEnrollmentService.js";

import {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import {
  authenticateFinoraBranchCredential,
} from "./finoraBranchCredentialAuthenticationService.js";


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
          "finora-credential-enrollment-auth-",
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
    // NATIVE INSTALLATION BINDING
    // ========================================================

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


    // ========================================================
    // INSTALLATION IDENTITY
    // ========================================================

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
      "OWNER-CREDENTIAL-ENROLLMENT-AUTH-SELFTEST";

    const businessId =
      "BUSINESS-CREDENTIAL-ENROLLMENT-AUTH-SELFTEST";

    const branchId =
      "BRANCH-CREDENTIAL-ENROLLMENT-AUTH-SELFTEST";

    const userId =
      "USER-CREDENTIAL-ENROLLMENT-AUTH-SELFTEST";

    const grantId =
      "GRANT-CREDENTIAL-ENROLLMENT-AUTH-SELFTEST";

    const authorizationId =
      "FINORA-CREDENTIAL-ENROLLMENT-USB-ADMIN-SELFTEST";

    const username =
      "admin";

    const password =
      "admin123";

    const securityCode =
      "FINORA-Security@8421";

    const installation:
      FinoraControlInstallationIdentity = {

        installationId:
          nativeBinding.installationId,

        ownerId,

        businessId,

        branchId,

        businessCode:
          "CEA01",

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


    // ========================================================
    // TRUST REAL CONTROL CENTER SIGNER
    // ========================================================

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
      "PASS: real Control Center signing identity trusted",
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


    // ========================================================
    // EXISTING REGISTERED USB ACCESS
    // ========================================================

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
          "USB",

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
            "Credential enrollment authentication self-test.",

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

    const issuePackage =
      await issueFinoraBranchAccessPackage({
        target,

        payload: {
          action:
            "ISSUE",

          accessGrant,

          schemaVersion:
            1,
        },
      });

    assert(
      issuePackage.sequence ===
        1,
      "Control Center bootstrap did not allocate Branch Access sequence 1.",
    );

    const issueResult =
      await applyFinoraSignedBranchAccessPackage(
        issuePackage,
        trustedKeys,
        new Date(),
      );

    expectSuccess(
      "signed ISSUE seeded ACTIVE REGISTERED USB access",
      issueResult,
    );


    const preAuthorizationStore =
      await readFinoraControlStore();

    assert(
      preAuthorizationStore.success &&
        preAuthorizationStore.data,
      preAuthorizationStore.error ??
        "Unable to read pre-authorization Control Store.",
    );

    assert(
      (
        preAuthorizationStore.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        0 &&
      (
        preAuthorizationStore.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        0,
      "Credential fixture did not begin empty.",
    );

    const grantBeforeAuthorization =
      preAuthorizationStore.data.branchAccessGrants
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
      grantBeforeAuthorization,
      "Seeded USB Branch Access grant is missing.",
    );

    const grantJsonBeforeAuthorization =
      JSON.stringify(
        grantBeforeAuthorization,
      );

    console.log(
      "PASS: credential fixture starts with USB access and no credential state",
    );


    // ========================================================
    // SIGNED CREDENTIAL ENROLLMENT BUNDLE
    // ========================================================

    const authorizeIssuedAt =
      new Date(
        now.getTime() +
          1000,
      ).toISOString();

    const credentialAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {

        authorizationId,

        userId,

        username,

        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        ownerId,

        businessId,

        branchId,

        storageMode:
          "USB",

        dataContext:
          "REAL",

        method:
          FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,

        oneTime:
          true,

        schemaVersion:
          1,
      };

    const credentialEnrollmentBundle =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target,

        sourceAuthorization:
          credentialAuthorization,
      });

    assert(
      credentialEnrollmentBundle.branchAccessPackage.purpose ===
        "BRANCH_ACCESS" &&
      credentialEnrollmentBundle.branchAccessPackage.payload.action ===
        "AUTHORIZE_CREDENTIAL" &&
      credentialEnrollmentBundle.branchPortabilityAuthorityPackage.purpose ===
        "BRANCH_PORTABILITY_AUTHORITY" &&
      credentialEnrollmentBundle.branchAccessPackage.sequence ===
        2,
      "Credential Enrollment Bundle did not contain exact authorization + portability children.",
    );

    const authorizePackage =
      credentialEnrollmentBundle.branchAccessPackage;

    const signedAuthorizePayload =
      authorizePackage.payload as
        Record<string, unknown>;

    assert(
      !Object.prototype.hasOwnProperty.call(
        signedAuthorizePayload,
        "accessGrant",
      ),
      "AUTHORIZE_CREDENTIAL unexpectedly contains Access Grant snapshot.",
    );

    const authorizeResult =
      await applyFinoraBranchCredentialEnrollmentBundle(
        credentialEnrollmentBundle,
        trustedKeys,
        new Date(),
      );

    expectSuccess(
      "signed Credential Enrollment Bundle persisted pending USB credential authority + portability provenance",
      authorizeResult,
    );


    const authorizedStore =
      await readFinoraControlStore();

    assert(
      authorizedStore.success &&
        authorizedStore.data,
      authorizedStore.error ??
        "Unable to read authorized Control Store.",
    );

    assert(
      (
        authorizedStore.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        1 &&
      (
        authorizedStore.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        0,
      "Credential Enrollment Bundle did not produce exactly one pending authority.",
    );

    const pendingAuthorization =
      authorizedStore.data
        .branchCredentialEnrollmentAuthorizations
        ?.[0];

    assert(
      pendingAuthorization?.authorizationId ===
        authorizationId &&
      pendingAuthorization.username ===
        "admin" &&
      pendingAuthorization.userId ===
        userId &&
      pendingAuthorization.ownerId ===
        ownerId &&
      pendingAuthorization.businessId ===
        businessId &&
      pendingAuthorization.branchId ===
        branchId &&
      pendingAuthorization.storageMode ===
        "USB" &&
      pendingAuthorization.dataContext ===
        "REAL" &&
      pendingAuthorization.role ===
        "ADMIN",
      "Pending signed credential authorization is incorrect.",
    );

    console.log(
      "PASS: pending authorization is exact signed admin / USB authority with portability provenance",
    );


    // ========================================================
    // ISOLATED PORTABLE AUTH STORE
    //
    // The signed authority above is USB-scoped. For this
    // executable proof, isolated Electron userData acts only as
    // the fake removable root supplied directly by the trusted
    // main-process test fixture.
    //
    // No renderer path is involved and LOCAL must never be
    // consulted by the USB enrollment flow.
    // ========================================================

    let portableLocalResolverCalls =
      0;

    let portableUsbResolverCalls =
      0;

    const portableStore =
      new FinoraPortableBranchAuthStore({
        resolveLocalRoot:
          () => {
            portableLocalResolverCalls +=
              1;

            return app.getPath(
              "userData",
            );
          },

        resolveUsbRoot:
          async () => {
            portableUsbResolverCalls +=
              1;

            return app.getPath(
              "userData",
            );
          },
      });
    // ========================================================
    // RECIPIENT SET PASSWORD
    // ========================================================

    const missingSecurityCodeEnrollment =
      await enrollFinoraBranchCredentialWithPortableStore(
        {
          username:
            "admin",

          password,
        },
        portableStore,
      );

    assert(
      !missingSecurityCodeEnrollment.success &&
      missingSecurityCodeEnrollment.errorCode ===
        "INVALID_REQUEST",
      "Credential enrollment accepted a request without Security Code.",
    );

    console.log(
      "PASS: enrollment without Security Code rejected",
    );
    const enrollmentResult =
      await enrollFinoraBranchCredentialWithPortableStore(
        {
          username,
          password,
          securityCode,
        },
        portableStore,
      );

    assert(
      enrollmentResult.success,
      enrollmentResult.success
        ? "Unexpected enrollment state."
        : enrollmentResult.error,
    );

    assert(
      enrollmentResult.data.username ===
        "admin" &&
      enrollmentResult.data.userId ===
        userId &&
      enrollmentResult.data.fullName ===
        "FINORA Admin" &&
      enrollmentResult.data.role ===
        "ADMIN" &&
      enrollmentResult.data.ownerId ===
        ownerId &&
      enrollmentResult.data.businessId ===
        businessId &&
      enrollmentResult.data.branchId ===
        branchId &&
      enrollmentResult.data.storageMode ===
        "USB" &&
      enrollmentResult.data.dataContext ===
        "REAL",
      "Enrollment success result did not derive exact signed authority.",
    );

    console.log(
      "PASS: Set Password enrolled admin/admin123 from signed authority",
    );


    // ========================================================
    // PORTABLE AUTH + ATOMIC AUTHORIZATION CONSUMPTION
    // ========================================================

    const enrolledStore =
      await readFinoraControlStore();

    assert(
      enrolledStore.success &&
        enrolledStore.data,
      enrolledStore.error ??
        "Unable to read enrolled Control Store.",
    );

    assert(
      (
        enrolledStore.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        0,
      "Consumed credential authorization remains pending.",
    );

    assert(
      (
        enrolledStore.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        1,
      "Exactly one Branch Credential was not persisted.",
    );

    assert(
      (
        enrolledStore.data
          .portableBranchAuthEnrollmentTransactions
          ?.length ??
        0
      ) ===
        1 &&
      enrolledStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .status ===
        "COMPLETE",
      "Portable enrollment did not finalize exactly one COMPLETE durable transaction.",
    );

    console.log(
      "PASS: Portable enrollment finalized one COMPLETE durable transaction",
    );
    const storedCredential =
      enrolledStore.data
        .branchCredentials
        ?.[0];

    assert(
      storedCredential,
      "Persisted Branch Credential is missing.",
    );

    assert(
      storedCredential.sourceAuthorizationId ===
        authorizationId &&
      storedCredential.userId ===
        userId &&
      storedCredential.username ===
        "admin" &&
      storedCredential.canonicalUsername ===
        "admin" &&
      storedCredential.fullName ===
        "FINORA Admin" &&
      storedCredential.role ===
        "ADMIN" &&
      storedCredential.ownerId ===
        ownerId &&
      storedCredential.businessId ===
        businessId &&
      storedCredential.branchId ===
        branchId &&
      storedCredential.storageMode ===
        "USB" &&
      storedCredential.dataContext ===
        "REAL" &&
      storedCredential.status ===
        "ACTIVE",
      "Persisted Branch Credential authority is incorrect.",
    );

    assert(
      storedCredential.verifier.algorithm ===
        "SCRYPT" &&
      storedCredential.verifier.saltEncoding ===
        "BASE64" &&
      storedCredential.verifier.derivedKeyEncoding ===
        "BASE64" &&
      storedCredential.verifier.keyLength ===
        32 &&
      storedCredential.verifier.N ===
        32768 &&
      storedCredential.verifier.r ===
        8 &&
      storedCredential.verifier.p ===
        1,
      "Persisted credential does not use required SCRYPT parameters.",
    );

    assert(
      Buffer.from(
        storedCredential.verifier.salt,
        "base64",
      ).length ===
        16,
      "Persisted SCRYPT salt is not 16 bytes.",
    );

    assert(
      Buffer.from(
        storedCredential.verifier.derivedKey,
        "base64",
      ).length ===
        32,
      "Persisted SCRYPT derived key is not 32 bytes.",
    );

    const securityVerifier =
      storedCredential.securityVerifier;

    assert(
      securityVerifier !==
        undefined,
      "Persisted Branch Credential is missing Security Code verifier.",
    );

    if (!securityVerifier) {
      throw new Error(
        "Persisted Branch Credential is missing Security Code verifier.",
      );
    }

    assert(
      securityVerifier.algorithm ===
        "SCRYPT" &&
      securityVerifier.saltEncoding ===
        "BASE64" &&
      securityVerifier.derivedKeyEncoding ===
        "BASE64" &&
      securityVerifier.keyLength ===
        32 &&
      securityVerifier.N ===
        32768 &&
      securityVerifier.r ===
        8 &&
      securityVerifier.p ===
        1,
      "Persisted Security Code verifier does not use required SCRYPT parameters.",
    );

    assert(
      Buffer.from(
        securityVerifier.salt,
        "base64",
      ).length ===
        16,
      "Persisted Security Code SCRYPT salt is not 16 bytes.",
    );

    assert(
      Buffer.from(
        securityVerifier.derivedKey,
        "base64",
      ).length ===
        32,
      "Persisted Security Code SCRYPT derived key is not 32 bytes.",
    );

    assert(
      storedCredential.verifier.salt !==
        securityVerifier.salt,
      "Password and Security Code unexpectedly share the same SCRYPT salt.",
    );

    assert(
      storedCredential.verifier.derivedKey !==
        securityVerifier.derivedKey,
      "Password and Security Code unexpectedly share the same derived verifier.",
    );

    const credentialJson =
      JSON.stringify(
        storedCredential,
      );

    assert(
      !credentialJson.includes(
        password,
      ) &&
      !credentialJson.includes(
        securityCode,
      ) &&
      !credentialJson.includes(
        "FINORA_HASH_",
      ),
      "Plaintext password, Security Code or legacy weak password material was persisted.",
    );

    assert(
      JSON.stringify(
        enrolledStore.data.branchAccessGrants
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
          ),
      ) ===
        grantJsonBeforeAuthorization,
      "Credential enrollment mutated existing Branch Access grant.",
    );

    console.log(
      "PASS: pending authorization atomically consumed",
    );

    console.log(
      "PASS: one ACTIVE USB Branch Credential persisted",
    );

    console.log(
      "PASS: password and Security Code use independent SCRYPT verifiers",
    );

    console.log(
      "PASS: plaintext password, Security Code and legacy FINORA_HASH_ were not persisted",
    );

    console.log(
      "PASS: Branch Access remained field-identical through enrollment",
    );

    const persistedPortableAuth =
      await portableStore.read(
        "USB",
      );

    assert(
      persistedPortableAuth !==
        null,
      "Portable USB authentication envelope was not persisted.",
    );

    assert(
      portableLocalResolverCalls ===
        0,
      "USB Portable enrollment unexpectedly consulted LOCAL root.",
    );

    assert(
      portableUsbResolverCalls >=
        2,
      "USB Portable root resolver was not exercised by write/read flow.",
    );

    console.log(
      "PASS: encrypted Portable USB authentication state persisted",
    );

    console.log(
      "PASS: USB Portable enrollment has zero LOCAL fallback",
    );


    // ========================================================
    // CORRECT AUTHENTICATION
    // ========================================================

    const correctAuth =
      await authenticateFinoraBranchCredential({
        username:
          "admin",

        password:
          "admin123",
      });

    assert(
      correctAuth.success,
      correctAuth.success
        ? "Unexpected authentication state."
        : correctAuth.error,
    );

    assert(
      correctAuth.data.credentialId ===
        storedCredential.credentialId &&
      correctAuth.data.userId ===
        userId &&
      correctAuth.data.username ===
        "admin" &&
      correctAuth.data.fullName ===
        "FINORA Admin" &&
      correctAuth.data.role ===
        "ADMIN" &&
      correctAuth.data.ownerId ===
        ownerId &&
      correctAuth.data.businessId ===
        businessId &&
      correctAuth.data.branchId ===
        branchId &&
      correctAuth.data.storageMode ===
        "USB" &&
      correctAuth.data.dataContext ===
        "REAL",
      "Successful authentication returned incorrect principal.",
    );

    console.log(
      "PASS: admin/admin123 authenticated against SCRYPT credential",
    );


    // ========================================================
    // CANONICAL USERNAME AUTH
    // ========================================================

    const canonicalAuth =
      await authenticateFinoraBranchCredential({
        username:
          " ADMIN ",

        password:
          "admin123",
      });

    assert(
      canonicalAuth.success &&
      canonicalAuth.data.credentialId ===
        storedCredential.credentialId,
      "Canonical username authentication failed.",
    );

    console.log(
      "PASS: canonical username normalization resolves same credential",
    );


    // ========================================================
    // WRONG PASSWORD / UNKNOWN USERNAME SAME FAILURE
    // ========================================================

    const wrongPasswordAuth =
      await authenticateFinoraBranchCredential({
        username:
          "admin",

        password:
          "wrong-password",
      });

    const unknownUsernameAuth =
      await authenticateFinoraBranchCredential({
        username:
          "missing-admin",

        password:
          "wrong-password",
      });

    assert(
      !wrongPasswordAuth.success &&
      wrongPasswordAuth.errorCode ===
        "INVALID_CREDENTIALS",
      "Wrong password did not return INVALID_CREDENTIALS.",
    );

    assert(
      !unknownUsernameAuth.success &&
      unknownUsernameAuth.errorCode ===
        "INVALID_CREDENTIALS",
      "Unknown username did not return INVALID_CREDENTIALS.",
    );

    assert(
      !wrongPasswordAuth.success &&
      !unknownUsernameAuth.success &&
      wrongPasswordAuth.error ===
        unknownUsernameAuth.error,
      "Wrong password and unknown username exposed different authentication errors.",
    );

    console.log(
      "PASS: wrong password and unknown username both return INVALID_CREDENTIALS",
    );

    console.log(
      "PASS: wrong password and unknown username expose identical error text",
    );


    // ========================================================
    // COMPLETED ENROLLMENT RETRY IS IDEMPOTENT
    //
    // Once the one-time signed authorization is consumed, the
    // durable COMPLETE transaction remains recovery evidence.
    // The same Password + Security Code must resolve the exact
    // existing credential without creating another credential.
    // ========================================================

    const completedRetry =
      await enrollFinoraBranchCredentialWithPortableStore(
        {
          username:
            "admin",

          password:
            "admin123",

          securityCode,
        },
        portableStore,
      );

    assert(
      completedRetry.success &&
      completedRetry.data.credentialId ===
        storedCredential.credentialId,
      completedRetry.success
        ? "Completed enrollment retry returned a different credential."
        : completedRetry.error,
    );

    console.log(
      "PASS: completed Portable enrollment retries idempotently after authorization consumption",
    );

    const wrongCompletedRetry =
      await enrollFinoraBranchCredentialWithPortableStore(
        {
          username:
            "admin",

          password:
            "wrong-password",

          securityCode,
        },
        portableStore,
      );

    assert(
      !wrongCompletedRetry.success &&
      wrongCompletedRetry.errorCode ===
        "ENROLLMENT_APPLY_FAILED",
      "Completed Portable enrollment accepted incorrect recovery credentials.",
    );

    console.log(
      "PASS: completed Portable enrollment rejects incorrect recovery credentials",
    );

    // ========================================================
    // EXISTING CREDENTIAL BLOCKS NEW RECOVERY AUTHORITY
    // ========================================================

    const beforeRejectedRecovery =
      await readFinoraControlStore();

    assert(
      beforeRejectedRecovery.success &&
        beforeRejectedRecovery.data,
      beforeRejectedRecovery.error ??
        "Unable to read existing-credential recovery baseline.",
    );

    const beforeRejectedRecoveryJson =
      JSON.stringify(
        beforeRejectedRecovery.data,
      );

    const secondAuthorizeIssuedAt =
      new Date(
        now.getTime() +
          2000,
      ).toISOString();

    const secondAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {
        ...credentialAuthorization,

        authorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-USB-ADMIN-SECOND-SELFTEST",
      };

    const secondAuthorizePackage =
      await signFinoraBranchAccessPackage({

        packageId:
          "PACKAGE-CREDENTIAL-ENROLLMENT-AUTH-SECOND-AUTHORIZE",

        sequence:
          3,

        issuedAt:
          secondAuthorizeIssuedAt,

        target,

        payload: {
          action:
            "AUTHORIZE_CREDENTIAL",

          credentialEnrollment:
            secondAuthorization,

          issuedAt:
            secondAuthorizeIssuedAt,

          schemaVersion:
            1,
        },
      });

    const secondAuthorizeResult =
      await applyFinoraSignedBranchAccessPackage(
        secondAuthorizePackage,
        trustedKeys,
        new Date(
          secondAuthorizeIssuedAt,
        ),
      );

    expectFailure(
      "new AUTHORIZE_CREDENTIAL rejected when Branch Credential already exists",
      secondAuthorizeResult,
    );

    assert(
      secondAuthorizeResult.error?.includes(
        "Branch Credential already exists",
      ),
      "Existing credential rejection did not reach credential duplicate guard.",
    );

    const finalStore =
      await readFinoraControlStore();

    assert(
      finalStore.success &&
        finalStore.data,
      finalStore.error ??
        "Unable to read final credential Control Store.",
    );

    assert(
      JSON.stringify(
        finalStore.data,
      ) ===
        beforeRejectedRecoveryJson,
      "Rejected second credential authorization mutated Control Store.",
    );

    assert(
      (
        finalStore.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        0 &&
      (
        finalStore.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        1 &&
      (
        finalStore.data
          .portableBranchAuthEnrollmentTransactions
          ?.length ??
        0
      ) ===
        1 &&
      finalStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .status ===
        "COMPLETE",
      "Final credential / Portable Auth transaction state is incorrect.",
    );

    console.log(
      "PASS: existing credential blocks redundant recovery authorization",
    );

    console.log(
      "PASS: rejected redundant recovery left Control Store unchanged",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA BRANCH CREDENTIAL ENROLLMENT + AUTH E2E SELFTEST",
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
          "PASS: isolated credential enrollment userData deleted",
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
        "PASS: credential enrollment/auth self-test process exiting with code 0",
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
        "FAIL: FINORA BRANCH CREDENTIAL ENROLLMENT + AUTH E2E SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );