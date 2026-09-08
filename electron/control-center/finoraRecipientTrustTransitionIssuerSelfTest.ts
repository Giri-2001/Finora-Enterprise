/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST TRANSITION ISSUER SELF TEST

   RESPONSIBILITY:

   - Establish Control Center key A
   - Rotate local authority A -> B
   - Issue real retained-A signed A -> B transition
   - Verify recipient-side A trust accepts transition
   - Prove policy rejection consumes no sequence
   - Rotate local authority B -> C
   - Issue direct retained-A signed A -> C transition
   - Issue retained-B signed B -> C transition
   - Enforce historical revocation generation policy
   - Issue current-C signed REVOKE_RETIRED for A
   - Reject tampered real issuer signature
   - Prove issuer-vs-local-rotation shared queue ordering
   - Prove post-rotation A -> D issuance targets new current D

   IMPORTANT:

   - Real Electron safeStorage.
   - Real Control Center P-256 private keys.
   - Real encrypted issuance ledger.
   - Real ECDSA P1363 signatures.
   - Real recipient verifier.
   - Isolated temporary userData.
   - No renderer.
   - No IPC.
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
  setTimeout as delay,
} from "node:timers/promises";

import {
  loadOrCreateFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";

import {
  rotateFinoraControlCenterSigningKey,
} from "./finoraControlCenterSigningKeyRotationService.js";

import type {
  FinoraControlCenterSigningKeyRotationResult,
} from "./finoraControlCenterSigningKeyRotationService.js";

import {
  issueFinoraRecipientTrustTransition,
} from "./finoraRecipientTrustTransitionIssuer.js";

import type {
  FinoraRecipientTrustTransitionIssueResult,
} from "./finoraRecipientTrustTransitionIssuer.js";

import {
  verifyFinoraRecipientTrustTransition,
} from "../control/finoraRecipientTrustTransitionVerifier.js";

import type {
  FinoraRecipientTrustTransitionSignedEnvelope,
  FinoraRecipientTrustTransitionTarget,
} from "../control/finoraRecipientTrustTransitionContract.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "../control/finoraSignedControlPackageVerifier.js";

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
// RESULT NARROWING
// ============================================================

function assertRotationSuccess(
  result:
    FinoraControlCenterSigningKeyRotationResult,
  label:
    string,
): asserts result is Extract<
  FinoraControlCenterSigningKeyRotationResult,
  {
    success:
      true;
  }
> {
  if (
    !result.success
  ) {
    throw new Error(
      `${label}: ${result.error}`,
    );
  }
}

function assertIssueSuccess(
  result:
    FinoraRecipientTrustTransitionIssueResult,
  label:
    string,
): asserts result is Extract<
  FinoraRecipientTrustTransitionIssueResult,
  {
    success:
      true;
  }
> {
  if (
    !result.success
  ) {
    throw new Error(
      `${label}: ${result.error}`,
    );
  }
}

// ============================================================
// CLOCK
// ============================================================

async function waitForClockAfter(
  iso:
    string,
): Promise<void> {
  const boundary =
    Date.parse(
      iso,
    );

  assert(
    Number.isFinite(
      boundary,
    ),
    `Invalid clock boundary: ${iso}`,
  );

  while (
    Date.now() <=
      boundary
  ) {
    await delay(
      2,
    );
  }
}

// ============================================================
// RECIPIENT TRUST KEY
// ============================================================

function createActiveRecipientTrustedKey(
  issuerId:
    string,
  signingKeyId:
    string,
  publicKey:
    string,
  validFrom:
    string,
): FinoraBranchTrustedControlPublicKey {
  return {
    issuerId,

    signingKeyId,

    algorithm:
      "ECDSA_P256_SHA256",

    format:
      "SPKI_DER_BASE64",

    publicKey,

    status:
      "ACTIVE",

    validFrom,
  };
}

// ============================================================
// VERIFY VALID
// ============================================================

function assertRecipientAccepts(
  signedTransition:
    FinoraRecipientTrustTransitionSignedEnvelope,
  trustedKey:
    FinoraBranchTrustedControlPublicKey,
  target:
    FinoraRecipientTrustTransitionTarget,
  label:
    string,
): void {
  const result =
    verifyFinoraRecipientTrustTransition(
      signedTransition,
      [
        trustedKey,
      ],
      target,
    );

  assert(
    result.valid,
    result.valid
      ? `${label} unexpectedly failed.`
      : `${label}: ${result.reason}: ${result.error}`,
  );

  assert(
    result.trustedSigner.signingKeyId ===
      trustedKey.signingKeyId,
    `${label} resolved the wrong recipient trusted signer.`,
  );
}

// ============================================================
// ROTATE DESTINATION
// ============================================================

function assertRotateDestination(
  transition:
    FinoraRecipientTrustTransitionSignedEnvelope,
  expectedSigningKeyId:
    string,
  expectedPublicKey:
    string,
  label:
    string,
): void {
  assert(
    transition.payload.action ===
      "ROTATE",
    `${label} is not a ROTATE transition.`,
  );

  if (
    transition.payload.action !==
      "ROTATE"
  ) {
    return;
  }

  assert(
    transition.payload.newTrustedKey.signingKeyId ===
      expectedSigningKeyId &&
    transition.payload.newTrustedKey.publicKey ===
      expectedPublicKey &&
    transition.payload.newTrustedKey.status ===
      "ACTIVE" &&
    transition.payload.newTrustedKey.validFrom ===
      transition.issuedAt,
    `${label} does not target the expected current Control Center key.`,
  );
}

// ============================================================
// POLICY REJECTION
// ============================================================

async function assertIssueRejected(
  request:
    Parameters<
      typeof issueFinoraRecipientTrustTransition
    >[0],
  expectedError:
    string,
  label:
    string,
): Promise<void> {
  const result =
    await issueFinoraRecipientTrustTransition(
      request,
    );

  assert(
    !result.success,
    `${label} was unexpectedly accepted.`,
  );

  if (
    result.success
  ) {
    return;
  }

  assert(
    result.error.includes(
      expectedError,
    ),
    `${label} returned unexpected error: ${result.error}`,
  );

  console.log(
    `PASS: ${label} rejected before valid issuance continuation`,
  );
}

// ============================================================
// RUN
// ============================================================

async function runSelfTest():
  Promise<void> {
  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-recipient-trust-transition-issuer-selftest-",
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
    // TARGET
    // --------------------------------------------------------

    const target:
      FinoraRecipientTrustTransitionTarget = {
        installationId:
          "FINORA-INSTALLATION-ISSUER-E2E-001",

        bindingKeyId:
          "FINORA-BINDING-ISSUER-E2E-001",

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          "c".repeat(
            64,
          ),
      };

    // --------------------------------------------------------
    // INITIAL LOCAL CONTROL CENTER KEY A
    // --------------------------------------------------------

    const vaultA =
      await loadOrCreateFinoraControlCenterKeyVault();

    const issuerId =
      vaultA.issuerId;

    const signingKeyIdA =
      vaultA.signingKeyId;

    const trustedA =
      createActiveRecipientTrustedKey(
        issuerId,
        vaultA.signingKeyId,
        vaultA.publicKeySpkiDerBase64,
        vaultA.createdAt,
      );

    console.log(
      "PASS: initial local Control Center key A established",
    );

    // --------------------------------------------------------
    // LOCAL ROTATE A -> B
    // --------------------------------------------------------

    await waitForClockAfter(
      vaultA.createdAt,
    );

    const rotationAB =
      await rotateFinoraControlCenterSigningKey(
        new Date(),
      );

    assertRotationSuccess(
      rotationAB,
      "local A-to-B rotation",
    );

    assert(
      rotationAB.data.issuerId ===
        issuerId &&
      rotationAB.data.previousSigningKeyId ===
        signingKeyIdA,
      "A-to-B rotation changed issuer or previous-key authority.",
    );

    const vaultB =
      await loadOrCreateFinoraControlCenterKeyVault();

    const signingKeyIdB =
      vaultB.signingKeyId;

    const trustedB =
      createActiveRecipientTrustedKey(
        issuerId,
        vaultB.signingKeyId,
        vaultB.publicKeySpkiDerBase64,
        vaultB.createdAt,
      );

    console.log(
      "PASS: local authority rotated A->B with A retained",
    );

    // --------------------------------------------------------
    // ISSUE A -> B, SEQUENCE 1
    // --------------------------------------------------------

    const issueAB1 =
      await issueFinoraRecipientTrustTransition({
        action:
          "ROTATE",

        target,

        authorizingSigningKeyId:
          signingKeyIdA,
      });

    assertIssueSuccess(
      issueAB1,
      "retained-A signed A-to-B issuance",
    );

    assert(
      issueAB1.data.sequence ===
        1 &&
      issueAB1.data.authorizingSigningKeyId ===
        signingKeyIdA &&
      issueAB1.data.currentSigningKeyId ===
        signingKeyIdB &&
      issueAB1.data.signedTransition.issuer.signingKeyId ===
        signingKeyIdA &&
      issueAB1.data.signedTransition.signature.signingKeyId ===
        signingKeyIdA,
      "A-to-B issuance metadata/signing authority is invalid.",
    );

    assertRotateDestination(
      issueAB1.data.signedTransition,
      signingKeyIdB,
      vaultB.publicKeySpkiDerBase64,
      "A-to-B issuance",
    );

    assertRecipientAccepts(
      issueAB1.data.signedTransition,
      trustedA,
      target,
      "recipient verification of A-to-B transition",
    );

    assert(
      !JSON.stringify(
        issueAB1.data,
      ).includes(
        "privateKey"
      ),
      "Issuer success result exposed private signing material.",
    );

    console.log(
      "PASS: retained A produced a real recipient-verifiable A->B transition",
    );

    // --------------------------------------------------------
    // REAL SIGNATURE TAMPER
    // --------------------------------------------------------

    const tamperedBytes =
      Buffer.from(
        issueAB1.data.signedTransition.signature.value,
        "base64",
      );

    assert(
      tamperedBytes.length >
        0,
      "Issued signature unexpectedly decoded to zero bytes.",
    );

    tamperedBytes[0] =
      tamperedBytes[0] ^
      0x01;

    const tamperedTransition:
      FinoraRecipientTrustTransitionSignedEnvelope = {
        ...issueAB1.data.signedTransition,

        signature: {
          ...issueAB1.data.signedTransition.signature,

          value:
            tamperedBytes.toString(
              "base64",
            ),
        },
      };

    const tamperedResult =
      verifyFinoraRecipientTrustTransition(
        tamperedTransition,
        [
          trustedA,
        ],
        target,
      );

    assert(
      !tamperedResult.valid &&
      tamperedResult.reason ===
        "INVALID_SIGNATURE",
      "Tampered real issuer signature was not rejected as INVALID_SIGNATURE.",
    );

    console.log(
      "PASS: real issuer signature byte tamper rejected by recipient verifier",
    );

    // --------------------------------------------------------
    // SELF-ROTATE POLICY FAILURE MUST NOT CONSUME SEQUENCE
    // --------------------------------------------------------

    await assertIssueRejected(
      {
        action:
          "ROTATE",

        target,

        authorizingSigningKeyId:
          signingKeyIdB,
      },
      "already equals the current destination signing key",
      "current-B self ROTATE",
    );

    const issueAB2 =
      await issueFinoraRecipientTrustTransition({
        action:
          "ROTATE",

        target,

        authorizingSigningKeyId:
          signingKeyIdA,
      });

    assertIssueSuccess(
      issueAB2,
      "second retained-A A-to-B issuance",
    );

    assert(
      issueAB2.data.sequence ===
        2,
      "Rejected current-B self ROTATE consumed an issuance sequence.",
    );

    console.log(
      "PASS: self-ROTATE policy rejection consumed no issuance sequence",
    );

    // --------------------------------------------------------
    // LOCAL ROTATE B -> C
    // --------------------------------------------------------

    await waitForClockAfter(
      vaultB.createdAt,
    );

    const rotationBC =
      await rotateFinoraControlCenterSigningKey(
        new Date(),
      );

    assertRotationSuccess(
      rotationBC,
      "local B-to-C rotation",
    );

    assert(
      rotationBC.data.previousSigningKeyId ===
        signingKeyIdB,
      "B-to-C rotation did not rotate from B.",
    );

    const vaultC =
      await loadOrCreateFinoraControlCenterKeyVault();

    const signingKeyIdC =
      vaultC.signingKeyId;

    const trustedC =
      createActiveRecipientTrustedKey(
        issuerId,
        vaultC.signingKeyId,
        vaultC.publicKeySpkiDerBase64,
        vaultC.createdAt,
      );

    console.log(
      "PASS: local authority rotated B->C while preserving A/B history",
    );

    // --------------------------------------------------------
    // DIRECT A -> C, SEQUENCE 3
    // --------------------------------------------------------

    const issueAC =
      await issueFinoraRecipientTrustTransition({
        action:
          "ROTATE",

        target,

        authorizingSigningKeyId:
          signingKeyIdA,
      });

    assertIssueSuccess(
      issueAC,
      "direct retained-A A-to-C issuance",
    );

    assert(
      issueAC.data.sequence ===
        3 &&
      issueAC.data.currentSigningKeyId ===
        signingKeyIdC,
      "A-to-C issuance sequence/current authority is incorrect.",
    );

    assertRotateDestination(
      issueAC.data.signedTransition,
      signingKeyIdC,
      vaultC.publicKeySpkiDerBase64,
      "direct A-to-C issuance",
    );

    assertRecipientAccepts(
      issueAC.data.signedTransition,
      trustedA,
      target,
      "recipient verification of direct A-to-C transition",
    );

    console.log(
      "PASS: historical A can directly authorize recipient migration to current C",
    );

    // --------------------------------------------------------
    // B -> C, SEQUENCE 4
    // --------------------------------------------------------

    const issueBC =
      await issueFinoraRecipientTrustTransition({
        action:
          "ROTATE",

        target,

        authorizingSigningKeyId:
          signingKeyIdB,
      });

    assertIssueSuccess(
      issueBC,
      "retained-B B-to-C issuance",
    );

    assert(
      issueBC.data.sequence ===
        4 &&
      issueBC.data.currentSigningKeyId ===
        signingKeyIdC,
      "B-to-C issuance sequence/current authority is incorrect.",
    );

    assertRotateDestination(
      issueBC.data.signedTransition,
      signingKeyIdC,
      vaultC.publicKeySpkiDerBase64,
      "B-to-C issuance",
    );

    assertRecipientAccepts(
      issueBC.data.signedTransition,
      trustedB,
      target,
      "recipient verification of B-to-C transition",
    );

    console.log(
      "PASS: retained B produced a real recipient-verifiable B->C transition",
    );

    // --------------------------------------------------------
    // HISTORICAL GENERATION POLICY:
    // A MUST NOT REVOKE FUTURE SUCCESSOR B
    //
    // This must reject before reservation.
    // --------------------------------------------------------

    await assertIssueRejected(
      {
        action:
          "REVOKE_RETIRED",

        target,

        authorizingSigningKeyId:
          signingKeyIdA,

        revokedSigningKeyId:
          signingKeyIdB,
      },
      "cannot revoke a successor key from a later trust generation",
      "historical-A revocation of successor B",
    );

    // --------------------------------------------------------
    // CURRENT C REVOKES OLDER RETIRED A, SEQUENCE 5
    // --------------------------------------------------------

    const revokeAByC =
      await issueFinoraRecipientTrustTransition({
        action:
          "REVOKE_RETIRED",

        target,

        authorizingSigningKeyId:
          signingKeyIdC,

        revokedSigningKeyId:
          signingKeyIdA,
      });

    assertIssueSuccess(
      revokeAByC,
      "current-C revocation of retired A",
    );

    assert(
      revokeAByC.data.sequence ===
        5,
      "Rejected historical successor revocation consumed an issuance sequence.",
    );

    assert(
      revokeAByC.data.signedTransition.payload.action ===
        "REVOKE_RETIRED",
      "Expected REVOKE_RETIRED payload was not issued.",
    );

    if (
      revokeAByC.data.signedTransition.payload.action ===
        "REVOKE_RETIRED"
    ) {
      assert(
        revokeAByC.data.signedTransition.payload.revokedSigningKeyId ===
          signingKeyIdA,
        "REVOKE_RETIRED payload contains incorrect historical key ID.",
      );
    }

    assertRecipientAccepts(
      revokeAByC.data.signedTransition,
      trustedC,
      target,
      "recipient verification of C-signed retired-A revocation",
    );

    console.log(
      "PASS: current C validly authorized revocation of older retired A",
    );

    // --------------------------------------------------------
    // ISSUER VS LOCAL ROTATION SHARED QUEUE
    //
    // Current = C.
    //
    // These calls are intentionally started in this order:
    //   1. issue retained-A -> CURRENT
    //   2. rotate C -> D
    //
    // Both operations use the same key-authority queue.
    //
    // Therefore issuance must snapshot/sign against C and
    // rotation must execute afterwards.
    // --------------------------------------------------------

    await waitForClockAfter(
      vaultC.createdAt,
    );

    const rotateCDAt =
      new Date();

    const [
      issueDuringRotation,
      rotationCD,
    ] =
      await Promise.all([
        issueFinoraRecipientTrustTransition({
          action:
            "ROTATE",

          target,

          authorizingSigningKeyId:
            signingKeyIdA,
        }),

        rotateFinoraControlCenterSigningKey(
          rotateCDAt,
        ),
      ]);

    assertIssueSuccess(
      issueDuringRotation,
      "issuer-before-rotation shared-queue issuance",
    );

    assertRotationSuccess(
      rotationCD,
      "shared-queue C-to-D rotation",
    );

    assert(
      issueDuringRotation.data.sequence ===
        6,
      "Shared-queue issuance received unexpected sequence.",
    );

    assert(
      rotationCD.data.previousSigningKeyId ===
        signingKeyIdC,
      "Concurrent local rotation did not execute from C.",
    );

    assertRotateDestination(
      issueDuringRotation.data.signedTransition,
      signingKeyIdC,
      vaultC.publicKeySpkiDerBase64,
      "issuer-before-rotation transition",
    );

    assertRecipientAccepts(
      issueDuringRotation.data.signedTransition,
      trustedA,
      target,
      "recipient verification of issuer-before-rotation transition",
    );

    const vaultD =
      await loadOrCreateFinoraControlCenterKeyVault();

    const signingKeyIdD =
      vaultD.signingKeyId;

    assert(
      signingKeyIdD ===
        rotationCD.data.newSigningKeyId &&
      signingKeyIdD !==
        signingKeyIdC,
      "Shared-queue local rotation did not leave D current.",
    );

    console.log(
      "PASS: issuer-first concurrent operation signed for C before serialized C->D rotation",
    );

    // --------------------------------------------------------
    // POST-ROTATION A -> D, SEQUENCE 7
    // --------------------------------------------------------

    const issueAD =
      await issueFinoraRecipientTrustTransition({
        action:
          "ROTATE",

        target,

        authorizingSigningKeyId:
          signingKeyIdA,
      });

    assertIssueSuccess(
      issueAD,
      "post-rotation retained-A A-to-D issuance",
    );

    assert(
      issueAD.data.sequence ===
        7 &&
      issueAD.data.currentSigningKeyId ===
        signingKeyIdD,
      "Post-rotation issuance did not advance to sequence 7/current D.",
    );

    assertRotateDestination(
      issueAD.data.signedTransition,
      signingKeyIdD,
      vaultD.publicKeySpkiDerBase64,
      "post-rotation A-to-D transition",
    );

    assertRecipientAccepts(
      issueAD.data.signedTransition,
      trustedA,
      target,
      "recipient verification of post-rotation A-to-D transition",
    );

    console.log(
      "PASS: after shared C->D rotation, retained A issuance targets new current D",
    );

    // --------------------------------------------------------
    // FINAL VAULT HISTORY
    // --------------------------------------------------------

    const finalRetainedIds =
      new Set(
        (
          vaultD.retainedSigningKeys ??
          []
        ).map(
          (key) =>
            key.signingKeyId,
        ),
      );

    assert(
      finalRetainedIds.has(
        signingKeyIdA,
      ) &&
      finalRetainedIds.has(
        signingKeyIdB,
      ) &&
      finalRetainedIds.has(
        signingKeyIdC,
      ),
      "Final Control Center vault lost A/B/C predecessor signing history.",
    );

    console.log(
      "PASS: final local vault preserves A/B/C predecessor rollout authority",
    );

    // --------------------------------------------------------
    // FINAL
    // --------------------------------------------------------

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA RECIPIENT TRUST TRANSITION ISSUER E2E SELFTEST",
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
      "PASS: isolated temporary issuer E2E userData deleted",
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
        "FAIL: FINORA RECIPIENT TRUST TRANSITION ISSUER E2E SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );