/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST TRANSITION APPLY SERVICE SELF TEST

   RESPONSIBILITY:

   - Isolate Electron userData
   - Create authoritative native installation binding
   - Bootstrap trusted Control Center signing key A
   - Apply real signed ROTATE A -> B
   - Verify A RETIRED / B ACTIVE
   - Verify replay ledger + monotonic sequence persistence
   - Reject duplicate packageId without mutation
   - Reject stale sequence without mutation
   - Apply B-signed REVOKE_RETIRED A
   - Verify A REVOKED / B remains ACTIVE
   - Reject signature tamper without mutation
   - Reject wrong native target without mutation
   - Reject future-issued transition without mutation

   IMPORTANT:

   - Real Electron safeStorage runtime.
   - Real native installation-binding vault.
   - Real ECDSA P-256 signatures.
   - Isolated temporary userData only.
   - No renderer.
   - No IPC.
   - No production Control Center key vault.
=========================================================== */

import {
  app,
} from "electron";

import {
  generateKeyPairSync,
  sign as nodeSign,
} from "node:crypto";

import type {
  KeyObject,
} from "node:crypto";

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
  createFinoraInstallationBindingFingerprint,
} from "./finoraInstallationBindingCrypto.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  bootstrapFinoraRecipientTrust,
} from "./finoraRecipientTrustBootstrapService.js";

