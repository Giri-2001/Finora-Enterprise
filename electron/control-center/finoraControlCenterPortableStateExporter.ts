// ============================================================
// FINORA ENTERPRISE
// CONTROL CENTER PORTABLE STATE EXPORTER
//
// LAYER:
// Privileged Electron main process.
//
// RESPONSIBILITY:
// - Capture canonical Control Center operational state.
// - Detect concurrent operational mutation by double capture.
// - Reserve one monotonic Portable State generation.
// - Bind payload to active issuer/signing authority.
// - Canonicalize, hash, sign, and self-verify payload.
//
// IMPORTANT:
// - No file transport here.
// - No IPC/preload/renderer authority here.
// - No signing private key enters the portable payload.
// - A failed export may consume a generation.
//   Gaps are permitted; generation reuse is not.
// ============================================================

import type {
  FinoraControlCenterPortableStateEnvelope,
  FinoraControlCenterPortableStatePayload,
} from "./finoraControlCenterPortableState.types.js";

import {
  FINORA_CONTROL_CENTER_PORTABLE_STATE_FORMAT,
  FINORA_CONTROL_CENTER_PORTABLE_STATE_SCHEMA_VERSION,
} from "./finoraControlCenterPortableState.types.js";

import {
  loadFinoraControlCenterBranchRegistry,
} from "./finoraControlCenterBranchRegistryStore.js";

import {
  loadFinoraControlCenterBranchDirectoryMetadata,
} from "./finoraControlCenterBranchDirectoryMetadataStore.js";

import {
  loadFinoraControlCenterWalletHistory,
} from "./finoraControlCenterWalletHistoryStore.js";

import {
  readFinoraControlCenterIncomePricing,
} from "./finoraControlCenterIncomePricingStore.js";

import {
  loadFinoraControlCenterBranchPricingSnapshot,
} from "./finoraControlCenterBranchPricingStore.js";

import {
  loadFinoraControlCenterIssuanceLedgerSnapshot,
} from "./finoraControlCenterIssuanceLedger.js";

import {
  loadFinoraPortableBranchAccessIssuanceLedgerSnapshot,
} from "./finoraPortableBranchAccessIssuanceLedger.js";

import {
  loadFinoraPortableBusinessProfileIssuanceLedgerSnapshot,
} from "./finoraPortableBusinessProfileIssuanceLedger.js";

import {
  loadFinoraPortablePricingPolicyIssuanceLedgerSnapshot,
} from "./finoraPortablePricingPolicyIssuanceLedger.js";

import {
  loadFinoraPortableStorageEntitlementIssuanceLedgerSnapshot,
} from "./finoraPortableStorageEntitlementIssuanceLedger.js";

import {
  loadFinoraControlCenterClockHighWaterState,
} from "./finoraControlCenterClockHighWaterStore.js";

import {
  observeFinoraControlCenterAuthoritativeWallClock,
} from "./finoraControlCenterClockHighWaterAuthorityService.js";

import {
  reserveFinoraControlCenterPortableStateGeneration,
} from "./finoraControlCenterPortableStateGenerationStore.js";

import {
  commitFinoraControlCenterPortableStateHead,
  loadFinoraControlCenterPortableStateHead,
} from "./finoraControlCenterPortableStateHeadStore.js";

import {
  canonicalizeFinoraControlCenterValue,
  createFinoraControlCenterSha256,
} from "./finoraControlCenterCanonicalization.js";

import {
  signFinoraControlCenterCanonicalValue,
  verifyFinoraControlCenterCanonicalSignature,
} from "./finoraControlCenterCrypto.js";

import {
  getFinoraControlCenterPublicIdentity,
  loadOrCreateFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";


// ============================================================
// CAPTURE SHAPE
// ============================================================

interface FinoraControlCenterPortableOperationalCapture {
  readonly branchRegistry:
    FinoraControlCenterPortableStatePayload["branchRegistry"];

  readonly branchDirectoryMetadata:
    FinoraControlCenterPortableStatePayload["branchDirectoryMetadata"];

  readonly walletHistory:
    FinoraControlCenterPortableStatePayload["walletHistory"];

  readonly incomePricing:
    FinoraControlCenterPortableStatePayload["incomePricing"];

  readonly branchPricing:
    FinoraControlCenterPortableStatePayload["branchPricing"];

  readonly issuanceAuthority:
    FinoraControlCenterPortableStatePayload["issuanceAuthority"];

  readonly clockAuthority:
    FinoraControlCenterPortableStatePayload["clockAuthority"];
}


let exportQueue:
  Promise<void> =
    Promise.resolve();


function runSerialized<T>(
  operation:
    () => Promise<T>,
): Promise<T> {

  const result =
    exportQueue.then(
      operation,
      operation,
    );

  exportQueue =
    result.then(
      () => undefined,
      () => undefined,
    );

  return result;
}


// ============================================================
// ISSUER GUARDS
// ============================================================

function assertSequenceIssuer(
  label:
    string,
  issuerId:
    string,
  snapshot:
    {
      readonly sequences:
        readonly {
          readonly issuerId:
            string;
        }[];
    } | null,
): void {

  if (!snapshot) {
    return;
  }

  for (
    const record of
      snapshot.sequences
  ) {

    if (
      record.issuerId !==
        issuerId
    ) {

      throw new Error(
        `FINORA Portable State ${label} contains sequence authority for another issuer.`,
      );
    }
  }
}


function assertCaptureIssuer(
  issuerId:
    string,
  capture:
    FinoraControlCenterPortableOperationalCapture,
): void {

  assertSequenceIssuer(
    "general issuance ledger",
    issuerId,
    capture.issuanceAuthority.general,
  );

  assertSequenceIssuer(
    "portable Branch Access ledger",
    issuerId,
    capture.issuanceAuthority.portableBranchAccess,
  );

  assertSequenceIssuer(
    "portable Business Profile ledger",
    issuerId,
    capture.issuanceAuthority.portableBusinessProfile,
  );

  assertSequenceIssuer(
    "portable Pricing Policy ledger",
    issuerId,
    capture.issuanceAuthority.portablePricingPolicy,
  );

  assertSequenceIssuer(
    "portable Storage Entitlement ledger",
    issuerId,
    capture.issuanceAuthority.portableStorageEntitlement,
  );

  const clockState =
    capture.clockAuthority.state;

  if (!clockState) {

    throw new Error(
      "FINORA Portable State export requires an established Control Center clock high-water.",
    );
  }

  if (
    clockState.issuerId !==
      issuerId
  ) {

    throw new Error(
      "FINORA Portable State clock authority is bound to another issuer.",
    );
  }
}


// ============================================================
// VALIDATED OPERATIONAL CAPTURE
// ============================================================

async function captureOperationalState():
  Promise<
    FinoraControlCenterPortableOperationalCapture
  > {

  const branchRegistry =
    await loadFinoraControlCenterBranchRegistry();

  const branchDirectoryRecords =
    await loadFinoraControlCenterBranchDirectoryMetadata();

  const walletHistoryRecords =
    await loadFinoraControlCenterWalletHistory();

  const incomePricing =
    await readFinoraControlCenterIncomePricing();

  const branchPricingSnapshot =
    await loadFinoraControlCenterBranchPricingSnapshot();

  const generalIssuance =
    await loadFinoraControlCenterIssuanceLedgerSnapshot();

  const portableBranchAccess =
    await loadFinoraPortableBranchAccessIssuanceLedgerSnapshot();

  const portableBusinessProfile =
    await loadFinoraPortableBusinessProfileIssuanceLedgerSnapshot();

  const portablePricingPolicy =
    await loadFinoraPortablePricingPolicyIssuanceLedgerSnapshot();

  const portableStorageEntitlement =
    await loadFinoraPortableStorageEntitlementIssuanceLedgerSnapshot();

  const clockState =
    await loadFinoraControlCenterClockHighWaterState();

  return {
    branchRegistry:
      branchRegistry ??
      null,

    branchDirectoryMetadata: {
      records:
        branchDirectoryRecords,
    },

    walletHistory: {
      records:
        walletHistoryRecords,
    },

    incomePricing: {
      state:
        incomePricing,
    },

    branchPricing: {
      records:
        branchPricingSnapshot.records,
    },

    issuanceAuthority: {
      general:
        generalIssuance ??
        null,

      portableBranchAccess:
        portableBranchAccess ??
        null,

      portableBusinessProfile:
        portableBusinessProfile ??
        null,

      portablePricingPolicy:
        portablePricingPolicy ??
        null,

      portableStorageEntitlement:
        portableStorageEntitlement ??
        null,
    },

    clockAuthority: {
      state:
        clockState ??
        null,
    },
  };
}


// ============================================================
// STABLE DOUBLE CAPTURE
// ============================================================

async function captureStableOperationalState(
  issuerId:
    string,
): Promise<
  FinoraControlCenterPortableOperationalCapture
> {

  const first =
    await captureOperationalState();

  assertCaptureIssuer(
    issuerId,
    first,
  );

  const firstCanonical =
    canonicalizeFinoraControlCenterValue(
      first,
    );

  /*
   * Capture every operational domain a second time.
   *
   * Existing branch/history/pricing/sequence stores are
   * monotonic or revisioned authorities. If anything mutates
   * while export is being assembled, the canonical captures
   * differ and this export is rejected instead of signing a
   * mixed-time snapshot.
   */
  const second =
    await captureOperationalState();

  assertCaptureIssuer(
    issuerId,
    second,
  );

  const secondCanonical =
    canonicalizeFinoraControlCenterValue(
      second,
    );

  if (
    firstCanonical !==
      secondCanonical
  ) {

    throw new Error(
      "FINORA Control Center operational state changed during Portable State export. Retry export.",
    );
  }

  return second;
}


// ============================================================
// INTERNAL EXPORT
// ============================================================

async function createEnvelopeInternal():
  Promise<
    FinoraControlCenterPortableStateEnvelope
  > {

  /*
   * Use the existing issuer-bound authoritative wall clock.
   *
   * This rejects clock rollback and establishes/advances the
   * persisted clock high-water before state capture.
   */
  const clockResult =
    await observeFinoraControlCenterAuthoritativeWallClock();

  if (!clockResult.success) {

    throw new Error(
      clockResult.error,
    );
  }

  const issuerId =
    clockResult.data.issuerId;

  const exportedAt =
    clockResult.data.observedAt;


  /*
   * Read the currently committed lineage head before reserving
   * the next export generation.
   *
   * Envelope creation itself does NOT advance the head.
   * Durable transport/import boundaries commit separately.
   */
  const currentHead =
    await loadFinoraControlCenterPortableStateHead();

  if (
    currentHead &&
    currentHead.issuerId !==
      issuerId
  ) {

    throw new Error(
      "FINORA Portable State lineage head is bound to another issuer.",
    );
  }


  /*
   * Reserve generation before capture/signing.
   *
   * Any later failure intentionally leaves a generation gap.
   * A reserved generation must never be reused.
   */
  const generationReservation =
    await reserveFinoraControlCenterPortableStateGeneration(
      issuerId,
    );

  if (
    generationReservation.issuerId !==
      issuerId
  ) {

    throw new Error(
      "FINORA Portable State generation reservation issuer mismatch.",
    );
  }

  if (
    currentHead &&
    generationReservation.generation <=
      currentHead.headGeneration
  ) {

    throw new Error(
      "FINORA Portable State reserved generation does not advance the committed lineage head.",
    );
  }


  /*
   * Capture a stable operational snapshot using each domain's
   * existing validated/decrypted public read boundary.
   */
  const capture =
    await captureStableOperationalState(
      issuerId,
    );


  /*
   * Load the current cryptographically validated main-process
   * key vault only after the operational state is stable.
   *
   * Private material is used only to sign canonical payload
   * bytes and is never copied into payload/envelope data.
   */
  const vault =
    await loadOrCreateFinoraControlCenterKeyVault();

  if (
    vault.issuerId !==
      issuerId
  ) {

    throw new Error(
      "FINORA Portable State signing authority issuer mismatch.",
    );
  }


  const payload:
    FinoraControlCenterPortableStatePayload = {
      format:
        FINORA_CONTROL_CENTER_PORTABLE_STATE_FORMAT,

      schemaVersion:
        FINORA_CONTROL_CENTER_PORTABLE_STATE_SCHEMA_VERSION,

      stateGeneration:
        generationReservation.generation,

      parentPayloadSha256:
        currentHead
          ? currentHead.headPayloadSha256
          : null,

      issuerId:
        vault.issuerId,

      signingKeyId:
        vault.signingKeyId,

      exportedAt,

      sourcePlatform:
        "WINDOWS",

      branchRegistry:
        capture.branchRegistry,

      branchDirectoryMetadata:
        capture.branchDirectoryMetadata,

      walletHistory:
        capture.walletHistory,

      incomePricing:
        capture.incomePricing,

      branchPricing:
        capture.branchPricing,

      issuanceAuthority:
        capture.issuanceAuthority,

      clockAuthority:
        capture.clockAuthority,
    };


  const canonicalPayload =
    canonicalizeFinoraControlCenterValue(
      payload,
    );

  const payloadSha256 =
    createFinoraControlCenterSha256(
      canonicalPayload,
    );

  const signatureBase64 =
    signFinoraControlCenterCanonicalValue(
      canonicalPayload,
      vault.privateKeyPkcs8DerBase64,
    );


  /*
   * Never return a signature that the currently loaded public
   * key cannot verify.
   */
  const signatureValid =
    verifyFinoraControlCenterCanonicalSignature(
      canonicalPayload,
      signatureBase64,
      vault.publicKeySpkiDerBase64,
    );

  if (!signatureValid) {

    throw new Error(
      "FINORA Portable State generated signature failed self-verification.",
    );
  }


  /*
   * Detect signing-key rotation that raced this export.
   *
   * A generation gap is acceptable. Returning an envelope
   * whose signing identity changed during assembly is not.
   */
  const postSignIdentity =
    await getFinoraControlCenterPublicIdentity();

  if (
    postSignIdentity.issuerId !==
      vault.issuerId ||
    postSignIdentity.signingKeyId !==
      vault.signingKeyId ||
    postSignIdentity.publicKeySpkiDerBase64 !==
      vault.publicKeySpkiDerBase64
  ) {

    throw new Error(
      "FINORA Control Center signing authority changed during Portable State export. Retry export.",
    );
  }


  /*
   * Digest must still correspond to the exact payload returned.
   */
  const finalCanonicalPayload =
    canonicalizeFinoraControlCenterValue(
      payload,
    );

  const finalPayloadSha256 =
    createFinoraControlCenterSha256(
      finalCanonicalPayload,
    );

  if (
    finalCanonicalPayload !==
      canonicalPayload ||
    finalPayloadSha256 !==
      payloadSha256
  ) {

    throw new Error(
      "FINORA Portable State payload changed during envelope assembly.",
    );
  }


  return {
    format:
      FINORA_CONTROL_CENTER_PORTABLE_STATE_FORMAT,

    schemaVersion:
      FINORA_CONTROL_CENTER_PORTABLE_STATE_SCHEMA_VERSION,

    payload,

    payloadSha256,

    signatureBase64,
  };
}


// ============================================================
// PUBLIC MAIN-PROCESS API
// ============================================================

export function createFinoraControlCenterPortableStateEnvelope():
  Promise<
    FinoraControlCenterPortableStateEnvelope
  > {

  /*
   * Serialize envelope construction in-process.
   *
   * IMPORTANT:
   * This function reserves a generation but does NOT commit the
   * Portable State lineage head.
   *
   * Durable transport/import code must commit the exact verified
   * envelope only after its own persistence boundary is satisfied.
   */
  return runSerialized(
    createEnvelopeInternal,
  );
}


export async function commitFinoraControlCenterPortableStateEnvelopeHead(
  envelope:
    FinoraControlCenterPortableStateEnvelope,
): Promise<void> {

  if (
    envelope.format !==
      FINORA_CONTROL_CENTER_PORTABLE_STATE_FORMAT ||
    envelope.schemaVersion !==
      FINORA_CONTROL_CENTER_PORTABLE_STATE_SCHEMA_VERSION ||
    envelope.payload.format !==
      FINORA_CONTROL_CENTER_PORTABLE_STATE_FORMAT ||
    envelope.payload.schemaVersion !==
      FINORA_CONTROL_CENTER_PORTABLE_STATE_SCHEMA_VERSION
  ) {

    throw new Error(
      "FINORA Portable State envelope format or schemaVersion is invalid.",
    );
  }

  const canonicalPayload =
    canonicalizeFinoraControlCenterValue(
      envelope.payload,
    );

  const expectedPayloadSha256 =
    createFinoraControlCenterSha256(
      canonicalPayload,
    );

  if (
    envelope.payloadSha256 !==
      expectedPayloadSha256
  ) {

    throw new Error(
      "FINORA Portable State envelope payload digest is invalid.",
    );
  }

  const identity =
    await getFinoraControlCenterPublicIdentity();

  if (
    envelope.payload.issuerId !==
      identity.issuerId ||
    envelope.payload.signingKeyId !==
      identity.signingKeyId
  ) {

    throw new Error(
      "FINORA Portable State envelope does not match the current signing authority.",
    );
  }

  const signatureValid =
    verifyFinoraControlCenterCanonicalSignature(
      canonicalPayload,
      envelope.signatureBase64,
      identity.publicKeySpkiDerBase64,
    );

  if (!signatureValid) {

    throw new Error(
      "FINORA Portable State envelope signature is invalid.",
    );
  }

  const committed =
    await commitFinoraControlCenterPortableStateHead({
      issuerId:
        envelope.payload.issuerId,

      generation:
        envelope.payload.stateGeneration,

      payloadSha256:
        envelope.payloadSha256,

      parentPayloadSha256:
        envelope.payload.parentPayloadSha256,
    });

  if (
    committed.head.issuerId !==
      envelope.payload.issuerId ||
    committed.head.headGeneration !==
      envelope.payload.stateGeneration ||
    committed.head.headPayloadSha256 !==
      envelope.payloadSha256
  ) {

    throw new Error(
      "FINORA Portable State committed lineage head does not match the envelope.",
    );
  }
}