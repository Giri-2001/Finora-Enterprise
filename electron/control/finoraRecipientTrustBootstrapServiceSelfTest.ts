/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST BOOTSTRAP SERVICE SELF TEST

   RESPONSIBILITY:

   - Exercise production first-trust bootstrap service
   - Verify independently supplied fingerprint enforcement
   - Verify canonical Control Center signingKeyId binding
   - Verify initial ACTIVE-only policy
   - Verify no mutation after rejected bootstrap attempts
   - Verify first valid bootstrap succeeds
   - Verify existing trust cannot be silently replaced

   IMPORTANT:

   - Isolated temporary Electron userData only.
   - No renderer.
   - No IPC.
   - No production Control Center key vault.
=========================================================== */

import {
  app,
} from "electron";

import {
  generateKeyPairSync,
} from "node:crypto";

import {
  mkdtemp,
  rm,
} from "node:fs/promises";

import {
  join,
} from "node:path";

import {
  tmpdir,
} from "node:os";

import {
  createFinoraInstallationBindingFingerprint,
} from "./finoraInstallationBindingCrypto.js";

import {
  bootstrapFinoraRecipientTrust,
} from "./finoraRecipientTrustBootstrapService.js";

import {
  loadFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

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
// KEY MATERIAL
// ============================================================

function createPublicKey():
  string {
  const pair =
    generateKeyPairSync(
      "ec",
      {
        namedCurve:
          "prime256v1",
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

function createSigningKeyId(
  fingerprint:
    string,
): string {
  return (
    `FINORA-KEY-${fingerprint
      .slice(
        0,
        24,
      )
      .toUpperCase()}`
  );
}

function createDifferentFingerprint(
  fingerprint:
    string,
): string {
  const lastCharacter =
    fingerprint.slice(
      -1,
    );

  const replacement =
    lastCharacter ===
      "0"
      ? "1"
      : "0";

  return (
    fingerprint.slice(
      0,
      -1,
    ) +
    replacement
  );
}

// ============================================================
// ASSERT UNBOOTSTRAPPED
// ============================================================

async function assertUnbootstrapped(
  label:
    string,
): Promise<void> {
  const store =
    await loadFinoraRecipientTrustStore();

  assert(
    store ===
      undefined,
    `${label} unexpectedly created recipient trust.`,
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
        "finora-recipient-bootstrap-selftest-",
      ),
    );

  try {
    app.setPath(
      "userData",
      temporaryUserData,
    );

    console.log(
      "PASS: isolated Electron userData configured",
    );

    await app.whenReady();

    // --------------------------------------------------------
    // INITIAL STATE
    // --------------------------------------------------------

    await assertUnbootstrapped(
      "Initial state",
    );

    console.log(
      "PASS: recipient trust starts unbootstrapped",
    );

    // --------------------------------------------------------
    // PRIMARY TEST KEY
    // --------------------------------------------------------

    const issuerId =
      "FINORA-CC-BOOTSTRAP-SELFTEST";

    const publicKey =
      createPublicKey();

    const fingerprint =
      createFinoraInstallationBindingFingerprint(
        publicKey,
      );

    const signingKeyId =
      createSigningKeyId(
        fingerprint,
      );

    const validFrom =
      "2026-09-07T00:00:00.000Z";

    const trustedKey:
      FinoraBranchTrustedControlPublicKey = {
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

    // --------------------------------------------------------
    // TEST 1 — NONCANONICAL FINGERPRINT
    // --------------------------------------------------------

    const nonCanonicalResult =
      await bootstrapFinoraRecipientTrust({
        trustedKey,

        expectedPublicKeyFingerprint:
          "A".repeat(
            64,
          ),
      });

    assert(
      !nonCanonicalResult.success &&
      nonCanonicalResult.error.includes(
        "canonical lowercase SHA-256",
      ),
      "Noncanonical bootstrap fingerprint was not rejected.",
    );

    await assertUnbootstrapped(
      "Noncanonical fingerprint rejection",
    );

    console.log(
      "PASS: noncanonical bootstrap fingerprint rejected with zero trust mutation",
    );

    // --------------------------------------------------------
    // TEST 2 — WRONG BUT CANONICAL FINGERPRINT
    // --------------------------------------------------------

    const wrongFingerprint =
      createDifferentFingerprint(
        fingerprint,
      );

    const wrongFingerprintResult =
      await bootstrapFinoraRecipientTrust({
        trustedKey,

        expectedPublicKeyFingerprint:
          wrongFingerprint,
      });

    assert(
      !wrongFingerprintResult.success &&
      wrongFingerprintResult.error.includes(
        "does not match the independently supplied fingerprint",
      ),
      "Wrong canonical bootstrap fingerprint was not rejected.",
    );

    await assertUnbootstrapped(
      "Wrong fingerprint rejection",
    );

    console.log(
      "PASS: wrong canonical bootstrap fingerprint rejected with zero trust mutation",
    );

    // --------------------------------------------------------
    // TEST 3 — FORGED SIGNING KEY ID
    // --------------------------------------------------------

    const forgedSigningKeyIdResult =
      await bootstrapFinoraRecipientTrust({
        trustedKey: {
          ...trustedKey,

          signingKeyId:
            "FINORA-KEY-000000000000000000000000",
        },

        expectedPublicKeyFingerprint:
          fingerprint,
      });

    assert(
      !forgedSigningKeyIdResult.success &&
      forgedSigningKeyIdResult.error.includes(
        "signingKeyId does not match the trusted public key",
      ),
      "Forged signingKeyId was not rejected.",
    );

    await assertUnbootstrapped(
      "Forged signingKeyId rejection",
    );

    console.log(
      "PASS: forged Control Center signingKeyId rejected with zero trust mutation",
    );

    // --------------------------------------------------------
    // TEST 4 — NON-ACTIVE INITIAL KEY
    // --------------------------------------------------------

    const retiredResult =
      await bootstrapFinoraRecipientTrust({
        trustedKey: {
          ...trustedKey,

          status:
            "RETIRED",

          validUntil:
            "2026-12-31T23:59:59.999Z",
        },

        expectedPublicKeyFingerprint:
          fingerprint,
      });

    assert(
      !retiredResult.success &&
      retiredResult.error.includes(
        "requires one ACTIVE initial signing key",
      ),
      "Non-ACTIVE initial key was not rejected.",
    );

    await assertUnbootstrapped(
      "Non-ACTIVE initial-key rejection",
    );

    console.log(
      "PASS: non-ACTIVE initial signing key rejected with zero trust mutation",
    );

    // --------------------------------------------------------
    // TEST 5 — INITIAL ACTIVE KEY MUST BE OPEN-ENDED
    // --------------------------------------------------------

    const boundedActiveResult =
      await bootstrapFinoraRecipientTrust({
        trustedKey: {
          ...trustedKey,

          validUntil:
            "2026-12-31T23:59:59.999Z",
        },

        expectedPublicKeyFingerprint:
          fingerprint,
      });

    assert(
      !boundedActiveResult.success &&
      boundedActiveResult.error.includes(
        "must not define validUntil",
      ),
      "Initial ACTIVE key with validUntil was not rejected.",
    );

    await assertUnbootstrapped(
      "Bounded ACTIVE initial-key rejection",
    );

    console.log(
      "PASS: initial ACTIVE key with validUntil rejected with zero trust mutation",
    );

    // --------------------------------------------------------
    // TEST 6 — VALID FIRST BOOTSTRAP
    // --------------------------------------------------------

    const bootstrapResult =
      await bootstrapFinoraRecipientTrust({
        trustedKey,

        expectedPublicKeyFingerprint:
          fingerprint,
      });

    assert(
      bootstrapResult.success,
      bootstrapResult.success
        ? "Valid bootstrap unexpectedly failed."
        : bootstrapResult.error,
    );

    assert(
      bootstrapResult.data.issuerId ===
        issuerId &&
      bootstrapResult.data.signingKeyId ===
        signingKeyId &&
      bootstrapResult.data.publicKeyFingerprint ===
        fingerprint,
      "Successful bootstrap returned incorrect authority identity.",
    );

    const bootstrappedStore =
      await loadFinoraRecipientTrustStore();

    assert(
      bootstrappedStore !==
        undefined &&
      bootstrappedStore.trustedKeys.length ===
        1,
      "Successful first bootstrap did not persist exactly one trusted key.",
    );

    const persistedInitialKey =
      bootstrappedStore.trustedKeys[0];

    assert(
      persistedInitialKey.issuerId ===
        issuerId &&
      persistedInitialKey.signingKeyId ===
        signingKeyId &&
      persistedInitialKey.publicKey ===
        publicKey &&
      persistedInitialKey.status ===
        "ACTIVE" &&
      persistedInitialKey.validFrom ===
        validFrom &&
      persistedInitialKey.validUntil ===
        undefined,
      "Persisted first-trust authority does not match authorized bootstrap key.",
    );

    console.log(
      "PASS: fingerprint-pinned first recipient trust bootstrap persisted exactly one ACTIVE key",
    );

    // --------------------------------------------------------
    // SNAPSHOT ORIGINAL TRUST
    // --------------------------------------------------------

    const originalSnapshot =
      JSON.stringify(
        bootstrappedStore,
      );

    // --------------------------------------------------------
    // TEST 7 — SECOND BOOTSTRAP CANNOT REPLACE TRUST
    // --------------------------------------------------------

    const replacementPublicKey =
      createPublicKey();

    const replacementFingerprint =
      createFinoraInstallationBindingFingerprint(
        replacementPublicKey,
      );

    const replacementSigningKeyId =
      createSigningKeyId(
        replacementFingerprint,
      );

    const replacementKey:
      FinoraBranchTrustedControlPublicKey = {
        issuerId:
          "FINORA-CC-BOOTSTRAP-REPLACEMENT",

        signingKeyId:
          replacementSigningKeyId,

        algorithm:
          "ECDSA_P256_SHA256",

        format:
          "SPKI_DER_BASE64",

        publicKey:
          replacementPublicKey,

        status:
          "ACTIVE",

        validFrom:
          "2026-10-01T00:00:00.000Z",
      };

    const replacementResult =
      await bootstrapFinoraRecipientTrust({
        trustedKey:
          replacementKey,

        expectedPublicKeyFingerprint:
          replacementFingerprint,
      });

    assert(
      !replacementResult.success &&
      replacementResult.error.includes(
        "recipient trust is already bootstrapped",
      ),
      "Second bootstrap unexpectedly replaced existing trust.",
    );

    const afterReplacementAttempt =
      await loadFinoraRecipientTrustStore();

    assert(
      afterReplacementAttempt !==
        undefined &&
      JSON.stringify(
        afterReplacementAttempt,
      ) ===
        originalSnapshot,
      "Rejected second bootstrap mutated established recipient trust.",
    );

    console.log(
      "PASS: second bootstrap rejected and original recipient trust preserved",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA RECIPIENT TRUST BOOTSTRAP RUNTIME SELFTEST",
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
      "PASS: isolated temporary bootstrap userData deleted",
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
        "FAIL: FINORA RECIPIENT TRUST BOOTSTRAP RUNTIME SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );