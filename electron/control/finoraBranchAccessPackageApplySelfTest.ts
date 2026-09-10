/* ===========================================================
   FINORA ENTERPRISE OS™

   SIGNED BRANCH ACCESS RECIPIENT APPLY SELF TEST

   CURRENT PROOF:

   - Real Control Center BRANCH_ACCESS signer
   - Real recipient signed-package verifier/apply service
   - Exact native installation binding
   - Signed ISSUE
   - Signed one-time credential enrollment authorization
   - Atomic Access + authorization persistence
   - Replay rejection
   - Branch Activation remains untouched

   No credential secret is carried.
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
  FinoraBranchAccessPayloadV1,
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
          "finora-branch-access-recipient-",
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


    // --------------------------------------------------------
    // NATIVE INSTALLATION BINDING
    // --------------------------------------------------------

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0,
      "Native installation binding was not created.",
    );

    console.log(
      "PASS: isolated native installation binding created",
    );


    // --------------------------------------------------------
    // INSTALLATION IDENTITY
    // --------------------------------------------------------

    const now =
      new Date();

    const issuedAt =
      now.toISOString();

    const createdAt =
      new Date(
        now.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const ownerId =
      "OWNER-BRANCH-ACCESS-RECIPIENT-SELFTEST";

    const businessId =
      "BUSINESS-BRANCH-ACCESS-RECIPIENT-SELFTEST";

    const branchId =
      "BRANCH-BRANCH-ACCESS-RECIPIENT-SELFTEST";

    const userId =
      "USER-BRANCH-ACCESS-RECIPIENT-SELFTEST";

    const grantId =
      "GRANT-BRANCH-ACCESS-RECIPIENT-SELFTEST";

    const authorizationId =
      "FINORA-CREDENTIAL-ENROLLMENT-BRANCH-ACCESS-RECIPIENT-SELFTEST";

    const installation:
      FinoraControlInstallationIdentity = {

        installationId:
          nativeBinding.installationId,

        ownerId,

        businessId,

        branchId,

        businessCode:
          "BAR01",

        branchCode:
          "B01",

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
      "isolated Control Store installation identity persisted",
      installationResult,
    );


    // --------------------------------------------------------
    // REAL CONTROL CENTER IDENTITY -> RECIPIENT TRUST
    // --------------------------------------------------------

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
      "PASS: real Control Center public signing identity trusted by isolated recipient",
    );


    // --------------------------------------------------------
    // EXACT TARGET
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // PRE-STATE
    // --------------------------------------------------------

    const before =
      await readFinoraControlStore();

    assert(
      before.success &&
        before.data,
      before.error ??
        "Unable to read pre-test Control Store.",
    );

    const activationCountBefore =
      before.data.activations.length;

    const credentialCountBefore =
      before.data.branchCredentialEnrollmentAuthorizations
        ?.length ??
      0;


    // --------------------------------------------------------
    // REGISTERED ACCESS GRANT
    // --------------------------------------------------------

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
            "FINORA signed Branch Access recipient self-test.",

          refundable:
            false,
        },

        registrationCycle:
          1,

        createdAt,

        updatedAt:
          issuedAt,

        schemaVersion:
          1,
      };


    // --------------------------------------------------------
    // CORRECT ONE-TIME CREDENTIAL AUTHORIZATION
    //
    // IMPORTANT:
    // authorizationId must use production-required prefix.
    // --------------------------------------------------------

    const credentialEnrollment:
      FinoraBranchCredentialEnrollmentAuthorization = {

        authorizationId,

        userId,

        username:
          "branch.admin",

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

    assert(
      credentialEnrollment.authorizationId.startsWith(
        "FINORA-CREDENTIAL-ENROLLMENT-",
      ),
      "Credential authorization ID does not satisfy production prefix policy.",
    );

    console.log(
      "PASS: credential authorization uses production-required identifier prefix",
    );


    // --------------------------------------------------------
    // PAYLOAD
    // --------------------------------------------------------

    const payload:
      FinoraBranchAccessPayloadV1 = {

        action:
          "ISSUE",

        accessGrant,

        credentialEnrollment,

        issuedAt,

        schemaVersion:
          1,
      };


    // --------------------------------------------------------
    // REAL CONTROL CENTER SIGNER
    // --------------------------------------------------------

    const signedPackage =
      await signFinoraBranchAccessPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-ISSUE",

        sequence:
          1,

        issuedAt,

        target,

        payload,
      });

    assert(
      signedPackage.purpose ===
        "BRANCH_ACCESS",
      "Real signer emitted wrong purpose.",
    );

    console.log(
      "PASS: real Control Center signed ISSUE with credential authorization",
    );


    // --------------------------------------------------------
    // REAL RECIPIENT APPLY
    // --------------------------------------------------------

    const applyResult =
      await applyFinoraSignedBranchAccessPackage(
        signedPackage,
        trustedKeys,
        now,
      );

    expectSuccess(
      "real signed BRANCH_ACCESS ISSUE applied by recipient",
      applyResult,
    );


    // --------------------------------------------------------
    // ATOMIC STORE PROOF
    // --------------------------------------------------------

    const after =
      await readFinoraControlStore();

    assert(
      after.success &&
        after.data,
      after.error ??
        "Unable to read post-ISSUE Control Store.",
    );

    const persistedGrant =
      after.data.branchAccessGrants
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
      persistedGrant?.grantId ===
        grantId &&
      persistedGrant.administrativeStatus ===
        "ACTIVE" &&
      persistedGrant.accessType ===
        "REGISTERED" &&
      persistedGrant.registrationCycle ===
        1,
      "Signed ISSUE did not persist expected Branch Access grant.",
    );

    const persistedAuthorization =
      after.data.branchCredentialEnrollmentAuthorizations
        ?.find(
          (item) =>
            item.authorizationId ===
              authorizationId,
        );

    assert(
      persistedAuthorization?.userId ===
        userId &&
      persistedAuthorization.username ===
        "branch.admin" &&
      persistedAuthorization.fullName ===
        "Branch Administrator" &&
      persistedAuthorization.role ===
        "ADMIN" &&
      persistedAuthorization.storageMode ===
        "LOCAL" &&
      persistedAuthorization.dataContext ===
        "REAL" &&
      persistedAuthorization.method ===
        "SET_PASSWORD_ON_RECIPIENT" &&
      persistedAuthorization.oneTime ===
        true,
      "Credential enrollment authorization was not persisted correctly.",
    );

    assert(
      (
        after.data.branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        credentialCountBefore +
          1,
      "Credential authorization was not added exactly once.",
    );

    assert(
      after.data.appliedControlPackages
        ?.some(
          (item) =>
            item.packageId ===
              "PACKAGE-BRANCH-ACCESS-RECIPIENT-ISSUE",
        ),
      "Successful ISSUE is missing from replay ledger.",
    );

    assert(
      after.data.activations.length ===
        activationCountBefore,
      "BRANCH_ACCESS ISSUE mutated Branch Activation state.",
    );

    console.log(
      "PASS: signed ISSUE atomically persisted Branch Access grant",
    );

    console.log(
      "PASS: signed ISSUE atomically persisted credential authorization",
    );

    console.log(
      "PASS: successful ISSUE persisted in replay ledger",
    );

    console.log(
      "PASS: BRANCH_ACCESS ISSUE did not mutate Branch Activation state",
    );


    // --------------------------------------------------------
    // REPLAY
    // --------------------------------------------------------

    const replayResult =
      await applyFinoraSignedBranchAccessPackage(
        signedPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "same signed BRANCH_ACCESS ISSUE replay rejected",
      replayResult,
    );


    // ========================================================
    // STALE / EQUAL SEQUENCE
    // ========================================================

    const staleIssuedAt =
      new Date(
        now.getTime() +
          500,
      ).toISOString();

    const staleGrant:
      FinoraBranchAccessGrantPayload = {
        ...accessGrant,

        updatedAt:
          staleIssuedAt,
      };

    const stalePackage =
      await signFinoraBranchAccessPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-STALE",

        sequence:
          1,

        issuedAt:
          staleIssuedAt,

        target,

        payload: {
          action:
            "REPLACE",

          accessGrant:
            staleGrant,

          issuedAt:
            staleIssuedAt,

          schemaVersion:
            1,
        },
      });

    const staleResult =
      await applyFinoraSignedBranchAccessPackage(
        stalePackage,
        trustedKeys,
        new Date(
          staleIssuedAt,
        ),
      );

    expectFailure(
      "equal/stale BRANCH_ACCESS sequence rejected",
      staleResult,
    );


    // ========================================================
    // REPLACE - PRESERVE ACTIVE STATUS
    // ========================================================

    const replaceIssuedAt =
      new Date(
        now.getTime() +
          1000,
      ).toISOString();

    const replaceGrant:
      FinoraBranchAccessGrantPayload = {
        ...accessGrant,

        updatedAt:
          replaceIssuedAt,
      };

    const replacePayload:
      FinoraBranchAccessPayloadV1 = {
        action:
          "REPLACE",

        accessGrant:
          replaceGrant,

        issuedAt:
          replaceIssuedAt,

        schemaVersion:
          1,
      };

    const replacePackage =
      await signFinoraBranchAccessPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-REPLACE",

        sequence:
          2,

        issuedAt:
          replaceIssuedAt,

        target,

        payload:
          replacePayload,
      });

    const replaceResult =
      await applyFinoraSignedBranchAccessPackage(
        replacePackage,
        trustedKeys,
        new Date(
          replaceIssuedAt,
        ),
      );

    expectSuccess(
      "real signed BRANCH_ACCESS REPLACE applied",
      replaceResult,
    );


    // ========================================================
    // RENEW - REGISTERED CYCLE 2
    // ========================================================

    const renewIssuedAt =
      new Date(
        now.getTime() +
          2000,
      ).toISOString();

    const renewalValidFrom =
      renewIssuedAt;

    const renewalValidUntil =
      addDays(
        renewalValidFrom,
        365,
      );

    const renewGrant:
      FinoraBranchAccessGrantPayload = {

        ...replaceGrant,

        validity: {
          validFrom:
            renewalValidFrom,

          validUntil:
            renewalValidUntil,
        },

        registrationPayment: {
          amount:
            2000,

          currency:
            "INR",

          paymentMode:
            "CASH",

          paidAt:
            renewalValidFrom,

          remarks:
            "FINORA signed Branch Access recipient RENEW self-test.",

          refundable:
            false,
        },

        registrationCycle:
          2,

        updatedAt:
          renewIssuedAt,
      };

    const renewPayload:
      FinoraBranchAccessPayloadV1 = {
        action:
          "RENEW",

        accessGrant:
          renewGrant,

        issuedAt:
          renewIssuedAt,

        schemaVersion:
          1,
      };

    const renewPackage =
      await signFinoraBranchAccessPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-RENEW",

        sequence:
          3,

        issuedAt:
          renewIssuedAt,

        target,

        payload:
          renewPayload,
      });

    const renewResult =
      await applyFinoraSignedBranchAccessPackage(
        renewPackage,
        trustedKeys,
        new Date(
          renewIssuedAt,
        ),
      );

    expectSuccess(
      "real signed BRANCH_ACCESS RENEW applied",
      renewResult,
    );


    // ========================================================
    // SUSPEND - ACTIVE -> SUSPENDED
    //
    // Status action preserves every grant metadata field except
    // administrativeStatus and updatedAt.
    // ========================================================

    const suspendIssuedAt =
      new Date(
        now.getTime() +
          3000,
      ).toISOString();

    const suspendGrant:
      FinoraBranchAccessGrantPayload = {
        ...renewGrant,

        administrativeStatus:
          "SUSPENDED",

        updatedAt:
          suspendIssuedAt,
      };

    const suspendPackage =
      await signFinoraBranchAccessPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-SUSPEND",

        sequence:
          4,

        issuedAt:
          suspendIssuedAt,

        target,

        payload: {
          action:
            "SUSPEND",

          accessGrant:
            suspendGrant,

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
      "real signed BRANCH_ACCESS SUSPEND applied",
      suspendResult,
    );


    // ========================================================
    // RESUME - SUSPENDED -> ACTIVE
    // ========================================================

    const resumeIssuedAt =
      new Date(
        now.getTime() +
          4000,
      ).toISOString();

    const resumeGrant:
      FinoraBranchAccessGrantPayload = {
        ...suspendGrant,

        administrativeStatus:
          "ACTIVE",

        updatedAt:
          resumeIssuedAt,
      };

    const resumePackage =
      await signFinoraBranchAccessPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-RESUME",

        sequence:
          5,

        issuedAt:
          resumeIssuedAt,

        target,

        payload: {
          action:
            "RESUME",

          accessGrant:
            resumeGrant,

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
      "real signed BRANCH_ACCESS RESUME applied",
      resumeResult,
    );


    // ========================================================
    // REVOKE - ACTIVE -> REVOKED
    // ========================================================

    const revokeIssuedAt =
      new Date(
        now.getTime() +
          5000,
      ).toISOString();

    const revokeGrant:
      FinoraBranchAccessGrantPayload = {
        ...resumeGrant,

        administrativeStatus:
          "REVOKED",

        updatedAt:
          revokeIssuedAt,
      };

    const revokePackage =
      await signFinoraBranchAccessPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-REVOKE",

        sequence:
          6,

        issuedAt:
          revokeIssuedAt,

        target,

        payload: {
          action:
            "REVOKE",

          accessGrant:
            revokeGrant,

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
      "real signed BRANCH_ACCESS REVOKE applied",
      revokeResult,
    );

    const finalStore =
      await readFinoraControlStore();

    assert(
      finalStore.success &&
        finalStore.data,
      finalStore.error ??
        "Unable to read final Control Store.",
    );

    const finalGrant =
      finalStore.data.branchAccessGrants
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
      finalGrant?.grantId ===
        grantId &&
      finalGrant.accessType ===
        "REGISTERED" &&
      finalGrant.administrativeStatus ===
        "REVOKED" &&
      finalGrant.registrationCycle ===
        2 &&
      finalGrant.validity.validFrom ===
        renewalValidFrom &&
      finalGrant.validity.validUntil ===
        renewalValidUntil &&
      finalGrant.createdAt ===
        createdAt,
      "Final Branch Access lifecycle state is incorrect.",
    );

    const successfulPackageIds =
      [
        "PACKAGE-BRANCH-ACCESS-RECIPIENT-ISSUE",
        "PACKAGE-BRANCH-ACCESS-RECIPIENT-REPLACE",
        "PACKAGE-BRANCH-ACCESS-RECIPIENT-RENEW",
        "PACKAGE-BRANCH-ACCESS-RECIPIENT-SUSPEND",
        "PACKAGE-BRANCH-ACCESS-RECIPIENT-RESUME",
        "PACKAGE-BRANCH-ACCESS-RECIPIENT-REVOKE",
      ];

    for (
      const packageId of
      successfulPackageIds
    ) {

      assert(
        finalStore.data.appliedControlPackages
          ?.some(
            (item) =>
              item.packageId ===
                packageId,
          ),
        `Successful Branch Access package missing from replay ledger: ${packageId}`,
      );
    }

    assert(
      !finalStore.data.appliedControlPackages
        ?.some(
          (item) =>
            item.packageId ===
              "PACKAGE-BRANCH-ACCESS-RECIPIENT-STALE",
        ),
      "Rejected stale-sequence package was persisted in replay ledger.",
    );

    assert(
      finalStore.data.activations.length ===
        activationCountBefore,
      "BRANCH_ACCESS lifecycle mutated Branch Activation state.",
    );

    console.log(
      "PASS: final Branch Access state = REVOKED with REGISTERED renewal cycle 2",
    );

    console.log(
      "PASS: all six successful BRANCH_ACCESS lifecycle packages persisted in replay ledger",
    );

    console.log(
      "PASS: rejected stale-sequence package did not enter replay ledger",
    );

    console.log(
      "PASS: full BRANCH_ACCESS lifecycle did not mutate Branch Activation state",
    );
    assert(
      (
        finalStore.data.branchCredentialEnrollmentAuthorizations
          ?.filter(
            (item) =>
              item.authorizationId ===
                authorizationId,
          ).length ??
        0
      ) ===
        1,
      "Replay duplicated credential authorization.",
    );

    console.log(
      "PASS: replay did not duplicate credential authorization",
    );


    // ========================================================
    // RECIPIENT NEGATIVE MATRIX BASELINE
    //
    // Every package below must fail before authoritative Control
    // Store mutation. All recipient state is compared byte-for-
    // byte through JSON after the complete rejection matrix.
    // ========================================================

    const negativeBaselineStore =
      await readFinoraControlStore();

    assert(
      negativeBaselineStore.success &&
        negativeBaselineStore.data,
      negativeBaselineStore.error ??
        "Unable to read negative-matrix baseline Control Store.",
    );

    const negativeBaselineJson =
      JSON.stringify(
        negativeBaselineStore.data,
      );


    // ========================================================
    // 1. BAD SIGNATURE
    //
    // Start from a genuine production-signed BRANCH_ACCESS
    // package and corrupt only signature bytes.
    // ========================================================

    const corruptedSignature =
      `${
        revokePackage.signature.value.startsWith(
          "A",
        )
          ? "B"
          : "A"
      }${
        revokePackage.signature.value.slice(
          1,
        )
      }`;

    const badSignaturePackage = {
      ...revokePackage,

      signature: {
        ...revokePackage.signature,

        value:
          corruptedSignature,
      },
    };

    const badSignatureResult =
      await applyFinoraSignedBranchAccessPackage(
        badSignaturePackage,
        trustedKeys,
        new Date(
          revokeIssuedAt,
        ),
      );

    expectFailure(
      "tampered BRANCH_ACCESS signature rejected",
      badSignatureResult,
    );


    // ========================================================
    // COMMON CRYPTOGRAPHICALLY VALID MALFORMED PACKAGE TIME
    //
    // Sequence 7 is intentionally reused because every package
    // below must be rejected before Control Store sequence state
    // advances beyond the successful REVOKE sequence 6.
    // ========================================================

    const negativeIssuedAt =
      new Date(
        now.getTime() +
          6000,
      ).toISOString();

    const genericPayload = {
      action:
        "REPLACE",

      accessGrant:
        revokeGrant,

      issuedAt:
        negativeIssuedAt,

      schemaVersion:
        1 as const,
    };


    // ========================================================
    // 2. CRYPTOGRAPHICALLY VALID WRONG PURPOSE
    // ========================================================

    const wrongPurposePackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-WRONG-PURPOSE",

        purpose:
          "BUSINESS_PROFILE",

        target,

        issuedAt:
          negativeIssuedAt,

        sequence:
          7,

        payloadVersion:
          1,

        payload:
          genericPayload,

        schemaVersion:
          1,
      });

    const wrongPurposeResult =
      await applyFinoraSignedBranchAccessPackage(
        wrongPurposePackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "cryptographically valid wrong-purpose package rejected by BRANCH_ACCESS recipient",
      wrongPurposeResult,
    );


    // ========================================================
    // 3. WRONG OWNER TARGET
    // ========================================================

    const wrongOwnerPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-WRONG-OWNER",

        purpose:
          "BRANCH_ACCESS",

        target: {
          ...target,

          ownerId:
            "OWNER-WRONG-BRANCH-ACCESS-RECIPIENT-SELFTEST",
        },

        issuedAt:
          negativeIssuedAt,

        sequence:
          7,

        payloadVersion:
          1,

        payload:
          genericPayload,

        schemaVersion:
          1,
      });

    const wrongOwnerResult =
      await applyFinoraSignedBranchAccessPackage(
        wrongOwnerPackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "cryptographically valid wrong owner target rejected",
      wrongOwnerResult,
    );


    // ========================================================
    // 4. WRONG BUSINESS TARGET
    // ========================================================

    const wrongBusinessPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-WRONG-BUSINESS",

        purpose:
          "BRANCH_ACCESS",

        target: {
          ...target,

          businessId:
            "BUSINESS-WRONG-BRANCH-ACCESS-RECIPIENT-SELFTEST",
        },

        issuedAt:
          negativeIssuedAt,

        sequence:
          7,

        payloadVersion:
          1,

        payload:
          genericPayload,

        schemaVersion:
          1,
      });

    const wrongBusinessResult =
      await applyFinoraSignedBranchAccessPackage(
        wrongBusinessPackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "cryptographically valid wrong business target rejected",
      wrongBusinessResult,
    );


    // ========================================================
    // 5. WRONG BRANCH TARGET
    // ========================================================

    const wrongBranchPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-WRONG-BRANCH",

        purpose:
          "BRANCH_ACCESS",

        target: {
          ...target,

          branchId:
            "BRANCH-WRONG-BRANCH-ACCESS-RECIPIENT-SELFTEST",
        },

        issuedAt:
          negativeIssuedAt,

        sequence:
          7,

        payloadVersion:
          1,

        payload:
          genericPayload,

        schemaVersion:
          1,
      });

    const wrongBranchResult =
      await applyFinoraSignedBranchAccessPackage(
        wrongBranchPackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "cryptographically valid wrong branch target rejected",
      wrongBranchResult,
    );


    // ========================================================
    // 6. WRONG INSTALLATION
    // ========================================================

    const wrongInstallationPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-WRONG-INSTALLATION",

        purpose:
          "BRANCH_ACCESS",

        target: {
          ...target,

          installationId:
            "INSTALLATION-WRONG-BRANCH-ACCESS-RECIPIENT-SELFTEST",
        },

        issuedAt:
          negativeIssuedAt,

        sequence:
          7,

        payloadVersion:
          1,

        payload:
          genericPayload,

        schemaVersion:
          1,
      });

    const wrongInstallationResult =
      await applyFinoraSignedBranchAccessPackage(
        wrongInstallationPackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "cryptographically valid wrong installation rejected",
      wrongInstallationResult,
    );


    // ========================================================
    // 7. WRONG NATIVE BINDING
    //
    // Pair is internally coherent:
    // fingerprint -> FINORA-BINDING-{UPPERCASE fingerprint}
    //
    // It is nevertheless not this installation's native binding.
    // ========================================================

    const wrongBindingFingerprint =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const wrongBindingKeyId =
      "FINORA-BINDING-0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF";

    assert(
      wrongBindingFingerprint !==
        nativeBinding.publicKeyFingerprint,
      "Synthetic wrong binding unexpectedly matches native fingerprint.",
    );

    assert(
      wrongBindingKeyId !==
        nativeBinding.bindingKeyId,
      "Synthetic wrong binding unexpectedly matches native bindingKeyId.",
    );

    const wrongBindingPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-WRONG-BINDING",

        purpose:
          "BRANCH_ACCESS",

        target: {
          ...target,

          bindingKeyId:
            wrongBindingKeyId,

          publicKeyFingerprint:
            wrongBindingFingerprint,
        },

        issuedAt:
          negativeIssuedAt,

        sequence:
          7,

        payloadVersion:
          1,

        payload:
          genericPayload,

        schemaVersion:
          1,
      });

    const wrongBindingResult =
      await applyFinoraSignedBranchAccessPackage(
        wrongBindingPackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "cryptographically valid wrong native binding rejected",
      wrongBindingResult,
    );


    // ========================================================
    // 8. SIGNED ACCESS GRANT SCOPE MISMATCH
    //
    // Envelope target is exact and therefore passes native target
    // verification. Payload Grant owner scope is intentionally
    // different so the recipient domain guard must reject it.
    // ========================================================

    const wrongGrantScopePackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-WRONG-GRANT-SCOPE",

        purpose:
          "BRANCH_ACCESS",

        target,

        issuedAt:
          negativeIssuedAt,

        sequence:
          7,

        payloadVersion:
          1,

        payload: {
          action:
            "REPLACE",

          accessGrant: {
            ...revokeGrant,

            ownerId:
              "OWNER-WRONG-GRANT-SCOPE-BRANCH-ACCESS-SELFTEST",
          },

          issuedAt:
            negativeIssuedAt,

          schemaVersion:
            1,
        },

        schemaVersion:
          1,
      });

    const wrongGrantScopeResult =
      await applyFinoraSignedBranchAccessPackage(
        wrongGrantScopePackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "cryptographically valid signed Access Grant scope mismatch rejected",
      wrongGrantScopeResult,
    );


    // ========================================================
    // 9. CREDENTIAL AUTHORIZATION ON NON-ISSUE
    //
    // Dedicated Branch Access issuer intentionally refuses to
    // create this package. Generic signer creates a valid
    // cryptographic envelope so recipient enforcement itself is
    // exercised.
    // ========================================================

    const credentialOnRenewPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-CREDENTIAL-ON-RENEW",

        purpose:
          "BRANCH_ACCESS",

        target,

        issuedAt:
          negativeIssuedAt,

        sequence:
          7,

        payloadVersion:
          1,

        payload: {
          action:
            "RENEW",

          accessGrant:
            revokeGrant,

          credentialEnrollment,

          issuedAt:
            negativeIssuedAt,

          schemaVersion:
            1,
        },

        schemaVersion:
          1,
      });

    const credentialOnRenewResult =
      await applyFinoraSignedBranchAccessPackage(
        credentialOnRenewPackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "cryptographically valid credential authorization on non-ISSUE rejected",
      credentialOnRenewResult,
    );


    // ========================================================
    // 10. UNSUPPORTED BRANCH_ACCESS PAYLOAD VERSION
    //
    // Generic signed package is cryptographically valid.
    // Native verification succeeds; Branch Access recipient
    // rejects domain payloadVersion 2.
    // ========================================================

    const unsupportedPayloadVersionPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-UNSUPPORTED-PAYLOAD-VERSION",

        purpose:
          "BRANCH_ACCESS",

        target,

        issuedAt:
          negativeIssuedAt,

        sequence:
          7,

        payloadVersion:
          2,

        payload:
          genericPayload,

        schemaVersion:
          1,
      });

    const unsupportedPayloadVersionResult =
      await applyFinoraSignedBranchAccessPackage(
        unsupportedPayloadVersionPackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "unsupported BRANCH_ACCESS payload version rejected",
      unsupportedPayloadVersionResult,
    );

    assert(
      unsupportedPayloadVersionResult.error?.includes(
        "FINORA BRANCH_ACCESS payload version is unsupported.",
      ),
      "Unsupported payload-version package did not reach the expected Branch Access recipient guard.",
    );

    console.log(
      "PASS: unsupported payload version reached exact recipient guard",
    );


    // ========================================================
    // 11. EXPIRED CRYPTOGRAPHICALLY VALID CONTROL PACKAGE
    // ========================================================

    const expiredIssuedAt =
      new Date(
        Date.parse(
          negativeIssuedAt,
        ) -
          120000,
      ).toISOString();

    const expiredAt =
      new Date(
        Date.parse(
          negativeIssuedAt,
        ) -
          60000,
      ).toISOString();

    const expiredPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-EXPIRED",

        purpose:
          "BRANCH_ACCESS",

        target,

        issuedAt:
          expiredIssuedAt,

        validity: {
          expiresAt:
            expiredAt,
        },

        sequence:
          7,

        payloadVersion:
          1,

        payload: {
          action:
            "REPLACE",

          accessGrant:
            revokeGrant,

          issuedAt:
            expiredIssuedAt,

          schemaVersion:
            1,
        },

        schemaVersion:
          1,
      });

    const expiredPackageResult =
      await applyFinoraSignedBranchAccessPackage(
        expiredPackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "expired control package rejected",
      expiredPackageResult,
    );

    assert(
      expiredPackageResult.error?.includes(
        "PACKAGE_EXPIRED",
      ) &&
      expiredPackageResult.error.includes(
        "FINORA Control Package has expired.",
      ),
      "Expired package did not reach the generic verifier expiry guard.",
    );

    console.log(
      "PASS: expired package reached exact PACKAGE_EXPIRED verifier guard",
    );


    // ========================================================
    // 12. NOT-YET-VALID CRYPTOGRAPHICALLY VALID PACKAGE
    // ========================================================

    const notBefore =
      new Date(
        Date.parse(
          negativeIssuedAt,
        ) +
          60000,
      ).toISOString();

    const notYetValidPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-NOT-YET-VALID",

        purpose:
          "BRANCH_ACCESS",

        target,

        issuedAt:
          negativeIssuedAt,

        validity: {
          notBefore,
        },

        sequence:
          7,

        payloadVersion:
          1,

        payload:
          genericPayload,

        schemaVersion:
          1,
      });

    const notYetValidResult =
      await applyFinoraSignedBranchAccessPackage(
        notYetValidPackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "not-yet-valid control package rejected",
      notYetValidResult,
    );

    assert(
      notYetValidResult.error?.includes(
        "NOT_YET_VALID",
      ) &&
      notYetValidResult.error.includes(
        "FINORA Control Package is not valid yet.",
      ),
      "Future notBefore package did not reach the expected verifier guard.",
    );

    console.log(
      "PASS: not-yet-valid package reached exact NOT_YET_VALID verifier guard",
    );


    // ========================================================
    // 13. MALFORMED EXACT-KEY BRANCH_ACCESS PAYLOAD
    //
    // Signature and payload digest remain valid.
    // Extra domain key must be rejected after verification.
    // ========================================================

    const malformedPayloadPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-MALFORMED-PAYLOAD",

        purpose:
          "BRANCH_ACCESS",

        target,

        issuedAt:
          negativeIssuedAt,

        sequence:
          7,

        payloadVersion:
          1,

        payload: {
          action:
            "REPLACE",

          accessGrant:
            revokeGrant,

          issuedAt:
            negativeIssuedAt,

          schemaVersion:
            1,

          unexpectedField:
            true,
        },

        schemaVersion:
          1,
      });

    const malformedPayloadResult =
      await applyFinoraSignedBranchAccessPackage(
        malformedPayloadPackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "malformed BRANCH_ACCESS payload rejected",
      malformedPayloadResult,
    );

    assert(
      malformedPayloadResult.error?.includes(
        "FINORA BRANCH_ACCESS payload structure is invalid.",
      ),
      "Malformed payload did not reach the exact-key Branch Access payload guard.",
    );

    console.log(
      "PASS: malformed payload reached exact recipient structure guard",
    );


    // ========================================================
    // 14. INVALID SIGNED ACCESS GRANT
    //
    // Payload structure itself is valid, but REGISTERED
    // registrationCycle 0 is invalid at recipient sanitizer.
    // ========================================================

    const invalidAccessGrantPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-INVALID-GRANT",

        purpose:
          "BRANCH_ACCESS",

        target,

        issuedAt:
          negativeIssuedAt,

        sequence:
          7,

        payloadVersion:
          1,

        payload: {
          action:
            "REPLACE",

          accessGrant: {
            ...revokeGrant,

            registrationCycle:
              0,
          },

          issuedAt:
            negativeIssuedAt,

          schemaVersion:
            1,
        },

        schemaVersion:
          1,
      });

    const invalidAccessGrantResult =
      await applyFinoraSignedBranchAccessPackage(
        invalidAccessGrantPackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "invalid signed Access Grant rejected",
      invalidAccessGrantResult,
    );

    assert(
      invalidAccessGrantResult.error?.includes(
        "FINORA BRANCH_ACCESS signed Access Grant is invalid.",
      ),
      "Invalid Access Grant did not reach the recipient grant sanitizer guard.",
    );

    console.log(
      "PASS: invalid Access Grant reached exact recipient sanitizer guard",
    );


    // ========================================================
    // 15. INVALID CREDENTIAL ENROLLMENT AUTHORIZATION
    //
    // ISSUE is required so the recipient reaches credential
    // sanitizer rather than the earlier non-ISSUE guard.
    // oneTime false makes the signed authorization invalid.
    // No credential secret is introduced.
    // ========================================================

    const invalidCredentialPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-RECIPIENT-INVALID-CREDENTIAL",

        purpose:
          "BRANCH_ACCESS",

        target,

        issuedAt:
          negativeIssuedAt,

        sequence:
          7,

        payloadVersion:
          1,

        payload: {
          action:
            "ISSUE",

          accessGrant,

          credentialEnrollment: {
            ...credentialEnrollment,

            oneTime:
              false,
          },

          issuedAt:
            negativeIssuedAt,

          schemaVersion:
            1,
        },

        schemaVersion:
          1,
      });

    const invalidCredentialResult =
      await applyFinoraSignedBranchAccessPackage(
        invalidCredentialPackage,
        trustedKeys,
        new Date(
          negativeIssuedAt,
        ),
      );

    expectFailure(
      "invalid credential enrollment authorization rejected",
      invalidCredentialResult,
    );

    assert(
      invalidCredentialResult.error?.includes(
        "FINORA BRANCH_ACCESS credential enrollment authorization is invalid.",
      ),
      "Invalid credential authorization did not reach the recipient credential sanitizer guard.",
    );

    console.log(
      "PASS: invalid credential authorization reached exact recipient sanitizer guard",
    );


    // ========================================================
    // NEGATIVE MATRIX MUST BE ZERO-MUTATION
    // ========================================================

    const negativeFinalStore =
      await readFinoraControlStore();

    assert(
      negativeFinalStore.success &&
        negativeFinalStore.data,
      negativeFinalStore.error ??
        "Unable to read post-negative Control Store.",
    );

    const negativeFinalJson =
      JSON.stringify(
        negativeFinalStore.data,
      );

    assert(
      negativeFinalJson ===
        negativeBaselineJson,
      "Rejected signed BRANCH_ACCESS negative packages mutated authoritative Control Store state.",
    );

    console.log(
      "PASS: rejected signed negative matrix left entire Control Store unchanged",
    );

    console.log(
      "PASS: bad signature / purpose / owner / business / branch / installation / binding / grant scope / credential-action guards fail closed",
    );

    console.log(
      "PASS: payload-version / expiry / not-before / payload-shape / grant-sanitizer / credential-sanitizer guards fail closed",
    );

    console.log(
      "PASS: FINORA SIGNED BRANCH ACCESS RECIPIENT SECURITY CLOSURE SELFTEST",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA SIGNED BRANCH ACCESS RECIPIENT LIFECYCLE E2E SELFTEST",
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
        "PASS: BRANCH_ACCESS recipient lifecycle self-test process exiting with code 0",
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
        "FAIL: FINORA SIGNED BRANCH ACCESS RECIPIENT LIFECYCLE E2E SELFTEST",
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