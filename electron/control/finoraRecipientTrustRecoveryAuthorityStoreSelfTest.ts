/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST RECOVERY AUTHORITY STORE SELF TEST

   VERIFY:

   - Isolated temporary Electron userData
   - Real Electron safeStorage encryption
   - Missing recovery authority remains unprovisioned
   - Strict P-256 recovery public-key validation
   - Canonical fingerprint enforcement
   - Canonical signing-key ID enforcement
   - Valid encrypted first-provisioning round trip
   - Ciphertext does not expose authority identity / public key
   - Exact installation target is retained
   - Second provisioning is refused with zero mutation
   - Malformed encrypted persisted state fails closed
   - Canonical ciphertext can be restored and loaded
   - Successful writes leave no temporary files

   IMPORTANT:

   - No production userData.
   - No renderer.
   - No IPC.
   - No recovery private key.
   - No operational Control Center key vault.
=========================================================== */

import {
  app,
  safeStorage,
} from "electron";

import {
  generateKeyPairSync,
} from "node:crypto";

import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  join,
} from "node:path";

import {
  tmpdir,
} from "node:os";

import {
  createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  createFinoraInstallationBindingFingerprint,
} from "./finoraInstallationBindingCrypto.js";

import {
  loadFinoraRecipientTrustRecoveryAuthorityStore,
  persistNewFinoraRecipientTrustRecoveryAuthorityStore,
  validateFinoraRecipientTrustRecoveryAuthorityStoreState,
} from "./finoraRecipientTrustRecoveryAuthorityStore.js";

import type {
  FinoraRecipientTrustRecoveryAuthorityStoreState,
} from "./finoraRecipientTrustRecoveryAuthorityStore.js";

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

function errorMessage(
  error:
    unknown,
): string {
  return error instanceof Error
    ? error.message
    : String(
        error,
      );
}

function expectRejected(
  label:
    string,
  operation:
    () => void,
  expectedMessage:
    string,
): void {
  let rejection:
    string | undefined;

  try {
    operation();
  } catch (
    error
  ) {
    rejection =
      errorMessage(
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
      expectedMessage,
    ),
    `${label} returned unexpected rejection: ${rejection}`,
  );

  console.log(
    `PASS: ${label} rejected`,
  );
}

// ============================================================
// KEY HELPERS
// ============================================================

function createEcPublicKeyBase64(
  namedCurve:
    string,
): string {
  const pair =
    generateKeyPairSync(
      "ec",
      {
        namedCurve,
      },
    );

  return pair.publicKey
    .export({
      type:
        "spki",

      format:
        "der",
    })
    .toString(
      "base64",
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
        "finora-recovery-authority-store-",
      ),
    );

  try {
    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    assert(
      safeStorage.isEncryptionAvailable(),
      "Electron safeStorage encryption is unavailable for recovery-authority store selftest.",
    );

    console.log(
      "PASS: isolated Electron userData configured with safeStorage",
    );

    const controlDirectory =
      join(
        temporaryUserData,
        "finora",
        "control",
      );

    const storePath =
      join(
        controlDirectory,
        "finora-recipient-trust-recovery-authority.bin",
      );

    // --------------------------------------------------------
    // TEST 1 — MISSING STORE
    // --------------------------------------------------------

    const missing =
      await loadFinoraRecipientTrustRecoveryAuthorityStore();

    assert(
      missing ===
        undefined,
      "Missing recovery-authority store did not remain explicitly unprovisioned.",
    );

    console.log(
      "PASS: missing recovery-authority store remains explicitly unprovisioned",
    );

    // --------------------------------------------------------
    // VALID FIXTURE
    // --------------------------------------------------------

    const operationalPublicKey =
      createEcPublicKeyBase64(
        "prime256v1",
      );

    const publicKeyFingerprint =
      createFinoraInstallationBindingFingerprint(
        operationalPublicKey,
      );

    const signingKeyId =
      createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
        publicKeyFingerprint,
      );

    const validState:
      FinoraRecipientTrustRecoveryAuthorityStoreState = {
        schemaVersion:
          1,

        installation: {
          installationId:
            "FINORA-INSTALLATION-RECOVERY-AUTHORITY-SELFTEST",

          bindingKeyId:
            "FINORA-BINDING-RECOVERY-AUTHORITY-SELFTEST",

          fingerprintAlgorithm:
            "SHA-256",

          publicKeyFingerprint:
            "a".repeat(
              64,
            ),
        },

        authority: {
          type:
            "FINORA_RECOVERY_AUTHORITY",

          recoveryAuthorityId:
            "FINORA-RECOVERY-AUTHORITY-SELFTEST",

          signingKeyId,

          algorithm:
            "ECDSA_P256_SHA256",

          format:
            "SPKI_DER_BASE64",

          publicKey:
            operationalPublicKey,

          fingerprintAlgorithm:
            "SHA-256",

          publicKeyFingerprint,
        },

        provisionedAt:
          "2026-09-08T12:00:00.000Z",
      };

    // --------------------------------------------------------
    // TEST 2 — VALID STATE
    // --------------------------------------------------------

    validateFinoraRecipientTrustRecoveryAuthorityStoreState(
      validState,
    );

    console.log(
      "PASS: valid recovery-authority public trust state accepted",
    );

    // --------------------------------------------------------
    // TEST 3 — BAD FINGERPRINT
    // --------------------------------------------------------

    expectRejected(
      "recovery-authority mismatched public-key fingerprint",
      () => {
        validateFinoraRecipientTrustRecoveryAuthorityStoreState({
          ...validState,

          authority: {
            ...validState.authority,

            publicKeyFingerprint:
              "b".repeat(
                64,
              ),
          },
        });
      },
      "fingerprint does not match its public key",
    );

    assert(
      await loadFinoraRecipientTrustRecoveryAuthorityStore() ===
        undefined,
      "Invalid recovery-authority fingerprint unexpectedly persisted state.",
    );

    console.log(
      "PASS: bad recovery-authority fingerprint caused zero persisted mutation",
    );

    // --------------------------------------------------------
    // TEST 4 — BAD SIGNING KEY ID
    // --------------------------------------------------------

    expectRejected(
      "recovery-authority non-canonical signingKeyId",
      () => {
        validateFinoraRecipientTrustRecoveryAuthorityStoreState({
          ...validState,

          authority: {
            ...validState.authority,

            signingKeyId:
              "FINORA-KEY-WRONG000000000000001",
          },
        });
      },
      "signingKeyId does not match its public key",
    );

    assert(
      await loadFinoraRecipientTrustRecoveryAuthorityStore() ===
        undefined,
      "Invalid recovery-authority signingKeyId unexpectedly persisted state.",
    );

    console.log(
      "PASS: bad recovery-authority signingKeyId caused zero persisted mutation",
    );

    // --------------------------------------------------------
    // TEST 5 — NON-P256 ROOT
    // --------------------------------------------------------

    const nonP256PublicKey =
      createEcPublicKeyBase64(
        "secp384r1",
      );

    const nonP256Fingerprint =
      createFinoraInstallationBindingFingerprint(
        nonP256PublicKey,
      );

    expectRejected(
      "non-P-256 recovery-authority public key",
      () => {
        validateFinoraRecipientTrustRecoveryAuthorityStoreState({
          ...validState,

          authority: {
            ...validState.authority,

            publicKey:
              nonP256PublicKey,

            publicKeyFingerprint:
              nonP256Fingerprint,

            signingKeyId:
              createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
                nonP256Fingerprint,
              ),
          },
        });
      },
      "must use P-256",
    );

    assert(
      await loadFinoraRecipientTrustRecoveryAuthorityStore() ===
        undefined,
      "Non-P-256 recovery authority unexpectedly persisted state.",
    );

    console.log(
      "PASS: non-P-256 recovery authority caused zero persisted mutation",
    );

    // --------------------------------------------------------
    // TEST 6 — FIRST PROVISIONING
    // --------------------------------------------------------

    await persistNewFinoraRecipientTrustRecoveryAuthorityStore(
      validState,
    );

    const firstCiphertext =
      await readFile(
        storePath,
      );

    assert(
      firstCiphertext.length >
        0,
      "Recovery-authority encrypted store is empty.",
    );

    const ciphertextText =
      firstCiphertext.toString(
        "utf8",
      );

    assert(
      !ciphertextText.includes(
        validState.authority.recoveryAuthorityId,
      ),
      "Recovery-authority ciphertext exposes recoveryAuthorityId plaintext.",
    );

    assert(
      !ciphertextText.includes(
        validState.authority.signingKeyId,
      ),
      "Recovery-authority ciphertext exposes signingKeyId plaintext.",
    );

    assert(
      !ciphertextText.includes(
        validState.authority.publicKey,
      ),
      "Recovery-authority ciphertext exposes public-key plaintext.",
    );

    assert(
      !ciphertextText.includes(
        validState.installation.installationId,
      ),
      "Recovery-authority ciphertext exposes installationId plaintext.",
    );

    console.log(
      "PASS: recovery-authority store ciphertext hides authority and installation plaintext",
    );

    const loaded =
      await loadFinoraRecipientTrustRecoveryAuthorityStore();

    assert(
      loaded !==
        undefined,
      "Persisted recovery-authority store could not be loaded.",
    );

    assert(
      JSON.stringify(
        loaded,
      ) ===
        JSON.stringify(
          validState,
        ),
      "Recovery-authority encrypted round trip changed persisted state.",
    );

    assert(
      loaded.installation.installationId ===
        validState.installation.installationId &&
      loaded.installation.bindingKeyId ===
        validState.installation.bindingKeyId &&
      loaded.installation.publicKeyFingerprint ===
        validState.installation.publicKeyFingerprint,
      "Recovery-authority store changed its installation target.",
    );

    console.log(
      "PASS: recovery-authority encrypted round trip retained exact installation target",
    );

    const serializedLoaded =
      JSON.stringify(
        loaded,
      );

    assert(
      !serializedLoaded.includes(
        "privateKey",
      ),
      "Recovery-authority public trust state unexpectedly contains private-key material.",
    );

    console.log(
      "PASS: recovery-authority persisted state contains no private-key field",
    );

    // --------------------------------------------------------
    // TEST 7 — SECOND PROVISIONING REFUSED / ZERO MUTATION
    // --------------------------------------------------------

    let secondProvisioningRejection:
      string | undefined;

    try {
      await persistNewFinoraRecipientTrustRecoveryAuthorityStore(
        validState,
      );
    } catch (
      error
    ) {
      secondProvisioningRejection =
        errorMessage(
          error,
        );
    }

    assert(
      secondProvisioningRejection?.includes(
        "already provisioned and cannot be replaced",
      ) ===
        true,
      `Second recovery-authority provisioning returned unexpected result: ${secondProvisioningRejection}`,
    );

    const afterSecondProvisioning =
      await readFile(
        storePath,
      );

    assert(
      firstCiphertext.equals(
        afterSecondProvisioning,
      ),
      "Rejected second recovery-authority provisioning mutated persisted ciphertext.",
    );

    console.log(
      "PASS: second recovery-authority provisioning refused with zero persisted mutation",
    );

    // --------------------------------------------------------
    // TEST 8 — MALFORMED ENCRYPTED PERSISTED STATE FAILS CLOSED
    // --------------------------------------------------------

    const malformedState = {
      ...validState,

      authority: {
        ...validState.authority,

        type:
          "INVALID_RECOVERY_AUTHORITY",
      },
    };

    const malformedCiphertext =
      safeStorage.encryptString(
        JSON.stringify(
          malformedState,
        ),
      );

    assert(
      malformedCiphertext.length >
        0,
      "Malformed-state test encryption returned an empty payload.",
    );

    await writeFile(
      storePath,
      malformedCiphertext,
    );

    let malformedRejected =
      false;

    try {
      await loadFinoraRecipientTrustRecoveryAuthorityStore();
    } catch {
      malformedRejected =
        true;
    }

    assert(
      malformedRejected,
      "Malformed encrypted recovery-authority persisted state was unexpectedly accepted.",
    );

    console.log(
      "PASS: malformed encrypted recovery-authority state fails closed",
    );

    // --------------------------------------------------------
    // TEST 9 — RESTORE CANONICAL CIPHERTEXT
    // --------------------------------------------------------

    await writeFile(
      storePath,
      firstCiphertext,
    );

    const restored =
      await loadFinoraRecipientTrustRecoveryAuthorityStore();

    assert(
      restored !==
        undefined &&
      JSON.stringify(
        restored,
      ) ===
        JSON.stringify(
          validState,
        ),
      "Recovery-authority store did not recover after canonical ciphertext restoration.",
    );

    console.log(
      "PASS: canonical recovery-authority ciphertext restores exact state",
    );

    // --------------------------------------------------------
    // TEST 10 — TEMP FILE CLEANUP
    // --------------------------------------------------------

    const directoryEntries =
      await readdir(
        controlDirectory,
      );

    const leakedTemporaryFiles =
      directoryEntries.filter(
        (entry) =>
          entry.startsWith(
            "finora-recipient-trust-recovery-authority.bin.",
          ) &&
          entry.endsWith(
            ".tmp",
          ),
      );

    assert(
      leakedTemporaryFiles.length ===
        0,
      `Recovery-authority store temporary files leaked: ${leakedTemporaryFiles.join(", ")}`,
    );

    console.log(
      "PASS: recovery-authority store temporary-file cleanup verified",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA RECIPIENT TRUST RECOVERY AUTHORITY STORE RUNTIME SELFTEST",
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
      "PASS: isolated temporary recovery-authority userData deleted",
    );
  }
}

// ============================================================
// RUN
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
        "FAIL: FINORA RECIPIENT TRUST RECOVERY AUTHORITY STORE RUNTIME SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );