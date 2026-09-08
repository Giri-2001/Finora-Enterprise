/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER KEY VAULT ROTATION SELF TEST

   RESPONSIBILITY:

   - Verify legacy single-current-key vault compatibility
   - Verify stable issuer identity across key replacement
   - Verify A -> B replacement retains A
   - Verify public/current identity changes to B
   - Verify retained A remains cryptographically valid
   - Reject issuer mutation with zero persisted mutation
   - Reject predecessor omission with zero persisted mutation
   - Reject arbitrary retained-key injection with zero mutation
   - Reject invalid new current keypair with zero mutation
   - Verify B -> C replacement preserves A and retains B
   - Verify public/current identity changes to C

   IMPORTANT:

   - Real Electron safeStorage runtime.
   - Isolated temporary userData.
   - No IPC.
   - No renderer.
   - No production key material.
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
  generateFinoraControlCenterSigningMaterial,
  validateFinoraControlCenterSigningMaterial,
} from "./finoraControlCenterCrypto.js";

import {
  getFinoraControlCenterPublicIdentity,
  loadOrCreateFinoraControlCenterKeyVault,
  replaceFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";

import type {
  FinoraControlCenterKeyVaultRecord,
  FinoraControlCenterRetainedSigningKeyRecord,
} from "./finoraControlCenterKeyVault.js";

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
  const base =
    Date.parse(
      iso,
    );

  assert(
    Number.isFinite(
      base,
    ),
    `Invalid fixture timestamp: ${iso}`,
  );

  return new Date(
    base +
      milliseconds,
  ).toISOString();
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

// ============================================================
// ZERO-MUTATION REJECTION
// ============================================================

async function expectRejectedWithoutMutation(
  label:
    string,
  nextRecord:
    FinoraControlCenterKeyVaultRecord,
  expectedError:
    string,
): Promise<void> {
  const before =
    await snapshotVault();

  let rejection:
    string | undefined;

  try {
    await replaceFinoraControlCenterKeyVault(
      nextRecord,
    );
  } catch (
    error
  ) {
    rejection =
      error instanceof Error
        ? error.message
        : String(
            error,
          );
  }

  assert(
    rejection !==
      undefined,
    `${label} was unexpectedly accepted.`,
  );

  assert(
    rejection.includes(
      expectedError,
    ),
    `${label} returned unexpected rejection: ${rejection}`,
  );

  const after =
    await snapshotVault();

  assert(
    after ===
      before,
    `${label} changed persisted key-vault state.`,
  );

  console.log(
    `PASS: ${label} rejected with zero persisted mutation`,
  );
}

// ============================================================
// RETAINED RECORD
// ============================================================

function createRetainedRecord(
  current:
    FinoraControlCenterKeyVaultRecord,
  retiredAt:
    string,
): FinoraControlCenterRetainedSigningKeyRecord {
  return {
    signingKeyId:
      current.signingKeyId,

    privateKeyPkcs8DerBase64:
      current.privateKeyPkcs8DerBase64,

    publicKeySpkiDerBase64:
      current.publicKeySpkiDerBase64,

    createdAt:
      current.createdAt,

    retiredAt,
  };
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
        "finora-control-center-key-vault-rotation-selftest-",
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
    // INITIAL LEGACY SINGLE-KEY VAULT A
    // --------------------------------------------------------

    const vaultA =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      vaultA.issuerId.length >
        0 &&
      vaultA.signingKeyId.length >
        0,
      "Initial Control Center vault identity is invalid.",
    );

    assert(
      vaultA.retainedSigningKeys ===
        undefined,
      "Initial legacy-compatible vault unexpectedly contains retained signing keys.",
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
      "Initial Control Center key A failed cryptographic validation.",
    );

    const publicA =
      await getFinoraControlCenterPublicIdentity();

    assert(
      publicA.issuerId ===
        vaultA.issuerId &&
      publicA.signingKeyId ===
        vaultA.signingKeyId,
      "Initial public identity does not match current vault key A.",
    );

    console.log(
      "PASS: legacy single-current-key vault A loaded and validated",
    );

    // --------------------------------------------------------
    // PREPARE B
    // --------------------------------------------------------

    const materialB =
      generateFinoraControlCenterSigningMaterial();

    const rotateABAt =
      addMilliseconds(
        vaultA.createdAt,
        1000,
      );

    const retainedA =
      createRetainedRecord(
        vaultA,
        rotateABAt,
      );

    const vaultB:
      FinoraControlCenterKeyVaultRecord = {
        issuerId:
          vaultA.issuerId,

        signingKeyId:
          materialB.signingKeyId,

        privateKeyPkcs8DerBase64:
          materialB.privateKeyPkcs8DerBase64,

        publicKeySpkiDerBase64:
          materialB.publicKeySpkiDerBase64,

        createdAt:
          rotateABAt,

        retainedSigningKeys: [
          retainedA,
        ],

        schemaVersion:
          1,
      };

    // --------------------------------------------------------
    // VALID A -> B REPLACEMENT
    // --------------------------------------------------------

    await replaceFinoraControlCenterKeyVault(
      vaultB,
    );

    const loadedB =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      loadedB.issuerId ===
        vaultA.issuerId,
      "A-to-B replacement changed stable issuerId.",
    );

    assert(
      loadedB.signingKeyId ===
        materialB.signingKeyId,
      "A-to-B replacement did not make B the current signing key.",
    );

    assert(
      loadedB.retainedSigningKeys?.length ===
        1 &&
      loadedB.retainedSigningKeys[0].signingKeyId ===
        vaultA.signingKeyId &&
      loadedB.retainedSigningKeys[0].retiredAt ===
        rotateABAt,
      "A-to-B replacement did not retain predecessor A correctly.",
    );

    assert(
      validateFinoraControlCenterSigningMaterial({
        signingKeyId:
          loadedB.retainedSigningKeys[0].signingKeyId,

        privateKeyPkcs8DerBase64:
          loadedB.retainedSigningKeys[0].privateKeyPkcs8DerBase64,

        publicKeySpkiDerBase64:
          loadedB.retainedSigningKeys[0].publicKeySpkiDerBase64,
      }),
      "Retained predecessor A is no longer cryptographically valid.",
    );

    const publicB =
      await getFinoraControlCenterPublicIdentity();

    assert(
      publicB.issuerId ===
        vaultA.issuerId &&
      publicB.signingKeyId ===
        materialB.signingKeyId &&
      publicB.publicKeySpkiDerBase64 ===
        materialB.publicKeySpkiDerBase64,
      "Public identity did not switch to current key B after replacement.",
    );

    console.log(
      "PASS: A->B replacement preserved issuer, retained A, and switched current/public identity to B",
    );

    // --------------------------------------------------------
    // REJECT ISSUER MUTATION
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "issuerId mutation",
      {
        ...loadedB,

        issuerId:
          "FINORA-CC-DIFFERENT-ISSUER",
      },
      "cannot change issuerId",
    );

    // --------------------------------------------------------
    // PREPARE C / B RETENTION
    // --------------------------------------------------------

    const materialC =
      generateFinoraControlCenterSigningMaterial();

    const rotateBCAt =
      addMilliseconds(
        rotateABAt,
        1000,
      );

    const retainedB:
      FinoraControlCenterRetainedSigningKeyRecord = {
        signingKeyId:
          loadedB.signingKeyId,

        privateKeyPkcs8DerBase64:
          loadedB.privateKeyPkcs8DerBase64,

        publicKeySpkiDerBase64:
          loadedB.publicKeySpkiDerBase64,

        createdAt:
          loadedB.createdAt,

        retiredAt:
          rotateBCAt,
      };

    // --------------------------------------------------------
    // REJECT MISSING IMMEDIATE PREDECESSOR B
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "rotation missing immediate predecessor",
      {
        issuerId:
          loadedB.issuerId,

        signingKeyId:
          materialC.signingKeyId,

        privateKeyPkcs8DerBase64:
          materialC.privateKeyPkcs8DerBase64,

        publicKeySpkiDerBase64:
          materialC.publicKeySpkiDerBase64,

        createdAt:
          rotateBCAt,

        retainedSigningKeys: [
          ...(
            loadedB.retainedSigningKeys ??
            []
          ),
        ],

        schemaVersion:
          1,
      },
      "must retain exactly the immediately previous current signing key",
    );

    // --------------------------------------------------------
    // REJECT ARBITRARY RETAINED-KEY INJECTION
    //
    // Keep current B unchanged but append unrelated C as a
    // historical retained key.
    // --------------------------------------------------------

    const injectedRetainedC:
      FinoraControlCenterRetainedSigningKeyRecord = {
        signingKeyId:
          materialC.signingKeyId,

        privateKeyPkcs8DerBase64:
          materialC.privateKeyPkcs8DerBase64,

        publicKeySpkiDerBase64:
          materialC.publicKeySpkiDerBase64,

        createdAt:
          rotateABAt,

        retiredAt:
          rotateBCAt,
      };

    await expectRejectedWithoutMutation(
      "arbitrary retained-key injection",
      {
        ...loadedB,

        retainedSigningKeys: [
          ...(
            loadedB.retainedSigningKeys ??
            []
          ),
          injectedRetainedC,
        ],
      },
      "cannot inject retained signing material without rotating the current key",
    );

    // --------------------------------------------------------
    // REJECT INVALID NEW CURRENT KEYPAIR
    //
    // Rotation history is otherwise correct, allowing the
    // cryptographic validator to reject mismatched C material.
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "invalid new current signing keypair",
      {
        issuerId:
          loadedB.issuerId,

        signingKeyId:
          materialC.signingKeyId,

        privateKeyPkcs8DerBase64:
          materialB.privateKeyPkcs8DerBase64,

        publicKeySpkiDerBase64:
          materialC.publicKeySpkiDerBase64,

        createdAt:
          rotateBCAt,

        retainedSigningKeys: [
          ...(
            loadedB.retainedSigningKeys ??
            []
          ),
          retainedB,
        ],

        schemaVersion:
          1,
      },
      "current signing-key vault failed cryptographic validation",
    );

    // --------------------------------------------------------
    // REJECT MODIFICATION OF OLDER RETAINED A
    // --------------------------------------------------------

    const modifiedA:
      FinoraControlCenterRetainedSigningKeyRecord = {
        ...loadedB.retainedSigningKeys![0],

        retiredAt:
          addMilliseconds(
            loadedB.retainedSigningKeys![0].retiredAt,
            1,
          ),
      };

    await expectRejectedWithoutMutation(
      "modification of existing retained history",
      {
        ...loadedB,

        retainedSigningKeys: [
          modifiedA,
        ],
      },
      "cannot remove or modify existing retained signing history",
    );

    // --------------------------------------------------------
    // VALID B -> C REPLACEMENT
    // --------------------------------------------------------

    const vaultC:
      FinoraControlCenterKeyVaultRecord = {
        issuerId:
          loadedB.issuerId,

        signingKeyId:
          materialC.signingKeyId,

        privateKeyPkcs8DerBase64:
          materialC.privateKeyPkcs8DerBase64,

        publicKeySpkiDerBase64:
          materialC.publicKeySpkiDerBase64,

        createdAt:
          rotateBCAt,

        retainedSigningKeys: [
          ...(
            loadedB.retainedSigningKeys ??
            []
          ),
          retainedB,
        ],

        schemaVersion:
          1,
      };

    await replaceFinoraControlCenterKeyVault(
      vaultC,
    );

    const loadedC =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      loadedC.issuerId ===
        vaultA.issuerId,
      "B-to-C replacement changed stable issuerId.",
    );

    assert(
      loadedC.signingKeyId ===
        materialC.signingKeyId,
      "B-to-C replacement did not make C current.",
    );

    assert(
      loadedC.retainedSigningKeys?.length ===
        2,
      "B-to-C replacement did not retain both A and B.",
    );

    const finalRetainedA =
      loadedC.retainedSigningKeys.find(
        (key) =>
          key.signingKeyId ===
            vaultA.signingKeyId,
      );

    const finalRetainedB =
      loadedC.retainedSigningKeys.find(
        (key) =>
          key.signingKeyId ===
            materialB.signingKeyId,
      );

    assert(
      finalRetainedA !==
        undefined &&
      JSON.stringify(
        finalRetainedA,
      ) ===
        JSON.stringify(
          retainedA,
        ),
      "Older retained key A changed or disappeared during B-to-C rotation.",
    );

    assert(
      finalRetainedB !==
        undefined &&
      finalRetainedB.retiredAt ===
        rotateBCAt,
      "Immediate predecessor B was not retained at B-to-C boundary.",
    );

    assert(
      validateFinoraControlCenterSigningMaterial({
        signingKeyId:
          finalRetainedA.signingKeyId,

        privateKeyPkcs8DerBase64:
          finalRetainedA.privateKeyPkcs8DerBase64,

        publicKeySpkiDerBase64:
          finalRetainedA.publicKeySpkiDerBase64,
      }) &&
      validateFinoraControlCenterSigningMaterial({
        signingKeyId:
          finalRetainedB.signingKeyId,

        privateKeyPkcs8DerBase64:
          finalRetainedB.privateKeyPkcs8DerBase64,

        publicKeySpkiDerBase64:
          finalRetainedB.publicKeySpkiDerBase64,
      }),
      "Retained A/B signing materials are not cryptographically valid after B-to-C replacement.",
    );

    const publicC =
      await getFinoraControlCenterPublicIdentity();

    assert(
      publicC.issuerId ===
        vaultA.issuerId &&
      publicC.signingKeyId ===
        materialC.signingKeyId &&
      publicC.publicKeySpkiDerBase64 ===
        materialC.publicKeySpkiDerBase64,
      "Public identity did not switch to current key C.",
    );

    console.log(
      "PASS: B->C replacement preserved immutable A history, retained B, and switched current/public identity to C",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA CONTROL CENTER KEY VAULT ROTATION SELFTEST",
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
      "PASS: isolated temporary Control Center key-vault userData deleted",
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
        "FAIL: FINORA CONTROL CENTER KEY VAULT ROTATION SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );