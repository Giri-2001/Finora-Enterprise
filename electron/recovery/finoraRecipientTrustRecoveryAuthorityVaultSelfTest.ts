// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST RECOVERY AUTHORITY VAULT SELFTEST
//
// VERIFY:
//
// - Real isolated Electron userData
// - Real safeStorage encryption
// - Concurrent first load creates one immutable Recovery root
// - Repeated loads return the exact same Recovery authority
// - Persisted ciphertext does not expose plaintext private key
// - Persisted record decrypts to exact canonical vault state
// - Public-key fingerprint is exact
// - signingKeyId is canonical
// - P-256 private/public keypair validates
// - Corrupt encrypted state fails closed
// - Corruption does not silently create a new root
// - Canonical ciphertext restores exactly
// - No temporary persistence artifacts remain
// ============================================================

import {
  app,
  safeStorage,
} from "electron";

import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint,
  validateFinoraControlCenterSigningMaterial,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  assertFinoraP256SpkiPublicKey,
  createFinoraInstallationBindingFingerprint,
} from "../control/finoraInstallationBindingCrypto.js";

import {
  loadFinoraRecipientTrustRecoveryAuthorityVault,
  loadOrCreateFinoraRecipientTrustRecoveryAuthorityVault,
  validateFinoraRecipientTrustRecoveryAuthorityVaultRecord,
} from "./finoraRecipientTrustRecoveryAuthorityVault.js";

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
// SELFTEST
// ============================================================

async function runSelfTest():
  Promise<void> {
  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-recovery-authority-vault-selftest-",
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
      "Electron safeStorage encryption is unavailable for Recovery Authority vault selftest.",
    );

    console.log(
      "PASS: isolated Electron userData + safeStorage available",
    );

    // --------------------------------------------------------
    // UNPROVISIONED
    // --------------------------------------------------------

    const beforeProvisioning =
      await loadFinoraRecipientTrustRecoveryAuthorityVault();

    assert(
      beforeProvisioning ===
        undefined,
      "Recovery Authority vault unexpectedly existed before provisioning.",
    );

    console.log(
      "PASS: Recovery Authority vault begins unprovisioned",
    );

    // --------------------------------------------------------
    // CONCURRENT FIRST LOAD
    // --------------------------------------------------------

    const concurrent =
      await Promise.all([
        loadOrCreateFinoraRecipientTrustRecoveryAuthorityVault(),
        loadOrCreateFinoraRecipientTrustRecoveryAuthorityVault(),
        loadOrCreateFinoraRecipientTrustRecoveryAuthorityVault(),
        loadOrCreateFinoraRecipientTrustRecoveryAuthorityVault(),
        loadOrCreateFinoraRecipientTrustRecoveryAuthorityVault(),
      ]);

    const canonicalJson =
      JSON.stringify(
        concurrent[0],
      );

    assert(
      concurrent.every(
        (record) =>
          JSON.stringify(
            record,
          ) ===
            canonicalJson,
      ),
      "Concurrent Recovery Authority loads did not converge on one root.",
    );

    console.log(
      "PASS: concurrent first load produced one immutable Recovery Authority root",
    );

    const authority =
      concurrent[0];

    validateFinoraRecipientTrustRecoveryAuthorityVaultRecord(
      authority,
    );

    console.log(
      "PASS: Recovery Authority record passed strict validation",
    );

    // --------------------------------------------------------
    // CRYPTOGRAPHIC KEYPAIR
    // --------------------------------------------------------

    assertFinoraP256SpkiPublicKey(
      authority.publicKeySpkiDerBase64,
    );

    assert(
      validateFinoraControlCenterSigningMaterial({
        signingKeyId:
          authority.signingKeyId,

        privateKeyPkcs8DerBase64:
          authority.privateKeyPkcs8DerBase64,

        publicKeySpkiDerBase64:
          authority.publicKeySpkiDerBase64,
      }),
      "Recovery Authority P-256 private/public keypair is invalid.",
    );

    console.log(
      "PASS: Recovery Authority owns a valid P-256 private/public keypair",
    );

    // --------------------------------------------------------
    // FINGERPRINT / KEY ID
    // --------------------------------------------------------

    const fingerprint =
      createFinoraInstallationBindingFingerprint(
        authority.publicKeySpkiDerBase64,
      );

    assert(
      fingerprint ===
        authority.publicKeyFingerprint,
      "Recovery Authority fingerprint does not match public key.",
    );

    const expectedSigningKeyId =
      createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
        fingerprint,
      );

    assert(
      expectedSigningKeyId ===
        authority.signingKeyId,
      "Recovery Authority signingKeyId is not canonical.",
    );

    console.log(
      "PASS: Recovery Authority fingerprint and signingKeyId exactly derive from public key",
    );

    // --------------------------------------------------------
    // PERSISTED CIPHERTEXT
    // --------------------------------------------------------

    const vaultDirectory =
      join(
        temporaryUserData,
        "finora",
        "recovery",
      );

    const vaultPath =
      join(
        vaultDirectory,
        "finora-recipient-trust-recovery-authority-vault.bin",
      );

    const canonicalCiphertext =
      await readFile(
        vaultPath,
      );

    assert(
      canonicalCiphertext.byteLength >
        0,
      "Recovery Authority ciphertext is empty.",
    );

    const ciphertextUtf8 =
      canonicalCiphertext.toString(
        "utf8",
      );

    assert(
      !ciphertextUtf8.includes(
        authority.privateKeyPkcs8DerBase64,
      ),
      "Recovery Authority private key appears in ciphertext.",
    );

    assert(
      !ciphertextUtf8.includes(
        authority.recoveryAuthorityId,
      ),
      "Recovery Authority identity appears in ciphertext.",
    );

    assert(
      !ciphertextUtf8.includes(
        authority.publicKeySpkiDerBase64,
      ),
      "Recovery Authority public key appears in ciphertext.",
    );

    console.log(
      "PASS: persisted Recovery Authority vault hides authority material at rest",
    );

    // --------------------------------------------------------
    // EXACT DECRYPTED STATE
    // --------------------------------------------------------

    const decrypted =
      safeStorage.decryptString(
        canonicalCiphertext,
      );

    const parsed:
      unknown =
        JSON.parse(
          decrypted,
        );

    validateFinoraRecipientTrustRecoveryAuthorityVaultRecord(
      parsed,
    );

    assert(
      JSON.stringify(
        parsed,
      ) ===
        canonicalJson,
      "Decrypted Recovery Authority state differs from canonical state.",
    );

    console.log(
      "PASS: encrypted vault decrypts to exact canonical Recovery Authority state",
    );

    // --------------------------------------------------------
    // REPEATED LOAD
    // --------------------------------------------------------

    const repeated =
      await loadOrCreateFinoraRecipientTrustRecoveryAuthorityVault();

    const directReload =
      await loadFinoraRecipientTrustRecoveryAuthorityVault();

    assert(
      JSON.stringify(
        repeated,
      ) ===
        canonicalJson &&
      directReload !==
        undefined &&
      JSON.stringify(
        directReload,
      ) ===
        canonicalJson,
      "Repeated Recovery Authority loads changed the root.",
    );

    const ciphertextAfterReload =
      await readFile(
        vaultPath,
      );

    assert(
      ciphertextAfterReload.equals(
        canonicalCiphertext,
      ),
      "Repeated Recovery Authority load rewrote vault ciphertext.",
    );

    console.log(
      "PASS: repeated loads preserved exact immutable Recovery root and ciphertext",
    );

    // --------------------------------------------------------
    // CORRUPTION — FAIL CLOSED
    // --------------------------------------------------------

    const corruptCiphertext =
      Buffer.from(
        "FINORA-RECOVERY-AUTHORITY-CORRUPT-SELFTEST",
        "utf8",
      );

    await writeFile(
      vaultPath,
      corruptCiphertext,
    );

    let corruptionRejected =
      false;

    try {
      await loadFinoraRecipientTrustRecoveryAuthorityVault();
    } catch {
      corruptionRejected =
        true;
    }

    assert(
      corruptionRejected,
      "Corrupt Recovery Authority state did not fail closed.",
    );

    const afterCorruptionReject =
      await readFile(
        vaultPath,
      );

    assert(
      afterCorruptionReject.equals(
        corruptCiphertext,
      ),
      "Corruption rejection silently changed persisted Recovery root state.",
    );

    console.log(
      "PASS: corrupt encrypted Recovery Authority state failed closed with zero silent root replacement",
    );

    // --------------------------------------------------------
    // RESTORE
    // --------------------------------------------------------

    await writeFile(
      vaultPath,
      canonicalCiphertext,
    );

    const restored =
      await loadFinoraRecipientTrustRecoveryAuthorityVault();

    assert(
      restored !==
        undefined &&
      JSON.stringify(
        restored,
      ) ===
        canonicalJson,
      "Canonical Recovery Authority state did not restore exactly.",
    );

    console.log(
      "PASS: canonical encrypted Recovery Authority vault restored exactly",
    );

    // --------------------------------------------------------
    // TEMP FILE CLEANLINESS
    // --------------------------------------------------------

    const entries =
      await readdir(
        vaultDirectory,
      );

    const unexpected =
      entries.filter(
        (entry) =>
          entry !==
            "finora-recipient-trust-recovery-authority-vault.bin",
      );

    assert(
      unexpected.length ===
        0,
      `Recovery Authority vault left temporary artifacts: ${unexpected.join(", ")}`,
    );

    console.log(
      "PASS: Recovery Authority vault left no temporary persistence artifacts",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA OFFLINE RECIPIENT TRUST RECOVERY AUTHORITY VAULT SELFTEST",
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

        maxRetries:
          20,

        retryDelay:
          100,
      },
    );

    console.log(
      "PASS: isolated Recovery Authority vault selftest userData deleted",
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
        "FAIL: FINORA OFFLINE RECIPIENT TRUST RECOVERY AUTHORITY VAULT SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );