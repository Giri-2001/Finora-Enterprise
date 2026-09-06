// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL PLANE
// SIGNED BRANCH ACTIVATION / STATUS PACKAGE APPLY SELF TEST
//
// ISOLATION:
//
// - Uses a temporary Electron userData directory.
// - Uses a temporary encrypted FINORA Control Store.
// - Uses a temporary native installation-binding vault.
// - Uses an ephemeral Control Center P-256 signing key.
// - Does NOT access the production Control Center key vault.
// - Does NOT access normal FINORA userData.
// - Deletes temporary state before exit.
//
// COVERAGE:
//
// - Valid signed ISSUE
// - ACTIVE -> SUSPENDED
// - SUSPENDED -> ACTIVE
// - SUSPENDED -> REVOKED
// - ACTIVE -> REVOKED
// - REVOKED terminal-state enforcement
// - Invalid transition rejection
// - RENEW status-change bypass rejection
// - REPLACE status-change bypass rejection
// - Status-action access metadata immutability
// - Status-action activation-record immutability
// - Replay rejection
// - Stale/equal sequence rejection
//
// ============================================================

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
  FinoraControlBranchAccessGrant,
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

type SelfTestAction =
  | "ISSUE"
  | "RENEW"
  | "REPLACE"
  | "SUSPEND"
  | "RESUME"
  | "REVOKE";

type AdministrativeStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

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

function addMinutes(
  value:
    string,

  minutes:
    number,
): string {

  return new Date(
    Date.parse(
      value,
    ) +
      minutes *
        60 *
        1000,
  ).toISOString();
}

function addDays(
  value:
    string,

  days:
    number,
): string {

  return new Date(
    Date.parse(
      value,
    ) +
      days *
        24 *
        60 *
        60 *
        1000,
  ).toISOString();
}


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

function createRegisteredGrant(
  scope:
    SelfTestScope,

  userId:
    string,

  administrativeStatus:
    AdministrativeStatus,

  createdAt:
    string,

  updatedAt:
    string,
): FinoraControlBranchAccessGrant {

  return {
    grantId:
      `FINORA-GRANT-${userId}`,

    userId,

    ownerId:
      scope.ownerId,

    businessId:
      scope.businessId,

    branchId:
      scope.branchId,

    storageMode:
      "LOCAL",

    accessType:
      "REGISTERED",

    administrativeStatus,

    validity: {
      validFrom:
        createdAt,

      validUntil:
        addDays(
          createdAt,
          365,
        ),
    },

    registrationPayment: {
      amount:
        2000,

      currency:
        "INR",

      paymentMode:
        "CASH",

      paidAt:
        createdAt,

      reference:
        `SELFTEST-PAYMENT-${userId}`,

      remarks:
        "Phase 10 Signed Status selftest",

      refundable:
        false,
    },

    registrationCycle:
      1,

    createdAt,

    updatedAt,

    schemaVersion:
      1,
  };
}

function withStatus(
  grant:
    FinoraControlBranchAccessGrant,

  administrativeStatus:
    AdministrativeStatus,

  updatedAt:
    string,
): FinoraControlBranchAccessGrant {

  return {
    ...grant,

    administrativeStatus,

    updatedAt,
  };
}

function createActivationPayload(
  action:
    SelfTestAction,

  activation:
    FinoraControlBranchActivation,

  accessGrant:
    FinoraControlBranchAccessGrant,

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

    accessGrant: {
      ...accessGrant,

      validity: {
        ...accessGrant.validity,
      },

      registrationPayment:
        accessGrant.registrationPayment
          ? {
              ...accessGrant.registrationPayment,
            }
          : undefined,
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

async function expectPersistedStatus(
  userId:
    string,

  expectedStatus:
    AdministrativeStatus,
): Promise<void> {

  const storeResult =
    await readFinoraControlStore();

  assert(
    storeResult.success &&
      storeResult.data,
    storeResult.error ??
      "Unable to read Control Store during Signed Status selftest.",
  );

  const grant =
    storeResult.data.branchAccessGrants?.find(
      (item) =>
        item.userId ===
          userId,
    );

  assert(
    grant,
    `Persisted Branch Access grant not found for ${userId}.`,
  );

  assert(
    grant.administrativeStatus ===
      expectedStatus,
    `Expected ${userId} status ${expectedStatus}, found ${grant.administrativeStatus}.`,
  );

  console.log(
    `PASS: persisted ${userId} status = ${expectedStatus}`,
  );
}


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

        action:
          SelfTestAction,

        accessGrant:
          FinoraControlBranchAccessGrant,

        activationRecord:
          FinoraControlBranchActivation =
            activation,

        forcedSequence?:
          number,
      ) => {

        const issuedAt =
          now.toISOString();

        const packageSequence =
          forcedSequence ??
          nextSequence();

        return createSignedPackage({
          packageId,

          target:
            packageTarget,

          issuedAt,

          sequence:
            packageSequence,

          payload:
            createActivationPayload(
              action,
              activationRecord,
              accessGrant,
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
    // TEST 1 - ISSUE ACTIVE
    // ========================================================

    const lifecycleUser =
      "USER-STATUS-LIFECYCLE";

    const lifecycleInitial =
      createRegisteredGrant(
        scope,
        lifecycleUser,
        "ACTIVE",
        baseTimestamp,
        baseTimestamp,
      );

    const issuePackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-ISSUE-1",
        "ISSUE",
        lifecycleInitial,
      );

    const issueResult =
      await applyFinoraSignedBranchActivationPackage(
        issuePackage,
        trustedKeys,
        now,
      );

    expectSuccess(
      "signed ISSUE ACTIVE applied",
      issueResult,
    );

    await expectPersistedStatus(
      lifecycleUser,
      "ACTIVE",
    );


    // ========================================================
    // TEST 2 - ACTIVE -> SUSPENDED
    // ========================================================

    const suspendedGrant =
      withStatus(
        lifecycleInitial,
        "SUSPENDED",
        addMinutes(
          baseTimestamp,
          1,
        ),
      );

    const suspendPackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-SUSPEND-2",
        "SUSPEND",
        suspendedGrant,
      );

    const suspendResult =
      await applyFinoraSignedBranchActivationPackage(
        suspendPackage,
        trustedKeys,
        now,
      );

    expectSuccess(
      "ACTIVE -> SUSPENDED applied",
      suspendResult,
    );

    await expectPersistedStatus(
      lifecycleUser,
      "SUSPENDED",
    );


    // ========================================================
    // TEST 3 - SUSPENDED -> ACTIVE
    // ========================================================

    const resumedGrant =
      withStatus(
        suspendedGrant,
        "ACTIVE",
        addMinutes(
          baseTimestamp,
          2,
        ),
      );

    const resumePackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-RESUME-3",
        "RESUME",
        resumedGrant,
      );

    const resumeResult =
      await applyFinoraSignedBranchActivationPackage(
        resumePackage,
        trustedKeys,
        now,
      );

    expectSuccess(
      "SUSPENDED -> ACTIVE applied",
      resumeResult,
    );

    await expectPersistedStatus(
      lifecycleUser,
      "ACTIVE",
    );


    // ========================================================
    // TEST 4 - ACTIVE -> SUSPENDED AGAIN
    // ========================================================

    const suspendedAgainGrant =
      withStatus(
        resumedGrant,
        "SUSPENDED",
        addMinutes(
          baseTimestamp,
          3,
        ),
      );

    const suspendAgainPackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-SUSPEND-4",
        "SUSPEND",
        suspendedAgainGrant,
      );

    const suspendAgainResult =
      await applyFinoraSignedBranchActivationPackage(
        suspendAgainPackage,
        trustedKeys,
        now,
      );

    expectSuccess(
      "ACTIVE -> SUSPENDED second lifecycle transition applied",
      suspendAgainResult,
    );


    // ========================================================
    // TEST 5 - SUSPENDED -> REVOKED
    // ========================================================

    const revokedGrant =
      withStatus(
        suspendedAgainGrant,
        "REVOKED",
        addMinutes(
          baseTimestamp,
          4,
        ),
      );

    const revokePackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-REVOKE-5",
        "REVOKE",
        revokedGrant,
      );

    const revokeResult =
      await applyFinoraSignedBranchActivationPackage(
        revokePackage,
        trustedKeys,
        now,
      );

    expectSuccess(
      "SUSPENDED -> REVOKED applied",
      revokeResult,
    );

    await expectPersistedStatus(
      lifecycleUser,
      "REVOKED",
    );


    // ========================================================
    // TEST 6 - REVOKED IS TERMINAL
    // ========================================================

    const illegalResume =
      withStatus(
        revokedGrant,
        "ACTIVE",
        addMinutes(
          baseTimestamp,
          5,
        ),
      );

    const illegalResumePackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-TERMINAL-6",
        "RESUME",
        illegalResume,
      );

    const illegalResumeResult =
      await applyFinoraSignedBranchActivationPackage(
        illegalResumePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "REVOKED -> ACTIVE rejected as terminal",
      illegalResumeResult,
      "terminal",
    );

    await expectPersistedStatus(
      lifecycleUser,
      "REVOKED",
    );


    // ========================================================
    // TEST 7 - SAME SIGNED PACKAGE REPLAY
    // ========================================================

    const replayResult =
      await applyFinoraSignedBranchActivationPackage(
        issuePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "same signed ISSUE package replay rejected",
      replayResult,
    );


    // ========================================================
    // TEST 8 - STALE / EQUAL SEQUENCE
    //
    // Last committed sequence is still 5 because TEST 6 failed.
    // ========================================================

    const stalePackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-STALE-SEQUENCE",
        "REVOKE",
        revokedGrant,
        activation,
        5,
      );

    const staleResult =
      await applyFinoraSignedBranchActivationPackage(
        stalePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "stale/equal BRANCH_ACTIVATION sequence rejected",
      staleResult,
    );


    // ========================================================
    // TEST 9 - STATUS ACTION METADATA TAMPERING
    // ========================================================

    const metadataUser =
      "USER-STATUS-METADATA";

    const metadataInitial =
      createRegisteredGrant(
        scope,
        metadataUser,
        "ACTIVE",
        baseTimestamp,
        baseTimestamp,
      );

    const metadataIssuePackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-METADATA-ISSUE",
        "ISSUE",
        metadataInitial,
      );

    const metadataIssueResult =
      await applyFinoraSignedBranchActivationPackage(
        metadataIssuePackage,
        trustedKeys,
        now,
      );

    expectSuccess(
      "metadata-test ISSUE applied",
      metadataIssueResult,
    );

    const metadataTamperedGrant:
      FinoraControlBranchAccessGrant = {
        ...metadataInitial,

        storageMode:
          "USB",

        administrativeStatus:
          "SUSPENDED",

        updatedAt:
          addMinutes(
            baseTimestamp,
            6,
          ),
      };

    const metadataTamperPackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-METADATA-TAMPER",
        "SUSPEND",
        metadataTamperedGrant,
      );

    const metadataTamperResult =
      await applyFinoraSignedBranchActivationPackage(
        metadataTamperPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "status action grant metadata tampering rejected",
      metadataTamperResult,
      "cannot modify grant metadata",
    );

    await expectPersistedStatus(
      metadataUser,
      "ACTIVE",
    );


    // ========================================================
    // TEST 10 - STATUS ACTION ACTIVATION MUTATION
    // ========================================================

    const activationTamperGrant =
      withStatus(
        metadataInitial,
        "SUSPENDED",
        addMinutes(
          baseTimestamp,
          7,
        ),
      );

    const mutatedActivation:
      FinoraControlBranchActivation = {
        ...activation,

        updatedAt:
          addMinutes(
            baseTimestamp,
            7,
          ),
      };

    const activationTamperPackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-ACTIVATION-TAMPER",
        "SUSPEND",
        activationTamperGrant,
        mutatedActivation,
      );

    const activationTamperResult =
      await applyFinoraSignedBranchActivationPackage(
        activationTamperPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "status action Branch Activation mutation rejected",
      activationTamperResult,
      "cannot modify the Branch Activation record",
    );

    await expectPersistedStatus(
      metadataUser,
      "ACTIVE",
    );


    // ========================================================
    // TEST 11 - RENEW STATUS-CHANGE BYPASS
    // ========================================================

    const renewUser =
      "USER-STATUS-RENEW";

    const renewInitial =
      createRegisteredGrant(
        scope,
        renewUser,
        "ACTIVE",
        baseTimestamp,
        baseTimestamp,
      );

    const renewIssuePackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-RENEW-ISSUE",
        "ISSUE",
        renewInitial,
      );

    const renewIssueResult =
      await applyFinoraSignedBranchActivationPackage(
        renewIssuePackage,
        trustedKeys,
        now,
      );

    expectSuccess(
      "RENEW-test ISSUE applied",
      renewIssueResult,
    );

    const renewBypassGrant =
      withStatus(
        renewInitial,
        "SUSPENDED",
        addMinutes(
          baseTimestamp,
          8,
        ),
      );

    const renewBypassPackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-RENEW-BYPASS",
        "RENEW",
        renewBypassGrant,
      );

    const renewBypassResult =
      await applyFinoraSignedBranchActivationPackage(
        renewBypassPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "RENEW administrative-status bypass rejected",
      renewBypassResult,
      "transition is invalid",
    );

    await expectPersistedStatus(
      renewUser,
      "ACTIVE",
    );


    // ========================================================
    // TEST 12 - REPLACE STATUS-CHANGE BYPASS
    // ========================================================

    const replaceBypassGrant =
      withStatus(
        renewInitial,
        "SUSPENDED",
        addMinutes(
          baseTimestamp,
          9,
        ),
      );

    const replaceBypassPackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-REPLACE-BYPASS",
        "REPLACE",
        replaceBypassGrant,
      );

    const replaceBypassResult =
      await applyFinoraSignedBranchActivationPackage(
        replaceBypassPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "REPLACE administrative-status bypass rejected",
      replaceBypassResult,
      "transition is invalid",
    );

    await expectPersistedStatus(
      renewUser,
      "ACTIVE",
    );


    // ========================================================
    // TEST 13 - INVALID ACTIVE -> ACTIVE RESUME
    // ========================================================

    const directRevokeUser =
      "USER-STATUS-DIRECT-REVOKE";

    const directRevokeInitial =
      createRegisteredGrant(
        scope,
        directRevokeUser,
        "ACTIVE",
        baseTimestamp,
        baseTimestamp,
      );

    const directIssuePackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-DIRECT-ISSUE",
        "ISSUE",
        directRevokeInitial,
      );

    const directIssueResult =
      await applyFinoraSignedBranchActivationPackage(
        directIssuePackage,
        trustedKeys,
        now,
      );

    expectSuccess(
      "direct-revoke test ISSUE applied",
      directIssueResult,
    );

    const invalidResumeGrant =
      withStatus(
        directRevokeInitial,
        "ACTIVE",
        addMinutes(
          baseTimestamp,
          10,
        ),
      );

    const invalidResumePackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-INVALID-RESUME",
        "RESUME",
        invalidResumeGrant,
      );

    const invalidResumeResult =
      await applyFinoraSignedBranchActivationPackage(
        invalidResumePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "ACTIVE -> ACTIVE RESUME rejected",
      invalidResumeResult,
      "transition is invalid",
    );


    // ========================================================
    // TEST 14 - ACTIVE -> REVOKED
    // ========================================================

    const directRevokedGrant =
      withStatus(
        directRevokeInitial,
        "REVOKED",
        addMinutes(
          baseTimestamp,
          11,
        ),
      );

    const directRevokePackage =
      signPackage(
        "FINORA-STATUS-SELFTEST-DIRECT-REVOKE",
        "REVOKE",
        directRevokedGrant,
      );

    const directRevokeResult =
      await applyFinoraSignedBranchActivationPackage(
        directRevokePackage,
        trustedKeys,
        now,
      );

    expectSuccess(
      "ACTIVE -> REVOKED applied",
      directRevokeResult,
    );

    await expectPersistedStatus(
      directRevokeUser,
      "REVOKED",
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
        "Unable to read final Signed Status Control Store.",
    );

    assert(
      finalStoreResult.data
        .appliedControlPackages
        ?.some(
          (item) =>
            item.packageId ===
              "FINORA-STATUS-SELFTEST-DIRECT-REVOKE",
        ),
      "Final successful REVOKE package was not recorded in replay ledger.",
    );

    console.log(
      "PASS: successful Signed Status packages persisted in replay ledger",
    );


    // ========================================================
    // COMPLETE
    // ========================================================

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA SIGNED BRANCH STATUS E2E SELFTEST",
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
        "FAIL: FINORA SIGNED BRANCH STATUS E2E SELFTEST",
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