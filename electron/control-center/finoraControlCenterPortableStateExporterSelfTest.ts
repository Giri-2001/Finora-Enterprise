// ============================================================
// FINORA ENTERPRISE
// PORTABLE STATE EXPORTER RUNTIME SELF TEST
//
// Uses isolated temporary Electron userData only.
// ============================================================

import {
  app,
  safeStorage,
} from "electron";

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
  commitFinoraControlCenterPortableStateEnvelopeHead,
  createFinoraControlCenterPortableStateEnvelope,
} from "./finoraControlCenterPortableStateExporter.js";

import {
  FINORA_CONTROL_CENTER_PORTABLE_STATE_FORMAT,
  FINORA_CONTROL_CENTER_PORTABLE_STATE_SCHEMA_VERSION,
} from "./finoraControlCenterPortableState.types.js";

import {
  canonicalizeFinoraControlCenterValue,
  createFinoraControlCenterSha256,
} from "./finoraControlCenterCanonicalization.js";

import {
  verifyFinoraControlCenterCanonicalSignature,
} from "./finoraControlCenterCrypto.js";

import {
  getFinoraControlCenterPublicIdentity,
} from "./finoraControlCenterKeyVault.js";

import {
  loadFinoraControlCenterPortableStateGenerationState,
} from "./finoraControlCenterPortableStateGenerationStore.js";

import {
  loadFinoraControlCenterPortableStateHead,
} from "./finoraControlCenterPortableStateHeadStore.js";


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


function assertEnvelopeHasNoSecretMaterial(
  envelope:
    unknown,
): void {

  const serialized =
    JSON.stringify(
      envelope,
    );

  const forbidden =
    [
      "privateKeyPkcs8DerBase64",
      "developerSecurityCode",
      "adminRecoverySecurityCode",
      "securityVerifier",
      "\"password\"",
    ];

  for (
    const marker of
      forbidden
  ) {

    assert(
      !serialized.includes(
        marker,
      ),
      `Portable State envelope leaked forbidden marker: ${marker}`,
    );
  }
}


async function verifyEnvelope(
  envelope:
    Awaited<
      ReturnType<
        typeof createFinoraControlCenterPortableStateEnvelope
      >
    >,
  expectedGeneration:
    number,
): Promise<void> {

  assert(
    envelope.format ===
      FINORA_CONTROL_CENTER_PORTABLE_STATE_FORMAT,
    "Portable State envelope format is invalid.",
  );

  assert(
    envelope.schemaVersion ===
      FINORA_CONTROL_CENTER_PORTABLE_STATE_SCHEMA_VERSION,
    "Portable State envelope schemaVersion is invalid.",
  );

  assert(
    envelope.payload.format ===
      FINORA_CONTROL_CENTER_PORTABLE_STATE_FORMAT,
    "Portable State payload format is invalid.",
  );

  assert(
    envelope.payload.schemaVersion ===
      FINORA_CONTROL_CENTER_PORTABLE_STATE_SCHEMA_VERSION,
    "Portable State payload schemaVersion is invalid.",
  );

  assert(
    envelope.payload.stateGeneration ===
      expectedGeneration,
    `Portable State generation is not ${expectedGeneration}.`,
  );

  assert(
    envelope.payload.sourcePlatform ===
      "WINDOWS",
    "Portable State sourcePlatform is not WINDOWS.",
  );

  assert(
    envelope.payload.parentPayloadSha256 ===
      null ||
    /^[0-9a-f]{64}$/.test(
      envelope.payload.parentPayloadSha256,
    ),
    "Portable State parentPayloadSha256 is invalid.",
  );

  assert(
    typeof envelope.payload.issuerId ===
      "string" &&
    envelope.payload.issuerId.length >
      0,
    "Portable State issuerId is missing.",
  );

  assert(
    typeof envelope.payload.signingKeyId ===
      "string" &&
    envelope.payload.signingKeyId.length >
      0,
    "Portable State signingKeyId is missing.",
  );

  assert(
    new Date(
      envelope.payload.exportedAt,
    ).toISOString() ===
      envelope.payload.exportedAt,
    "Portable State exportedAt is not canonical ISO.",
  );


  // ----------------------------------------------------------
  // Isolated Control Center has no provisioned branch data.
  // ----------------------------------------------------------

  assert(
    envelope.payload.branchRegistry ===
      null,
    "Isolated Portable State unexpectedly contains Branch Registry.",
  );

  assert(
    envelope.payload.branchDirectoryMetadata.records.length ===
      0,
    "Isolated Portable State unexpectedly contains Directory Metadata.",
  );

  assert(
    envelope.payload.walletHistory.records.length ===
      0,
    "Isolated Portable State unexpectedly contains Wallet History.",
  );

  assert(
    envelope.payload.branchPricing.records.length ===
      0,
    "Isolated Portable State unexpectedly contains Branch Pricing records.",
  );

  assert(
    envelope.payload.issuanceAuthority.general ===
      null,
    "Isolated Portable State unexpectedly contains General Issuance ledger.",
  );

  assert(
    envelope.payload.issuanceAuthority.portableBranchAccess ===
      null,
    "Isolated Portable State unexpectedly contains Portable Branch Access ledger.",
  );

  assert(
    envelope.payload.issuanceAuthority.portableBusinessProfile ===
      null,
    "Isolated Portable State unexpectedly contains Portable Business Profile ledger.",
  );

  assert(
    envelope.payload.issuanceAuthority.portablePricingPolicy ===
      null,
    "Isolated Portable State unexpectedly contains Portable Pricing Policy ledger.",
  );

  assert(
    envelope.payload.issuanceAuthority.portableStorageEntitlement ===
      null,
    "Isolated Portable State unexpectedly contains Portable Storage Entitlement ledger.",
  );


  // ----------------------------------------------------------
  // Clock authority must be established by exporter.
  // ----------------------------------------------------------

  const clockState =
    envelope.payload.clockAuthority.state;

  assert(
    clockState !==
      null,
    "Portable State exporter did not capture clock high-water authority.",
  );

  assert(
    clockState.issuerId ===
      envelope.payload.issuerId,
    "Portable State clock issuer does not match payload issuer.",
  );


  // ----------------------------------------------------------
  // Canonical digest.
  // ----------------------------------------------------------

  const canonicalPayload =
    canonicalizeFinoraControlCenterValue(
      envelope.payload,
    );

  const expectedDigest =
    createFinoraControlCenterSha256(
      canonicalPayload,
    );

  assert(
    expectedDigest ===
      envelope.payloadSha256,
    "Portable State payload SHA-256 is invalid.",
  );


  // ----------------------------------------------------------
  // Signature verification against current public identity.
  // ----------------------------------------------------------

  const identity =
    await getFinoraControlCenterPublicIdentity();

  assert(
    identity.issuerId ===
      envelope.payload.issuerId,
    "Portable State issuer does not match current public identity.",
  );

  assert(
    identity.signingKeyId ===
      envelope.payload.signingKeyId,
    "Portable State signingKeyId does not match current public identity.",
  );

  const signatureValid =
    verifyFinoraControlCenterCanonicalSignature(
      canonicalPayload,
      envelope.signatureBase64,
      identity.publicKeySpkiDerBase64,
    );

  assert(
    signatureValid,
    "Portable State signature verification failed.",
  );

  assertEnvelopeHasNoSecretMaterial(
    envelope,
  );
}


async function runSelfTest():
  Promise<void> {

  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-portable-state-exporter-",
      ),
    );

  app.setPath(
    "userData",
    temporaryUserData,
  );

  try {

    await app.whenReady();

    assert(
      safeStorage.isEncryptionAvailable(),
      "Electron safeStorage unavailable for Portable State exporter self-test.",
    );

    console.log(
      "PASS: isolated Electron userData configured",
    );


    // ========================================================
    // FIRST ENVELOPE
    // ========================================================

    const first =
      await createFinoraControlCenterPortableStateEnvelope();

    await verifyEnvelope(
      first,
      1,
    );

    assert(
      first.payload.parentPayloadSha256 ===
        null,
      "First Portable State envelope unexpectedly declared a parent digest.",
    );

    const headBeforeFirstCommit =
      await loadFinoraControlCenterPortableStateHead();

    assert(
      headBeforeFirstCommit ===
        undefined,
      "Envelope creation implicitly committed the first Portable State head.",
    );

    console.log(
      "PASS: first envelope parent digest = null",
    );

    console.log(
      "PASS: envelope creation did not implicitly commit lineage",
    );

    await commitFinoraControlCenterPortableStateEnvelopeHead(
      first,
    );

    const headAfterFirstCommit =
      await loadFinoraControlCenterPortableStateHead();

    assert(
      headAfterFirstCommit !==
        undefined &&
      headAfterFirstCommit.issuerId ===
        first.payload.issuerId &&
      headAfterFirstCommit.headGeneration ===
        1 &&
      headAfterFirstCommit.headPayloadSha256 ===
        first.payloadSha256,
      "First Portable State envelope did not commit the exact lineage head.",
    );

    console.log(
      "PASS: first envelope explicitly committed as lineage head",
    );

    console.log(
      "PASS: first signed Portable State envelope generation = 1",
    );

    console.log(
      "PASS: first envelope canonical SHA-256 verified",
    );

    console.log(
      "PASS: first envelope P-256 signature verified",
    );

    console.log(
      "PASS: isolated operational domains captured exactly",
    );

    console.log(
      "PASS: Portable State envelope contains no secret material",
    );


    // ========================================================
    // SECOND ENVELOPE
    // ========================================================

    const second =
      await createFinoraControlCenterPortableStateEnvelope();

    await verifyEnvelope(
      second,
      2,
    );

    assert(
      second.payload.issuerId ===
        first.payload.issuerId,
      "Portable State issuer changed between exports.",
    );

    assert(
      second.payload.signingKeyId ===
        first.payload.signingKeyId,
      "Portable State signing key changed between exports.",
    );

    assert(
      second.payload.stateGeneration >
        first.payload.stateGeneration,
      "Portable State generation did not advance.",
    );

    assert(
      second.payload.parentPayloadSha256 ===
        first.payloadSha256,
      "Second Portable State envelope does not extend the first committed payload digest.",
    );

    const headBeforeSecondCommit =
      await loadFinoraControlCenterPortableStateHead();

    assert(
      headBeforeSecondCommit !==
        undefined &&
      headBeforeSecondCommit.headGeneration ===
        1 &&
      headBeforeSecondCommit.headPayloadSha256 ===
        first.payloadSha256,
      "Second envelope creation mutated the committed lineage head.",
    );

    console.log(
      "PASS: second envelope parent = first payload SHA-256",
    );

    console.log(
      "PASS: second envelope creation did not implicitly advance lineage",
    );

    await commitFinoraControlCenterPortableStateEnvelopeHead(
      second,
    );

    const headAfterSecondCommit =
      await loadFinoraControlCenterPortableStateHead();

    assert(
      headAfterSecondCommit !==
        undefined &&
      headAfterSecondCommit.issuerId ===
        second.payload.issuerId &&
      headAfterSecondCommit.headGeneration ===
        2 &&
      headAfterSecondCommit.headPayloadSha256 ===
        second.payloadSha256,
      "Second Portable State envelope did not commit the exact lineage head.",
    );

    console.log(
      "PASS: second envelope explicitly committed as lineage head",
    );

    console.log(
      "PASS: second signed Portable State envelope generation = 2",
    );

    console.log(
      "PASS: signing authority stable across exports",
    );


    // ========================================================
    // GENERATION STORE HIGH-WATER
    // ========================================================

    const generationState =
      await loadFinoraControlCenterPortableStateGenerationState();

    assert(
      generationState !==
        undefined &&
      generationState.issuerId ===
        second.payload.issuerId &&
      generationState.lastReservedGeneration ===
        2,
      "Portable State generation authority did not persist high-water 2.",
    );

    console.log(
      "PASS: generation high-water persisted at 2",
    );


    // ========================================================
    // TAMPER REJECTION
    // ========================================================

    const tamperedPayload = {
      ...second.payload,

      stateGeneration:
        second.payload.stateGeneration +
        1,
    };

    const tamperedCanonical =
      canonicalizeFinoraControlCenterValue(
        tamperedPayload,
      );

    const identity =
      await getFinoraControlCenterPublicIdentity();

    const tamperedSignatureValid =
      verifyFinoraControlCenterCanonicalSignature(
        tamperedCanonical,
        second.signatureBase64,
        identity.publicKeySpkiDerBase64,
      );

    assert(
      !tamperedSignatureValid,
      "Tampered Portable State payload unexpectedly verified.",
    );

    const tamperedDigest =
      createFinoraControlCenterSha256(
        tamperedCanonical,
      );

    assert(
      tamperedDigest !==
        second.payloadSha256,
      "Tampered Portable State payload retained original SHA-256.",
    );

    console.log(
      "PASS: tampered payload signature rejected",
    );

    console.log(
      "PASS: tampered payload digest differs",
    );


    // ========================================================
    // RESULT
    // ========================================================

    console.log(
      "PASS: PORTABLE STATE EXPORTER RUNTIME SELFTEST",
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
      "PASS: isolated exporter self-test userData deleted",
    );
  }
}


void runSelfTest()
  .then(
    () => {

      app.exit(
        0,
      );
    },
    (
      error,
    ) => {

      console.error(
        "FAIL: PORTABLE STATE EXPORTER RUNTIME SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );