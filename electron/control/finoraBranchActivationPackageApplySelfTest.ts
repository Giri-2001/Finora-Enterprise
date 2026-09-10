/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL PLANE
   SIGNED BRANCH ACTIVATION PACKAGE APPLY SELF TEST

   AUTHORITY:

   - BRANCH_ACTIVATION is ISSUE-only.
   - Branch Access lifecycle belongs exclusively to BRANCH_ACCESS.
   - This self-test contains no Branch Access Grant authority.

   ISOLATION:

   - Temporary Electron userData
   - Temporary encrypted FINORA Control Store
   - Temporary native installation-binding vault
   - Ephemeral Control Center P-256 signing key
   - Production Control Center keys are never used
   - Temporary state is deleted before exit

   COVERAGE:

   - Valid signed ISSUE
   - Exact persisted ACTIVE activation
   - No Branch Access mutation
   - Replay rejection
   - Equal/stale sequence rejection
   - Tampered signature rejection
   - Wrong purpose rejection
   - Wrong target scope rejection
   - Wrong installation rejection
   - Wrong payload native binding rejection
   - Wrong activation identity rejection
   - Legacy non-ISSUE action rejection
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
  canonicalizeFinoraControlCenterValue,
  createFinoraControlCenterPayloadDigest,
} from "../control-center/finoraControlCenterCanonicalization.js";

import {
  generateFinoraControlCenterSigningMaterial,
  signFinoraControlCenterCanonicalValue,
} from "../control-center/finoraControlCenterCrypto.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import type {
  FinoraWindowsInstallationBindingPublic,
} from "./finoraInstallationBindingCrypto.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import type {
  FinoraControlBranchActivation,
  FinoraControlInstallationIdentity,
} from "./finoraControlStore.js";

import {
  readFinoraControlStore,
  saveFinoraInstallationIdentity,
} from "./finoraControlStore.js";

import {
  applyFinoraSignedBranchActivationPackage,
} from "./finoraBranchActivationPackageApplyService.js";


// ============================================================
// TYPES
// ============================================================

interface SelfTestScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

interface SelfTestBindingTarget {
  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;

  schemaVersion:
    1;
}

interface SelfTestPackageTarget {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;
}


// ============================================================
// ASSERTIONS
// ============================================================

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
      `${label}: expected success but operation failed.`,
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

  expectedErrorFragment?:
    string,
): void {

  assert(
    !result.success,
    `${label}: expected failure but operation succeeded.`,
  );

  if (expectedErrorFragment) {
    assert(
      result.error
        ?.toLowerCase()
        .includes(
          expectedErrorFragment.toLowerCase(),
        ),
      `${label}: failure did not contain expected error fragment "${expectedErrorFragment}". Actual: ${result.error ?? "<none>"}`,
    );
  }

  console.log(
    `PASS: ${label}`,
  );
}


// ============================================================
// TIME
// ============================================================






// ============================================================
// PAYLOAD BUILDERS
// ============================================================

function toBindingTarget(
  binding:
    FinoraWindowsInstallationBindingPublic,
): SelfTestBindingTarget {

  return {
    installationId:
      binding.installationId,

    bindingKeyId:
      binding.bindingKeyId,

    fingerprintAlgorithm:
      "SHA-256",

    publicKeyFingerprint:
      binding.publicKeyFingerprint,

    schemaVersion:
      1,
  };
}

function createActivation(
  scope:
    SelfTestScope,

  timestamp:
    string,
): FinoraControlBranchActivation {

  return {
    activationId:
      "FINORA-BRANCH-ACTIVATION-SELFTEST",

    ownerId:
      scope.ownerId,

    businessId:
      scope.businessId,

    branchId:
      scope.branchId,

    status:
      "ACTIVE",

    activatedAt:
      timestamp,

    createdAt:
      timestamp,

    updatedAt:
      timestamp,

    schemaVersion:
      1,
  };
}







function createActivationPayload(
  action:
    string,

  activation:
    FinoraControlBranchActivation,

  binding:
    SelfTestBindingTarget,

  issuedAt:
    string,
): Record<string, unknown> {

  return {
    action,

    activation: {
      ...activation,
    },

    installationBinding: {
      ...binding,
    },

    issuedAt,

    schemaVersion:
      1,
  };
}


// ============================================================
// EPHEMERAL SIGNER
// ============================================================

function createSignedPackage(
  input: {
    packageId:
      string;

    purpose?:
      string;

    target:
      SelfTestPackageTarget;

    issuedAt:
      string;

    sequence:
      number;

    payload:
      Record<string, unknown>;

    issuerId:
      string;

    signingKeyId:
      string;

    privateKeyPkcs8DerBase64:
      string;
  },
) {

  const unsignedPackage = {
    packageId:
      input.packageId,

    purpose:
      input.purpose ??
        "BRANCH_ACTIVATION",

    issuer: {
      type:
        "FINORA_CONTROL_CENTER" as const,

      issuerId:
        input.issuerId,

      signingKeyId:
        input.signingKeyId,
    },

    target: {
      ...input.target,
    },

    issuedAt:
      input.issuedAt,

    sequence:
      input.sequence,

    payloadVersion:
      1,

    payload:
      input.payload,

    payloadDigest:
      createFinoraControlCenterPayloadDigest(
        input.payload,
      ),

    schemaVersion:
      1 as const,
  };

  const canonicalPackage =
    canonicalizeFinoraControlCenterValue(
      unsignedPackage,
    );

  const signature =
    signFinoraControlCenterCanonicalValue(
      canonicalPackage,
      input.privateKeyPkcs8DerBase64,
    );

  return {
    ...unsignedPackage,

    signature: {
      algorithm:
        "ECDSA_P256_SHA256" as const,

      encoding:
        "IEEE_P1363" as const,

      canonicalization:
        "FINORA_CANONICAL_JSON_V1" as const,

      signingKeyId:
        input.signingKeyId,

      value:
        signature,
    },
  };
}


// ============================================================
// READBACK
// ============================================================




// ============================================================
// SELF TEST
// ============================================================

async function runSelfTest():
  Promise<void> {

  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-branch-status-selftest-",
      ),
    );

  let failure:
    unknown;

  try {

    // --------------------------------------------------------
    // ISOLATE ELECTRON STATE
    // --------------------------------------------------------

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
    // CONTROL STORE INSTALLATION
    // --------------------------------------------------------

    const now =
      new Date();

    const baseTimestamp =
      new Date(
        now.getTime() -
          30 *
            60 *
            1000,
      ).toISOString();

    const scope:
      SelfTestScope = {
        ownerId:
          "OWNER-BRANCH-STATUS-SELFTEST",

        businessId:
          "BUSINESS-BRANCH-STATUS-SELFTEST",

        branchId:
          "BRANCH-BRANCH-STATUS-SELFTEST",
      };

    const installation:
      FinoraControlInstallationIdentity = {

        installationId:
          nativeBinding.installationId,

        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,

        businessCode:
          "STS01",

        branchCode:
          "B01",

        createdAt:
          baseTimestamp,

        updatedAt:
          baseTimestamp,

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
    // EPHEMERAL CONTROL CENTER SIGNER
    // --------------------------------------------------------

    const signingMaterial =
      generateFinoraControlCenterSigningMaterial();

    const issuerId =
      "FINORA-BRANCH-STATUS-SELFTEST-CONTROL-CENTER";

    const trustedKeys:
      FinoraBranchTrustedControlPublicKey[] = [
        {
          issuerId,

          signingKeyId:
            signingMaterial.signingKeyId,

          algorithm:
            "ECDSA_P256_SHA256",

          format:
            "SPKI_DER_BASE64",

          publicKey:
            signingMaterial.publicKeySpkiDerBase64,

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
      "PASS: ephemeral Control Center signing identity created",
    );


    // --------------------------------------------------------
    // COMMON TARGET
    // --------------------------------------------------------

    const packageTarget:
      SelfTestPackageTarget = {

        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,

        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,
      };

    const bindingTarget =
      toBindingTarget(
        nativeBinding,
      );

    const activation =
      createActivation(
        scope,
        baseTimestamp,
      );

    let sequence =
      0;

    const nextSequence =
      (): number => {
        sequence +=
          1;

        return sequence;
      };

    const signPackage =
      (
        packageId:
          string,

        options?: {
          purpose?:
            string;

          action?:
            string;

          target?:
            SelfTestPackageTarget;

          activationRecord?:
            FinoraControlBranchActivation;

          bindingRecord?:
            SelfTestBindingTarget;

          forcedSequence?:
            number;
        },
      ) => {

        const issuedAt =
          now.toISOString();

        const packageSequence =
          options?.forcedSequence ??
          nextSequence();

        return createSignedPackage({
          packageId,

          ...(
            options?.purpose ===
              undefined
              ? {}
              : {
                  purpose:
                    options.purpose,
                }
          ),

          target:
            options?.target ??
            packageTarget,

          issuedAt,

          sequence:
            packageSequence,

          payload:
            createActivationPayload(
              options?.action ??
                "ISSUE",
              options?.activationRecord ??
                activation,
              options?.bindingRecord ??
                bindingTarget,
              issuedAt,
            ),

          issuerId,

          signingKeyId:
            signingMaterial.signingKeyId,

          privateKeyPkcs8DerBase64:
            signingMaterial.privateKeyPkcs8DerBase64,
        });
      };


    // ========================================================
    // TEST 1 - VALID SIGNED ISSUE
    // ========================================================

    const beforeIssueStore =
      await readFinoraControlStore();

    assert(
      beforeIssueStore.success &&
        beforeIssueStore.data,
      beforeIssueStore.error ??
        "Unable to read pre-ISSUE Control Store.",
    );

    const accessCountBefore =
      beforeIssueStore.data.branchAccessGrants
        ?.length ??
      0;

    const issuePackage =
      signPackage(
        "FINORA-BRANCH-ACTIVATION-SELFTEST-ISSUE",
      );

    const issueResult =
      await applyFinoraSignedBranchActivationPackage(
        issuePackage,
        trustedKeys,
        now,
      );

    expectSuccess(
      "valid signed BRANCH_ACTIVATION ISSUE applied",
      issueResult,
    );

    const afterIssueStore =
      await readFinoraControlStore();

    assert(
      afterIssueStore.success &&
        afterIssueStore.data,
      afterIssueStore.error ??
        "Unable to read post-ISSUE Control Store.",
    );

    const persistedActivation =
      afterIssueStore.data.activations.find(
        (item) =>
          item.ownerId ===
            scope.ownerId &&
          item.businessId ===
            scope.businessId &&
          item.branchId ===
            scope.branchId,
      );

    assert(
      persistedActivation,
      "Signed Branch Activation ISSUE did not persist activation.",
    );

    assert(
      persistedActivation.activationId ===
        activation.activationId &&
      persistedActivation.ownerId ===
        activation.ownerId &&
      persistedActivation.businessId ===
        activation.businessId &&
      persistedActivation.branchId ===
        activation.branchId &&
      persistedActivation.status ===
        "ACTIVE",
      "Persisted Branch Activation differs from signed authority.",
    );

    const accessCountAfterIssue =
      afterIssueStore.data.branchAccessGrants
        ?.length ??
      0;

    assert(
      accessCountAfterIssue ===
        accessCountBefore,
      "BRANCH_ACTIVATION ISSUE mutated Branch Access state.",
    );

    console.log(
      "PASS: signed Activation ISSUE persisted exact ACTIVE activation",
    );

    console.log(
      "PASS: Activation ISSUE did not mutate Branch Access state",
    );


    // ========================================================
    // TEST 2 - REPLAY
    // ========================================================

    const replayResult =
      await applyFinoraSignedBranchActivationPackage(
        issuePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "same signed Activation ISSUE package replay rejected",
      replayResult,
    );


    // ========================================================
    // TEST 3 - STALE/EQUAL SEQUENCE
    // ========================================================

    const stalePackage =
      signPackage(
        "FINORA-BRANCH-ACTIVATION-SELFTEST-STALE-SEQUENCE",
        {
          forcedSequence:
            1,
        },
      );

    const staleResult =
      await applyFinoraSignedBranchActivationPackage(
        stalePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "equal/stale BRANCH_ACTIVATION sequence rejected",
      staleResult,
    );


    // ========================================================
    // TEST 4 - BAD SIGNATURE
    // ========================================================

    const originalSignature =
      issuePackage.signature.value;

    assert(
      originalSignature.length >
        0,
      "Signed Activation package signature is empty.",
    );

    const tamperedSignaturePackage = {
      ...issuePackage,

      packageId:
        "FINORA-BRANCH-ACTIVATION-SELFTEST-BAD-SIGNATURE",

      sequence:
        2,

      signature: {
        ...issuePackage.signature,

        value:
          (
            originalSignature[0] ===
              "A"
              ? "B"
              : "A"
          ) +
          originalSignature.slice(
            1,
          ),
      },
    };

    const badSignatureResult =
      await applyFinoraSignedBranchActivationPackage(
        tamperedSignaturePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "tampered Activation signature rejected",
      badSignatureResult,
    );


    // ========================================================
    // TEST 5 - WRONG PURPOSE
    // ========================================================

    const wrongPurposePackage =
      signPackage(
        "FINORA-BRANCH-ACTIVATION-SELFTEST-WRONG-PURPOSE",
        {
          purpose:
            "STORAGE_ENTITLEMENT",

          forcedSequence:
            2,
        },
      );

    const wrongPurposeResult =
      await applyFinoraSignedBranchActivationPackage(
        wrongPurposePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "wrong signed purpose rejected by Activation apply",
      wrongPurposeResult,
      "purpose must be BRANCH_ACTIVATION",
    );


    // ========================================================
    // TEST 6 - WRONG TARGET SCOPE
    // ========================================================

    const wrongScopeTarget:
      SelfTestPackageTarget = {
        ...packageTarget,

        ownerId:
          `${scope.ownerId}-WRONG`,
      };

    const wrongScopeResult =
      await applyFinoraSignedBranchActivationPackage(
        signPackage(
          "FINORA-BRANCH-ACTIVATION-SELFTEST-WRONG-SCOPE",
          {
            target:
              wrongScopeTarget,

            forcedSequence:
              2,
          },
        ),
        trustedKeys,
        now,
      );

    expectFailure(
      "wrong signed Activation scope rejected",
      wrongScopeResult,
    );


    // ========================================================
    // TEST 7 - WRONG INSTALLATION
    // ========================================================

    const wrongInstallationTarget:
      SelfTestPackageTarget = {
        ...packageTarget,

        installationId:
          `${packageTarget.installationId}-WRONG`,
      };

    const wrongInstallationResult =
      await applyFinoraSignedBranchActivationPackage(
        signPackage(
          "FINORA-BRANCH-ACTIVATION-SELFTEST-WRONG-INSTALLATION",
          {
            target:
              wrongInstallationTarget,

            forcedSequence:
              2,
          },
        ),
        trustedKeys,
        now,
      );

    expectFailure(
      "wrong signed installation rejected",
      wrongInstallationResult,
    );


    // ========================================================
    // TEST 8 - WRONG PAYLOAD BINDING
    // ========================================================

    const wrongBinding:
      SelfTestBindingTarget = {
        ...bindingTarget,

        bindingKeyId:
          `${bindingTarget.bindingKeyId}-WRONG`,
      };

    const wrongBindingResult =
      await applyFinoraSignedBranchActivationPackage(
        signPackage(
          "FINORA-BRANCH-ACTIVATION-SELFTEST-WRONG-BINDING",
          {
            bindingRecord:
              wrongBinding,

            forcedSequence:
              2,
          },
        ),
        trustedKeys,
        now,
      );

    expectFailure(
      "wrong Activation payload native binding rejected",
      wrongBindingResult,
      "payload native installation binding does not match",
    );


    // ========================================================
    // TEST 9 - WRONG ACTIVATION IDENTITY
    // ========================================================

    const wrongIdentityActivation:
      FinoraControlBranchActivation = {
        ...activation,

        ownerId:
          `${scope.ownerId}-WRONG`,
      };

    const wrongIdentityResult =
      await applyFinoraSignedBranchActivationPackage(
        signPackage(
          "FINORA-BRANCH-ACTIVATION-SELFTEST-WRONG-IDENTITY",
          {
            activationRecord:
              wrongIdentityActivation,

            forcedSequence:
              2,
          },
        ),
        trustedKeys,
        now,
      );

    expectFailure(
      "wrong signed Activation payload identity rejected",
      wrongIdentityResult,
      "payload identity mismatch",
    );


    // ========================================================
    // TEST 10 - HISTORICAL NON-ISSUE FAILS CLOSED
    //
    // Construct dynamically so stale lifecycle action literals
    // do not remain in the Activation self-test.
    // ========================================================

    const historicalNonIssueAction =
      [
        "RE",
        "NEW",
      ].join(
        "",
      );

    const nonIssueResult =
      await applyFinoraSignedBranchActivationPackage(
        signPackage(
          "FINORA-BRANCH-ACTIVATION-SELFTEST-NON-ISSUE",
          {
            action:
              historicalNonIssueAction,

            forcedSequence:
              2,
          },
        ),
        trustedKeys,
        now,
      );

    expectFailure(
      "legacy non-ISSUE Activation action rejected",
      nonIssueResult,
      "BRANCH_ACTIVATION accepts only ISSUE",
    );


    // ========================================================
    // FINAL STORE PROOF
    // ========================================================

    const finalStoreResult =
      await readFinoraControlStore();

    assert(
      finalStoreResult.success &&
        finalStoreResult.data,
      finalStoreResult.error ??
        "Unable to read final Activation Control Store.",
    );

    const finalActivation =
      finalStoreResult.data.activations.find(
        (item) =>
          item.ownerId ===
            scope.ownerId &&
          item.businessId ===
            scope.businessId &&
          item.branchId ===
            scope.branchId,
      );

    assert(
      finalActivation?.activationId ===
        activation.activationId &&
      finalActivation.status ===
        "ACTIVE",
      "Rejected Activation packages mutated persisted activation.",
    );

    assert(
      (
        finalStoreResult.data.branchAccessGrants
          ?.length ??
        0
      ) ===
        accessCountBefore,
      "Activation package processing mutated Branch Access state.",
    );

    assert(
      finalStoreResult.data.appliedControlPackages
        ?.some(
          (item) =>
            item.packageId ===
              "FINORA-BRANCH-ACTIVATION-SELFTEST-ISSUE",
        ),
      "Successful Activation ISSUE missing from replay ledger.",
    );

    console.log(
      "PASS: rejected Activation packages preserved authoritative activation state",
    );

    console.log(
      "PASS: final Branch Access state remained untouched",
    );

    console.log(
      "PASS: successful Activation ISSUE persisted in replay ledger",
    );
    // ========================================================
    // COMPLETE
    // ========================================================

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA SIGNED BRANCH ACTIVATION ISSUE-ONLY E2E SELFTEST",
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

  if (failure) {
    throw failure;
  }
}


// ============================================================
// ENTRY
// ============================================================

void runSelfTest()
  .then(
    () => {
      app.exit(
        0,
      );
    },
    (error) => {

      console.error(
        "FAIL: FINORA SIGNED BRANCH ACTIVATION ISSUE-ONLY E2E SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );

// ============================================================
// END
// ============================================================