import {
  loadFinoraRecipientTrustStore,
  persistFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

import {
  applyFinoraSignedRecipientTrustTransition,
} from "./finoraRecipientTrustTransitionApplyService.js";

import {
  FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,
  FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,
  canonicalizeFinoraRecipientTrustTransitionUnsignedEnvelope,
  createFinoraRecipientTrustTransitionPayloadDigest,
} from "./finoraRecipientTrustTransitionContract.js";

import type {
  FinoraRecipientTrustRevokeRetiredPayload,
  FinoraRecipientTrustRotatePayload,
  FinoraRecipientTrustTransitionPayload,
  FinoraRecipientTrustTransitionSignedEnvelope,
  FinoraRecipientTrustTransitionTarget,
  FinoraRecipientTrustTransitionUnsignedEnvelope,
} from "./finoraRecipientTrustTransitionContract.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

// ============================================================
// ASSERT
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

// ============================================================
// SIGNING MATERIAL
// ============================================================

interface TestSigningMaterial {
  privateKey:
    KeyObject;

  publicKey:
    string;

  fingerprint:
    string;

  signingKeyId:
    string;
}

function createSigningMaterial():
  TestSigningMaterial {
  const pair =
    generateKeyPairSync(
      "ec",
      {
        namedCurve:
          "prime256v1",
      },
    );

  const publicKey =
    pair.publicKey
      .export({
        type:
          "spki",

        format:
          "der",
      })
      .toString(
        "base64",
      );

  const fingerprint =
    createFinoraInstallationBindingFingerprint(
      publicKey,
    );

  return {
    privateKey:
      pair.privateKey,

    publicKey,

    fingerprint,

    signingKeyId:
      `FINORA-KEY-${fingerprint
        .slice(
          0,
          24,
        )
        .toUpperCase()}`,
  };
}

// ============================================================
// TRUSTED KEY
// ============================================================

function createActiveTrustedKey(
  issuerId:
    string,
  material:
    TestSigningMaterial,
  validFrom:
    string,
): FinoraBranchTrustedControlPublicKey {
  return {
    issuerId,

    signingKeyId:
      material.signingKeyId,

    algorithm:
      "ECDSA_P256_SHA256",

    format:
      "SPKI_DER_BASE64",

    publicKey:
      material.publicKey,

    status:
      "ACTIVE",

    validFrom,
  };
}

// ============================================================
// UNSIGNED ENVELOPE
// ============================================================

function createUnsignedEnvelope(
  input: {
    packageId:
      string;

    issuerId:
      string;

    signingKeyId:
      string;

    target:
      FinoraRecipientTrustTransitionTarget;

    issuedAt:
      string;

    sequence:
      number;

    payload:
      FinoraRecipientTrustTransitionPayload;
  },
): FinoraRecipientTrustTransitionUnsignedEnvelope {
  return {
    packageId:
      input.packageId,

    purpose:
      FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,

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

    schemaVersion:
      1,

    issuer: {
      type:
        "FINORA_CONTROL_CENTER",

      issuerId:
        input.issuerId,

      signingKeyId:
        input.signingKeyId,
    },

    payloadDigest:
      createFinoraRecipientTrustTransitionPayloadDigest(
        input.payload,
      ),
  };
}

// ============================================================
// REAL ECDSA SIGN
// ============================================================

function signEnvelope(
  unsignedEnvelope:
    FinoraRecipientTrustTransitionUnsignedEnvelope,
  privateKey:
    KeyObject,
): FinoraRecipientTrustTransitionSignedEnvelope {
  const canonical =
    canonicalizeFinoraRecipientTrustTransitionUnsignedEnvelope(
      unsignedEnvelope,
    );

  const signature =
    nodeSign(
      "sha256",
      Buffer.from(
        canonical,
        "utf8",
      ),
      {
        key:
          privateKey,

        dsaEncoding:
          "ieee-p1363",
      },
    );

  assert(
    signature.byteLength ===
      64,
    "Generated trust-transition signature was not 64-byte IEEE-P1363.",
  );

  return {
    ...unsignedEnvelope,

    signature: {
      algorithm:
        "ECDSA_P256_SHA256",

      encoding:
        "IEEE_P1363",

      canonicalization:
        "FINORA_CANONICAL_JSON_V1",

      signingKeyId:
        unsignedEnvelope.issuer.signingKeyId,

      value:
        signature.toString(
          "base64",
        ),
    },
  };
}

// ============================================================
// PAYLOAD HELPERS
// ============================================================

function createRotatePayload(
  issuerId:
    string,
  newMaterial:
    TestSigningMaterial,
  issuedAt:
    string,
): FinoraRecipientTrustRotatePayload {
  return {
    transitionFormat:
      FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,

    action:
      "ROTATE",

    newTrustedKey:
      createActiveTrustedKey(
        issuerId,
        newMaterial,
        issuedAt,
      ),

    issuedAt,

    schemaVersion:
      1,
  };
}

function createRevokePayload(
  revokedSigningKeyId:
    string,
  issuedAt:
    string,
): FinoraRecipientTrustRevokeRetiredPayload {
  return {
    transitionFormat:
      FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,

    action:
      "REVOKE_RETIRED",

    revokedSigningKeyId,

    issuedAt,

    schemaVersion:
      1,
  };
}

// ============================================================
// STORE SNAPSHOT
// ============================================================

async function snapshotTrustStore():
  Promise<string> {
  const store =
    await loadFinoraRecipientTrustStore();

  assert(
    store !==
      undefined,
    "Recipient trust store unexpectedly missing.",
  );

  return JSON.stringify(
    store,
  );
}

// ============================================================
// REJECT WITHOUT MUTATION
// ============================================================

async function expectRejectedWithoutMutation(
  label:
    string,
  signedTransition:
    FinoraRecipientTrustTransitionSignedEnvelope,
  now:
    Date,
  expectedMessage:
    string,
): Promise<void> {
  const before =
    await snapshotTrustStore();

  const result =
    await applyFinoraSignedRecipientTrustTransition(
      signedTransition,
      now,
    );

  assert(
    !result.success,
    `${label} was unexpectedly accepted.`,
  );

  assert(
    result.error.includes(
      expectedMessage,
    ),
    `${label} returned unexpected error: ${result.error}`,
  );

  const after =
    await snapshotTrustStore();

  assert(
    after ===
      before,
    `${label} mutated recipient trust state.`,
  );

  console.log(
    `PASS: ${label} rejected with zero persisted mutation`,
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
        "finora-recipient-trust-transition-apply-selftest-",
      ),
    );

  try {
    // --------------------------------------------------------
    // ISOLATED ELECTRON USERDATA
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
    // AUTHORITATIVE NATIVE INSTALLATION BINDING
    // --------------------------------------------------------

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0 &&
      nativeBinding.bindingKeyId.length >
        0 &&
      nativeBinding.fingerprintAlgorithm ===
        "SHA-256" &&
      /^[0-9a-f]{64}$/.test(
        nativeBinding.publicKeyFingerprint,
      ),
      "Authoritative native installation binding was not created correctly.",
    );

    const target:
      FinoraRecipientTrustTransitionTarget = {
        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          nativeBinding.fingerprintAlgorithm,

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,
      };

    console.log(
      "PASS: authoritative native installation binding created",
    );

    // --------------------------------------------------------
    // CONTROL CENTER TEST AUTHORITY A / B / C
    // --------------------------------------------------------

    const issuerId =
      "FINORA-CC-TRUST-TRANSITION-E2E";

    const materialA =
      createSigningMaterial();

    const materialB =
      createSigningMaterial();

    const materialC =
      createSigningMaterial();

    const initialValidFrom =
      "2026-09-07T00:00:00.000Z";

    const rotateIssuedAt =
      "2026-09-07T08:00:00.000Z";

    const revokeIssuedAt =
      "2026-09-07T08:30:00.000Z";

    const normalApplyNow =
      new Date(
        "2026-09-07T09:00:00.000Z",
      );

    // --------------------------------------------------------
    // BOOTSTRAP A
    // --------------------------------------------------------

    const trustedKeyA =
      createActiveTrustedKey(
        issuerId,
        materialA,
        initialValidFrom,
      );

    const bootstrapResult =
      await bootstrapFinoraRecipientTrust({
        trustedKey:
          trustedKeyA,

        expectedPublicKeyFingerprint:
          materialA.fingerprint,
      });

    assert(
      bootstrapResult.success,
      bootstrapResult.success
        ? "Bootstrap A unexpectedly failed."
        : bootstrapResult.error,
    );

    const bootstrappedStore =
      await loadFinoraRecipientTrustStore();

    assert(
      bootstrappedStore !==
        undefined &&
      bootstrappedStore.trustedKeys.length ===
        1 &&
      bootstrappedStore.trustedKeys[0].signingKeyId ===
        materialA.signingKeyId &&
      bootstrappedStore.trustedKeys[0].status ===
        "ACTIVE",
      "Bootstrap A did not establish exactly one ACTIVE recipient trust key.",
    );

    console.log(
      "PASS: recipient trust bootstrapped with ACTIVE key A",
    );

    // --------------------------------------------------------
    // SEED EXISTING EMERGENCY-RECOVERY REPLAY METADATA
    //
    // This fixture represents recovery history that already
    // exists before a later normal trust transition.
    //
    // Normal ROTATE / REVOKE_RETIRED must preserve these
    // independent recovery replay records exactly.
    // --------------------------------------------------------

    const seededRecoveryAuthorityId =
      "FINORA-RECOVERY-AUTHORITY-TRANSITION-PRESERVATION";

    const seededRecoveryPackageId =
      "FINORA-TRUST-RECOVERY-PRESERVE-0007";

    const seededRecoveryAppliedAt =
      "2026-09-07T08:30:00.000Z";

    await persistFinoraRecipientTrustStore({
      ...bootstrappedStore,

      appliedTrustRecoveries: [
        {
          packageId:
            seededRecoveryPackageId,

          recoveryAuthorityId:
            seededRecoveryAuthorityId,

          purpose:
            "RECIPIENT_TRUST_RECOVERY",

          sequence:
            7,

          installationId:
            nativeBinding.installationId,

          operationalIssuerId:
            issuerId,

          appliedAt:
            seededRecoveryAppliedAt,
        },
      ],

      trustRecoverySequences: [
        {
          recoveryAuthorityId:
            seededRecoveryAuthorityId,

          purpose:
            "RECIPIENT_TRUST_RECOVERY",

          installationId:
            nativeBinding.installationId,

          operationalIssuerId:
            issuerId,

          lastSequence:
            7,

          updatedAt:
            seededRecoveryAppliedAt,
        },
      ],
    });

    const seededRecoveryStore =
      await loadFinoraRecipientTrustStore();

    assert(
      seededRecoveryStore !==
        undefined &&
      seededRecoveryStore.appliedTrustRecoveries?.length ===
        1 &&
      seededRecoveryStore.appliedTrustRecoveries[0].packageId ===
        seededRecoveryPackageId &&
      seededRecoveryStore.appliedTrustRecoveries[0].sequence ===
        7 &&
      seededRecoveryStore.trustRecoverySequences?.length ===
        1 &&
      seededRecoveryStore.trustRecoverySequences[0].lastSequence ===
        7,
      "Recovery replay metadata fixture was not persisted before normal trust transitions.",
    );

    const seededRecoveryLedgerSnapshot =
      JSON.stringify(
        seededRecoveryStore.appliedTrustRecoveries,
      );

    const seededRecoverySequenceSnapshot =
      JSON.stringify(
        seededRecoveryStore.trustRecoverySequences,
      );

    console.log(
      "PASS: seeded existing emergency-recovery replay ledger and sequence cursor before normal transition",
    );

    // --------------------------------------------------------
    // SIGNED ROTATE A -> B, SEQUENCE 1
    // --------------------------------------------------------

    const rotatePayload =
      createRotatePayload(
        issuerId,
        materialB,
        rotateIssuedAt,
      );

    const rotateSigned =
      signEnvelope(
        createUnsignedEnvelope({
          packageId:
            "FINORA-TRUST-TRANSITION-E2E-0001",

          issuerId,

          signingKeyId:
            materialA.signingKeyId,

          target,

          issuedAt:
            rotateIssuedAt,

          sequence:
            1,

          payload:
            rotatePayload,
        }),
        materialA.privateKey,
      );

    const rotateResult =
      await applyFinoraSignedRecipientTrustTransition(
        rotateSigned,
        normalApplyNow,
      );

    assert(
      rotateResult.success,
      rotateResult.success
        ? "Valid A-to-B rotation unexpectedly failed."
        : rotateResult.error,
    );

    assert(
      rotateResult.data.action ===
        "ROTATE" &&
      rotateResult.data.sequence ===
        1 &&
      rotateResult.data.activeSigningKeyId ===
        materialB.signingKeyId &&
      rotateResult.data.affectedSigningKeyId ===
        materialA.signingKeyId,
      "ROTATE result returned incorrect authority metadata.",
    );

    const afterRotate =
      await loadFinoraRecipientTrustStore();

    assert(
      afterRotate !==
        undefined,
      "Recipient trust missing after valid rotation.",
    );

    const keyAAfterRotate =
      afterRotate.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            materialA.signingKeyId,
      );

    const keyBAfterRotate =
      afterRotate.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            materialB.signingKeyId,
      );

    assert(
      keyAAfterRotate?.status ===
        "RETIRED" &&
      keyAAfterRotate.validUntil ===
        rotateIssuedAt &&
      keyBAfterRotate?.status ===
        "ACTIVE" &&
      keyBAfterRotate.validFrom ===
        rotateIssuedAt &&
      keyBAfterRotate.validUntil ===
        undefined,
      "ROTATE did not persist A RETIRED / B ACTIVE at the signed transition boundary.",
    );

    assert(
      afterRotate.appliedTrustTransitions?.length ===
        1 &&
      afterRotate.appliedTrustTransitions[0].packageId ===
        rotateSigned.packageId &&
      afterRotate.appliedTrustTransitions[0].sequence ===
        1 &&
      afterRotate.trustTransitionSequences?.length ===
        1 &&
      afterRotate.trustTransitionSequences[0].lastSequence ===
        1 &&
      afterRotate.trustTransitionSequences[0].installationId ===
        nativeBinding.installationId,
      "ROTATE did not atomically persist replay ledger and monotonic sequence state.",
    );

    console.log(
      "PASS: signed ROTATE A->B persisted A RETIRED, B ACTIVE, replay ledger, and sequence 1",
    );

    assert(
      JSON.stringify(
        afterRotate.appliedTrustRecoveries,
      ) ===
        seededRecoveryLedgerSnapshot &&
      JSON.stringify(
        afterRotate.trustRecoverySequences,
      ) ===
        seededRecoverySequenceSnapshot,
      "ROTATE did not preserve pre-existing emergency-recovery replay metadata exactly.",
    );

    console.log(
      "PASS: ROTATE preserved existing emergency-recovery replay ledger and sequence cursor exactly",
    );

    // --------------------------------------------------------
    // DUPLICATE PACKAGE ID
    //
    // Must be signed by CURRENT ACTIVE B so verification
    // succeeds and replay detection is actually reached.
    // --------------------------------------------------------

    const duplicatePackageSigned =
      signEnvelope(
        createUnsignedEnvelope({
          packageId:
            rotateSigned.packageId,

          issuerId,

          signingKeyId:
            materialB.signingKeyId,

          target,

          issuedAt:
            revokeIssuedAt,

          sequence:
            2,

          payload:
            createRevokePayload(
              materialA.signingKeyId,
              revokeIssuedAt,
            ),
        }),
        materialB.privateKey,
      );

    await expectRejectedWithoutMutation(
      "duplicate trust-transition packageId",
      duplicatePackageSigned,
      normalApplyNow,
      "already been applied",
    );

    // --------------------------------------------------------
    // STALE SEQUENCE
    //
    // New packageId, current ACTIVE B, otherwise-valid domain
    // transition, but sequence remains 1.
    // --------------------------------------------------------

    const staleSequenceSigned =
      signEnvelope(
        createUnsignedEnvelope({
          packageId:
            "FINORA-TRUST-TRANSITION-E2E-STALE",

          issuerId,

          signingKeyId:
            materialB.signingKeyId,

          target,

          issuedAt:
            revokeIssuedAt,

          sequence:
            1,

          payload:
            createRevokePayload(
              materialA.signingKeyId,
              revokeIssuedAt,
            ),
        }),
        materialB.privateKey,
      );

    await expectRejectedWithoutMutation(
      "stale trust-transition sequence",
      staleSequenceSigned,
      normalApplyNow,
      "sequence is stale",
    );

    // --------------------------------------------------------
    // VALID B-SIGNED REVOKE_RETIRED A, SEQUENCE 2
    // --------------------------------------------------------

    const revokeSigned =
      signEnvelope(
        createUnsignedEnvelope({
          packageId:
            "FINORA-TRUST-TRANSITION-E2E-0002",

          issuerId,

          signingKeyId:
            materialB.signingKeyId,

          target,

          issuedAt:
            revokeIssuedAt,

          sequence:
            2,

          payload:
            createRevokePayload(
              materialA.signingKeyId,
              revokeIssuedAt,
            ),
        }),
        materialB.privateKey,
      );

    const revokeResult =
      await applyFinoraSignedRecipientTrustTransition(
        revokeSigned,
        normalApplyNow,
      );

    assert(
      revokeResult.success,
      revokeResult.success
        ? "Valid REVOKE_RETIRED unexpectedly failed."
        : revokeResult.error,
    );

    assert(
      revokeResult.data.action ===
        "REVOKE_RETIRED" &&
      revokeResult.data.activeSigningKeyId ===
        materialB.signingKeyId &&
      revokeResult.data.affectedSigningKeyId ===
        materialA.signingKeyId &&
      revokeResult.data.sequence ===
        2,
      "REVOKE_RETIRED result returned incorrect authority metadata.",
    );

    const afterRevoke =
      await loadFinoraRecipientTrustStore();

    assert(
      afterRevoke !==
        undefined,
      "Recipient trust missing after valid REVOKE_RETIRED.",
    );

    const keyAAfterRevoke =
      afterRevoke.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            materialA.signingKeyId,
      );

    const keyBAfterRevoke =
      afterRevoke.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            materialB.signingKeyId,
      );

    assert(
      keyAAfterRevoke?.status ===
        "REVOKED" &&
      keyAAfterRevoke.validUntil ===
        rotateIssuedAt &&
      keyBAfterRevoke?.status ===
        "ACTIVE" &&
      keyBAfterRevoke.validUntil ===
        undefined,
      "REVOKE_RETIRED did not preserve B ACTIVE while revoking historical key A.",
    );

    assert(
      afterRevoke.appliedTrustTransitions?.length ===
        2 &&
      afterRevoke.appliedTrustTransitions[1].packageId ===
        revokeSigned.packageId &&
      afterRevoke.appliedTrustTransitions[1].sequence ===
        2 &&
      afterRevoke.trustTransitionSequences?.length ===
        1 &&
      afterRevoke.trustTransitionSequences[0].lastSequence ===
        2,
      "REVOKE_RETIRED did not advance replay ledger and monotonic sequence atomically.",
    );

    console.log(
      "PASS: B-signed REVOKE_RETIRED A persisted A REVOKED, B ACTIVE, and sequence 2",
    );

    assert(
      JSON.stringify(
        afterRevoke.appliedTrustRecoveries,
      ) ===
        seededRecoveryLedgerSnapshot &&
      JSON.stringify(
        afterRevoke.trustRecoverySequences,
      ) ===
        seededRecoverySequenceSnapshot,
      "REVOKE_RETIRED did not preserve pre-existing emergency-recovery replay metadata exactly.",
    );

    console.log(
      "PASS: REVOKE_RETIRED preserved existing emergency-recovery replay ledger and sequence cursor exactly",
    );

    // --------------------------------------------------------
    // VALID BASE ROTATE B -> C, SEQUENCE 3
    // Used only to construct rejected variants below.
    // --------------------------------------------------------

    const rotateCBaseIssuedAt =
      "2026-09-07T09:15:00.000Z";

    const rotateCBase =
      signEnvelope(
        createUnsignedEnvelope({
          packageId:
            "FINORA-TRUST-TRANSITION-E2E-0003",

          issuerId,

          signingKeyId:
            materialB.signingKeyId,

          target,

          issuedAt:
            rotateCBaseIssuedAt,

          sequence:
            3,

          payload:
            createRotatePayload(
              issuerId,
              materialC,
              rotateCBaseIssuedAt,
            ),
        }),
        materialB.privateKey,
      );

    // --------------------------------------------------------
    // SIGNATURE TAMPER
    // --------------------------------------------------------

    const tamperedSignatureBytes =
      Buffer.from(
        rotateCBase.signature.value,
        "base64",
      );

    tamperedSignatureBytes[0] =
      tamperedSignatureBytes[0] ^
      0x01;

    await expectRejectedWithoutMutation(
      "tampered trust-transition signature",
      {
        ...rotateCBase,

        signature: {
          ...rotateCBase.signature,

          value:
            tamperedSignatureBytes.toString(
              "base64",
            ),
        },
      },
      new Date(
        "2026-09-07T09:30:00.000Z",
      ),
      "INVALID_SIGNATURE",
    );

    // --------------------------------------------------------
    // WRONG NATIVE INSTALLATION TARGET
    //
    // Signed correctly over wrong target so rejection proves
    // target authority rather than signature mismatch.
    // --------------------------------------------------------

    const wrongTarget:
      FinoraRecipientTrustTransitionTarget = {
        ...target,

        installationId:
          "FINORA-WRONG-INSTALLATION-E2E",
      };

    const wrongTargetIssuedAt =
      "2026-09-07T09:20:00.000Z";

    const wrongTargetSigned =
      signEnvelope(
        createUnsignedEnvelope({
          packageId:
            "FINORA-TRUST-TRANSITION-E2E-WRONG-TARGET",

          issuerId,

          signingKeyId:
            materialB.signingKeyId,

          target:
            wrongTarget,

          issuedAt:
            wrongTargetIssuedAt,

          sequence:
            3,

          payload:
            createRotatePayload(
              issuerId,
              materialC,
              wrongTargetIssuedAt,
            ),
        }),
        materialB.privateKey,
      );

    await expectRejectedWithoutMutation(
      "wrong native installation target",
      wrongTargetSigned,
      new Date(
        "2026-09-07T09:30:00.000Z",
      ),
      "TARGET_MISMATCH",
    );

    // --------------------------------------------------------
    // FUTURE-ISSUED TRANSITION
    //
    // Signature and target are valid. Apply time is earlier
    // than signed issuedAt.
    // --------------------------------------------------------

    const futureIssuedAt =
      "2026-09-07T11:00:00.000Z";

    const futureSigned =
      signEnvelope(
        createUnsignedEnvelope({
          packageId:
            "FINORA-TRUST-TRANSITION-E2E-FUTURE",

          issuerId,

          signingKeyId:
            materialB.signingKeyId,

          target,

          issuedAt:
            futureIssuedAt,

          sequence:
            3,

          payload:
            createRotatePayload(
              issuerId,
              materialC,
              futureIssuedAt,
            ),
        }),
        materialB.privateKey,
      );

    await expectRejectedWithoutMutation(
      "future-issued trust transition",
      futureSigned,
      new Date(
        "2026-09-07T10:00:00.000Z",
      ),
      "cannot be applied before its signed issuedAt",
    );

    // --------------------------------------------------------
    // FINAL STATE
    // --------------------------------------------------------

    const finalStore =
      await loadFinoraRecipientTrustStore();

    assert(
      finalStore !==
        undefined &&
      finalStore.trustedKeys.length ===
        2 &&
      finalStore.appliedTrustTransitions?.length ===
        2 &&
      finalStore.trustTransitionSequences?.length ===
        1 &&
      finalStore.trustTransitionSequences[0].lastSequence ===
        2,
      "Rejected transitions changed final recipient trust/replay state.",
    );

    const finalA =
      finalStore.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            materialA.signingKeyId,
      );

    const finalB =
      finalStore.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            materialB.signingKeyId,
      );

    assert(
      finalA?.status ===
        "REVOKED" &&
      finalB?.status ===
        "ACTIVE",
      "Final recipient trust authority is not A REVOKED / B ACTIVE.",
    );

    const finalRecoveryMetadataStore =
      await loadFinoraRecipientTrustStore();

    assert(
      finalRecoveryMetadataStore !==
        undefined &&
      JSON.stringify(
        finalRecoveryMetadataStore.appliedTrustRecoveries,
      ) ===
        seededRecoveryLedgerSnapshot &&
      JSON.stringify(
        finalRecoveryMetadataStore.trustRecoverySequences,
      ) ===
        seededRecoverySequenceSnapshot,
      "Rejected transition paths mutated pre-existing emergency-recovery replay metadata.",
    );

    console.log(
      "PASS: rejected transition paths preserved emergency-recovery replay metadata exactly",
    );

    console.log(
      "PASS: rejected tamper/target/future transitions preserved final recipient trust state",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA RECIPIENT TRUST TRANSITION APPLY E2E SELFTEST",
    );

    console.log(
      "============================================================",
    );
  } finally {
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
      "PASS: isolated temporary recipient trust-transition userData deleted",
    );
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
  )
  .catch(
    (error) => {
      console.error(
        "FAIL: FINORA RECIPIENT TRUST TRANSITION APPLY E2E SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );