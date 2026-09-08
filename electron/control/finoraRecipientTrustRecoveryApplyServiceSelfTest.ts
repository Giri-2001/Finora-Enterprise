/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST EMERGENCY RECOVERY APPLY SERVICE SELF TEST

   VERIFY:

   - Isolated real Electron userData + safeStorage
   - Authoritative native installation binding
   - Independently fingerprint-pinned recovery authority
   - Operational recipient trust bootstrapped with ACTIVE key A
   - Historical RETIRED / REVOKED keys preserved
   - Existing normal transition replay metadata preserved
   - Real recovery-root signed REPLACE_ACTIVE A -> B
   - A becomes REVOKED at signed recovery boundary
   - B becomes sole ACTIVE at signed recovery boundary
   - Recovery package ledger + scoped sequence persisted together
   - Duplicate recovery package rejected with zero mutation
   - Stale recovery sequence rejected with zero mutation
   - Wrong expected current ACTIVE rejected with zero mutation
   - Previously trusted replacement identity rejected
   - Tampered recovery signature rejected with zero mutation
   - Wrong installation target rejected with zero mutation
   - Future-issued recovery rejected with zero mutation
   - Recovery-authority root remains unchanged
   - Final recipient trust state remains coherent

   IMPORTANT:

   - Real Electron safeStorage.
   - Real native installation-binding vault.
   - Real ECDSA P-256 signatures.
   - Isolated temporary userData only.
   - Recovery private key exists only in selftest memory.
   - No renderer.
   - No IPC.
   - No production Control Center key vault.
=========================================================== */

import {
  app,
  safeStorage,
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
  createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint,
} from "../control-center/finoraControlCenterCrypto.js";

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
  bootstrapFinoraRecipientTrustRecoveryAuthority,
} from "./finoraRecipientTrustRecoveryAuthorityBootstrapService.js";

import {
  loadFinoraRecipientTrustRecoveryAuthorityStore,
} from "./finoraRecipientTrustRecoveryAuthorityStore.js";

import {
  applyFinoraSignedRecipientTrustRecovery,
} from "./finoraRecipientTrustRecoveryApplyService.js";

import {
  canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope,
  createFinoraRecipientTrustRecoveryPayloadDigest,
} from "./finoraRecipientTrustRecoveryContract.js";

import type {
  FinoraRecipientTrustRecoveryPayload,
  FinoraRecipientTrustRecoverySignedEnvelope,
  FinoraRecipientTrustRecoveryUnsignedEnvelope,
} from "./finoraRecipientTrustRecoveryContract.js";

import {
  loadFinoraRecipientTrustStore,
  persistFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

import type {
  FinoraRecipientTrustStoreState,
} from "./finoraRecipientTrustStore.js";

import type {
  FinoraRecipientTrustTransitionTarget,
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
      createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
        fingerprint,
      ),
  };
}

// ============================================================
// ACTIVE TRUSTED KEY
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
// RECOVERY UNSIGNED ENVELOPE
// ============================================================

function createRecoveryUnsignedEnvelope(
  input: {
    packageId:
      string;

    recoveryAuthorityId:
      string;

    recoverySigningKeyId:
      string;

    operationalIssuerId:
      string;

    expectedActiveSigningKeyId:
      string;

    replacementTrustedKey:
      FinoraBranchTrustedControlPublicKey;

    target:
      FinoraRecipientTrustTransitionTarget;

    issuedAt:
      string;

    sequence:
      number;
  },
): FinoraRecipientTrustRecoveryUnsignedEnvelope {
  const payload:
    FinoraRecipientTrustRecoveryPayload = {
      recoveryFormat:
        "FINORA_RECIPIENT_TRUST_RECOVERY_V1",

      action:
        "REPLACE_ACTIVE",

      operationalIssuerId:
        input.operationalIssuerId,

      expectedActiveSigningKeyId:
        input.expectedActiveSigningKeyId,

      replacementTrustedKey:
        input.replacementTrustedKey,

      issuedAt:
        input.issuedAt,

      schemaVersion:
        1,
    };

  return {
    packageId:
      input.packageId,

    purpose:
      "RECIPIENT_TRUST_RECOVERY",

    target:
      input.target,

    issuedAt:
      input.issuedAt,

    sequence:
      input.sequence,

    payloadVersion:
      1,

    payload,

    schemaVersion:
      1,

    issuer: {
      type:
        "FINORA_RECOVERY_AUTHORITY",

      recoveryAuthorityId:
        input.recoveryAuthorityId,

      signingKeyId:
        input.recoverySigningKeyId,
    },

    payloadDigest:
      createFinoraRecipientTrustRecoveryPayloadDigest(
        payload,
      ),
  };
}

// ============================================================
// SIGN RECOVERY
// ============================================================

function signRecoveryEnvelope(
  unsignedEnvelope:
    FinoraRecipientTrustRecoveryUnsignedEnvelope,
  recoveryPrivateKey:
    KeyObject,
): FinoraRecipientTrustRecoverySignedEnvelope {
  const canonicalEnvelope =
    canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope(
      unsignedEnvelope,
    );

  const signature =
    nodeSign(
      "sha256",
      Buffer.from(
        canonicalEnvelope,
        "utf8",
      ),
      {
        key:
          recoveryPrivateKey,

        dsaEncoding:
          "ieee-p1363",
      },
    );

  assert(
    signature.byteLength ===
      64,
    "Recovery selftest did not produce a 64-byte IEEE-P1363 signature.",
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
// TRUST STORE SNAPSHOT
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
// RECOVERY AUTHORITY SNAPSHOT
// ============================================================

async function snapshotRecoveryAuthority():
  Promise<string> {
  const store =
    await loadFinoraRecipientTrustRecoveryAuthorityStore();

  assert(
    store !==
      undefined,
    "Recipient recovery-authority store unexpectedly missing.",
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
  signedRecovery:
    FinoraRecipientTrustRecoverySignedEnvelope,
  acceptedNow:
    Date,
  expectedMessage:
    string,
): Promise<void> {
  const trustBefore =
    await snapshotTrustStore();

  const recoveryAuthorityBefore =
    await snapshotRecoveryAuthority();

  const result =
    await applyFinoraSignedRecipientTrustRecovery(
      signedRecovery,
      acceptedNow,
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

  const trustAfter =
    await snapshotTrustStore();

  const recoveryAuthorityAfter =
    await snapshotRecoveryAuthority();

  assert(
    trustAfter ===
      trustBefore,
    `${label} mutated recipient trust state.`,
  );

  assert(
    recoveryAuthorityAfter ===
      recoveryAuthorityBefore,
    `${label} mutated independently provisioned recovery authority.`,
  );

  console.log(
    `PASS: ${label} rejected with zero recipient/recovery-root mutation`,
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
        "finora-recipient-trust-recovery-apply-selftest-",
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

    assert(
      safeStorage.isEncryptionAvailable(),
      "Electron safeStorage encryption is unavailable for recovery apply selftest.",
    );

    console.log(
      "PASS: isolated Electron userData configured with safeStorage",
    );

    // --------------------------------------------------------
    // AUTHORITATIVE NATIVE INSTALLATION BINDING
    // --------------------------------------------------------

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

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
    // TEST SIGNING AUTHORITIES
    // --------------------------------------------------------

    const recoveryMaterial =
      createSigningMaterial();

    const materialA =
      createSigningMaterial();

    const materialB =
      createSigningMaterial();

    const materialC =
      createSigningMaterial();

    const historicalRetiredMaterial =
      createSigningMaterial();

    const historicalRevokedMaterial =
      createSigningMaterial();

    // --------------------------------------------------------
    // INDEPENDENT RECOVERY AUTHORITY BOOTSTRAP
    // --------------------------------------------------------

    const recoveryAuthorityId =
      "FINORA-RECOVERY-AUTHORITY-APPLY-E2E";

    const recoveryBootstrapResult =
      await bootstrapFinoraRecipientTrustRecoveryAuthority({
        recoveryAuthorityId,

        signingKeyId:
          recoveryMaterial.signingKeyId,

        algorithm:
          "ECDSA_P256_SHA256",

        format:
          "SPKI_DER_BASE64",

        publicKey:
          recoveryMaterial.publicKey,

        expectedPublicKeyFingerprint:
          recoveryMaterial.fingerprint,
      });

    assert(
      recoveryBootstrapResult.success,
      recoveryBootstrapResult.success
        ? "Recovery authority bootstrap returned invalid success state."
        : recoveryBootstrapResult.error,
    );

    const recoveryAuthorityStore =
      await loadFinoraRecipientTrustRecoveryAuthorityStore();

    assert(
      recoveryAuthorityStore !==
        undefined &&
      recoveryAuthorityStore.installation.installationId ===
        nativeBinding.installationId &&
      recoveryAuthorityStore.authority.recoveryAuthorityId ===
        recoveryAuthorityId &&
      recoveryAuthorityStore.authority.signingKeyId ===
        recoveryMaterial.signingKeyId,
      "Recovery authority was not provisioned against the exact native installation.",
    );

    console.log(
      "PASS: independent fingerprint-pinned recovery authority provisioned",
    );

    // --------------------------------------------------------
    // DYNAMIC RECOVERY TIMES
    //
    // Recovery issuedAt must be at/after root provisionedAt.
    // --------------------------------------------------------

    const provisionedAtMs =
      Date.parse(
        recoveryAuthorityStore.provisionedAt,
      );

    assert(
      Number.isFinite(
        provisionedAtMs,
      ),
      "Recovery authority provisionedAt is invalid.",
    );

    const recoveryIssuedAt =
      new Date(
        provisionedAtMs +
        1_000,
      ).toISOString();

    const acceptedAt =
      new Date(
        provisionedAtMs +
        2_000,
      );

    // --------------------------------------------------------
    // OPERATIONAL RECIPIENT TRUST BOOTSTRAP — ACTIVE A
    // --------------------------------------------------------

    const operationalIssuerId =
      "FINORA-CONTROL-CENTER-RECOVERY-APPLY-E2E";

    const activeA =
      createActiveTrustedKey(
        operationalIssuerId,
        materialA,
        "2026-01-01T00:00:00.000Z",
      );

    const operationalBootstrapResult =
      await bootstrapFinoraRecipientTrust({
        trustedKey:
          activeA,

        expectedPublicKeyFingerprint:
          materialA.fingerprint,
      });

    assert(
      operationalBootstrapResult.success,
      operationalBootstrapResult.success
        ? "Operational trust bootstrap returned invalid success state."
        : operationalBootstrapResult.error,
    );

    console.log(
      "PASS: operational recipient trust bootstrapped with ACTIVE key A",
    );

    // --------------------------------------------------------
    // SEED HISTORICAL KEYS + NORMAL TRANSITION REPLAY STATE
    // --------------------------------------------------------

    const historicalRetired:
      FinoraBranchTrustedControlPublicKey = {
        ...createActiveTrustedKey(
          operationalIssuerId,
          historicalRetiredMaterial,
          "2024-01-01T00:00:00.000Z",
        ),

        status:
          "RETIRED",

        validUntil:
          "2024-12-31T23:59:59.999Z",
      };

    const historicalRevoked:
      FinoraBranchTrustedControlPublicKey = {
        ...createActiveTrustedKey(
          operationalIssuerId,
          historicalRevokedMaterial,
          "2023-01-01T00:00:00.000Z",
        ),

        status:
          "REVOKED",

        validUntil:
          "2023-12-31T23:59:59.999Z",
      };

    const bootstrappedTrustStore =
      await loadFinoraRecipientTrustStore();

    assert(
      bootstrappedTrustStore !==
        undefined,
      "Operational recipient trust store missing after bootstrap.",
    );

    const seededNormalTransitionAppliedAt =
      "2026-02-01T00:00:00.000Z";

    const seededTrustStore:
      FinoraRecipientTrustStoreState = {
        schemaVersion:
          1,

        trustedKeys: [
          ...bootstrappedTrustStore.trustedKeys.map(
            (
              key,
            ) => ({
              ...key,
            }),
          ),

          historicalRetired,

          historicalRevoked,
        ],

        appliedTrustTransitions: [
          {
            packageId:
              "FINORA-TRUST-TRANSITION-HISTORY-E2E-0004",

            issuerId:
              operationalIssuerId,

            purpose:
              "RECIPIENT_TRUST_TRANSITION",

            sequence:
              4,

            installationId:
              nativeBinding.installationId,

            appliedAt:
              seededNormalTransitionAppliedAt,
          },
        ],

        trustTransitionSequences: [
          {
            issuerId:
              operationalIssuerId,

            purpose:
              "RECIPIENT_TRUST_TRANSITION",

            installationId:
              nativeBinding.installationId,

            lastSequence:
              4,

            updatedAt:
              seededNormalTransitionAppliedAt,
          },
        ],
      };

    await persistFinoraRecipientTrustStore(
      seededTrustStore,
    );

    const seededPersisted =
      await loadFinoraRecipientTrustStore();

    assert(
      seededPersisted !==
        undefined &&
      seededPersisted.trustedKeys.length ===
        3 &&
      seededPersisted.appliedTrustTransitions?.length ===
        1 &&
      seededPersisted.trustTransitionSequences?.length ===
        1,
      "Historical keys and normal transition replay metadata were not seeded correctly.",
    );

    const historicalRetiredSnapshot =
      JSON.stringify(
        historicalRetired,
      );

    const historicalRevokedSnapshot =
      JSON.stringify(
        historicalRevoked,
      );

    const normalTransitionLedgerSnapshot =
      JSON.stringify(
        seededPersisted.appliedTrustTransitions,
      );

    const normalTransitionSequenceSnapshot =
      JSON.stringify(
        seededPersisted.trustTransitionSequences,
      );

    console.log(
      "PASS: historical trusted keys and normal transition replay metadata seeded",
    );

    // --------------------------------------------------------
    // REAL SIGNED RECOVERY A -> B, SEQUENCE 1
    // --------------------------------------------------------

    const replacementB =
      createActiveTrustedKey(
        operationalIssuerId,
        materialB,
        recoveryIssuedAt,
      );

    const recoveryAtoB =
      signRecoveryEnvelope(
        createRecoveryUnsignedEnvelope({
          packageId:
            "FINORA-RECIPIENT-TRUST-RECOVERY-E2E-0001",

          recoveryAuthorityId,

          recoverySigningKeyId:
            recoveryMaterial.signingKeyId,

          operationalIssuerId,

          expectedActiveSigningKeyId:
            materialA.signingKeyId,

          replacementTrustedKey:
            replacementB,

          target,

          issuedAt:
            recoveryIssuedAt,

          sequence:
            1,
        }),
        recoveryMaterial.privateKey,
      );

    const recoveryResult =
      await applyFinoraSignedRecipientTrustRecovery(
        recoveryAtoB,
        acceptedAt,
      );

    assert(
      recoveryResult.success,
      recoveryResult.success
        ? "Valid recovery returned invalid success state."
        : recoveryResult.error,
    );

    assert(
      recoveryResult.data.action ===
        "REPLACE_ACTIVE" &&
      recoveryResult.data.recoveryAuthorityId ===
        recoveryAuthorityId &&
      recoveryResult.data.operationalIssuerId ===
        operationalIssuerId &&
      recoveryResult.data.sequence ===
        1 &&
      recoveryResult.data.installationId ===
        nativeBinding.installationId &&
      recoveryResult.data.revokedSigningKeyId ===
        materialA.signingKeyId &&
      recoveryResult.data.activeSigningKeyId ===
        materialB.signingKeyId &&
      recoveryResult.data.appliedAt ===
        acceptedAt.toISOString(),
      "Recovery apply result returned incorrect authority metadata.",
    );

    const afterRecovery =
      await loadFinoraRecipientTrustStore();

    assert(
      afterRecovery !==
        undefined,
      "Recipient trust store missing after valid emergency recovery.",
    );

    const keyAAfterRecovery =
      afterRecovery.trustedKeys.find(
        (key) =>
          key.issuerId ===
            operationalIssuerId &&
          key.signingKeyId ===
            materialA.signingKeyId,
      );

    const keyBAfterRecovery =
      afterRecovery.trustedKeys.find(
        (key) =>
          key.issuerId ===
            operationalIssuerId &&
          key.signingKeyId ===
            materialB.signingKeyId,
      );

    const activeKeysAfterRecovery =
      afterRecovery.trustedKeys.filter(
        (key) =>
          key.issuerId ===
            operationalIssuerId &&
          key.status ===
            "ACTIVE",
      );

    assert(
      keyAAfterRecovery?.status ===
        "REVOKED" &&
      keyAAfterRecovery.validUntil ===
        recoveryIssuedAt &&
      keyBAfterRecovery?.status ===
        "ACTIVE" &&
      keyBAfterRecovery.validFrom ===
        recoveryIssuedAt &&
      keyBAfterRecovery.validUntil ===
        undefined &&
      activeKeysAfterRecovery.length ===
        1 &&
      activeKeysAfterRecovery[0].signingKeyId ===
        materialB.signingKeyId,
      "Emergency recovery did not persist A REVOKED / B sole ACTIVE at the signed recovery boundary.",
    );

    console.log(
      "PASS: signed REPLACE_ACTIVE persisted A REVOKED and B as sole ACTIVE at recovery issuedAt",
    );

    // --------------------------------------------------------
    // HISTORICAL KEYS PRESERVED
    // --------------------------------------------------------

    const retiredAfterRecovery =
      afterRecovery.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            historicalRetiredMaterial.signingKeyId,
      );

    const revokedAfterRecovery =
      afterRecovery.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            historicalRevokedMaterial.signingKeyId,
      );

    assert(
      JSON.stringify(
        retiredAfterRecovery,
      ) ===
        historicalRetiredSnapshot &&
      JSON.stringify(
        revokedAfterRecovery,
      ) ===
        historicalRevokedSnapshot,
      "Emergency recovery mutated historical RETIRED / REVOKED trusted keys.",
    );

    console.log(
      "PASS: emergency recovery preserved historical RETIRED and REVOKED keys exactly",
    );

    // --------------------------------------------------------
    // NORMAL TRANSITION METADATA PRESERVED
    // --------------------------------------------------------

    assert(
      JSON.stringify(
        afterRecovery.appliedTrustTransitions,
      ) ===
        normalTransitionLedgerSnapshot &&
      JSON.stringify(
        afterRecovery.trustTransitionSequences,
      ) ===
        normalTransitionSequenceSnapshot,
      "Emergency recovery mutated normal trust-transition replay metadata.",
    );

    console.log(
      "PASS: emergency recovery preserved normal transition replay ledger and sequence cursor exactly",
    );

    // --------------------------------------------------------
    // RECOVERY REPLAY LEDGER + CURSOR ATOMIC STATE
    // --------------------------------------------------------

    assert(
      afterRecovery.appliedTrustRecoveries?.length ===
        1 &&
      afterRecovery.appliedTrustRecoveries[0].packageId ===
        recoveryAtoB.packageId &&
      afterRecovery.appliedTrustRecoveries[0].recoveryAuthorityId ===
        recoveryAuthorityId &&
      afterRecovery.appliedTrustRecoveries[0].purpose ===
        "RECIPIENT_TRUST_RECOVERY" &&
      afterRecovery.appliedTrustRecoveries[0].sequence ===
        1 &&
      afterRecovery.appliedTrustRecoveries[0].installationId ===
        nativeBinding.installationId &&
      afterRecovery.appliedTrustRecoveries[0].operationalIssuerId ===
        operationalIssuerId &&
      afterRecovery.appliedTrustRecoveries[0].appliedAt ===
        acceptedAt.toISOString() &&
      afterRecovery.trustRecoverySequences?.length ===
        1 &&
      afterRecovery.trustRecoverySequences[0].recoveryAuthorityId ===
        recoveryAuthorityId &&
      afterRecovery.trustRecoverySequences[0].purpose ===
        "RECIPIENT_TRUST_RECOVERY" &&
      afterRecovery.trustRecoverySequences[0].installationId ===
        nativeBinding.installationId &&
      afterRecovery.trustRecoverySequences[0].operationalIssuerId ===
        operationalIssuerId &&
      afterRecovery.trustRecoverySequences[0].lastSequence ===
        1 &&
      afterRecovery.trustRecoverySequences[0].updatedAt ===
        acceptedAt.toISOString(),
      "Emergency recovery did not atomically persist recovery replay ledger and scoped monotonic sequence state.",
    );

    console.log(
      "PASS: recovery package ledger and four-field scoped sequence cursor persisted with trust mutation",
    );

    // --------------------------------------------------------
    // RECOVERY ROOT MUST REMAIN UNCHANGED
    // --------------------------------------------------------

    const recoveryAuthoritySnapshotAfterSuccess =
      await snapshotRecoveryAuthority();

    // --------------------------------------------------------
    // DUPLICATE PACKAGE ID
    //
    // Replay check must win even though A is no longer ACTIVE.
    // --------------------------------------------------------

    await expectRejectedWithoutMutation(
      "duplicate recovery packageId",
      recoveryAtoB,
      acceptedAt,
      "already been applied",
    );

    // --------------------------------------------------------
    // STALE RECOVERY SEQUENCE
    // --------------------------------------------------------

    const staleIssuedAt =
      new Date(
        acceptedAt.getTime() -
        250,
      ).toISOString();

    const staleReplacementC =
      createActiveTrustedKey(
        operationalIssuerId,
        materialC,
        staleIssuedAt,
      );

    const staleRecovery =
      signRecoveryEnvelope(
        createRecoveryUnsignedEnvelope({
          packageId:
            "FINORA-RECIPIENT-TRUST-RECOVERY-E2E-STALE",

          recoveryAuthorityId,

          recoverySigningKeyId:
            recoveryMaterial.signingKeyId,

          operationalIssuerId,

          expectedActiveSigningKeyId:
            materialB.signingKeyId,

          replacementTrustedKey:
            staleReplacementC,

          target,

          issuedAt:
            staleIssuedAt,

          sequence:
            1,
        }),
        recoveryMaterial.privateKey,
      );

    await expectRejectedWithoutMutation(
      "stale recovery sequence",
      staleRecovery,
      acceptedAt,
      "sequence is stale",
    );

    // --------------------------------------------------------
    // WRONG EXPECTED CURRENT ACTIVE
    // --------------------------------------------------------

    const freshIssuedAt =
      new Date(
        acceptedAt.getTime() -
        100,
      ).toISOString();

    const freshReplacementC =
      createActiveTrustedKey(
        operationalIssuerId,
        materialC,
        freshIssuedAt,
      );

    const wrongExpectedActiveRecovery =
      signRecoveryEnvelope(
        createRecoveryUnsignedEnvelope({
          packageId:
            "FINORA-RECIPIENT-TRUST-RECOVERY-E2E-WRONG-ACTIVE",

          recoveryAuthorityId,

          recoverySigningKeyId:
            recoveryMaterial.signingKeyId,

          operationalIssuerId,

          expectedActiveSigningKeyId:
            materialA.signingKeyId,

          replacementTrustedKey:
            freshReplacementC,

          target,

          issuedAt:
            freshIssuedAt,

          sequence:
            2,
        }),
        recoveryMaterial.privateKey,
      );

    await expectRejectedWithoutMutation(
      "wrong expected current ACTIVE signing key",
      wrongExpectedActiveRecovery,
      acceptedAt,
      "does not match current recipient authority",
    );

    // --------------------------------------------------------
    // PREVIOUSLY TRUSTED REPLACEMENT IDENTITY
    //
    // Reuse historical RETIRED key identity as proposed ACTIVE.
    // --------------------------------------------------------

    const reusedIdentityReplacement:
      FinoraBranchTrustedControlPublicKey = {
        issuerId:
          operationalIssuerId,

        signingKeyId:
          historicalRetiredMaterial.signingKeyId,

        algorithm:
          "ECDSA_P256_SHA256",

        format:
          "SPKI_DER_BASE64",

        publicKey:
          historicalRetiredMaterial.publicKey,

        status:
          "ACTIVE",

        validFrom:
          freshIssuedAt,
      };

    const reusedIdentityRecovery =
      signRecoveryEnvelope(
        createRecoveryUnsignedEnvelope({
          packageId:
            "FINORA-RECIPIENT-TRUST-RECOVERY-E2E-REUSED-KEY",

          recoveryAuthorityId,

          recoverySigningKeyId:
            recoveryMaterial.signingKeyId,

          operationalIssuerId,

          expectedActiveSigningKeyId:
            materialB.signingKeyId,

          replacementTrustedKey:
            reusedIdentityReplacement,

          target,

          issuedAt:
            freshIssuedAt,

          sequence:
            2,
        }),
        recoveryMaterial.privateKey,
      );

    await expectRejectedWithoutMutation(
      "previously trusted recovery replacement identity",
      reusedIdentityRecovery,
      acceptedAt,
      "has already existed in recipient trust",
    );

    // --------------------------------------------------------
    // VALID BASE B -> C FOR CRYPTO/TARGET REJECTIONS
    // --------------------------------------------------------

    const baseRecoveryBtoC =
      signRecoveryEnvelope(
        createRecoveryUnsignedEnvelope({
          packageId:
            "FINORA-RECIPIENT-TRUST-RECOVERY-E2E-0002",

          recoveryAuthorityId,

          recoverySigningKeyId:
            recoveryMaterial.signingKeyId,

          operationalIssuerId,

          expectedActiveSigningKeyId:
            materialB.signingKeyId,

          replacementTrustedKey:
            freshReplacementC,

          target,

          issuedAt:
            freshIssuedAt,

          sequence:
            2,
        }),
        recoveryMaterial.privateKey,
      );

    // --------------------------------------------------------
    // TAMPERED SIGNATURE
    // --------------------------------------------------------

    const tamperedSignatureBytes =
      Buffer.from(
        baseRecoveryBtoC.signature.value,
        "base64",
      );

    tamperedSignatureBytes[0] =
      tamperedSignatureBytes[0] ^
      0x01;

    const tamperedSignatureRecovery:
      FinoraRecipientTrustRecoverySignedEnvelope = {
        ...baseRecoveryBtoC,

        signature: {
          ...baseRecoveryBtoC.signature,

          value:
            tamperedSignatureBytes.toString(
              "base64",
            ),
        },
      };

    await expectRejectedWithoutMutation(
      "tampered recovery signature",
      tamperedSignatureRecovery,
      acceptedAt,
      "INVALID_SIGNATURE",
    );

    // --------------------------------------------------------
    // WRONG NATIVE INSTALLATION TARGET
    // --------------------------------------------------------

    const wrongTarget:
      FinoraRecipientTrustTransitionTarget = {
        ...target,

        installationId:
          "FINORA-FOREIGN-RECOVERY-APPLY-E2E-INSTALLATION",
      };

    const wrongTargetRecovery =
      signRecoveryEnvelope(
        createRecoveryUnsignedEnvelope({
          packageId:
            "FINORA-RECIPIENT-TRUST-RECOVERY-E2E-WRONG-TARGET",

          recoveryAuthorityId,

          recoverySigningKeyId:
            recoveryMaterial.signingKeyId,

          operationalIssuerId,

          expectedActiveSigningKeyId:
            materialB.signingKeyId,

          replacementTrustedKey:
            freshReplacementC,

          target:
            wrongTarget,

          issuedAt:
            freshIssuedAt,

          sequence:
            2,
        }),
        recoveryMaterial.privateKey,
      );

    await expectRejectedWithoutMutation(
      "wrong native installation recovery target",
      wrongTargetRecovery,
      acceptedAt,
      "TARGET_MISMATCH",
    );

    // --------------------------------------------------------
    // FUTURE-ISSUED RECOVERY
    // --------------------------------------------------------

    const futureIssuedAt =
      new Date(
        acceptedAt.getTime() +
        1,
      ).toISOString();

    const futureReplacementC =
      createActiveTrustedKey(
        operationalIssuerId,
        materialC,
        futureIssuedAt,
      );

    const futureRecovery =
      signRecoveryEnvelope(
        createRecoveryUnsignedEnvelope({
          packageId:
            "FINORA-RECIPIENT-TRUST-RECOVERY-E2E-FUTURE",

          recoveryAuthorityId,

          recoverySigningKeyId:
            recoveryMaterial.signingKeyId,

          operationalIssuerId,

          expectedActiveSigningKeyId:
            materialB.signingKeyId,

          replacementTrustedKey:
            futureReplacementC,

          target,

          issuedAt:
            futureIssuedAt,

          sequence:
            2,
        }),
        recoveryMaterial.privateKey,
      );

    await expectRejectedWithoutMutation(
      "future-issued recovery",
      futureRecovery,
      acceptedAt,
      "RECOVERY_ISSUED_IN_FUTURE",
    );

    // --------------------------------------------------------
    // FINAL STATE
    // --------------------------------------------------------

    const finalStore =
      await loadFinoraRecipientTrustStore();

    assert(
      finalStore !==
        undefined,
      "Final recipient trust store unexpectedly missing.",
    );

    const finalActiveKeys =
      finalStore.trustedKeys.filter(
        (key) =>
          key.issuerId ===
            operationalIssuerId &&
          key.status ===
            "ACTIVE",
      );

    const finalA =
      finalStore.trustedKeys.find(
        (key) =>
          key.signingKeyId ===
            materialA.signingKeyId,
      );

    assert(
      finalActiveKeys.length ===
        1 &&
      finalActiveKeys[0].signingKeyId ===
        materialB.signingKeyId &&
      finalA?.status ===
        "REVOKED" &&
      finalA.validUntil ===
        recoveryIssuedAt &&
      finalStore.appliedTrustRecoveries?.length ===
        1 &&
      finalStore.trustRecoverySequences?.length ===
        1 &&
      finalStore.trustRecoverySequences[0].lastSequence ===
        1 &&
      JSON.stringify(
        finalStore.appliedTrustTransitions,
      ) ===
        normalTransitionLedgerSnapshot &&
      JSON.stringify(
        finalStore.trustTransitionSequences,
      ) ===
        normalTransitionSequenceSnapshot,
      "Rejected recovery cases changed the final authoritative recipient trust state.",
    );

    const finalRecoveryAuthoritySnapshot =
      await snapshotRecoveryAuthority();

    assert(
      finalRecoveryAuthoritySnapshot ===
        recoveryAuthoritySnapshotAfterSuccess,
      "Recovery apply path mutated independently provisioned recovery authority.",
    );

    console.log(
      "PASS: rejected replay/stale/current-key/reuse/tamper/target/future recoveries preserved final authoritative trust state",
    );

    console.log(
      "PASS: independently provisioned recovery authority remained unchanged",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA RECIPIENT TRUST RECOVERY APPLY E2E SELFTEST",
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
      "PASS: isolated temporary recipient recovery-apply userData deleted",
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
        "FAIL: FINORA RECIPIENT TRUST RECOVERY APPLY E2E SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );