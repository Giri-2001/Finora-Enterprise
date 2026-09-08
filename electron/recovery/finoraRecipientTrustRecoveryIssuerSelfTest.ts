// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST RECOVERY ISSUER SELFTEST
//
// VERIFY:
//
// - Real isolated Electron userData
// - Independent Recovery Authority root is created
// - Invalid preflight request reserves no sequence
// - Valid first Recovery package receives sequence 1
// - Valid second Recovery package receives sequence 2
// - Payload digest is exact
// - Envelope / payload issuedAt values match exactly
// - Recovery Authority issuer/signature key IDs are exact
// - Independent Recovery-root signature verifies cryptographically
// - Tampered envelope fails cryptographic verification
// - Persisted issuer-clock rollback rejects before reservation
// - Rollback rejection leaves exact ledger bytes/state unchanged
// - Operational Control Center persistence is never created
// - Recovery vault and sequence ledger are the only persisted
//   FINORA authority surfaces created by this selftest
// ============================================================

import {
  app,
} from "electron";

import {
  mkdtemp,
  readFile,
  readdir,
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
  verifyFinoraControlCenterCanonicalSignature,
} from "../control-center/finoraControlCenterCrypto.js";

import type {
  FinoraControlCenterSigningMaterial,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  generateFinoraWindowsInstallationBindingMaterial,
} from "../control/finoraInstallationBindingCrypto.js";

import {
  FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE,
  canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope,
  createFinoraRecipientTrustRecoveryPayloadDigest,
  validateFinoraRecipientTrustRecoverySignedEnvelope,
} from "../control/finoraRecipientTrustRecoveryContract.js";

import {
  loadOrCreateFinoraRecipientTrustRecoveryAuthorityVault,
} from "./finoraRecipientTrustRecoveryAuthorityVault.js";

import {
  issueFinoraRecipientTrustRecovery,
} from "./finoraRecipientTrustRecoveryIssuer.js";

import type {
  FinoraRecipientTrustRecoveryIssueRequest,
} from "./finoraRecipientTrustRecoveryIssuer.js";

import {
  loadFinoraRecipientTrustRecoverySequenceLedger,
} from "./finoraRecipientTrustRecoverySequenceLedger.js";

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
// REPLACEMENT KEY FIXTURE
// ============================================================

function createReplacementTrustedKey(
  material:
    FinoraControlCenterSigningMaterial,

  operationalIssuerId:
    string,

  validFrom:
    string,
):
  FinoraRecipientTrustRecoveryIssueRequest[
    "replacementTrustedKey"
  ] {
  return {
    issuerId:
      operationalIssuerId,

    signingKeyId:
      material.signingKeyId,

    algorithm:
      "ECDSA_P256_SHA256",

    format:
      "SPKI_DER_BASE64",

    publicKey:
      material.publicKeySpkiDerBase64,

    status:
      "ACTIVE",

    validFrom,
  };
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
        "finora-recovery-issuer-selftest-",
      ),
    );

  try {
    // --------------------------------------------------------
    // ISOLATED ELECTRON
    // --------------------------------------------------------

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    console.log(
      "PASS: isolated Electron userData ready",
    );

    // --------------------------------------------------------
    // INDEPENDENT RECOVERY AUTHORITY
    // --------------------------------------------------------

    const recoveryAuthority =
      await loadOrCreateFinoraRecipientTrustRecoveryAuthorityVault();

    assert(
      recoveryAuthority.type ===
        "FINORA_RECOVERY_AUTHORITY",
      "Recovery issuer did not load an independent Recovery Authority.",
    );

    console.log(
      "PASS: independent Recovery Authority root loaded",
    );

    // --------------------------------------------------------
    // AUTHORITY-RELATIVE TEST TIMES
    //
    // Do not assume a wall-clock earlier than first root creation.
    // --------------------------------------------------------

    const authorityCreatedMs =
      Date.parse(
        recoveryAuthority.createdAt,
      );

    const firstIssueDate =
      new Date(
        authorityCreatedMs +
          60_000,
      );

    const secondIssueDate =
      new Date(
        authorityCreatedMs +
          120_000,
      );

    const rollbackIssueDate =
      new Date(
        secondIssueDate.getTime() -
          1,
      );

    const firstIssuedAt =
      firstIssueDate.toISOString();

    const secondIssuedAt =
      secondIssueDate.toISOString();

    const rollbackIssuedAt =
      rollbackIssueDate.toISOString();

    // --------------------------------------------------------
    // AUTHORITATIVE INSTALLATION TARGET FIXTURE
    // --------------------------------------------------------

    const installationMaterial =
      generateFinoraWindowsInstallationBindingMaterial(
        firstIssueDate,
        "FINORA-INSTALLATION-RECOVERY-ISSUER-SELFTEST",
      );

    const target:
      FinoraRecipientTrustRecoveryIssueRequest[
        "target"
      ] = {
        installationId:
          installationMaterial.installationId,

        bindingKeyId:
          installationMaterial.bindingKeyId,

        fingerprintAlgorithm:
          installationMaterial.fingerprintAlgorithm,

        publicKeyFingerprint:
          installationMaterial.publicKeyFingerprint,
      };

    const operationalIssuerId =
      "FINORA-CONTROL-ISSUER-RECOVERY-SELFTEST";

    const compromisedA =
      generateFinoraControlCenterSigningMaterial();

    const replacementB =
      generateFinoraControlCenterSigningMaterial();

    const replacementC =
      generateFinoraControlCenterSigningMaterial();

    const replacementD =
      generateFinoraControlCenterSigningMaterial();

    // --------------------------------------------------------
    // INVALID PREFLIGHT — MUST NOT RESERVE
    //
    // expectedActiveSigningKeyId intentionally equals the
    // replacement key identity.
    // --------------------------------------------------------

    const invalidResult =
      await issueFinoraRecipientTrustRecovery(
        {
          target,

          operationalIssuerId,

          expectedActiveSigningKeyId:
            replacementB.signingKeyId,

          replacementTrustedKey:
            createReplacementTrustedKey(
              replacementB,
              operationalIssuerId,
              firstIssuedAt,
            ),
        },
        firstIssueDate,
      );

    assert(
      !invalidResult.success,
      "Invalid Recovery payload unexpectedly issued a signed package.",
    );

    const ledgerAfterInvalid =
      await loadFinoraRecipientTrustRecoverySequenceLedger();

    assert(
      ledgerAfterInvalid ===
        undefined,
      "Invalid Recovery preflight consumed a sequence reservation.",
    );

    console.log(
      "PASS: invalid Recovery preflight rejected before sequence reservation",
    );

    // --------------------------------------------------------
    // FIRST VALID ISSUE — SEQUENCE 1
    // --------------------------------------------------------

    const firstResult =
      await issueFinoraRecipientTrustRecovery(
        {
          target,

          operationalIssuerId,

          expectedActiveSigningKeyId:
            compromisedA.signingKeyId,

          replacementTrustedKey:
            createReplacementTrustedKey(
              replacementB,
              operationalIssuerId,
              firstIssuedAt,
            ),
        },
        firstIssueDate,
      );

    assert(
      firstResult.success,
      firstResult.success
        ? "Unexpected Recovery issuance state."
        : firstResult.error,
    );

    const firstRecovery =
      firstResult.data.signedRecovery;

    assert(
      firstResult.data.sequence ===
        1 &&
      firstRecovery.sequence ===
        1 &&
      firstResult.data.issuedAt ===
        firstIssuedAt &&
      firstRecovery.issuedAt ===
        firstIssuedAt &&
      firstRecovery.payload.issuedAt ===
        firstIssuedAt,
      "First Recovery package did not contain exact sequence/issuedAt state.",
    );

    assert(
      firstRecovery.purpose ===
        FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE &&
      firstRecovery.payload.action ===
        "REPLACE_ACTIVE" &&
      firstRecovery.payload.operationalIssuerId ===
        operationalIssuerId &&
      firstRecovery.payload.expectedActiveSigningKeyId ===
        compromisedA.signingKeyId &&
      firstRecovery.payload.replacementTrustedKey.signingKeyId ===
        replacementB.signingKeyId,
      "First Recovery package semantics are incorrect.",
    );

    validateFinoraRecipientTrustRecoverySignedEnvelope(
      firstRecovery,
    );

    console.log(
      "PASS: first valid Recovery package issued as sequence 1",
    );

    // --------------------------------------------------------
    // EXACT DIGEST
    // --------------------------------------------------------

    const expectedFirstDigest =
      createFinoraRecipientTrustRecoveryPayloadDigest(
        firstRecovery.payload,
      );

    assert(
      firstRecovery.payloadDigest.algorithm ===
        expectedFirstDigest.algorithm &&
      firstRecovery.payloadDigest.value ===
        expectedFirstDigest.value,
      "First Recovery package payload digest is not exact.",
    );

    console.log(
      "PASS: Recovery payload digest exactly matches canonical payload",
    );

    // --------------------------------------------------------
    // AUTHORITY / SIGNATURE IDENTITY
    // --------------------------------------------------------

    assert(
      firstResult.data.recoveryAuthorityId ===
        recoveryAuthority.recoveryAuthorityId &&
      firstResult.data.signingKeyId ===
        recoveryAuthority.signingKeyId &&
      firstRecovery.issuer.type ===
        "FINORA_RECOVERY_AUTHORITY" &&
      firstRecovery.issuer.recoveryAuthorityId ===
        recoveryAuthority.recoveryAuthorityId &&
      firstRecovery.issuer.signingKeyId ===
        recoveryAuthority.signingKeyId &&
      firstRecovery.signature.signingKeyId ===
        recoveryAuthority.signingKeyId,
      "Recovery issuer/signature identity does not match independent Recovery root.",
    );

    console.log(
      "PASS: envelope issuer and signature identities exactly match independent Recovery root",
    );

    // --------------------------------------------------------
    // CRYPTOGRAPHIC SIGNATURE
    // --------------------------------------------------------

    const {
      signature:
        firstSignature,
      ...firstUnsignedEnvelope
    } =
      firstRecovery;

    const firstCanonical =
      canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope(
        firstUnsignedEnvelope,
      );

    assert(
      verifyFinoraControlCenterCanonicalSignature(
        firstCanonical,
        firstSignature.value,
        recoveryAuthority.publicKeySpkiDerBase64,
      ),
      "Independent Recovery Authority signature failed cryptographic verification.",
    );

    console.log(
      "PASS: independent Recovery Authority signature verifies cryptographically",
    );

    // --------------------------------------------------------
    // TAMPER — SIGNATURE MUST FAIL
    // --------------------------------------------------------

    const tamperedUnsignedEnvelope = {
      ...firstUnsignedEnvelope,

      packageId:
        `${firstUnsignedEnvelope.packageId}-TAMPERED`,
    };

    const tamperedCanonical =
      canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope(
        tamperedUnsignedEnvelope,
      );

    assert(
      !verifyFinoraControlCenterCanonicalSignature(
        tamperedCanonical,
        firstSignature.value,
        recoveryAuthority.publicKeySpkiDerBase64,
      ),
      "Tampered Recovery envelope unexpectedly verified with original signature.",
    );

    console.log(
      "PASS: tampered Recovery envelope fails independent Recovery-root signature verification",
    );

    // --------------------------------------------------------
    // SECOND VALID ISSUE — SEQUENCE 2
    //
    // Simulate the expected current ACTIVE key becoming B after
    // the first Recovery, with a new replacement C.
    // --------------------------------------------------------

    const secondResult =
      await issueFinoraRecipientTrustRecovery(
        {
          target,

          operationalIssuerId,

          expectedActiveSigningKeyId:
            replacementB.signingKeyId,

          replacementTrustedKey:
            createReplacementTrustedKey(
              replacementC,
              operationalIssuerId,
              secondIssuedAt,
            ),
        },
        secondIssueDate,
      );

    assert(
      secondResult.success,
      secondResult.success
        ? "Unexpected second Recovery issuance state."
        : secondResult.error,
    );

    assert(
      secondResult.data.sequence ===
        2 &&
      secondResult.data.signedRecovery.sequence ===
        2 &&
      secondResult.data.issuedAt ===
        secondIssuedAt &&
      secondResult.data.signedRecovery.payload
        .expectedActiveSigningKeyId ===
        replacementB.signingKeyId &&
      secondResult.data.signedRecovery.payload
        .replacementTrustedKey.signingKeyId ===
        replacementC.signingKeyId,
      "Second Recovery package did not progress to exact sequence 2 state.",
    );

    console.log(
      "PASS: second valid Recovery package issued as sequence 2",
    );

    // --------------------------------------------------------
    // PERSISTED LEDGER BEFORE ROLLBACK
    // --------------------------------------------------------

    const ledgerPath =
      join(
        temporaryUserData,
        "finora",
        "recovery",
        "finora-recipient-trust-recovery-sequence-ledger.bin",
      );

    const ledgerBeforeRollback =
      await loadFinoraRecipientTrustRecoverySequenceLedger();

    assert(
      ledgerBeforeRollback !==
        undefined &&
      ledgerBeforeRollback.highWaterAt ===
        secondIssuedAt &&
      ledgerBeforeRollback.scopes.length ===
        1 &&
      ledgerBeforeRollback.scopes[0]
        .lastReservedSequence ===
        2,
      "Recovery sequence ledger does not contain expected pre-rollback sequence 2 state.",
    );

    const ledgerBytesBeforeRollback =
      await readFile(
        ledgerPath,
      );

    // --------------------------------------------------------
    // PERSISTED CLOCK ROLLBACK
    //
    // Payload remains structurally valid for rollbackIssuedAt,
    // therefore rejection must come from the Recovery sequence
    // ledger clock authority before a new sequence is reserved.
    // --------------------------------------------------------

    const rollbackResult =
      await issueFinoraRecipientTrustRecovery(
        {
          target,

          operationalIssuerId,

          expectedActiveSigningKeyId:
            replacementC.signingKeyId,

          replacementTrustedKey:
            createReplacementTrustedKey(
              replacementD,
              operationalIssuerId,
              rollbackIssuedAt,
            ),
        },
        rollbackIssueDate,
      );

    assert(
      !rollbackResult.success &&
      rollbackResult.error.includes(
        "wall-clock rollback",
      ),
      "Recovery issuer did not reject persisted wall-clock rollback at the sequence authority.",
    );

    const ledgerBytesAfterRollback =
      await readFile(
        ledgerPath,
      );

    const ledgerAfterRollback =
      await loadFinoraRecipientTrustRecoverySequenceLedger();

    assert(
      ledgerBytesAfterRollback.equals(
        ledgerBytesBeforeRollback,
      ),
      "Rejected Recovery issuer clock rollback mutated persisted sequence-ledger bytes.",
    );

    assert(
      ledgerAfterRollback !==
        undefined &&
      JSON.stringify(
        ledgerAfterRollback,
      ) ===
        JSON.stringify(
          ledgerBeforeRollback,
        ) &&
      ledgerAfterRollback.scopes[0]
        .lastReservedSequence ===
        2,
      "Rejected Recovery issuer rollback changed persisted sequence state.",
    );

    console.log(
      "PASS: persisted Recovery issuer wall-clock rollback rejected before sequence reservation with zero mutation",
    );

    // --------------------------------------------------------
    // OPERATIONAL CONTROL CENTER PERSISTENCE IS ABSENT
    // --------------------------------------------------------

    const finoraDirectory =
      join(
        temporaryUserData,
        "finora",
      );

    const finoraEntries =
      (
        await readdir(
          finoraDirectory,
        )
      ).sort();

    assert(
      JSON.stringify(
        finoraEntries,
      ) ===
        JSON.stringify([
          "recovery",
        ]),
      `Recovery issuer created an unexpected FINORA persistence surface: ${JSON.stringify(finoraEntries)}`,
    );

    console.log(
      "PASS: Recovery issuer created no operational Control Center persistence surface",
    );

    // --------------------------------------------------------
    // RECOVERY PERSISTENCE SURFACES
    // --------------------------------------------------------

    const recoveryDirectory =
      join(
        finoraDirectory,
        "recovery",
      );

    const recoveryEntries =
      (
        await readdir(
          recoveryDirectory,
        )
      ).sort();

    assert(
      JSON.stringify(
        recoveryEntries,
      ) ===
        JSON.stringify([
          "finora-recipient-trust-recovery-authority-vault.bin",
          "finora-recipient-trust-recovery-sequence-ledger.bin",
        ]),
      `Recovery issuer persistence set is unexpected: ${JSON.stringify(recoveryEntries)}`,
    );

    assert(
      recoveryEntries.every(
        (entry) =>
          !entry.endsWith(
            ".tmp",
          ),
      ),
      "Recovery issuer left temporary persistence artifacts.",
    );

    console.log(
      "PASS: Recovery issuer persisted only independent Recovery vault + sequence ledger",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA OFFLINE RECIPIENT TRUST RECOVERY ISSUER SELFTEST",
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
      "PASS: isolated Recovery issuer selftest userData deleted",
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
        "FAIL: FINORA OFFLINE RECIPIENT TRUST RECOVERY ISSUER SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );