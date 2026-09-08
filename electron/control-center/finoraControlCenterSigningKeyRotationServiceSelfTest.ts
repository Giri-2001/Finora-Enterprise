/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER SIGNING KEY ROTATION SERVICE SELF TEST

   RESPONSIBILITY:

   - Verify stable issuer across rotations
   - Verify A -> B rotation
   - Verify previous current key retention
   - Verify public-only rotation result
   - Verify backward-time rejection with vault/high-water zero mutation
   - Verify B -> C preserves older A history
   - Verify concurrent rotations serialize deterministically
   - Verify retained key cryptography after multiple rotations
   - Verify current public identity follows latest rotation
   - Verify future issuer high-water blocks signing-key rotation

   IMPORTANT:

   - Real Electron safeStorage runtime.
   - Isolated temporary userData only.
   - No renderer.
   - No IPC.
   - No recipient mutation.
   - No transition issuance.
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
} from "./finoraControlCenterCanonicalization.js";

import {
  loadFinoraControlCenterClockHighWaterState,
  persistFinoraControlCenterClockHighWaterState,
} from "./finoraControlCenterClockHighWaterStore.js";

import {
  validateFinoraControlCenterSigningMaterial,
  verifyFinoraControlCenterCanonicalSignature,
} from "./finoraControlCenterCrypto.js";

import {
  runFinoraControlCenterKeyAuthoritySerialized,
} from "./finoraControlCenterKeyAuthorityQueue.js";

import {
  getFinoraControlCenterPublicIdentity,
  loadOrCreateFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";

import {
  signFinoraControlCenterPackage,
} from "./finoraControlCenterSigner.js";

import {
  rotateFinoraControlCenterSigningKey,
} from "./finoraControlCenterSigningKeyRotationService.js";

import type {
  FinoraControlCenterSigningKeyRotationResult,
} from "./finoraControlCenterSigningKeyRotationService.js";

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
// TIME
// ============================================================

function addMilliseconds(
  iso:
    string,
  milliseconds:
    number,
): string {
  const parsed =
    Date.parse(
      iso,
    );

  assert(
    Number.isFinite(
      parsed,
    ),
    `Invalid timestamp fixture: ${iso}`,
  );

  return new Date(
    parsed +
      milliseconds,
  ).toISOString();
}

// ============================================================
// PUBLIC-ONLY RESULT
// ============================================================

function assertPublicOnlyRotationResult(
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
  assert(
    result.success,
    result.success
      ? `${label} unexpectedly failed.`
      : result.error,
  );

  const serialized =
    JSON.stringify(
      result.data,
    );

  assert(
    !serialized.includes(
      "privateKey"
    ) &&
    !serialized.includes(
      "privateKeyPkcs8DerBase64"
    ),
    `${label} exposed private signing material.`,
  );
}

// ============================================================
// SNAPSHOT
// ============================================================

async function snapshotVault():
  Promise<string> {
  const vault =
    await loadOrCreateFinoraControlCenterKeyVault();

  return JSON.stringify(
    vault,
  );
}

async function snapshotClockHighWater():
  Promise<string> {
  const state =
    await loadFinoraControlCenterClockHighWaterState();

  return JSON.stringify(
    state ??
      null,
  );
}

// ============================================================
// ZERO-MUTATION FAILURE
// ============================================================

async function expectRejectedWithoutMutation(
  label:
    string,
  now:
    Date,
  expectedError:
    string,
): Promise<void> {
  const beforeVault =
    await snapshotVault();

  const beforeHighWater =
    await snapshotClockHighWater();

  const result =
    await rotateFinoraControlCenterSigningKey(
      now,
    );

  assert(
    !result.success,
    `${label} was unexpectedly accepted.`,
  );

  assert(
    result.error
      .toLowerCase()
      .includes(
        expectedError.toLowerCase(),
      ),
    `${label} returned unexpected error: ${result.error}`,
  );

  const afterVault =
    await snapshotVault();

  const afterHighWater =
    await snapshotClockHighWater();

  assert(
    afterVault ===
      beforeVault,
    `${label} changed persisted Control Center key-vault state.`,
  );

  assert(
    afterHighWater ===
      beforeHighWater,
    `${label} changed persisted Control Center clock high-water state.`,
  );

  console.log(
    `PASS: ${label} rejected with zero persisted vault/high-water mutation`,
  );
}

// ============================================================
// RETAINED CRYPTO VALIDATION
// ============================================================

async function assertAllRetainedKeysValid():
  Promise<void> {
  const vault =
    await loadOrCreateFinoraControlCenterKeyVault();

  for (
    const retainedKey of
      (
        vault.retainedSigningKeys ??
        []
      )
  ) {
    assert(
      validateFinoraControlCenterSigningMaterial({
        signingKeyId:
          retainedKey.signingKeyId,

        privateKeyPkcs8DerBase64:
          retainedKey.privateKeyPkcs8DerBase64,

        publicKeySpkiDerBase64:
          retainedKey.publicKeySpkiDerBase64,
      }),
      `Retained signing key ${retainedKey.signingKeyId} failed cryptographic validation.`,
    );
  }
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
        "finora-control-center-signing-rotation-selftest-",
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
    // INITIAL CURRENT KEY A
    // --------------------------------------------------------

    const vaultA =
      await loadOrCreateFinoraControlCenterKeyVault();

    const issuerId =
      vaultA.issuerId;

    const signingKeyIdA =
      vaultA.signingKeyId;

    assert(
      vaultA.retainedSigningKeys ===
        undefined,
      "Initial vault unexpectedly contains retained signing history.",
    );

    assert(
      validateFinoraControlCenterSigningMaterial({
        signingKeyId:
          vaultA.signingKeyId,

        privateKeyPkcs8DerBase64:
          vaultA.privateKeyPkcs8DerBase64,

        publicKeySpkiDerBase64:
          vaultA.publicKeySpkiDerBase64,
      }),
      "Initial current signing key A failed cryptographic validation.",
    );

    console.log(
      "PASS: initial Control Center current signing key A established",
    );

    // --------------------------------------------------------
    // A -> B
    // --------------------------------------------------------

    const rotateABAt =
      addMilliseconds(
        vaultA.createdAt,
        1000,
      );

    const rotationAB =
      await rotateFinoraControlCenterSigningKey(
        new Date(
          rotateABAt,
        ),
      );

    assertPublicOnlyRotationResult(
      rotationAB,
      "A-to-B rotation",
    );

    assert(
      rotationAB.data.issuerId ===
        issuerId &&
      rotationAB.data.previousSigningKeyId ===
        signingKeyIdA &&
      rotationAB.data.newSigningKeyId !==
        signingKeyIdA &&
      rotationAB.data.rotatedAt ===
        rotateABAt,
      "A-to-B rotation returned incorrect authority metadata.",
    );

    const signingKeyIdB =
      rotationAB.data.newSigningKeyId;

    const vaultB =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      vaultB.issuerId ===
        issuerId &&
      vaultB.signingKeyId ===
        signingKeyIdB &&
      vaultB.createdAt ===
        rotateABAt &&
      vaultB.retainedSigningKeys?.length ===
        1 &&
      vaultB.retainedSigningKeys[0].signingKeyId ===
        signingKeyIdA &&
      vaultB.retainedSigningKeys[0].retiredAt ===
        rotateABAt,
      "A-to-B rotation did not persist B current / A retained correctly.",
    );

    const publicB =
      await getFinoraControlCenterPublicIdentity();

    assert(
      publicB.issuerId ===
        issuerId &&
      publicB.signingKeyId ===
        signingKeyIdB,
      "Public identity did not switch to B.",
    );

    await assertAllRetainedKeysValid();

    const highWaterAfterAB =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      highWaterAfterAB !==
        undefined &&
      highWaterAfterAB.issuerId ===
        issuerId &&
      highWaterAfterAB.highWaterAt ===
        rotateABAt,
      "A-to-B rotation did not establish the exact issuer clock high-water.",
    );

    console.log(
      "PASS: A->B rotation established exact issuer clock high-water",
    );

    console.log(
      "PASS: A->B rotation preserved stable issuer, retained A, switched public/current identity to B, and returned public metadata only",
    );

    // --------------------------------------------------------
    // BACKWARD-TIME REJECTION
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "backward-time signing-key rotation",
      new Date(
        addMilliseconds(
          rotateABAt,
          -1,
        ),
      ),
      "rollback",
    );

    // --------------------------------------------------------
    // B -> C
    // --------------------------------------------------------

    const rotateBCAt =
      addMilliseconds(
        rotateABAt,
        1000,
      );

    const rotationBC =
      await rotateFinoraControlCenterSigningKey(
        new Date(
          rotateBCAt,
        ),
      );

    assertPublicOnlyRotationResult(
      rotationBC,
      "B-to-C rotation",
    );

    assert(
      rotationBC.data.issuerId ===
        issuerId &&
      rotationBC.data.previousSigningKeyId ===
        signingKeyIdB &&
      rotationBC.data.newSigningKeyId !==
        signingKeyIdB,
      "B-to-C rotation returned incorrect authority metadata.",
    );

    const signingKeyIdC =
      rotationBC.data.newSigningKeyId;

    const vaultC =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      vaultC.issuerId ===
        issuerId &&
      vaultC.signingKeyId ===
        signingKeyIdC &&
      vaultC.retainedSigningKeys?.length ===
        2,
      "B-to-C rotation did not preserve A/B history.",
    );

    const retainedA =
      vaultC.retainedSigningKeys.find(
        (key) =>
          key.signingKeyId ===
            signingKeyIdA,
      );

    const retainedB =
      vaultC.retainedSigningKeys.find(
        (key) =>
          key.signingKeyId ===
            signingKeyIdB,
      );

    assert(
      retainedA !==
        undefined &&
      retainedA.retiredAt ===
        rotateABAt &&
      retainedB !==
        undefined &&
      retainedB.retiredAt ===
        rotateBCAt,
      "B-to-C rotation changed historical A or failed to retain B.",
    );

    await assertAllRetainedKeysValid();

    console.log(
      "PASS: B->C rotation preserved immutable A history and retained B",
    );

    // --------------------------------------------------------
    // CONCURRENT ROTATIONS
    //
    // Call order:
    // C -> D at t3
    // D -> E at t4
    //
    // The rotation service queue must serialize these calls
    // deterministically.
    // --------------------------------------------------------

    const rotateCDAt =
      addMilliseconds(
        rotateBCAt,
        1000,
      );

    const rotateDEAt =
      addMilliseconds(
        rotateCDAt,
        1000,
      );

    const [
      concurrentFirst,
      concurrentSecond,
    ] =
      await Promise.all([
        rotateFinoraControlCenterSigningKey(
          new Date(
            rotateCDAt,
          ),
        ),
        rotateFinoraControlCenterSigningKey(
          new Date(
            rotateDEAt,
          ),
        ),
      ]);

    assertPublicOnlyRotationResult(
      concurrentFirst,
      "first concurrent rotation",
    );

    assertPublicOnlyRotationResult(
      concurrentSecond,
      "second concurrent rotation",
    );

    assert(
      concurrentFirst.data.issuerId ===
        issuerId &&
      concurrentSecond.data.issuerId ===
        issuerId &&
      concurrentFirst.data.previousSigningKeyId ===
        signingKeyIdC &&
      concurrentSecond.data.previousSigningKeyId ===
        concurrentFirst.data.newSigningKeyId &&
      concurrentFirst.data.rotatedAt ===
        rotateCDAt &&
      concurrentSecond.data.rotatedAt ===
        rotateDEAt,
      "Concurrent rotations did not serialize in deterministic call order.",
    );

    const finalVault =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      finalVault.issuerId ===
        issuerId &&
      finalVault.signingKeyId ===
        concurrentSecond.data.newSigningKeyId &&
      finalVault.createdAt ===
        rotateDEAt &&
      finalVault.retainedSigningKeys?.length ===
        4,
      "Concurrent rotations did not persist the expected final current/history state.",
    );

    const expectedRetainedIds =
      new Set([
        signingKeyIdA,
        signingKeyIdB,
        signingKeyIdC,
        concurrentFirst.data.newSigningKeyId,
      ]);

    const actualRetainedIds =
      new Set(
        finalVault.retainedSigningKeys.map(
          (key) =>
            key.signingKeyId,
        ),
      );

    assert(
      actualRetainedIds.size ===
        expectedRetainedIds.size &&
      [
        ...expectedRetainedIds,
      ].every(
        (signingKeyId) =>
          actualRetainedIds.has(
            signingKeyId,
          ),
      ),
      "Concurrent rotations lost or duplicated predecessor signing history.",
    );

    await assertAllRetainedKeysValid();

    const finalPublicIdentity =
      await getFinoraControlCenterPublicIdentity();

    assert(
      finalPublicIdentity.issuerId ===
        issuerId &&
      finalPublicIdentity.signingKeyId ===
        concurrentSecond.data.newSigningKeyId &&
      finalPublicIdentity.publicKeySpkiDerBase64 ===
        concurrentSecond.data.newPublicKeySpkiDerBase64,
      "Final public identity does not match the latest serialized rotation.",
    );

    console.log(
      "PASS: concurrent rotations serialized deterministically and preserved complete predecessor history",
    );

    // --------------------------------------------------------
    // OPERATIONAL SIGN VS ROTATION — SIGN FIRST
    //
    // Hold the shared key-authority queue, enqueue operational
    // signing first and rotation second, then release the gate.
    //
    // Signing must complete with the pre-rotation current key.
    // --------------------------------------------------------

    const signFirstCurrentIdentity =
      await getFinoraControlCenterPublicIdentity();

    const signFirstCurrentVault =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      signFirstCurrentIdentity.signingKeyId ===
        signFirstCurrentVault.signingKeyId,
      "Sign-first fixture public identity does not match current key vault.",
    );

    let releaseSignFirstGate:
      (() => void) |
      undefined;

    const signFirstGate =
      new Promise<void>(
        (
          resolve,
        ) => {
          releaseSignFirstGate =
            resolve;
        },
      );

    const signFirstBlocker =
      runFinoraControlCenterKeyAuthoritySerialized(
        async () => {
          await signFirstGate;
        },
      );

    const signFirstPackagePromise =
      signFinoraControlCenterPackage({
        packageId:
          "FINORA-AX-SIGN-FIRST-0001",

        purpose:
          "BUSINESS_PROFILE",

        target: {
          ownerId:
            "FINORA-AX-OWNER",

          businessId:
            "FINORA-AX-BUSINESS",

          branchId:
            "FINORA-AX-BRANCH",
        },

        issuedAt:
          addMilliseconds(
            signFirstCurrentVault.createdAt,
            100,
          ),

        sequence:
          900001,

        payloadVersion:
          1,

        payload: {
          proof:
            "SIGN_FIRST",
        },

        schemaVersion:
          1,
      });

    const signFirstRotationPromise =
      rotateFinoraControlCenterSigningKey(
        new Date(
          addMilliseconds(
            signFirstCurrentVault.createdAt,
            1000,
          ),
        ),
      );

    assert(
      releaseSignFirstGate !==
        undefined,
      "Sign-first key-authority queue gate was not initialized.",
    );

    releaseSignFirstGate();

    await signFirstBlocker;

    const [
      signFirstPackage,
      signFirstRotation,
    ] =
      await Promise.all([
        signFirstPackagePromise,
        signFirstRotationPromise,
      ]);

    assertPublicOnlyRotationResult(
      signFirstRotation,
      "sign-first concurrent rotation",
    );

    assert(
      signFirstPackage.issuer.signingKeyId ===
        signFirstCurrentIdentity.signingKeyId &&
      signFirstPackage.signature.signingKeyId ===
        signFirstCurrentIdentity.signingKeyId &&
      signFirstRotation.data.previousSigningKeyId ===
        signFirstCurrentIdentity.signingKeyId,
      "Sign-first ordering did not preserve the pre-rotation signing authority.",
    );

    const {
      signature:
        signFirstSignature,

      ...signFirstUnsignedPackage
    } =
      signFirstPackage;

    assert(
      verifyFinoraControlCenterCanonicalSignature(
        canonicalizeFinoraControlCenterValue(
          signFirstUnsignedPackage,
        ),
        signFirstSignature.value,
        signFirstCurrentIdentity.publicKeySpkiDerBase64,
      ),
      "Sign-first package failed verification with the pre-rotation public key.",
    );

    const afterSignFirstVault =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      afterSignFirstVault.signingKeyId ===
        signFirstRotation.data.newSigningKeyId,
      "Sign-first concurrent rotation did not become the current signing authority.",
    );

    console.log(
      "PASS: operational signing queued before rotation completed with the pre-rotation key and rotation applied afterward",
    );

    // --------------------------------------------------------
    // OPERATIONAL SIGN VS ROTATION — ROTATION FIRST
    //
    // Hold the same authority queue, enqueue rotation first and
    // operational signing second, then release the gate.
    //
    // Signing must observe and use the newly rotated key.
    // --------------------------------------------------------

    const rotateFirstPreviousSigningKeyId =
      afterSignFirstVault.signingKeyId;

    let releaseRotateFirstGate:
      (() => void) |
      undefined;

    const rotateFirstGate =
      new Promise<void>(
        (
          resolve,
        ) => {
          releaseRotateFirstGate =
            resolve;
        },
      );

    const rotateFirstBlocker =
      runFinoraControlCenterKeyAuthoritySerialized(
        async () => {
          await rotateFirstGate;
        },
      );

    const rotateFirstRotationPromise =
      rotateFinoraControlCenterSigningKey(
        new Date(
          addMilliseconds(
            afterSignFirstVault.createdAt,
            1000,
          ),
        ),
      );

    const rotateFirstPackagePromise =
      signFinoraControlCenterPackage({
        packageId:
          "FINORA-AX-ROTATE-FIRST-0002",

        purpose:
          "BUSINESS_PROFILE",

        target: {
          ownerId:
            "FINORA-AX-OWNER",

          businessId:
            "FINORA-AX-BUSINESS",

          branchId:
            "FINORA-AX-BRANCH",
        },

        issuedAt:
          addMilliseconds(
            afterSignFirstVault.createdAt,
            1100,
          ),

        sequence:
          900002,

        payloadVersion:
          1,

        payload: {
          proof:
            "ROTATE_FIRST",
        },

        schemaVersion:
          1,
      });

    assert(
      releaseRotateFirstGate !==
        undefined,
      "Rotate-first key-authority queue gate was not initialized.",
    );

    releaseRotateFirstGate();

    await rotateFirstBlocker;

    const [
      rotateFirstRotation,
      rotateFirstPackage,
    ] =
      await Promise.all([
        rotateFirstRotationPromise,
        rotateFirstPackagePromise,
      ]);

    assertPublicOnlyRotationResult(
      rotateFirstRotation,
      "rotate-first concurrent rotation",
    );

    assert(
      rotateFirstRotation.data.previousSigningKeyId ===
        rotateFirstPreviousSigningKeyId &&
      rotateFirstPackage.issuer.signingKeyId ===
        rotateFirstRotation.data.newSigningKeyId &&
      rotateFirstPackage.signature.signingKeyId ===
        rotateFirstRotation.data.newSigningKeyId,
      "Rotate-first ordering did not make operational signing observe the newly rotated authority.",
    );

    const {
      signature:
        rotateFirstSignature,

      ...rotateFirstUnsignedPackage
    } =
      rotateFirstPackage;

    assert(
      verifyFinoraControlCenterCanonicalSignature(
        canonicalizeFinoraControlCenterValue(
          rotateFirstUnsignedPackage,
        ),
        rotateFirstSignature.value,
        rotateFirstRotation.data.newPublicKeySpkiDerBase64,
      ),
      "Rotate-first package failed verification with the newly rotated public key.",
    );

    const afterRotateFirstVault =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      afterRotateFirstVault.signingKeyId ===
        rotateFirstRotation.data.newSigningKeyId,
      "Rotate-first final key vault does not match the latest rotation.",
    );

    console.log(
      "PASS: rotation queued before operational signing completed first and signing used the newly rotated key",
    );

    console.log(
      "PASS: operational Control Center signing and signing-key rotation share one deterministic key-authority queue",
    );

    // --------------------------------------------------------
    // FUTURE ISSUER HIGH-WATER -> ROTATION FAILS CLOSED
    // --------------------------------------------------------

    const beforeFutureVault =
      await snapshotVault();

    const currentHighWater =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      currentHighWater !==
        undefined &&
      currentHighWater.issuerId ===
        issuerId,
      "Issuer clock high-water was unavailable before future rollback fixture.",
    );

    const attemptedFutureBlockedRotationAt =
      addMilliseconds(
        afterRotateFirstVault.createdAt,
        1000,
      );

    const futureHighWaterAt =
      addMilliseconds(
        attemptedFutureBlockedRotationAt,
        60 * 60 * 1000,
      );

    await persistFinoraControlCenterClockHighWaterState({
      schemaVersion:
        1,

      issuerId,

      highWaterAt:
        futureHighWaterAt,
    });

    const seededFutureHighWater =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      seededFutureHighWater !==
        undefined &&
      seededFutureHighWater.issuerId ===
        issuerId &&
      seededFutureHighWater.highWaterAt ===
        futureHighWaterAt,
      "Future issuer clock high-water fixture was not persisted.",
    );

    const seededFutureHighWaterSerialized =
      JSON.stringify(
        seededFutureHighWater,
      );

    const blockedRotation =
      await rotateFinoraControlCenterSigningKey(
        new Date(
          attemptedFutureBlockedRotationAt,
        ),
      );

    assert(
      !blockedRotation.success &&
      /rollback/i.test(
        blockedRotation.error,
      ),
      "Future issuer clock high-water did not reject signing-key rotation.",
    );

    const afterFutureVault =
      await snapshotVault();

    assert(
      afterFutureVault ===
        beforeFutureVault,
      "Future high-water rollback rejection mutated the Control Center key vault.",
    );

    const highWaterAfterBlockedRotation =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      highWaterAfterBlockedRotation !==
        undefined &&
      JSON.stringify(
        highWaterAfterBlockedRotation,
      ) ===
        seededFutureHighWaterSerialized,
      "Future high-water rollback rejection mutated the seeded issuer high-water.",
    );

    console.log(
      "PASS: future issuer high-water rejected rotation with zero vault/high-water mutation",
    );

    // --------------------------------------------------------
    // FINAL
    // --------------------------------------------------------

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA CONTROL CENTER SIGNING KEY ROTATION SERVICE SELFTEST",
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
      "PASS: isolated temporary signing-key rotation userData deleted",
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
        "FAIL: FINORA CONTROL CENTER SIGNING KEY ROTATION SERVICE SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );