/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT CONTROL TRUST STORE SELF TEST

   RESPONSIBILITY:

   - Exercise the production recipient trust-store implementation
   - Use isolated temporary Electron userData
   - Verify encrypted persistence
   - Verify strict trusted-key validation
   - Verify invalid updates leave persisted state unchanged
   - Verify ciphertext corruption/tamper fails closed
   - Verify complete-store replacement and temp cleanup

   IMPORTANT:

   - No production userData.
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
  loadFinoraRecipientTrustStore,
  persistFinoraRecipientTrustStore,
  validateFinoraRecipientTrustStoreState,
} from "./finoraRecipientTrustStore.js";

import type {
  FinoraRecipientTrustStoreState,
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

// ============================================================
// TEST PUBLIC KEYS
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
// MAIN SELF TEST
// ============================================================

async function runSelfTest():
  Promise<void> {
  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-recipient-trust-selftest-",
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

    const trustStorePath =
      join(
        temporaryUserData,
        "FINORA",
        "control",
        "finora-recipient-trust.bin",
      );

    const trustDirectory =
      join(
        temporaryUserData,
        "FINORA",
        "control",
      );

    // --------------------------------------------------------
    // TEST 1 — MISSING STORE = UNBOOTSTRAPPED
    // --------------------------------------------------------

    const missingStore =
      await loadFinoraRecipientTrustStore();

    assert(
      missingStore ===
        undefined,
      "Missing recipient trust store did not return undefined.",
    );

    console.log(
      "PASS: missing recipient trust store remains explicitly unbootstrapped",
    );

    // --------------------------------------------------------
    // TEST MATERIAL
    // --------------------------------------------------------

    const issuerId =
      "FINORA-CONTROL-CENTER-TRUST-SELFTEST";

    const signingKeyIdA =
      "FINORA-CC-TRUST-KEY-A";

    const signingKeyIdB =
      "FINORA-CC-TRUST-KEY-B";

    const validFromA =
      "2026-01-01T00:00:00.000Z";

    const retirementTimeA =
      "2026-06-01T00:00:00.000Z";

    const validFromB =
      "2026-06-01T00:00:00.000Z";

    const publicKeyA =
      createEcPublicKeyBase64(
        "prime256v1",
      );

    const publicKeyB =
      createEcPublicKeyBase64(
        "prime256v1",
      );

    const nonP256PublicKey =
      createEcPublicKeyBase64(
        "secp384r1",
      );

    const trustedKeyA:
      FinoraBranchTrustedControlPublicKey = {
        issuerId,

        signingKeyId:
          signingKeyIdA,

        algorithm:
          "ECDSA_P256_SHA256",

        format:
          "SPKI_DER_BASE64",

        publicKey:
          publicKeyA,

        status:
          "ACTIVE",

        validFrom:
          validFromA,
      };

    const initialStore:
      FinoraRecipientTrustStoreState = {
        schemaVersion:
          1,

        trustedKeys: [
          trustedKeyA,
        ],
      };

    // --------------------------------------------------------
    // TEST 2 — VALID STRUCTURE
    // --------------------------------------------------------

    validateFinoraRecipientTrustStoreState(
      initialStore,
    );

    console.log(
      "PASS: valid P-256 recipient trust state accepted",
    );

    // --------------------------------------------------------
    // TEST 3 — ENCRYPTED ROUND TRIP
    // --------------------------------------------------------

    await persistFinoraRecipientTrustStore(
      initialStore,
    );

    const firstCiphertext =
      await readFile(
        trustStorePath,
      );

    assert(
      firstCiphertext.length >
        0,
      "Recipient trust-store ciphertext is empty.",
    );

    assert(
      !firstCiphertext.includes(
        Buffer.from(
          issuerId,
          "utf8",
        ),
      ),
      "Recipient trust-store ciphertext exposes issuerId plaintext.",
    );

    assert(
      !firstCiphertext.includes(
        Buffer.from(
          signingKeyIdA,
          "utf8",
        ),
      ),
      "Recipient trust-store ciphertext exposes signingKeyId plaintext.",
    );

    assert(
      !firstCiphertext.includes(
        Buffer.from(
          publicKeyA,
          "utf8",
        ),
      ),
      "Recipient trust-store ciphertext exposes public-key plaintext.",
    );

    const loadedInitial =
      await loadFinoraRecipientTrustStore();

    assert(
      loadedInitial !==
        undefined,
      "Persisted recipient trust store could not be loaded.",
    );

    assert(
      loadedInitial.schemaVersion ===
        1 &&
      loadedInitial.trustedKeys.length ===
        1 &&
      loadedInitial.trustedKeys[0].issuerId ===
        issuerId &&
      loadedInitial.trustedKeys[0].signingKeyId ===
        signingKeyIdA &&
      loadedInitial.trustedKeys[0].publicKey ===
        publicKeyA &&
      loadedInitial.trustedKeys[0].status ===
        "ACTIVE",
      "Recipient trust-store encrypted round trip changed trusted state.",
    );

    console.log(
      "PASS: safeStorage encrypted recipient trust-state round trip verified",
    );

    assert(
      loadedInitial.appliedTrustTransitions ===
        undefined &&
      loadedInitial.trustTransitionSequences ===
        undefined &&
      loadedInitial.appliedTrustRecoveries ===
        undefined &&
      loadedInitial.trustRecoverySequences ===
        undefined,
      "Legacy bootstrap-only recipient trust state unexpectedly synthesized replay metadata.",
    );

    console.log(
      "PASS: legacy bootstrap-only trust store loads without transition or recovery replay metadata",
    );

    // --------------------------------------------------------
    // INVALID UPDATE HELPER
    // --------------------------------------------------------

    async function expectRejectedWithoutMutation(
      label:
        string,
      state:
        FinoraRecipientTrustStoreState,
      expectedMessage:
        string,
    ): Promise<void> {
      const before =
        await readFile(
          trustStorePath,
        );

      let rejection:
        string | undefined;

      try {
        await persistFinoraRecipientTrustStore(
          state,
        );
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

      const after =
        await readFile(
          trustStorePath,
        );

      assert(
        Buffer.compare(
          before,
          after,
        ) ===
          0,
        `${label} mutated persisted trust state.`,
      );

      console.log(
        `PASS: ${label} rejected with zero persisted mutation`,
      );
    }

    // --------------------------------------------------------
    // TEST 4 — VALID REPLAY METADATA ROUND TRIP
    // --------------------------------------------------------

    const replayAppliedAt =
      "2026-09-07T08:00:00.000Z";

    const validReplayMetadataStore:
      FinoraRecipientTrustStoreState = {
        ...initialStore,

        appliedTrustTransitions: [
          {
            packageId:
              "FINORA-TRUST-TRANSITION-APPLIED-0001",

            issuerId,

            purpose:
              "RECIPIENT_TRUST_TRANSITION",

            sequence:
              1,

            installationId:
              "FINORA-INSTALLATION-TRUST-SELFTEST",

            appliedAt:
              replayAppliedAt,
          },
        ],

        trustTransitionSequences: [
          {
            issuerId,

            purpose:
              "RECIPIENT_TRUST_TRANSITION",

            installationId:
              "FINORA-INSTALLATION-TRUST-SELFTEST",

            lastSequence:
              1,

            updatedAt:
              replayAppliedAt,
          },
        ],
      };

    validateFinoraRecipientTrustStoreState(
      validReplayMetadataStore,
    );

    await persistFinoraRecipientTrustStore(
      validReplayMetadataStore,
    );

    const loadedReplayMetadata =
      await loadFinoraRecipientTrustStore();

    assert(
      loadedReplayMetadata !==
        undefined,
      "Recipient trust store with replay metadata could not be loaded.",
    );

    assert(
      loadedReplayMetadata.appliedTrustTransitions?.length ===
        1 &&
      loadedReplayMetadata.appliedTrustTransitions[0].packageId ===
        "FINORA-TRUST-TRANSITION-APPLIED-0001" &&
      loadedReplayMetadata.appliedTrustTransitions[0].sequence ===
        1,
      "Applied trust-transition ledger did not round trip correctly.",
    );

    assert(
      loadedReplayMetadata.trustTransitionSequences?.length ===
        1 &&
      loadedReplayMetadata.trustTransitionSequences[0].issuerId ===
        issuerId &&
      loadedReplayMetadata.trustTransitionSequences[0].installationId ===
        "FINORA-INSTALLATION-TRUST-SELFTEST" &&
      loadedReplayMetadata.trustTransitionSequences[0].lastSequence ===
        1,
      "Trust-transition monotonic sequence state did not round trip correctly.",
    );

    console.log(
      "PASS: valid recipient trust replay metadata encrypted round trip verified",
    );

    // --------------------------------------------------------
    // RECOVERY METADATA — VALID ENCRYPTED ROUND TRIP
    // --------------------------------------------------------

    const recoveryAuthorityId =
      "FINORA-RECOVERY-AUTHORITY-SELFTEST";

    const recoveryAppliedAt =
      "2026-09-07T08:02:00.000Z";

    const recoveryInstallationId =
      "FINORA-INSTALLATION-TRUST-SELFTEST";

    const validRecoveryMetadataStore:
      FinoraRecipientTrustStoreState = {
        ...validReplayMetadataStore,

        appliedTrustRecoveries: [
          {
            packageId:
              "FINORA-TRUST-RECOVERY-APPLIED-0001",

            recoveryAuthorityId,

            purpose:
              "RECIPIENT_TRUST_RECOVERY",

            sequence:
              1,

            installationId:
              recoveryInstallationId,

            operationalIssuerId:
              issuerId,

            appliedAt:
              recoveryAppliedAt,
          },
        ],

        trustRecoverySequences: [
          {
            recoveryAuthorityId,

            purpose:
              "RECIPIENT_TRUST_RECOVERY",

            installationId:
              recoveryInstallationId,

            operationalIssuerId:
              issuerId,

            lastSequence:
              1,

            updatedAt:
              recoveryAppliedAt,
          },
        ],
      };

    validateFinoraRecipientTrustStoreState(
      validRecoveryMetadataStore,
    );

    await persistFinoraRecipientTrustStore(
      validRecoveryMetadataStore,
    );

    const loadedRecoveryMetadata =
      await loadFinoraRecipientTrustStore();

    assert(
      loadedRecoveryMetadata !==
        undefined,
      "Recipient trust store with recovery metadata could not be loaded.",
    );

    assert(
      loadedRecoveryMetadata.appliedTrustRecoveries?.length ===
        1 &&
      loadedRecoveryMetadata.appliedTrustRecoveries[0].packageId ===
        "FINORA-TRUST-RECOVERY-APPLIED-0001" &&
      loadedRecoveryMetadata.appliedTrustRecoveries[0].recoveryAuthorityId ===
        recoveryAuthorityId &&
      loadedRecoveryMetadata.appliedTrustRecoveries[0].purpose ===
        "RECIPIENT_TRUST_RECOVERY" &&
      loadedRecoveryMetadata.appliedTrustRecoveries[0].sequence ===
        1 &&
      loadedRecoveryMetadata.appliedTrustRecoveries[0].installationId ===
        recoveryInstallationId &&
      loadedRecoveryMetadata.appliedTrustRecoveries[0].operationalIssuerId ===
        issuerId &&
      loadedRecoveryMetadata.appliedTrustRecoveries[0].appliedAt ===
        recoveryAppliedAt,
      "Applied recipient trust-recovery ledger did not round trip correctly.",
    );

    assert(
      loadedRecoveryMetadata.trustRecoverySequences?.length ===
        1 &&
      loadedRecoveryMetadata.trustRecoverySequences[0].recoveryAuthorityId ===
        recoveryAuthorityId &&
      loadedRecoveryMetadata.trustRecoverySequences[0].purpose ===
        "RECIPIENT_TRUST_RECOVERY" &&
      loadedRecoveryMetadata.trustRecoverySequences[0].installationId ===
        recoveryInstallationId &&
      loadedRecoveryMetadata.trustRecoverySequences[0].operationalIssuerId ===
        issuerId &&
      loadedRecoveryMetadata.trustRecoverySequences[0].lastSequence ===
        1 &&
      loadedRecoveryMetadata.trustRecoverySequences[0].updatedAt ===
        recoveryAppliedAt,
      "Recipient trust-recovery monotonic sequence state did not round trip correctly.",
    );

    console.log(
      "PASS: valid recipient trust recovery metadata encrypted round trip verified",
    );

    // --------------------------------------------------------
    // MALFORMED APPLIED RECOVERY RECORD
    //
    // Unsupported fields must fail strict record validation and
    // must not mutate the previously persisted recovery state.
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "malformed applied trust-recovery record",
      {
        ...validRecoveryMetadataStore,

        appliedTrustRecoveries: [
          {
            packageId:
              "FINORA-TRUST-RECOVERY-MALFORMED",

            recoveryAuthorityId,

            purpose:
              "RECIPIENT_TRUST_RECOVERY",

            sequence:
              2,

            installationId:
              recoveryInstallationId,

            operationalIssuerId:
              issuerId,

            appliedAt:
              "2026-09-07T08:03:00.000Z",

            unsupportedField:
              "MUST-BE-REJECTED",
          },
        ],
      } as unknown as
        FinoraRecipientTrustStoreState,
      "applied recovery ledger is invalid",
    );

    // --------------------------------------------------------
    // DUPLICATE APPLIED RECOVERY PACKAGE ID
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "duplicate applied trust-recovery packageId",
      {
        ...validRecoveryMetadataStore,

        appliedTrustRecoveries: [
          {
            packageId:
              "FINORA-TRUST-RECOVERY-DUPLICATE",

            recoveryAuthorityId,

            purpose:
              "RECIPIENT_TRUST_RECOVERY",

            sequence:
              1,

            installationId:
              recoveryInstallationId,

            operationalIssuerId:
              issuerId,

            appliedAt:
              recoveryAppliedAt,
          },
          {
            packageId:
              "FINORA-TRUST-RECOVERY-DUPLICATE",

            recoveryAuthorityId,

            purpose:
              "RECIPIENT_TRUST_RECOVERY",

            sequence:
              2,

            installationId:
              recoveryInstallationId,

            operationalIssuerId:
              issuerId,

            appliedAt:
              "2026-09-07T08:03:00.000Z",
          },
        ],
      },
      "duplicate applied recovery packageId",
    );

    // --------------------------------------------------------
    // DUPLICATE RECOVERY SEQUENCE SCOPE
    //
    // Scope:
    // recoveryAuthorityId
    // + purpose
    // + installationId
    // + operationalIssuerId
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "duplicate trust-recovery sequence scope",
      {
        ...validRecoveryMetadataStore,

        trustRecoverySequences: [
          {
            recoveryAuthorityId,

            purpose:
              "RECIPIENT_TRUST_RECOVERY",

            installationId:
              recoveryInstallationId,

            operationalIssuerId:
              issuerId,

            lastSequence:
              1,

            updatedAt:
              recoveryAppliedAt,
          },
          {
            recoveryAuthorityId,

            purpose:
              "RECIPIENT_TRUST_RECOVERY",

            installationId:
              recoveryInstallationId,

            operationalIssuerId:
              issuerId,

            lastSequence:
              2,

            updatedAt:
              "2026-09-07T08:03:00.000Z",
          },
        ],
      },
      "duplicate recovery sequence scope",
    );

    // --------------------------------------------------------
    // TEST 5 — DUPLICATE APPLIED TRANSITION PACKAGE ID
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "duplicate applied trust-transition packageId",
      {
        ...validReplayMetadataStore,

        appliedTrustTransitions: [
          {
            packageId:
              "FINORA-TRUST-TRANSITION-DUPLICATE",

            issuerId,

            purpose:
              "RECIPIENT_TRUST_TRANSITION",

            sequence:
              1,

            installationId:
              "FINORA-INSTALLATION-TRUST-SELFTEST",

            appliedAt:
              replayAppliedAt,
          },
          {
            packageId:
              "FINORA-TRUST-TRANSITION-DUPLICATE",

            issuerId,

            purpose:
              "RECIPIENT_TRUST_TRANSITION",

            sequence:
              2,

            installationId:
              "FINORA-INSTALLATION-TRUST-SELFTEST",

            appliedAt:
              "2026-09-07T08:01:00.000Z",
          },
        ],
      },
      "duplicate applied transition packageId",
    );

    // --------------------------------------------------------
    // TEST 6 — DUPLICATE SEQUENCE SCOPE
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "duplicate trust-transition sequence scope",
      {
        ...validReplayMetadataStore,

        trustTransitionSequences: [
          {
            issuerId,

            purpose:
              "RECIPIENT_TRUST_TRANSITION",

            installationId:
              "FINORA-INSTALLATION-TRUST-SELFTEST",

            lastSequence:
              1,

            updatedAt:
              replayAppliedAt,
          },
          {
            issuerId,

            purpose:
              "RECIPIENT_TRUST_TRANSITION",

            installationId:
              "FINORA-INSTALLATION-TRUST-SELFTEST",

            lastSequence:
              2,

            updatedAt:
              "2026-09-07T08:01:00.000Z",
          },
        ],
      },
      "duplicate transition sequence scope",
    );

    // --------------------------------------------------------
    // TEST 7 — INVALID MONOTONIC SEQUENCE
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "invalid trust-transition lastSequence",
      {
        ...validReplayMetadataStore,

        trustTransitionSequences: [
          {
            issuerId,

            purpose:
              "RECIPIENT_TRUST_TRANSITION",

            installationId:
              "FINORA-INSTALLATION-TRUST-SELFTEST",

            lastSequence:
              0,

            updatedAt:
              replayAppliedAt,
          },
        ],
      },
      "transition sequence state is invalid",
    );

    // --------------------------------------------------------
    // TEST 8 — DUPLICATE TRUSTED KEY IDENTITY
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "duplicate issuer/signing-key identity",
      {
        schemaVersion:
          1,

        trustedKeys: [
          trustedKeyA,
          {
            ...trustedKeyA,

            publicKey:
              publicKeyB,
          },
        ],
      },
      "duplicate issuer/signing-key identity",
    );

    // --------------------------------------------------------
    // TEST 9 — MULTIPLE ACTIVE KEYS FOR SAME ISSUER
    //
    // This is intentionally NOT a duplicate key identity.
    //
    // Both records:
    // - use valid P-256 public keys,
    // - have different signingKeyIds,
    // - share one stable issuerId,
    // - are independently structurally valid,
    // - are both ACTIVE.
    //
    // The complete recipient trust store must reject this
    // ambiguous current-authority state before persistence.
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "multiple ACTIVE signing keys for same issuer",
      {
        schemaVersion:
          1,

        trustedKeys: [
          trustedKeyA,
          {
            issuerId,

            signingKeyId:
              signingKeyIdB,

            algorithm:
              "ECDSA_P256_SHA256",

            format:
              "SPKI_DER_BASE64",

            publicKey:
              publicKeyB,

            status:
              "ACTIVE",

            validFrom:
              validFromB,
          },
        ],
      },
      "more than one ACTIVE signing key for the same issuer",
    );

    // --------------------------------------------------------
    // TEST 10 — NON-P256 KEY
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "non-P-256 signing key",
      {
        schemaVersion:
          1,

        trustedKeys: [
          {
            ...trustedKeyA,

            publicKey:
              nonP256PublicKey,
          },
        ],
      },
      "must use the P-256 curve",
    );

    // --------------------------------------------------------
    // TEST 6 — RETIRED WITHOUT VALIDUNTIL
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "RETIRED key without validUntil",
      {
        schemaVersion:
          1,

        trustedKeys: [
          {
            ...trustedKeyA,

            status:
              "RETIRED",
          },
        ],
      },
      "retired recipient signing key requires validUntil",
    );

    // --------------------------------------------------------
    // TEST 7 — INVERTED VALIDITY WINDOW
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "inverted signing-key validity window",
      {
        schemaVersion:
          1,

        trustedKeys: [
          {
            ...trustedKeyA,

            validUntil:
              "2025-12-31T23:59:59.999Z",
          },
        ],
      },
      "validity window is invalid",
    );

    // --------------------------------------------------------
    // TEST 8 — CIPHERTEXT TAMPER FAILS CLOSED
    // --------------------------------------------------------

    const canonicalCiphertext =
      await readFile(
        trustStorePath,
      );

    assert(
      canonicalCiphertext.length >
        4,
      "Recipient trust-store ciphertext is unexpectedly short.",
    );

    const tampered =
      Buffer.from(
        canonicalCiphertext,
      );

    const tamperIndex =
      Math.floor(
        tampered.length /
          2,
      );

    tampered[tamperIndex] =
      tampered[tamperIndex] ^
      0x01;

    await writeFile(
      trustStorePath,
      tampered,
    );

    let tamperRejected =
      false;

    try {
      await loadFinoraRecipientTrustStore();
    } catch {
      tamperRejected =
        true;
    } finally {
      await writeFile(
        trustStorePath,
        canonicalCiphertext,
      );
    }

    assert(
      tamperRejected,
      "Tampered recipient trust-store ciphertext was accepted.",
    );

    const restoredStore =
      await loadFinoraRecipientTrustStore();

    assert(
      restoredStore !==
        undefined &&
      restoredStore.trustedKeys.length ===
        1 &&
      restoredStore.trustedKeys[0].signingKeyId ===
        signingKeyIdA,
      "Recipient trust store did not recover after restoring canonical ciphertext.",
    );

    console.log(
      "PASS: recipient trust-store ciphertext tamper fails closed",
    );

    // --------------------------------------------------------
    // TEST 9 — VALID COMPLETE-STORE REPLACEMENT
    // --------------------------------------------------------

    const replacementStore:
      FinoraRecipientTrustStoreState = {
        schemaVersion:
          1,

        trustedKeys: [
          {
            ...trustedKeyA,

            status:
              "RETIRED",

            validUntil:
              retirementTimeA,
          },
          {
            issuerId,

            signingKeyId:
              signingKeyIdB,

            algorithm:
              "ECDSA_P256_SHA256",

            format:
              "SPKI_DER_BASE64",

            publicKey:
              publicKeyB,

            status:
              "ACTIVE",

            validFrom:
              validFromB,
          },
        ],
      };

    await persistFinoraRecipientTrustStore(
      replacementStore,
    );

    const loadedReplacement =
      await loadFinoraRecipientTrustStore();

    assert(
      loadedReplacement !==
        undefined,
      "Replacement recipient trust store could not be loaded.",
    );

    assert(
      loadedReplacement.trustedKeys.length ===
        2,
      "Replacement recipient trust store did not persist both keys.",
    );

    const retiredA =
      loadedReplacement.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            signingKeyIdA,
      );

    const activeB =
      loadedReplacement.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            signingKeyIdB,
      );

    assert(
      retiredA?.status ===
        "RETIRED" &&
      retiredA.validUntil ===
        retirementTimeA,
      "Replacement did not preserve bounded RETIRED key state.",
    );

    assert(
      activeB?.status ===
        "ACTIVE" &&
      activeB.validFrom ===
        validFromB,
      "Replacement did not persist new ACTIVE key state.",
    );

    console.log(
      "PASS: valid complete recipient trust-store replacement persisted",
    );

    // --------------------------------------------------------
    // TEST 10 — UNIQUE TEMP FILE CLEANUP
    // --------------------------------------------------------

    const directoryEntries =
      await readdir(
        trustDirectory,
      );

    const leakedTemporaryFiles =
      directoryEntries.filter(
        (entry) =>
          entry.startsWith(
            "finora-recipient-trust.bin.",
          ) &&
          entry.endsWith(
            ".tmp",
          ),
      );

    assert(
      leakedTemporaryFiles.length ===
        0,
      `Recipient trust-store temporary files leaked: ${leakedTemporaryFiles.join(", ")}`,
    );

    console.log(
      "PASS: recipient trust-store atomic temporary-file cleanup verified",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA RECIPIENT TRUST STORE RUNTIME SELFTEST",
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
      "PASS: isolated temporary recipient trust userData deleted",
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
        "FAIL: FINORA RECIPIENT TRUST STORE RUNTIME SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );