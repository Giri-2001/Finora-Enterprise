/* ============================================================
   FINORA BRANCH CREDENTIAL ENROLLMENT BUNDLE APPLY SELF TEST

   D4E4I5D2 PROOF:

   VALID:
   - isolated recipient installation + native P-256 binding
   - real Control Center signing authority
   - active REGISTERED Branch Access bootstrap
   - real two-child Credential Enrollment Bundle
   - both child signatures verified before mutation
   - credential authorization persisted
   - Branch Access signer verification evidence persisted
   - reusable portability authority provenance persisted
   - portability child NOT entered into normal replay ledger
   - portability child NOT entered into normal sequence state

   ZERO-MUTATION NEGATIVE MATRIX:
   - tampered portability signature
   - portability branch target mismatch
   - authorization lineage mismatch
   - malformed unsigned wrapper

   Every negative case proves entire authoritative Control Store
   JSON is identical before and after rejection.

   Different-valid-signer proof is intentionally separate because
   it requires a genuine second trusted Control Center signing key.
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
  getFinoraControlCenterPublicIdentity,
} from "../control-center/finoraControlCenterKeyVault.js";

import {
  issueFinoraBranchCredentialEnrollmentBundle,
} from "../control-center/finoraBranchCredentialEnrollmentBundleIssuer.js";

import {
  issueFinoraBranchAccessPackage,
} from "../control-center/finoraControlCenterIssuanceCoordinator.js";

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

function verificationNow():
  Date {

  /*
   * Control Center issuance uses the real clock.
   * Give newly-issued packages a small positive verification
   * margin so the test cannot race issuedAt by milliseconds.
   */
  return new Date(
    Date.now() +
      5_000,
  );
}

function tamperSignature(
  value:
    string,
): string {

  assert(
    value.length >
      0,
    "Cannot tamper an empty signature.",
  );

  const replacement =
    value[0] ===
      "A"
      ? "B"
      : "A";

  return (
    replacement +
    value.slice(
      1,
    )
  );
}

async function readControlStoreJson():
  Promise<string> {

  const result =
    await readFinoraControlStore();

  assert(
    result.success &&
      result.data,
    result.error ??
      "Unable to read FINORA Control Store.",
  );

  return JSON.stringify(
    result.data,
  );
}

async function runSelfTest():
  Promise<void> {

  let temporaryUserData:
    string |
    undefined;

  try {
    // ========================================================
    // 1. ISOLATED ELECTRON USERDATA
    // ========================================================

    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-i5d2-bundle-apply-",
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
    // 2. NATIVE INSTALLATION BINDING
    // ========================================================

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0 &&
      nativeBinding.bindingKeyId.length >
        0 &&
      nativeBinding.publicKeyFingerprint.length ===
        64,
      "Native installation binding is incomplete.",
    );

    console.log(
      "PASS: isolated native installation binding created",
    );

    // ========================================================
    // 3. CONTROL STORE INSTALLATION IDENTITY
    // ========================================================

    const setupNow =
      new Date();

    const createdAt =
      new Date(
        setupNow.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const ownerId =
      "OWNER-I5D2";

    const businessId =
      "BUSINESS-I5D2";

    const branchId =
      "BRANCH-I5D2";

    const userId =
      "USER-I5D2-ADMIN";

    const grantId =
      "GRANT-I5D2-REGISTERED";

    const installation:
      FinoraControlInstallationIdentity = {

        installationId:
          nativeBinding.installationId,

        ownerId,

        businessId,

        branchId,

        businessCode:
          "I5D2",

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

    // ========================================================
    // 4. REAL CONTROL CENTER PUBLIC IDENTITY -> TRUST SET
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
              setupNow.getTime() -
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

    // ========================================================
    // 5. EXACT RECIPIENT TARGET
    // ========================================================

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
    // 6. ACTIVE REGISTERED BRANCH ACCESS BOOTSTRAP
    //
    // This consumes BRANCH_ACCESS issuance sequence 1.
    // The later enrollment bundle therefore receives sequence 2.
    // ========================================================

    const accessValidFrom =
      createdAt;

    const accessValidUntil =
      addDays(
        accessValidFrom,
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
          validFrom:
            accessValidFrom,

          validUntil:
            accessValidUntil,
        },

        registrationPayment: {
          amount:
            2000,

          currency:
            "INR",

          paymentMode:
            "CASH",

          paidAt:
            accessValidFrom,

          remarks:
            "FINORA I5D2 recipient composition E2E bootstrap.",

          refundable:
            false,
        },

        registrationCycle:
          1,

        createdAt,

        updatedAt:
          createdAt,

        schemaVersion:
          1,
      };

    const bootstrapPackage =
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

    const bootstrapApply =
      await applyFinoraSignedBranchAccessPackage(
        bootstrapPackage,
        trustedKeys,
        verificationNow(),
      );

    expectSuccess(
      "active REGISTERED Branch Access bootstrap applied",
      bootstrapApply,
    );

    const bootstrapStore =
      await readFinoraControlStore();

    assert(
      bootstrapStore.success &&
        bootstrapStore.data,
      bootstrapStore.error ??
        "Unable to read bootstrap Control Store.",
    );

    const activeGrant =
      bootstrapStore.data.branchAccessGrants
        ?.find(
          (
            item,
          ) =>
            item.grantId ===
              grantId &&
            item.userId ===
              userId,
        );

    assert(
      activeGrant?.administrativeStatus ===
        "ACTIVE" &&
      activeGrant.accessType ===
        "REGISTERED" &&
      activeGrant.storageMode ===
        "LOCAL",
      "Bootstrap did not establish the required active Branch Access grant.",
    );

    console.log(
      "PASS: recipient has matching active REGISTERED Branch Access grant",
    );

    // ========================================================
    // 7. SOURCE CREDENTIAL AUTHORIZATION
    // ========================================================

    const authorizationId =
      "FINORA-CREDENTIAL-ENROLLMENT-I5D2-000001";

    const sourceAuthorization:
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

    // ========================================================
    // 8. REAL TWO-CHILD BUNDLE ISSUANCE
    // ========================================================

    const validBundle =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target,
        sourceAuthorization,
      });

    assert(
      validBundle.branchAccessPackage.purpose ===
        "BRANCH_ACCESS" &&
      validBundle.branchAccessPackage.payload.action ===
        "AUTHORIZE_CREDENTIAL" &&
      validBundle.branchPortabilityAuthorityPackage.purpose ===
        "BRANCH_PORTABILITY_AUTHORITY" &&
      validBundle.branchAccessPackage.sequence ===
        2,
      "Control Center did not issue the expected I5D2 composition.",
    );

    console.log(
      "PASS: real two-child Credential Enrollment Bundle issued after active-grant bootstrap",
    );

    // ========================================================
    // 9. VALID RECIPIENT COMPOSITION APPLY
    // ========================================================

    const validApplyNow =
      verificationNow();

    const validApply =
      await applyFinoraBranchCredentialEnrollmentBundle(
        validBundle,
        trustedKeys,
        validApplyNow,
      );

    expectSuccess(
      "valid Credential Enrollment Bundle applied",
      validApply,
    );

    // ========================================================
    // 10. ATOMIC PERSISTENCE PROOF
    // ========================================================

    const validAfter =
      await readFinoraControlStore();

    assert(
      validAfter.success &&
        validAfter.data,
      validAfter.error ??
        "Unable to read post-I5D2 Control Store.",
    );

    const persistedAuthorization =
      validAfter.data.branchCredentialEnrollmentAuthorizations
        ?.find(
          (
            item,
          ) =>
            item.authorizationId ===
              authorizationId,
        );

    assert(
      persistedAuthorization?.userId ===
        userId &&
      persistedAuthorization.username ===
        "branch.admin" &&
      persistedAuthorization.ownerId ===
        ownerId &&
      persistedAuthorization.businessId ===
        businessId &&
      persistedAuthorization.branchId ===
        branchId &&
      persistedAuthorization.storageMode ===
        "LOCAL" &&
      persistedAuthorization.dataContext ===
        "REAL",
      "Valid composition did not persist the expected credential authorization.",
    );

    console.log(
      "PASS: credential authorization persisted",
    );

    const persistedVerificationEvidence =
      validAfter.data.branchCredentialAuthorizationVerificationEvidence
        ?.find(
          (
            item,
          ) =>
            item.authorizationId ===
              authorizationId,
        );

    assert(
      persistedVerificationEvidence?.packageId ===
        validBundle.branchAccessPackage.packageId &&
      persistedVerificationEvidence.issuerId ===
        publicIdentity.issuerId &&
      persistedVerificationEvidence.verifiedControlSigner.signingKeyId ===
        publicIdentity.signingKeyId &&
      persistedVerificationEvidence.verifiedAt ===
        validApplyNow.toISOString(),
      "Valid composition did not persist exact Branch Access signer verification evidence.",
    );

    console.log(
      "PASS: exact Branch Access signer verification evidence persisted",
    );

    const persistedPortability =
      validAfter.data.branchCredentialPortabilityAuthorities
        ?.find(
          (
            item,
          ) =>
            item.sourceAuthorizationId ===
              authorizationId,
        );

    assert(
      persistedPortability?.signedPortabilityAuthorityPackage.packageId ===
        validBundle.branchPortabilityAuthorityPackage.packageId &&
      persistedPortability.verifiedControlSigner.issuerId ===
        publicIdentity.issuerId &&
      persistedPortability.verifiedControlSigner.signingKeyId ===
        publicIdentity.signingKeyId &&
      persistedPortability.verifiedControlSigner.publicKey ===
        publicIdentity.publicKeySpkiDerBase64 &&
      persistedPortability.verifiedAt ===
        validApplyNow.toISOString(),
      "Valid composition did not atomically persist exact portability provenance.",
    );

    console.log(
      "PASS: reusable signed portability authority + exact verified signer provenance persisted",
    );

    const appliedPackagesJson =
      JSON.stringify(
        validAfter.data.appliedControlPackages ??
          [],
      );

    assert(
      appliedPackagesJson.includes(
        validBundle.branchAccessPackage.packageId,
      ),
      "BRANCH_ACCESS AUTHORIZE_CREDENTIAL child was not recorded in normal replay state.",
    );

    assert(
      !appliedPackagesJson.includes(
        validBundle.branchPortabilityAuthorityPackage.packageId,
      ),
      "Reusable portability authority incorrectly entered the normal applied-package replay ledger.",
    );

    const sequenceJson =
      JSON.stringify(
        validAfter.data.controlSequences ??
          [],
      );

    assert(
      !sequenceJson.includes(
        "BRANCH_PORTABILITY_AUTHORITY",
      ),
      "Reusable portability authority incorrectly entered normal Control Store sequence state.",
    );

    console.log(
      "PASS: portability child remains outside normal replay and sequence state",
    );

    console.log(
      "PASS: valid I5D composition completed one authoritative credential/provenance persistence path",
    );

    // ========================================================
    // NEGATIVE HELPER
    // ========================================================

    async function expectZeroMutationFailure(
      label:
        string,

      candidate:
        unknown,

      expectedErrorFragment?:
        string,
    ): Promise<void> {

      const beforeJson =
        await readControlStoreJson();

      const result =
        await applyFinoraBranchCredentialEnrollmentBundle(
          candidate,
          trustedKeys,
          verificationNow(),
        );

      expectFailure(
        label,
        result,
      );

      if (
        expectedErrorFragment !==
          undefined
      ) {
        assert(
          result.error?.includes(
            expectedErrorFragment,
          ),
          `${label}: expected error fragment "${expectedErrorFragment}", got "${result.error ?? ""}".`,
        );
      }

      const afterJson =
        await readControlStoreJson();

      assert(
        afterJson ===
          beforeJson,
        `${label}: rejected composition mutated authoritative Control Store state.`,
      );

      console.log(
        `PASS: ${label} left entire Control Store unchanged`,
      );
    }

    // ========================================================
    // 11. TAMPERED PORTABILITY SIGNATURE
    //
    // BRANCH_ACCESS child is valid and verifies first.
    // Portability verification then fails.
    // No authoritative Branch Access mutation may have occurred.
    // ========================================================

    const tamperAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {
        ...sourceAuthorization,

        authorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-I5D2-000002",
      };

    const tamperBundle =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target,

        sourceAuthorization:
          tamperAuthorization,
      });

    const tamperedPortabilitySignature =
      structuredClone(
        tamperBundle,
      );

    tamperedPortabilitySignature
      .branchPortabilityAuthorityPackage
      .signature
      .value =
        tamperSignature(
          tamperedPortabilitySignature
            .branchPortabilityAuthorityPackage
            .signature
            .value,
        );

    await expectZeroMutationFailure(
      "tampered portability signature rejected after BRANCH_ACCESS pre-verification",
      tamperedPortabilitySignature,
      "BRANCH_PORTABILITY_AUTHORITY",
    );

    // ========================================================
    // 12. PORTABILITY BRANCH TARGET MISMATCH
    //
    // The unsigned wrapper's exact branch-scope correlation must
    // reject this before either child can mutate recipient state.
    // ========================================================

    const wrongBranchAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {
        ...sourceAuthorization,

        authorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-I5D2-000003",
      };

    const wrongBranchBundle =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target,

        sourceAuthorization:
          wrongBranchAuthorization,
      });

    const wrongBranchCandidate =
      structuredClone(
        wrongBranchBundle,
      );

    wrongBranchCandidate
      .branchPortabilityAuthorityPackage
      .target
      .branchId =
        "WRONG-BRANCH-I5D2";

    await expectZeroMutationFailure(
      "portability branch target mismatch rejected",
      wrongBranchCandidate,
      "branch scopes do not match",
    );

    // ========================================================
    // 13. AUTHORIZATION LINEAGE MISMATCH
    //
    // Structural composition validation must reject the mismatch
    // before cryptographic application/mutation.
    // ========================================================

    const lineageAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {
        ...sourceAuthorization,

        authorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-I5D2-000004",
      };

    const lineageBundle =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target,

        sourceAuthorization:
          lineageAuthorization,
      });

    const lineageCandidate =
      structuredClone(
        lineageBundle,
      );

    lineageCandidate
      .branchPortabilityAuthorityPackage
      .payload
      .sourceAuthorizationId =
        "FINORA-CREDENTIAL-ENROLLMENT-I5D2-WRONG-LINEAGE";

    await expectZeroMutationFailure(
      "authorization lineage mismatch rejected",
      lineageCandidate,
      "authorization lineage does not match",
    );

    // ========================================================
    // 14. MALFORMED UNSIGNED WRAPPER
    // ========================================================

    const malformedAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {
        ...sourceAuthorization,

        authorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-I5D2-000005",
      };

    const malformedBundle =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target,

        sourceAuthorization:
          malformedAuthorization,
      });

    const malformedWrapper = {
      ...malformedBundle,

      unexpectedAuthority:
        true,
    };

    await expectZeroMutationFailure(
      "malformed enrollment wrapper rejected",
      malformedWrapper,
      "wrapper is invalid",
    );

    // ========================================================
    // 15. FINAL INVARIANTS
    // ========================================================

    const finalStore =
      await readFinoraControlStore();

    assert(
      finalStore.success &&
        finalStore.data,
      finalStore.error ??
        "Unable to read final I5D2 Control Store.",
    );

    const finalAuthorizations =
      finalStore.data.branchCredentialEnrollmentAuthorizations ??
        [];

    const finalPortabilityAuthorities =
      finalStore.data.branchCredentialPortabilityAuthorities ??
        [];

    assert(
      finalAuthorizations.filter(
        (
          item,
        ) =>
          item.authorizationId.startsWith(
            "FINORA-CREDENTIAL-ENROLLMENT-I5D2-",
          ),
      ).length ===
        1,
      "Rejected compositions persisted unexpected credential authorizations.",
    );

    assert(
      finalPortabilityAuthorities.filter(
        (
          item,
        ) =>
          item.sourceAuthorizationId.startsWith(
            "FINORA-CREDENTIAL-ENROLLMENT-I5D2-",
          ),
      ).length ===
        1,
      "Rejected compositions persisted unexpected portability provenance.",
    );

    console.log(
      "PASS: rejected negative matrix persisted no extra credential authorization or portability provenance",
    );

    console.log(
      "PASS: D4E4I5D2-B RECIPIENT COMPOSITION E2E + ZERO-MUTATION MATRIX",
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
        "PASS: isolated temporary FINORA userData deleted",
      );
    }
  }
}

void runSelfTest()
  .then(
    () => {
      console.log(
        "PASS: I5D2 recipient composition self-test process exiting with code 0",
      );

      app.quit();
    },
  )
  .catch(
    (
      error,
    ) => {
      console.error(
        "SELF-TEST FAILED",
      );

      console.error(
        error,
      );

      process.exitCode =
        1;

      app.quit();
    },
  );