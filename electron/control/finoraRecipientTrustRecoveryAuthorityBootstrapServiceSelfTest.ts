/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST RECOVERY AUTHORITY BOOTSTRAP SELF TEST

   VERIFY:

   - Isolated temporary Electron userData
   - Real Electron safeStorage
   - Missing native installation binding fails closed
   - Independent fingerprint mismatch fails with zero provisioning
   - Non-P-256 recovery root fails with zero provisioning
   - Non-canonical signingKeyId fails with zero provisioning
   - Invalid bootstrap attempts do not initialize clock high-water
   - Clock rollback fails before recovery-authority persistence
   - Rollback rejection preserves future high-water exactly
   - Valid fingerprint-pinned bootstrap succeeds
   - Recovery authority binds to exact native installation
   - provisionedAt comes from authoritative wall-clock observation
   - Recovery public trust state is encrypted
   - Second bootstrap is refused with zero recovery/clock mutation
   - Successful writes leave no temporary files

   IMPORTANT:

   - No production userData.
   - No renderer.
   - No IPC.
   - No recovery package import.
   - No recovery private-key persistence.
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
  loadFinoraClockHighWaterState,
  persistFinoraClockHighWaterState,
} from "./finoraClockHighWaterStore.js";

import {
  createFinoraInstallationBindingFingerprint,
} from "./finoraInstallationBindingCrypto.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  bootstrapFinoraRecipientTrustRecoveryAuthority,
} from "./finoraRecipientTrustRecoveryAuthorityBootstrapService.js";

import {
  loadFinoraRecipientTrustRecoveryAuthorityStore,
} from "./finoraRecipientTrustRecoveryAuthorityStore.js";

import type {
  FinoraRecipientTrustRecoveryAuthorityBootstrapRequest,
} from "./finoraRecipientTrustRecoveryAuthorityBootstrapService.js";

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
// PUBLIC-KEY HELPER
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
        "finora-recovery-authority-bootstrap-",
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
      "Electron safeStorage encryption is unavailable for recovery-authority bootstrap selftest.",
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

    const recoveryStorePath =
      join(
        controlDirectory,
        "finora-recipient-trust-recovery-authority.bin",
      );

    // --------------------------------------------------------
    // VALID RECOVERY ROOT FIXTURE
    // --------------------------------------------------------

    const recoveryPublicKey =
      createEcPublicKeyBase64(
        "prime256v1",
      );

    const recoveryFingerprint =
      createFinoraInstallationBindingFingerprint(
        recoveryPublicKey,
      );

    const recoverySigningKeyId =
      createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
        recoveryFingerprint,
      );

    const validRequest:
      FinoraRecipientTrustRecoveryAuthorityBootstrapRequest = {
        recoveryAuthorityId:
          "FINORA-RECOVERY-AUTHORITY-BOOTSTRAP-SELFTEST",

        signingKeyId:
          recoverySigningKeyId,

        algorithm:
          "ECDSA_P256_SHA256",

        format:
          "SPKI_DER_BASE64",

        publicKey:
          recoveryPublicKey,

        expectedPublicKeyFingerprint:
          recoveryFingerprint,
      };

    // --------------------------------------------------------
    // TEST 1 — MISSING INSTALLATION BINDING
    // --------------------------------------------------------

    const missingBindingResult =
      await bootstrapFinoraRecipientTrustRecoveryAuthority(
        validRequest,
      );

    assert(
      !missingBindingResult.success &&
      missingBindingResult.error.includes(
        "native installation binding is required",
      ),
      "Recovery-authority bootstrap did not fail closed when native installation binding was missing.",
    );

    assert(
      await loadFinoraRecipientTrustRecoveryAuthorityStore() ===
        undefined,
      "Missing-binding recovery bootstrap unexpectedly persisted recovery authority.",
    );

    assert(
      await loadFinoraClockHighWaterState() ===
        undefined,
      "Missing-binding recovery bootstrap unexpectedly initialized clock high-water.",
    );

    console.log(
      "PASS: missing native installation binding rejected with zero recovery/clock persistence",
    );

    // --------------------------------------------------------
    // CREATE AUTHORITATIVE NATIVE INSTALLATION
    // --------------------------------------------------------

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0 &&
      nativeBinding.bindingKeyId.length >
        0,
      "Native installation binding could not be initialized for recovery bootstrap selftest.",
    );

    console.log(
      "PASS: authoritative native installation binding initialized",
    );

    // --------------------------------------------------------
    // TEST 2 — INDEPENDENT FINGERPRINT MISMATCH
    // --------------------------------------------------------

    const badFingerprintResult =
      await bootstrapFinoraRecipientTrustRecoveryAuthority({
        ...validRequest,

        expectedPublicKeyFingerprint:
          "b".repeat(
            64,
          ),
      });

    assert(
      !badFingerprintResult.success &&
      badFingerprintResult.error.includes(
        "does not match the independently supplied fingerprint",
      ),
      "Recovery-authority bootstrap did not reject independent fingerprint mismatch.",
    );

    assert(
      await loadFinoraRecipientTrustRecoveryAuthorityStore() ===
        undefined,
      "Fingerprint-mismatch bootstrap unexpectedly persisted recovery authority.",
    );

    assert(
      await loadFinoraClockHighWaterState() ===
        undefined,
      "Fingerprint-mismatch bootstrap unexpectedly initialized clock high-water.",
    );

    console.log(
      "PASS: independent recovery fingerprint mismatch rejected before clock/persistence",
    );

    // --------------------------------------------------------
    // TEST 3 — BAD SIGNING KEY ID
    // --------------------------------------------------------

    const badSigningKeyIdResult =
      await bootstrapFinoraRecipientTrustRecoveryAuthority({
        ...validRequest,

        signingKeyId:
          "FINORA-KEY-WRONG000000000000001",
      });

    assert(
      !badSigningKeyIdResult.success &&
      badSigningKeyIdResult.error.includes(
        "signingKeyId does not match the recovery public key",
      ),
      "Recovery-authority bootstrap did not reject non-canonical signingKeyId.",
    );

    assert(
      await loadFinoraRecipientTrustRecoveryAuthorityStore() ===
        undefined,
      "Bad-signingKeyId bootstrap unexpectedly persisted recovery authority.",
    );

    assert(
      await loadFinoraClockHighWaterState() ===
        undefined,
      "Bad-signingKeyId bootstrap unexpectedly initialized clock high-water.",
    );

    console.log(
      "PASS: non-canonical recovery signingKeyId rejected before clock/persistence",
    );

    // --------------------------------------------------------
    // TEST 4 — NON-P256 RECOVERY AUTHORITY
    // --------------------------------------------------------

    const nonP256PublicKey =
      createEcPublicKeyBase64(
        "secp384r1",
      );

    const nonP256Fingerprint =
      createFinoraInstallationBindingFingerprint(
        nonP256PublicKey,
      );

    const nonP256Result =
      await bootstrapFinoraRecipientTrustRecoveryAuthority({
        ...validRequest,

        signingKeyId:
          createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
            nonP256Fingerprint,
          ),

        publicKey:
          nonP256PublicKey,

        expectedPublicKeyFingerprint:
          nonP256Fingerprint,
      });

    assert(
      !nonP256Result.success &&
      nonP256Result.error.includes(
        "must use P-256",
      ),
      "Recovery-authority bootstrap did not reject non-P-256 public key.",
    );

    assert(
      await loadFinoraRecipientTrustRecoveryAuthorityStore() ===
        undefined,
      "Non-P-256 bootstrap unexpectedly persisted recovery authority.",
    );

    assert(
      await loadFinoraClockHighWaterState() ===
        undefined,
      "Non-P-256 bootstrap unexpectedly initialized clock high-water.",
    );

    console.log(
      "PASS: non-P-256 recovery authority rejected before clock/persistence",
    );

    // --------------------------------------------------------
    // TEST 5 — CLOCK ROLLBACK FAIL-CLOSED
    //
    // Seed only this isolated test store into the future.
    // The recovery authority is still unprovisioned.
    // --------------------------------------------------------

    const futureHighWaterAt =
      "2999-01-01T00:00:00.000Z";

    await persistFinoraClockHighWaterState({
      schemaVersion:
        1,

      installationId:
        nativeBinding.installationId,

      highWaterAt:
        futureHighWaterAt,
    });

    const seededFuture =
      await loadFinoraClockHighWaterState();

    assert(
      seededFuture !==
        undefined &&
      seededFuture.installationId ===
        nativeBinding.installationId &&
      seededFuture.highWaterAt ===
        futureHighWaterAt,
      "Future clock high-water could not be seeded for recovery bootstrap rollback proof.",
    );

    const rollbackResult =
      await bootstrapFinoraRecipientTrustRecoveryAuthority(
        validRequest,
      );

    assert(
      !rollbackResult.success &&
      rollbackResult.error.includes(
        "clock rollback",
      ),
      "Recovery-authority bootstrap did not fail closed on authoritative clock rollback.",
    );

    assert(
      await loadFinoraRecipientTrustRecoveryAuthorityStore() ===
        undefined,
      "Clock-rollback rejection unexpectedly persisted recovery authority.",
    );

    const afterRollback =
      await loadFinoraClockHighWaterState();

    assert(
      afterRollback !==
        undefined &&
      afterRollback.installationId ===
        nativeBinding.installationId &&
      afterRollback.highWaterAt ===
        futureHighWaterAt,
      "Clock-rollback rejection mutated the persisted future high-water.",
    );

    console.log(
      "PASS: recovery bootstrap clock rollback rejected with zero recovery mutation and preserved high-water",
    );

    // --------------------------------------------------------
    // RESET ISOLATED TEST HIGH-WATER TO A SAFE HISTORICAL VALUE
    //
    // Direct store write here is test-fixture setup only.
    // Production bootstrap never bypasses the clock authority.
    // --------------------------------------------------------

    const historicalHighWaterAt =
      "2020-01-01T00:00:00.000Z";

    await persistFinoraClockHighWaterState({
      schemaVersion:
        1,

      installationId:
        nativeBinding.installationId,

      highWaterAt:
        historicalHighWaterAt,
    });

    // --------------------------------------------------------
    // TEST 6 — VALID FINGERPRINT-PINNED BOOTSTRAP
    // --------------------------------------------------------

    const successResult =
      await bootstrapFinoraRecipientTrustRecoveryAuthority(
        validRequest,
      );

    assert(
      successResult.success,
      successResult.success
        ? "Recovery-authority bootstrap success result is invalid."
        : `Valid recovery-authority bootstrap failed: ${successResult.error}`,
    );

    const persistedAuthority =
      await loadFinoraRecipientTrustRecoveryAuthorityStore();

    assert(
      persistedAuthority !==
        undefined,
      "Successful recovery-authority bootstrap did not persist authority state.",
    );

    const persistedClock =
      await loadFinoraClockHighWaterState();

    assert(
      persistedClock !==
        undefined,
      "Successful recovery-authority bootstrap did not retain authoritative clock high-water.",
    );

    assert(
      successResult.data.recoveryAuthorityId ===
        validRequest.recoveryAuthorityId &&
      successResult.data.signingKeyId ===
        validRequest.signingKeyId &&
      successResult.data.publicKeyFingerprint ===
        recoveryFingerprint,
      "Successful recovery-authority bootstrap returned incorrect authority identity.",
    );

    assert(
      persistedAuthority.installation.installationId ===
        nativeBinding.installationId &&
      persistedAuthority.installation.bindingKeyId ===
        nativeBinding.bindingKeyId &&
      persistedAuthority.installation.fingerprintAlgorithm ===
        nativeBinding.fingerprintAlgorithm &&
      persistedAuthority.installation.publicKeyFingerprint ===
        nativeBinding.publicKeyFingerprint,
      "Recovery-authority bootstrap did not bind to the exact authoritative native installation.",
    );

    assert(
      successResult.data.installationId ===
        nativeBinding.installationId &&
      successResult.data.provisionedAt ===
        persistedAuthority.provisionedAt &&
      persistedAuthority.provisionedAt ===
        persistedClock.highWaterAt,
      "Recovery-authority provisionedAt was not derived from the authoritative accepted wall clock.",
    );

    assert(
      Date.parse(
        persistedAuthority.provisionedAt,
      ) >
        Date.parse(
          historicalHighWaterAt,
        ),
      "Successful recovery-authority bootstrap did not advance from the historical test high-water.",
    );

    console.log(
      "PASS: fingerprint-pinned recovery authority provisioned against exact native installation and authoritative clock",
    );

    // --------------------------------------------------------
    // TEST 7 — ENCRYPTED RECOVERY TRUST ANCHOR
    // --------------------------------------------------------

    const recoveryCiphertext =
      await readFile(
        recoveryStorePath,
      );

    assert(
      recoveryCiphertext.length >
        0,
      "Recovery-authority bootstrap persisted an empty encrypted store.",
    );

    const ciphertextText =
      recoveryCiphertext.toString(
        "utf8",
      );

    assert(
      !ciphertextText.includes(
        validRequest.recoveryAuthorityId,
      ) &&
      !ciphertextText.includes(
        validRequest.signingKeyId,
      ) &&
      !ciphertextText.includes(
        validRequest.publicKey,
      ) &&
      !ciphertextText.includes(
        nativeBinding.installationId,
      ),
      "Recovery-authority bootstrap ciphertext exposes trusted authority or installation plaintext.",
    );

    console.log(
      "PASS: bootstrapped recovery authority persisted only as encrypted trust state",
    );

    // --------------------------------------------------------
    // TEST 8 — SECOND BOOTSTRAP REFUSED BEFORE CLOCK
    // --------------------------------------------------------

    const recoveryBytesBeforeRepeat =
      Buffer.from(
        recoveryCiphertext,
      );

    const clockBeforeRepeat =
      await loadFinoraClockHighWaterState();

    assert(
      clockBeforeRepeat !==
        undefined,
      "Clock state missing before repeated-bootstrap proof.",
    );

    const repeatedResult =
      await bootstrapFinoraRecipientTrustRecoveryAuthority(
        validRequest,
      );

    assert(
      !repeatedResult.success &&
      repeatedResult.error.includes(
        "already provisioned and cannot be replaced through bootstrap",
      ),
      "Repeated recovery-authority bootstrap was not refused.",
    );

    const recoveryBytesAfterRepeat =
      await readFile(
        recoveryStorePath,
      );

    const clockAfterRepeat =
      await loadFinoraClockHighWaterState();

    assert(
      recoveryBytesBeforeRepeat.equals(
        recoveryBytesAfterRepeat,
      ),
      "Repeated recovery-authority bootstrap mutated encrypted recovery trust state.",
    );

    assert(
      clockAfterRepeat !==
        undefined &&
      clockAfterRepeat.installationId ===
        clockBeforeRepeat.installationId &&
      clockAfterRepeat.highWaterAt ===
        clockBeforeRepeat.highWaterAt,
      "Repeated recovery-authority bootstrap advanced or changed clock high-water.",
    );

    console.log(
      "PASS: repeated recovery bootstrap refused before clock with zero recovery/clock mutation",
    );

    // --------------------------------------------------------
    // TEST 9 — NO PRIVATE KEY IN PERSISTED PUBLIC TRUST STATE
    // --------------------------------------------------------

    const serializedAuthority =
      JSON.stringify(
        persistedAuthority,
      );

    assert(
      !serializedAuthority.includes(
        "privateKey",
      ),
      "Bootstrapped recovery-authority store contains a private-key field.",
    );

    console.log(
      "PASS: bootstrapped recovery trust anchor contains no private-key field",
    );

    // --------------------------------------------------------
    // TEST 10 — TEMP FILE CLEANUP
    // --------------------------------------------------------

    const directoryEntries =
      await readdir(
        controlDirectory,
      );

    const leakedRecoveryTempFiles =
      directoryEntries.filter(
        (entry) =>
          entry.startsWith(
            "finora-recipient-trust-recovery-authority.bin.",
          ) &&
          entry.endsWith(
            ".tmp",
          ),
      );

    const leakedClockTempFiles =
      directoryEntries.filter(
        (entry) =>
          entry.startsWith(
            "finora-clock-high-water.bin.",
          ) &&
          entry.endsWith(
            ".tmp",
          ),
      );

    assert(
      leakedRecoveryTempFiles.length ===
        0 &&
      leakedClockTempFiles.length ===
        0,
      `Recovery bootstrap temporary files leaked: ${[
        ...leakedRecoveryTempFiles,
        ...leakedClockTempFiles,
      ].join(", ")}`,
    );

    console.log(
      "PASS: recovery bootstrap successful writes left no temporary files",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA RECIPIENT TRUST RECOVERY AUTHORITY BOOTSTRAP RUNTIME SELFTEST",
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
      "PASS: isolated temporary recovery bootstrap userData deleted",
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
        "FAIL: FINORA RECIPIENT TRUST RECOVERY AUTHORITY BOOTSTRAP RUNTIME SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );